# A simple web UI for managing Kubernetes deployments

## Intro

Kubeonoff is a small web UI that allows to quickly stop/start/restart pods.
It will also have visual cues that draws your attention if any pod or
deployment is behaving suspicously, such as:

  1. pods with restarting containers
  1. pods with cpu or memory near the configured limit
  1. deployments that don't have all the required replicas up and ready

A secondary goal of kubeonoff is to have a UI that non-developers can use, for
when the application is on fire and restarting it might fix it temporarily,
before calling a developer.


## Quickstart

Kubeonoff is a small web app that needs to be deployed to a specific k8s
namespace.  It is totally namespace specific.  To manage multiple namespaces in
the same cluster, kubeonoff needs to be deployed for each namespace.

The file `deploy/kubeonoff.yaml` contains a sample deployment manifest,
including a kubeonoff Service, a Deployment, as well a service account and
RBAC permissions:

    kubectl -n your-namespace apply -f deploy/kubeonoff.yaml

Now you can find out the service IP:

    $ kubectl get svc kubeonoff
    NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
    kubeonoff    ClusterIP   10.107.160.49   <none>        80/TCP    78m

Which means you should be able to open `http://10.107.160.49` in a browser.

![Screenshot](Screenshot.png)


## Security

Kubeonoff is meant to be exposed by some authenticating reverse proxy.  Do _not_ expose it to the Internet as it is!

The reverse proxy will have a login function, and possibly set some HTTP header 
indicating to the kubeonoff backend what is the username of the logged in user.  You can tell kubeonoff the name of the HTTP header that will contain the authenticated username by defining the `PROXY_AUTH_USER_HEADER` environment variable.  Kubeonoff will read this header containing the username, and the username will be used for logging.  Thus, if you inspect the kubeonoff logs (on container stdout), you will be able to get an audit log of who did what.

While kubeonoff uses a ServiceAccount with permissions giving it considerable power, the web UI is restricted in what it can do, to keep the cluster secure.

Here's what the web UI allows the user to do:

1. Delete pods;
2. Stop a deployment (set replicas to zero);
3. Start a deployment again (set replicas back to the original value);
4. Causing a rolling-restart of the pods of container (by modifying a label);
5. View logs of containers;

Even though kubeonoff backend needs a `patch` permission to Deployment resources, it only allows to stop/start/restart deployments.  It does _not_ allow to change any other field. Therefore kubeonoff does _NOT_ allow for code injection.  Therefore, a user with access to kubeonoff might be able to cause some downtime in your application by stopping pods, but it _cannot_ inject code into the cluster.
