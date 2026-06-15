# syntax=docker/dockerfile:1

# ---- Build stage: install all deps, generate Prisma client, compile TS ----
FROM node:20-alpine AS build
WORKDIR /app

# Prisma needs openssl on Alpine to generate/run the query engine
RUN apk add --no-cache openssl

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build   # runs: prisma generate && tsc

# ---- Production stage: minimal runtime image ----
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl

# Bring over installed deps (incl. generated Prisma client), build output, schema
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json ./

EXPOSE 3000
CMD ["node", "dist/server.js"]
