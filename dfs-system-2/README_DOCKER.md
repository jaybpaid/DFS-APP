# DFS Ultimate Optimizer - Docker Deployment Guide

## 🐳 Docker Containerization Benefits

### Why Docker for DFS Ultimate Optimizer?

✅ **Consistency**: Same environment across development, testing, and production
✅ **Isolation**: No conflicts with host system dependencies
✅ **Scalability**: Easy horizontal scaling and load balancing
✅ **Portability**: Run anywhere Docker is supported
✅ **Easy Deployment**: One-command deployment and updates
✅ **Resource Management**: Better control over CPU/memory usage
✅ **Security**: Isolated container environment
✅ **Backup/Recovery**: Easy data volume management

## 🚀 Quick Start

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB+ RAM recommended
- 2GB+ disk space

### Basic Deployment

```bash
# Clone and navigate to the project
cd dfs-system-2

# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Access the application
open http://localhost:8000
```

## 📋 Deployment Options

### 1. Basic Development Setup

```bash
# Start just the main application
docker-compose up dfs-optimizer
```

### 2. Production Setup with Redis

```bash
# Start with Redis caching
docker-compose --profile with-redis up -d
```

### 3. Full Production with Nginx

```bash
# Start with Nginx reverse proxy
docker-compose --profile production up -d
```

## 🔧 Configuration

### Environment Variables

```bash
# Create .env file for custom configuration
cat > .env << EOF
DFS_LOG_LEVEL=INFO
DFS_DATA_REFRESH_INTERVAL=900
FLASK_ENV=production
PYTHONUNBUFFERED=1
EOF
```

### Port Configuration

- **8000**: Live Optimizer API
- **8765**: DraftKings API Server
- **8080**: Web Dashboard (optional)
- **6379**: Redis (with-redis profile)
- **80/443**: Nginx (production profile)

## 📊 Monitoring & Health Checks

### Health Check Endpoints

```bash
# Check API health
curl http://localhost:8000/health

# Check DraftKings API health
curl http://localhost:8765/health

# Docker health status
docker-compose ps
```

### Container Logs

```bash
# View all logs
docker-compose logs

# Follow specific service logs
docker-compose logs -f dfs-optimizer

# View last 100 lines
docker-compose logs --tail=100 dfs-optimizer
```

## 💾 Data Persistence

### Volume Mounts

- `./public/data`: Player data and cache files
- `./logs`: Application logs
- `dfs_cache`: Internal application cache
- `redis_data`: Redis data (if using Redis)

### Backup Data

```bash
# Backup data volumes
docker run --rm -v dfs-system-2_dfs_cache:/data -v $(pwd):/backup alpine tar czf /backup/dfs_cache_backup.tar.gz -C /data .

# Restore data volumes
docker run --rm -v dfs-system-2_dfs_cache:/data -v $(pwd):/backup alpine tar xzf /backup/dfs_cache_backup.tar.gz -C /data
```

## 🔄 Updates & Maintenance

### Update Application

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Clean Up

```bash
# Remove containers and networks
docker-compose down

# Remove containers, networks, and volumes
docker-compose down -v

# Clean up unused Docker resources
docker system prune -a
```

## 🏗️ Advanced Configuration

### Custom Dockerfile Modifications

```dockerfile
# Add custom dependencies
RUN pip install additional-package

# Add custom configuration
COPY custom-config.json /app/config/

# Set custom environment
ENV CUSTOM_SETTING=value
```

### Scaling Services

```bash
# Scale to multiple instances
docker-compose up -d --scale dfs-optimizer=3

# Use with load balancer
# (requires nginx configuration)
```

## 🔒 Security Considerations

### Production Security

1. **Use secrets management** for API keys
2. **Enable SSL/TLS** with proper certificates
3. **Restrict network access** with firewall rules
4. **Regular security updates** of base images
5. **Monitor container logs** for suspicious activity

### Example Secrets Configuration

```yaml
# docker-compose.yml
services:
  dfs-optimizer:
    secrets:
      - draftkings_api_key
    environment:
      - DRAFTKINGS_API_KEY_FILE=/run/secrets/draftkings_api_key

secrets:
  draftkings_api_key:
    file: ./secrets/draftkings_api_key.txt
```

## 🚨 Troubleshooting

### Common Issues

#### Container Won't Start

```bash
# Check logs for errors
docker-compose logs dfs-optimizer

# Check resource usage
docker stats

# Verify port availability
netstat -tulpn | grep :8000
```

#### Memory Issues

```bash
# Increase memory limits in docker-compose.yml
services:
  dfs-optimizer:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
```

#### Data Not Persisting

```bash
# Verify volume mounts
docker-compose config

# Check volume permissions
docker-compose exec dfs-optimizer ls -la /app/public/data
```

## 📈 Performance Optimization

### Resource Limits

```yaml
# docker-compose.yml
services:
  dfs-optimizer:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '1.0'
          memory: 2G
```

### Caching Strategy

- **Redis**: For session and API response caching
- **Volume caching**: For player data and projections
- **Multi-stage builds**: For smaller image sizes

## 🌐 Cloud Deployment

### AWS ECS

```bash
# Build for ARM64 (Graviton)
docker buildx build --platform linux/arm64 -t dfs-optimizer:arm64 .

# Push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
docker tag dfs-optimizer:latest <account>.dkr.ecr.<region>.amazonaws.com/dfs-optimizer:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/dfs-optimizer:latest
```

### Google Cloud Run

```bash
# Build and deploy
gcloud builds submit --tag gcr.io/PROJECT-ID/dfs-optimizer
gcloud run deploy --image gcr.io/PROJECT-ID/dfs-optimizer --platform managed
```

### Azure Container Instances

```bash
# Create resource group and deploy
az group create --name dfs-optimizer --location eastus
az container create --resource-group dfs-optimizer --name dfs-optimizer --image dfs-optimizer:latest --ports 8000 8765
```

## 📞 Support

For Docker-related issues:

1. Check the logs: `docker-compose logs`
2. Verify configuration: `docker-compose config`
3. Test connectivity: `docker-compose exec dfs-optimizer curl localhost:8000/health`
4. Review resource usage: `docker stats`

## 🎯 Next Steps

1. **Set up monitoring** with Prometheus/Grafana
2. **Implement CI/CD** with GitHub Actions
3. **Add SSL certificates** for production
4. **Configure log aggregation** with ELK stack
5. **Set up automated backups** for data volumes
