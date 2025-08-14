# Container Build for Rocket.Chat AI App

This directory contains the containerized build setup for the Rocket.Chat AI App using the specified versions:
- Node.js: v22.17.1
- npm: v8.19.2

## Files

- `Dockerfile` - Multi-stage Docker build configuration
- `.dockerignore` - Optimizes build context by excluding unnecessary files

## Building Locally

### Prerequisites
- Docker installed on your system

### Build the app using Docker

1. From the repository root, run:
```bash
docker build -f container/Dockerfile -t rocketchat-ai-app-builder .
```

2. Extract the build artifact:
```bash
# Create a temporary container and copy the build output
docker run --name temp-container rocketchat-ai-app-builder
docker cp temp-container:/app/dist ./build-output
docker rm temp-container
```

Alternatively, use a volume mount:
```bash
# Run with volume mount to get output directly
docker run --rm -v $(pwd):/output rocketchat-ai-app-builder sh -c "cp -r /app/dist/* /output/"
```

### Using Docker Compose

For easier development, you can use the provided docker-compose.yml:

```bash
cd container
docker-compose up --build
```

This will build the image and run the build process, with the output available in the `dist/` directory.

## GitHub Actions

The build is automated via GitHub Actions. Every push to `main` or `develop` branches and all pull requests will:

1. Build the Docker image
2. Run the build process inside the container  
3. Upload the resulting `ai-bot_0.0.1.zip` as a workflow artifact

## Build Output

The build process creates:
- `dist/ai-bot_0.0.1.zip` - The packaged Rocket.Chat app ready for deployment

## Troubleshooting

### Check Node and npm versions in container:
```bash
docker run --rm rocketchat-ai-app-builder sh -c "node --version && npm --version"
```

### Debug build issues:
```bash
docker run --rm -it rocketchat-ai-app-builder sh
```

### View build logs:
```bash
docker build -t rocketchat-ai-app-builder . --no-cache
```