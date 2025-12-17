# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies for Prisma and native modules
RUN apk add --no-cache \
    openssl \
    libc6-compat

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy Prisma schema and generate Prisma Client
COPY prisma ./prisma
RUN npx prisma generate

# Copy application code
COPY . .

# Create uploads directory structure
RUN mkdir -p uploads/employees \
    uploads/hostels \
    uploads/owners \
    uploads/profiles \
    uploads/tenants

# Expose port (default 3000, can be overridden via env)
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Health check - check if server is responding (accepts any status code < 500)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode < 500 ? 0 : 1)})" || exit 1

# Start the application
CMD ["node", "app.js"]

