FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src
RUN npx prisma generate
RUN npm run build

FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
EXPOSE 4000

# Postgres: `db push` sincroniza esquema y `db seed` carga datos iniciales.
# Cuando existan migraciones versionadas, sustituir `db push` por `migrate deploy`.
CMD ["sh", "-c", "npx prisma db push && npx prisma db seed && node dist/server.js"]
