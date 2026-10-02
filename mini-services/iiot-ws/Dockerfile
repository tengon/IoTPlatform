FROM oven/bun:1.2-alpine
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY index.ts ./

ENV PORT=3002

EXPOSE 3002

CMD ["bun", "--hot", "index.ts"]
