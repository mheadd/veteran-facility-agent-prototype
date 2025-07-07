# Use multi-stage build for M2 optimization
FROM node:18-alpine AS builder

# Install build dependencies optimized for ARM64
RUN apk add --no-cache \
    curl \
    sqlite \
    python3 \
    make \
    g++ \
    libc6-compat

WORKDIR /app

# Copy and install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM node:18-alpine AS production

# Install runtime dependencies only
RUN apk add --no-cache \
    curl \
    sqlite \
    dumb-init

# Create app directory
WORKDIR /app

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY package*.json ./

# Create necessary directories
RUN mkdir -p data logs

# Create non-root user optimized for container
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Set proper permissions
RUN chown -R nodejs:nodejs /app && \
    chmod -R 755 /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Optimize Node.js for M2 and memory constraints
ENV NODE_OPTIONS="--max-old-space-size=1536"
ENV NODE_ENV=development

# Health check with longer intervals for development
HEALTHCHECK --interval=45s --timeout=15s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "start"]