# Render backend deployment Dockerfile (multi-stage for production)
# Using node:20-alpine for smaller image and long term support
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies (production only) early for better layer caching
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy backend source
COPY backend ./backend
WORKDIR /app/backend

# Expose port expected by Render (set via PORT env variable)
EXPOSE 5000

# Use a non-root user for security (optional)
RUN adduser -D appuser && chown -R appuser /app
USER appuser

# Start command
CMD ["node", "src/index.js"]
