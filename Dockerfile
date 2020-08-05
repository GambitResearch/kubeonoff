FROM ubuntu:18.04
RUN DEBIAN_FRONTEND=noninteractive apt-get -q update && \
	DEBIAN_FRONTEND=noninteractive apt-get -q install -y --no-install-recommends \
	build-essential \
	nodejs \
	python3.7 \
	python3-pip \
	python3-setuptools \
	npm \
	curl \
	openssh-client

COPY requirements.txt /code/requirements.txt
RUN pip3 --no-cache-dir install -r /code/requirements.txt

COPY /setup.py /code/

WORKDIR /code/kubeonoff-frontend
RUN npm install -g n && n 9.2.0
COPY kubeonoff-frontend/package.json kubeonoff-frontend/package-lock.json \
	./
RUN npm install

COPY kubeonoff-frontend .
RUN npm run build

COPY . /code

WORKDIR /code/
RUN python3 setup.py develop

ENTRYPOINT ["python3", "-Xfaulthandler", "-u", "kubeonoff/main.py"]
