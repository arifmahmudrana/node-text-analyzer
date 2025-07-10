# Multi-stage build for optimal image size
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci --include=dev

# Copy source code
COPY . .

# Build the application
RUN npm run build && npm prune --production

# Production stage
FROM node:22-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user with specific UID/GID for Kubernetes compatibility
RUN addgroup -g 1001 -S nodejs && \
    adduser -S textapi -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Copy built application and production dependencies
COPY --from=builder --chown=textapi:nodejs /app/dist ./dist
COPY --from=builder --chown=textapi:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=textapi:nodejs /app/package*.json ./

# Create logs directory with proper permissions
RUN mkdir -p logs && \
    chown -R textapi:nodejs logs && \
    chmod 755 logs

# Switch to non-root user
USER textapi

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application with logging
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "start:prod"]
