ARG DOCKER_HUB="docker.io"
ARG NGINX_VERSION="1.17.6"
ARG NODE_VERSION="24-alpine"

FROM $DOCKER_HUB/library/node:$NODE_VERSION as build

RUN apk add --no-cache python3 make g++

COPY . /workspace/

ARG NPM_REGISTRY=" https://registry.npmjs.org"

RUN cd /workspace/                                                                       && \
    npm install --force                                                                  && \
    npm run build                                                 

FROM $DOCKER_HUB/library/nginx:$NGINX_VERSION AS runtime

COPY  --from=build /workspace/dist/ /usr/share/nginx/html/conduit/dist/
RUN chmod a+rwx /var/cache/nginx /var/run /var/log/nginx
RUN chown nginx:nginx /usr/share/nginx/html/*
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080

USER nginx

HEALTHCHECK     CMD     [ "service", "nginx", "status" ]