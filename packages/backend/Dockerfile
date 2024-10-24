FROM node:18-alpine

WORKDIR /usr/src/app

COPY package.json ./

RUN set -ex; \
    apk add git g++ gcc libgcc libstdc++ linux-headers make python3; \
    yarn install --no-cache --frozen-lockfile; \
    yarn cache clean;

COPY ./ .
COPY ./.env.production ./.env

RUN set -ex; \
    yarn build; \
    rm -rf src;

CMD [ "yarn", "serve" ]
