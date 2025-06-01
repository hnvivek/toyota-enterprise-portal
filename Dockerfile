# Multi-stage Dockerfile for Toyota Enterprise Portal
# Stage 1: Build frontend
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend
COPY toyota-enterprise-portal/package*.json ./
RUN npm ci

# Set environment variables for React build - EXPLICIT SETTING
ENV NODE_ENV=production
ENV REACT_APP_API_URL=/api

# Debug: Show environment variables during build
RUN echo "🔍 Build Environment:" && \
    echo "NODE_ENV: $NODE_ENV" && \
    echo "REACT_APP_API_URL: $REACT_APP_API_URL"

COPY toyota-enterprise-portal/ ./

# Build with explicit environment variables
RUN REACT_APP_API_URL=/api NODE_ENV=production npm run build

# Debug: Check if build completed
RUN echo "✅ React build completed" && ls -la build/

# Stage 2: Build backend
FROM node:18-alpine AS backend-build

WORKDIR /app/backend
COPY server/package*.json ./
RUN npm ci

COPY server/ ./
RUN npm run build

# Stage 3: Production runtime
FROM node:18-alpine AS production

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Install curl for health checks
RUN apk add --no-cache curl

# Install production dependencies for backend
COPY server/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built backend
COPY --from=backend-build /app/backend/dist ./dist

# Copy migration files for production
COPY --from=backend-build /app/backend/src/migrations ./src/migrations

# Copy built frontend to serve statically
COPY --from=frontend-build /app/frontend/build ./public

# Create uploads directory
RUN mkdir -p uploads

# Copy startup script
COPY start.sh ./
RUN chmod +x start.sh

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/api/health || exit 1

# Start the application with seeding
CMD ["./start.sh"] 