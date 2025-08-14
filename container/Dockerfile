# Build image for Rocket.Chat AI App
# Using Node.js v22.17.1 and npm v8.19.2 as specified
FROM node:22.17.1-alpine

# Install npm v8.19.2 as required
RUN npm config set strict-ssl false && npm install -g npm@8.19.2 && npm config set strict-ssl true

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