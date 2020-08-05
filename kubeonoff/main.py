import argparse
import asyncio
import logging
import json
import ssl
import os
import importlib
import sys
import time
from functools import wraps
import re

from aiohttp import web
import aiohttp
from aiohttp.web import middleware
import uvloop


logger = logging.getLogger()

# K8S API reference: https://kubernetes.io/docs/api-reference/v1.8/

TOKEN_PATH = "/var/run/secrets/kubernetes.io/serviceaccount/token"
CAFILE_PATH = "/var/run/secrets/kubernetes.io/serviceaccount/ca.crt"
NAMESPACE = os.environ["POD_NAMESPACE"]
KUBE_API_URL = "https://kubernetes.default"


PROXY_AUTH_USER_HEADER = os.environ.get("PROXY_AUTH_USER_HEADER")


def get_user(request):
    username = "(unknown)"
    if PROXY_AUTH_USER_HEADER:
        username = request.headers.get(PROXY_AUTH_USER_HEADER)
    return username


@middleware
async def auth_trail_middleware(request, handler):
    username = get_user(request)
    print(f"{username}: {request}")
    request.auth_username = username
    return await handler(request)


def aiodogpile(expiry):
    """
    Caches the result of a function based on its positional arguments.

    Note: arguments passed as keyword arguments are not considered part of the
    cache key.
    """

    def outer(func):
        cache = {}
        locks = {}

        @wraps(func)
        async def wrapped(*args, **kwargs):
            key = args
            now = time.perf_counter()
            if key not in locks:
                locks[key] = asyncio.Lock()
            lock = locks[key]
            async with lock:
                if key in cache:
                    if cache[key]["ts"] + expiry > now:
                        return cache[key]["value"]
                value = await func(*args, **kwargs)
                cache[key] = {"ts": time.perf_counter(), "value": value}
            return value

        def clear():
            cache.clear()
            locks.clear()

        wrapped.clear = clear
        return wrapped

    return outer


class KubeApiError(Exception):
    def __init__(self, body, status):
        self.body = body
        self.status = status

    def __str__(self):
        return f"{self.body.strip()} ({self.status})"


async def simple_json_get(kubeapi: aiohttp.ClientSession, url: str):
    async with kubeapi.get(url) as resp:
        if not 200 <= resp.status < 300:
            raise KubeApiError(body=(await resp.text()), status=resp.status)
        return await resp.json()


MEM_RX = re.compile(r"(\d+)(.*)")
MEM_SUFFIX_TABLE = {
    "": 1,
    "Ki": 1024,
    "Mi": 1024 * 1024,
    "Gi": 1024 * 1024 * 1024,
    "m": 1e-3,
}


def parse_mem(mem: str) -> int:
    """
    Parse a kubernetes memory specification, like 700Mi, return number of bytes
    """
    match = MEM_RX.match(mem)
    return int(match.group(1)) * MEM_SUFFIX_TABLE[match.group(2)]


CPU_RX = re.compile(r"(\d+)(.*)")
CPU_SUFFIX_TABLE = {"": 1, "n": 1e-9, "m": 1e-3, "u": 1e-6}


def parse_cpu(cpu: str) -> float:
    """
    Parse a kubernetes cpu specification, return number of cores
    """
    match = CPU_RX.match(cpu)
    return float(match.group(1)) * CPU_SUFFIX_TABLE[match.group(2)]


# the metrics are updated every 60 seconds, so there is no point in fetching
# them more frequently than that
@aiodogpile(60)
async def _fetch_metrics(*, pods, kubeapi: aiohttp.ClientSession) -> dict:
    try:
        metrics_data = await simple_json_get(
            kubeapi,
            f"{KUBE_API_URL}/apis/metrics.k8s.io/v1beta1"
            f"/namespaces/{NAMESPACE}/pods",
        )
    except KubeApiError as ex:
        logger.warning("Got error fetching the API metrics: %s", ex)
        return None

    pod_index = {pod["metadata"]["name"]: pod for pod in pods["items"]}
    metrics = {}
    for pod in metrics_data["items"]:
        pod_name = pod["metadata"]["name"]
        pod_spec = pod_index[pod_name]
        pod_metrics = {}
        for container in pod["containers"]:
            usage_cpu = parse_cpu(container["usage"]["cpu"])
            usage_mem = parse_mem(container["usage"]["memory"])
            container_name = container["name"]
            for spec in pod_spec["spec"]["containers"]:
                if spec["name"] == container_name:
                    break
            else:
                continue
            metric = {}
            try:
                cpu_limit = spec["resources"]["limits"]["cpu"]
            except KeyError:
                pass
            else:
                metric["cpu_ratio"] = usage_cpu / parse_cpu(cpu_limit)

            try:
                mem_limit = spec["resources"]["limits"]["memory"]
            except KeyError:
                pass
            else:
                metric["mem_ratio"] = usage_mem / parse_mem(mem_limit)

            if metric:
                pod_metrics[container_name] = metric
        if pod_metrics:
            metrics[pod_name] = pod_metrics

    return metrics


@aiodogpile(2)
async def _fetch_all_things(*, kubeapi: aiohttp.ClientSession) -> dict:
    deployments, pods, daemonsets, replicasets = await asyncio.gather(
        simple_json_get(
            kubeapi,
            f"{KUBE_API_URL}/apis/apps/v1/namespaces/"
            f"{NAMESPACE}/deployments/",
        ),
        simple_json_get(
            kubeapi, f"{KUBE_API_URL}/api/v1/namespaces/{NAMESPACE}/pods"
        ),
        simple_json_get(
            kubeapi,
            f"{KUBE_API_URL}/apis/apps/v1/namespaces/"
            f"{NAMESPACE}/daemonsets/",
        ),
        simple_json_get(
            kubeapi,
            f"{KUBE_API_URL}/apis/apps/v1/namespaces/"
            f"{NAMESPACE}/replicasets/",
        ),
    )
    replicaset_deployment_map = {}
    for replicaset in replicasets["items"]:
        for owner in replicaset["metadata"].get("ownerReferences", []):
            if owner["kind"] != "Deployment":
                continue
            rs_uid = replicaset["metadata"]["uid"]
            replicaset_deployment_map[rs_uid] = owner["uid"]

    metrics = await _fetch_metrics(pods=pods, kubeapi=kubeapi)

    return {
        "deployments": deployments,
        "daemonsets": daemonsets,
        "replicaset_deployment_map": replicaset_deployment_map,
        "replicasets": replicasets,
        "pods": pods,
        "metrics": metrics,
    }


async def web_get_all(request) -> web.Response:
    try:
        all_things = await _fetch_all_things(
            kubeapi=request.app["kubesession"]
        )
    except KubeApiError as error:
        logger.exception("Error calling API")
        return web.Response(body=error.body, status=error.status)
    return web.json_response(all_things)


async def web_pod_log(request) -> web.Response:
    # https://kubernetes.io/docs/api-reference/v1.8/#read-log
    http = request.app["kubesession"]
    pod_name = request.match_info["name"]
    container_name = request.match_info["container"]
    timestamps = request.query.get("timestamps", "false")

    params = {
        # 'sinceSeconds': 600,
        "tailLines": 1000,
        "container": container_name,
        "timestamps": timestamps,
    }
    url = f"{KUBE_API_URL}/api/v1/namespaces/{NAMESPACE}/pods/{pod_name}/log"
    async with http.get(url, params=params) as resp:
        if not 200 <= resp.status < 300:
            return web.Response(body=(await resp.text()), status=resp.status)
        log = await resp.text()
    return web.Response(text=log)


async def get_deployment(name, kubeapi: aiohttp.ClientSession):
    async with kubeapi.get(
        f"{KUBE_API_URL}/apis/apps/v1/"
        f"namespaces/{NAMESPACE}/deployments/{name}"
    ) as resp:
        if not 200 <= resp.status < 300:
            raise KubeApiError(body=(await resp.text()), status=resp.status)

        deployment = await resp.json()

    return deployment


async def set_deployment_replicas(
    name, replicas, kubeapi: aiohttp.ClientSession
):
    deployment = await get_deployment(name, kubeapi)
    annotations = deployment["metadata"]["annotations"]
    if "kubeonoff/original-replicas" not in annotations:
        annotations["kubeonoff/original-replicas"] = str(
            deployment["spec"]["replicas"]
        )

    patch = json.dumps(
        {
            "metadata": {"annotations": annotations},
            "spec": {"replicas": replicas},
        }
    ).encode("utf-8")

    async with kubeapi.patch(
        f"{KUBE_API_URL}/apis/apps/v1/"
        f"namespaces/{NAMESPACE}/deployments/{name}/",
        headers={"Content-Type": "application/strategic-merge-patch+json"},
        data=patch,
    ) as resp:
        result = await resp.text()
        if not 200 <= resp.status < 300:
            raise KubeApiError(body=result, status=resp.status)
    return json.loads(result)


async def web_deployment_off(request) -> web.Response:
    try:
        result = await set_deployment_replicas(
            name=request.match_info["name"],
            replicas=0,
            kubeapi=request.app["kubesession"],
        )
    except KubeApiError as error:
        return web.Response(body=error.body, status=error.status)

    return web.json_response(result)


async def web_deployment_on(request) -> web.Response:
    kubeapi = request.app["kubesession"]
    name = request.match_info["name"]
    deployment = await get_deployment(name, kubeapi)

    annotations = deployment["metadata"]["annotations"]
    try:
        replicas = int(annotations["kubeonoff/original-replicas"])
    except (KeyError, ValueError) as err:
        return web.Response(
            body=f'deployment "{name}" wasn\'t stopped by onoff: {err}',
            status=400,
        )

    try:
        result = await set_deployment_replicas(name, replicas, kubeapi)
    except KubeApiError as error:
        return web.Response(body=error.body, status=error.status)

    return web.json_response(result)


async def web_deployment_restart(request) -> web.Response:
    kubeapi = request.app["kubesession"]
    name = request.match_info["name"]

    try:
        deployment = await get_deployment(name, kubeapi)

        all_the_things = await _fetch_all_things(
            kubeapi=request.app["kubesession"]
        )
        replicaset_deployment_map = all_the_things["replicaset_deployment_map"]
        pods = all_the_things["pods"]

        deployment_id = deployment["metadata"]["uid"]

        deletions = []

        for pod in pods["items"]:
            owners = pod["metadata"].get("ownerReferences", [])
            for owner in owners:
                pod_dep_id = replicaset_deployment_map.get(owner["uid"], None)

                if pod_dep_id is not None and pod_dep_id == deployment_id:
                    deletions.append(
                        await delete_pod(pod["metadata"]["name"], kubeapi)
                    )

        result = {"deletions": deletions, "deployment": deployment}
    except KubeApiError as error:
        return web.Response(body=error.body, status=error.status)

    return web.json_response(result)


async def web_deployment_rolling_restart(request) -> web.Response:
    LABEL = "kubeonoff/rolling-restart-serial"
    kubeapi = request.app["kubesession"]
    name = request.match_info["name"]

    try:
        deployment = await get_deployment(name, kubeapi)
        labels = deployment["spec"]["template"]["metadata"]["labels"]
        serial = int(labels.get(LABEL, "0")) + 1
        labels[LABEL] = str(serial)
        patch = json.dumps(
            {"spec": {"template": {"metadata": {"labels": labels}}}}
        ).encode("utf-8")

        async with kubeapi.patch(
            f"{KUBE_API_URL}/apis/apps/v1/"
            f"namespaces/{NAMESPACE}/deployments/{name}/",
            headers={"Content-Type": "application/strategic-merge-patch+json"},
            data=patch,
        ) as resp:
            if not 200 <= resp.status < 300:
                raise KubeApiError(
                    body=(await resp.text()), status=resp.status
                )
    except KubeApiError as error:
        return web.Response(body=error.body, status=error.status)

    return web.json_response({})


async def delete_pod(name, kubeapi):
    async with kubeapi.delete(
        f"{KUBE_API_URL}/api/v1/namespaces/" f"{NAMESPACE}/pods/{name}"
    ) as resp:
        result = await resp.text()
        if not 200 <= resp.status < 300:
            return KubeApiError(body=result, status=resp.status)

    return json.loads(result)


async def web_pod_delete(request) -> web.Response:
    name = request.match_info["name"]
    try:
        result = await delete_pod(
            name=name, kubeapi=request.app["kubesession"]
        )
    except KubeApiError as error:
        return web.Response(body=error.body, status=error.status)

    return web.json_response(result)


async def web_pod_delete_all(request) -> web.Response:
    kubeapi = request.app["kubesession"]
    everything = await _fetch_all_things(kubeapi=kubeapi)
    pods = [
        p["metadata"]["name"]
        for p in everything["pods"]["items"]
        if "kubeonoff" not in p["metadata"]["name"]
    ]

    results = []

    for pod in pods:
        try:
            result = await delete_pod(name=pod, kubeapi=kubeapi)
            results.append(result)
        except KubeApiError as error:
            results.append(error)

    return web.json_response(results)


async def serve_index_html(request) -> web.Response:
    with open(
        os.path.dirname(os.path.realpath(__file__))
        + "/../kubeonoff-frontend/build/index.html"
    ) as f:
        content = f.read()
        return web.Response(text=content, content_type="text/html")


EXTENSIONS = []


def load_extensions(app):
    extensions_to_load = [
        ext
        for ext in os.environ.get("KUBEONOFF_EXTENSIONS", "").split(",")
        if ext
    ]
    for ext_name in extensions_to_load:
        print(f"Loading extension {ext_name!r}...")
        module = importlib.import_module(f"kubeonoff.extensions.{ext_name}")
        if not hasattr(module, "get_controls"):
            print(
                f'ERROR: Extension "{ext_name}" does not have a get_controls method.'
            )
            sys.exit(1)
        subapp = module.create_web_app(kubesession=app["kubesession"])
        subapp.router.add_get("/controls", module.get_controls)
        app.add_subapp(f"/v1/kubeonoff/extensions/{ext_name}/", subapp)
        EXTENSIONS.append({"name": ext_name})
        print(f"Extension {ext_name!r} loaded: {module}")


async def web_get_extensions(request) -> web.Response:
    return web.json_response(EXTENSIONS)


def create_web_app():
    app = web.Application(middlewares=[auth_trail_middleware])

    with open(TOKEN_PATH, "rt") as tokenfile:
        token = tokenfile.read().strip()
    sslcontext = ssl.create_default_context(cafile=CAFILE_PATH)
    conn = aiohttp.TCPConnector(ssl_context=sslcontext)
    app["kubesession"] = aiohttp.ClientSession(
        connector=conn, headers={"Authorization": f"Bearer {token}"}
    )

    app.router.add_post("/v1/deployments/{name}/off", web_deployment_off)
    app.router.add_post("/v1/deployments/{name}/on", web_deployment_on)
    app.router.add_post(
        "/v1/deployments/{name}/restart", web_deployment_rolling_restart
    )
    app.router.add_get("/v1/pods/{name}/{container}/log", web_pod_log)
    app.router.add_delete("/v1/pods/all", web_pod_delete_all)
    app.router.add_delete("/v1/pods/{name}", web_pod_delete)
    app.router.add_get("/v1/all", web_get_all)
    app.router.add_get("/v1/kubeonoff/extensions", web_get_extensions)

    load_extensions(app)

    # keep these routes last
    app.router.add_get("/", serve_index_html)
    app.router.add_static(
        "/",
        os.path.dirname(os.path.realpath(__file__))
        + "/../kubeonoff-frontend/build",
        follow_symlinks=True,
        show_index=True,
    )
    app.on_shutdown.append(on_shutdown)
    return app


async def on_shutdown(app):
    print("Shutting down...")
    app["kubesession"].close()


def main():
    parser = argparse.ArgumentParser()

    parser.add_argument("--no-uvloop", default=False, action="store_true")
    parser.add_argument("--log-level", default="INFO")
    args = parser.parse_args()

    logging.basicConfig(level=getattr(logging, args.log_level))
    if not args.no_uvloop:
        asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())

    app = create_web_app()
    web.run_app(app, host="0.0.0.0", port=80)


if __name__ == "__main__":
    main()
