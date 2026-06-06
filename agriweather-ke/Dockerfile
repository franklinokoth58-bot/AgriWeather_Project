# ============================================================
# Stage 1 — development
# Runs the Vite dev server with hot-module replacement.
# Usage: docker-compose up agriweather-dev
# ============================================================
FROM node:18-alpine AS development

WORKDIR /app

# Copy manifests first — Docker caches this layer until they change
COPY package*.json ./

# npm ci is faster and deterministic (respects package-lock.json)
RUN npm ci

# Copy the rest of the source
COPY . .

EXPOSE 5173

# Bind to 0.0.0.0 so the port is reachable from outside the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]


# ============================================================
# Stage 2 — builder
# Compiles the production bundle into /app/dist.
# This stage is an intermediate — never run directly.
# ============================================================
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Vite writes the optimised bundle to /app/dist
RUN npm run build


# ============================================================
# Stage 3 — production
# Serves the pre-built static assets with nginx.
# Usage: docker-compose --profile prod up agriweather-prod
# ============================================================
FROM nginx:alpine AS production

# Copy the compiled assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Replace the default nginx config with our SPA-aware config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
