ARG RUST_VERSION=1.95
ARG WASM_PACK_VERSION=0.15.0
ARG NODE_VERSION=26.1
ARG PNPM_VERSION=11.1.2
ARG NGINX_VERSION=1.31

ARG BUILD_DIR=/app

ARG DEBIAN_FRONTEND=noninteractive
ARG TARGETPLATFORM

FROM rust:${RUST_VERSION}-slim AS wasm-builder

ARG BUILD_DIR
WORKDIR ${BUILD_DIR}

ARG DEBIAN_FRONTEND
RUN apt-get update && \
  apt-get install -y --no-install-recommends \
  wget ca-certificates && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

ARG WASM_PACK_VERSION
ARG TARGETPLATFORM

RUN <<INSTALL_WASM_PACK
#!/bin/bash
set -euo pipefail

case "${TARGETPLATFORM:-$(uname -m)}" in
  "linux/amd64"|"x86_64")
    arch="x86_64"
    ;;
  "linux/arm64"|"aarch64")
    arch="aarch64"
    ;;
  *)
    echo "Unsupported platform: ${TARGETPLATFORM:-$(uname -m)}"
    exit 1
    ;;
esac

package="wasm-pack-v${WASM_PACK_VERSION}-${arch}-unknown-linux-musl"

wget -qO- "https://github.com/rustwasm/wasm-pack/releases/download/v${WASM_PACK_VERSION}/${package}.tar.gz" |
  tar xz -C /usr/local/bin --strip-components=1 "${package}/wasm-pack"

wasm-pack --version
INSTALL_WASM_PACK

COPY rxing-wasm ./

RUN wasm-pack build --release

FROM node:${NODE_VERSION}-slim AS frontend-builder

ARG BUILD_DIR
WORKDIR ${BUILD_DIR}

RUN apt-get update && \
  apt-get install -y --no-install-recommends \
  wget ca-certificates libatomic1 && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

ARG PNPM_VERSION
RUN wget -qO- https://get.pnpm.io/install.sh | env PNPM_VERSION=${PNPM_VERSION} bash -s

ARG PNPM_HOME="/root/.local/share/pnpm"
ARG PATH="$PNPM_HOME/bin:$PATH"

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --from=wasm-builder ${BUILD_DIR}/pkg ./rxing-wasm/pkg

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

COPY . .
RUN pnpm build

FROM nginx:${NGINX_VERSION}-alpine

ARG BUILD_DIR

COPY --from=frontend-builder ${BUILD_DIR}/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
