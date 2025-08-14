# Build image for Rocket.Chat AI App
# Using Node.js v22.18.0 with built-in npm
FROM node:22.18.0-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm config set strict-ssl false && npm install && npm config set strict-ssl true

# Copy application source code
COPY . .

# Remove container directory to avoid duplication
RUN rm -rf container/

# Create output directory
RUN mkdir -p dist

# Build the application
RUN npm run build

# Verify the build output
RUN ls -la dist/

# Default command to show build results
CMD ["sh", "-c", "echo 'Build completed successfully!' && ls -la dist/ && echo 'Build artifact:' && ls -la dist/*.zip"]