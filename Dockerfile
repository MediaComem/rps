# https://docs.docker.com/reference/dockerfile/

# Builder image
# =============

FROM node:22.9.0-alpine AS build

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci

COPY ./ ./
RUN npm run build && \
    npm prune --production

# Production image
# ================

FROM node:22.9.0-alpine

ENV NODE_END=production

WORKDIR /usr/src/app

RUN addgroup -S rps && adduser -S rps -G rps && \
    chown -R rps:rps /usr/src/app

COPY --chown=rps:rps --from=build /usr/src/app/ /usr/src/app/

CMD ["node", "./bin/www.js"]

EXPOSE 3000
