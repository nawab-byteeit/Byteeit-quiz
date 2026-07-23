# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder
WORKDIR /app

# The Supabase anon key + URL are public by design (security is enforced by
# Postgres RLS, not by keeping this key secret) -- see supabase/migrations.
# Vite inlines VITE_* vars into the client bundle at build time, so they must
# be present now, not just as Cloud Run runtime env vars.
ARG VITE_SUPABASE_URL="https://drxfqwqnrtgtbbzkhgnt.supabase.co"
ARG VITE_SUPABASE_ANON_KEY="sb_publishable_OIHTh86bnsPK37lgM6_Exg_jsYilULn"
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# ---------------------------------------------------------------------------

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

# Cloud Run injects PORT at runtime; server.ts already binds to it on 0.0.0.0.
EXPOSE 8080
CMD ["node", "dist/server.cjs"]
