ARG BUILD_DIR=/app

FROM rust:slim AS wasm-builder

ARG BUILD_DIR
WORKDIR ${BUILD_DIR}

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

RUN curl https://wasm-bindgen.github.io/wasm-pack/installer/init.sh -sSf | sh

COPY rxing-wasm ./
RUN wasm-pack build --release

FROM node:slim AS frontend-builder

ARG BUILD_DIR
WORKDIR ${BUILD_DIR}

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --from=wasm-builder ${BUILD_DIR}/pkg ./rxing-wasm/pkg

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

COPY . .
RUN pnpm build

FROM nginx:alpine

ARG BUILD_DIR

COPY --from=frontend-builder ${BUILD_DIR}/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
