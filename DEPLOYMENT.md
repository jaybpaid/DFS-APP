# DFS App Deployment Guide

## Prerequisites

- Docker and Docker Compose installed on the production server
- Access to the production server via SSH
- Docker Hub account for pushing images

## Build and Deploy

1. Build the Docker image locally or in CI:

```bash
docker build -t your-dockerhub-username/dfs-app:latest .
```

2. Push the image to Docker Hub:

```bash
docker push your-dockerhub-username/dfs-app:latest
```

3. SSH into the production server and pull the latest image:

```bash
docker pull your-dockerhub-username/dfs-app:latest
```

4. Start the containers using Docker Compose:

```bash
docker-compose -f /path/to/docker-compose.yml up -d
```

## Database Migration

Run migrations on the production server:

```bash
./migrate-db.sh
```

## Running Tests

Run end-to-end tests locally or in CI:

```bash
cd DFSForge/client
npm run test:e2e
```

## Monitoring and Logs

- Use Docker logs to monitor container output:

```bash
docker logs -f <container_name>
```

- Monitor application health via `/api/health` endpoint

## Rollback

To rollback to a previous version:

```bash
docker tag your-dockerhub-username/dfs-app:<previous_tag> your-dockerhub-username/dfs-app:latest
docker push your-dockerhub-username/dfs-app:latest
docker-compose -f /path/to/docker-compose.yml up -d
```

## Contact

For issues, contact the DevOps team or project maintainer.

---

This guide provides the essential steps to deploy, maintain, and troubleshoot the DFS app in production.
