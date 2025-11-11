FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Prefer regular install since package-lock.json is absent; omit dev deps
# Using npm v9+ flag --omit=dev instead of deprecated --only=production

# Install dependencies (production only)
RUN npm install --omit=dev

# Copy application code
COPY . .

# Set NODE_ENV for libraries optimizations
ENV NODE_ENV=production

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 5000

# Run as non-root for security
RUN adduser -D appuser && chown -R appuser /app
USER appuser

# Start application
CMD ["node", "src/index.js"]

