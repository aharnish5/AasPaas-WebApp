# Render backend deployment Dockerfile (multi-stage for production)
# Using node:20-alpine for smaller image and long term support
FROM node:20-alpine AS base

WORKDIR /app

COPY backend/package*.json ./
RUN npm install --omit=dev

COPY backend ./backend
WORKDIR /app/backend

ENV NODE_ENV=production

# Expose port expected by Render (set via PORT env variable)
EXPOSE 5000

# Use a non-root user for security (optional)
RUN adduser -D appuser && chown -R appuser /app
USER appuser

# Start command
CMD ["node", "src/index.js"]
