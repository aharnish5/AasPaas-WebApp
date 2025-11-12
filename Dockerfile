# Multi-stage Dockerfile: build frontend (Vite) and run backend (Express)

# ---------- Frontend build stage ----------
FROM node:18-alpine AS frontend-build
WORKDIR /frontend

# Install deps and build
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# ---------- Backend runtime stage ----------
FROM node:18-alpine
WORKDIR /app

ENV NODE_ENV=production

# Install backend dependencies
COPY backend/package*.json ./
RUN apk add --no-cache libc6-compat \
	&& npm install --omit=dev

# Copy backend source
COPY backend/. .

# Copy built frontend into the image; backend will serve it
COPY --from=frontend-build /frontend/dist ./frontend-dist
ENV FRONTEND_DIST_DIR=/app/frontend-dist

# Expose the port (Render will provide $PORT at runtime)
EXPOSE 5000

# Start backend
CMD ["node", "src/index.js"]
