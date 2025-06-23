# Base Dockerfile used by all services
FROM node:18-alpine

# Install network debugging tools
RUN apk add --no-cache \
    bind-tools \
    curl \
    iputils-ping \
    net-tools \
    busybox-extras

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy app source
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /usr/src/app
USER nodejs

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "app.js"]