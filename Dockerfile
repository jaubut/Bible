FROM node:22-slim
RUN npm install -g bun@1.3.11
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build
RUN chown -R node:node /app/data /app/.next
ENV NODE_ENV=production
ENV PORT=3000
USER node
EXPOSE 3000
CMD ["node_modules/.bin/next", "start", "-H", "0.0.0.0"]
