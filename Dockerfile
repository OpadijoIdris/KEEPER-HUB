# --- build ---
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src

# `prisma generate` only reads the schema, it never connects — but
# prisma.config.ts resolves DATABASE_URL eagerly (see ROADMAP.md Phase 1
# log), so it needs *some* value at build time. The real one is supplied
# at container runtime via docker-compose/.env, this is unused otherwise.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npx prisma generate
RUN npm run build

# --- runtime ---
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Full node_modules (not a prod-only install) — `prisma migrate deploy` at
# startup needs the `prisma` CLI, which is a devDependency. Simpler than
# splitting it out for a hackathon-scale image; not size-optimized.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./
COPY --from=build /app/package.json ./

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
