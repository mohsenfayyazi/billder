# Frontend Docker Setup

This directory contains Docker configuration for the Billder frontend application.

## Files Created

- `Dockerfile` - Production Docker image
- `Dockerfile.dev` - Development Docker image with hot reloading
- `docker-compose.yml` - Production Docker Compose configuration
- `docker-compose.dev.yml` - Development Docker Compose configuration
- `.dockerignore` - Files to exclude from Docker build context
- `start.sh` - Startup script

## Usage

### Production Mode

```bash
# Build and run in production mode
docker-compose up --build

# Run in detached mode
docker-compose up -d --build
```

### Development Mode (with hot reloading)

```bash
# Build and run in development mode
docker-compose -f docker-compose.dev.yml up --build

# Run in detached mode
docker-compose -f docker-compose.dev.yml up -d --build
```

### Individual Commands

```bash
# Build the image
docker build -t billder-frontend .

# Run the container
docker run -p 3000:3000 billder-frontend

# Development build
docker build -f Dockerfile.dev -t billder-frontend-dev .
docker run -p 3000:3000 -v $(pwd):/app billder-frontend-dev
```

## Environment Variables

Create a `.env.local` file with the following variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
NEXT_PUBLIC_APP_NAME=Billder
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Network Configuration

The frontend is configured to use the `billder-network` Docker network. Make sure to create this network if it doesn't exist:

```bash
docker network create billder-network
```

## Ports

- **3000** - Frontend application (Next.js)

## Volumes

- **Development**: Source code is mounted for hot reloading
- **Production**: Only built files are included in the image

## Troubleshooting

### Build Issues
- Make sure Node.js dependencies are properly installed
- Check that all environment variables are set correctly
- Verify that the backend is running and accessible

### Hot Reloading Not Working
- Ensure you're using the development Docker Compose file
- Check that volumes are properly mounted
- Verify file permissions

### Network Issues
- Make sure the `billder-network` exists
- Check that both frontend and backend are on the same network
- Verify API URLs in environment variables
