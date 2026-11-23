FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    python3 \
    make \
    g++ \
    sqlite3 \
  && rm -rf /var/lib/apt/lists/*

ARG TARGETARCH
RUN ARCH="${TARGETARCH:-amd64}" && \
    curl -fsSL "https://github.com/benbjohnson/litestream/releases/download/v0.3.13/litestream-v0.3.13-linux-${ARCH}.tar.gz" \
    | tar -xz -C /usr/local/bin litestream && \
    chmod +x /usr/local/bin/litestream

WORKDIR /app

COPY package.json ./
RUN npm install --no-audit --no-fund

COPY . .
RUN chmod +x /app/scripts/cloudrun-entrypoint.sh && \
    mkdir -p /var/data/bible && \
    npm run build

ENV NODE_ENV=production
ENV PORT=8080
ENV BIBLE_DATA_DIR=/var/data/bible

EXPOSE 8080

CMD ["/app/scripts/cloudrun-entrypoint.sh"]
