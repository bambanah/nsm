FROM node:24-slim AS base
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./

FROM base AS build
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM base
ENV NODE_ENV=production
RUN pnpm install --prod --frozen-lockfile --ignore-scripts
COPY --from=build /app/.output ./.output
COPY drizzle ./drizzle
COPY migrate.js ./
EXPOSE 3000
CMD ["sh", "-c", "node migrate.js && node .output/server/index.mjs"]
