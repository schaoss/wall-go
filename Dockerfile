FROM oven/bun:1-alpine AS builder
RUN adduser -D -g '' appuser
WORKDIR /app
RUN chown -R appuser:appuser /app
USER appuser
COPY --chown=appuser:appuser package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY --chown=appuser:appuser . .
RUN bun run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html/wall-go/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
