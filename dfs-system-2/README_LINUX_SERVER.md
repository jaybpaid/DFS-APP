# DFS Ultimate Optimizer - Linux Server Deployment Guide

## 🖥️ Linux VM Specifications

### **Minimum Requirements**

- **CPU**: 2 vCPUs (2.4GHz+)
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **Network**: 1Gbps connection
- **OS**: Ubuntu 20.04+ LTS, CentOS 8+, or Debian 11+

### **Recommended Specifications**

- **CPU**: 4 vCPUs (3.0GHz+)
- **RAM**: 8GB
- **Storage**: 40GB SSD
- **Network**: 1Gbps+ connection
- **OS**: Ubuntu 22.04 LTS (most tested)

### **Production/High-Load Specifications**

- **CPU**: 8 vCPUs (3.2GHz+)
- **RAM**: 16GB
- **Storage**: 100GB NVMe SSD
- **Network**: 10Gbps connection
- **OS**: Ubuntu 22.04 LTS

## 🐳 Resource Allocation Breakdown

### **DFS Ultimate Optimizer**

- **Base Application**: 1-2GB RAM, 1-2 CPU cores
- **Live Data Processing**: 500MB-1GB RAM
- **Player Database**: 200-500MB RAM
- **Optimization Engine**: 1-2GB RAM (during optimization)

### **Supporting Services**

- **Docker Engine**: 200-500MB RAM
- **Portainer**: 100-200MB RAM
- **Redis (optional)**: 100-500MB RAM
- **Nginx (optional)**: 50-100MB RAM
- **System Overhead**: 1-2GB RAM

### **Total Resource Usage**

- **Light Usage**: 3-4GB RAM, 2 CPU cores
- **Normal Usage**: 5-6GB RAM, 3-4 CPU cores
- **Heavy Usage**: 8-12GB RAM, 6-8 CPU cores

## 🚀 Complete Linux Server Setup

### **Step 1: Server Preparation**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git htop nano ufw fail2ban

# Configure firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 8000
sudo ufw allow 8765
sudo ufw allow 9000  # Portainer
sudo ufw --force enable

# Create application user
sudo useradd -m -s /bin/bash dfsuser
sudo usermod -aG sudo dfsuser
```

### **Step 2: Docker Installation**

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
sudo usermod -aG docker dfsuser

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Start Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Verify installation
docker --version
docker-compose --version
```

### **Step 3: Portainer Installation**

```bash
# Create Portainer volume
docker volume create portainer_data

# Deploy Portainer
docker run -d \
  --name portainer \
  --restart unless-stopped \
  -p 8080:8000 \
  -p 9000:9000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest

# Verify Portainer is running
docker ps | grep portainer
```

### **Step 4: DFS Optimizer Deployment**

```bash
# Switch to application user
sudo su - dfsuser

# Clone your DFS optimizer
git clone <your-repo-url> dfs-optimizer
cd dfs-optimizer/dfs-system-2

# Create environment file
cat > .env << EOF
DFS_LOG_LEVEL=INFO
DFS_DATA_REFRESH_INTERVAL=900
FLASK_ENV=production
PYTHONUNBUFFERED=1
EOF

# Deploy with Docker Compose
docker-compose up -d

# Verify deployment
docker-compose ps
docker-compose logs -f
```

## 🎛️ Portainer Management

### **Access Portainer**

- **URL**: `http://your-server-ip:9000`
- **Initial Setup**: Create admin user on first access
- **Dashboard**: Manage all containers from web interface

### **Portainer Features for DFS Optimizer**

- **Container Management**: Start/stop/restart containers
- **Log Viewing**: Real-time log monitoring
- **Resource Monitoring**: CPU/RAM usage graphs
- **Volume Management**: Backup/restore data volumes
- **Stack Management**: Deploy/update Docker Compose stacks
- **Image Management**: Pull/build/manage Docker images

### **Managing DFS Optimizer via Portainer**

1. **Navigate to Stacks** → Find your DFS optimizer stack
2. **Container Actions**: Start, stop, restart individual services
3. **Logs**: View real-time logs for debugging
4. **Console**: Access container shell for troubleshooting
5. **Stats**: Monitor resource usage and performance

## 📊 Monitoring & Maintenance

### **System Monitoring Commands**

```bash
# Check system resources
htop
df -h
free -h

# Monitor Docker containers
docker stats
docker-compose ps
docker system df

# Check logs
docker-compose logs --tail=100 dfs-optimizer
journalctl -u docker.service -f
```

### **Automated Monitoring Setup**

```bash
# Install monitoring tools
sudo apt install -y prometheus node-exporter grafana

# Or use Docker-based monitoring
docker run -d \
  --name=grafana \
  -p 3000:3000 \
  -v grafana-data:/var/lib/grafana \
  grafana/grafana:latest
```

## 🔒 Security Hardening

### **Basic Security Setup**

```bash
# Configure SSH (disable root login)
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
# Set: PasswordAuthentication no (if using SSH keys)
sudo systemctl restart ssh

# Configure fail2ban
sudo nano /etc/fail2ban/jail.local
# Add Docker-specific rules

# Set up automatic updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
```

### **Docker Security**

```bash
# Limit Docker daemon exposure
sudo nano /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "userland-proxy": false
}

sudo systemctl restart docker
```

## 🔄 Backup & Recovery

### **Automated Backup Script**

```bash
#!/bin/bash
# backup-dfs.sh

BACKUP_DIR="/home/dfsuser/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup Docker volumes
docker run --rm -v dfs-system-2_dfs_cache:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/dfs_cache_$DATE.tar.gz -C /data .

# Backup configuration files
tar czf $BACKUP_DIR/dfs_config_$DATE.tar.gz -C /home/dfsuser/dfs-optimizer/dfs-system-2 .env docker-compose.yml

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

### **Cron Job for Automated Backups**

```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /home/dfsuser/backup-dfs.sh >> /home/dfsuser/backup.log 2>&1
```

## 🌐 Domain & SSL Setup

### **Nginx Reverse Proxy with SSL**

```bash
# Install Nginx
sudo apt install nginx certbot python3-certbot-nginx

# Configure Nginx
sudo nano /etc/nginx/sites-available/dfs-optimizer

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/dk/ {
        proxy_pass http://localhost:8765/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/dfs-optimizer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

## 📈 Performance Optimization

### **System Tuning**

```bash
# Increase file limits
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# Optimize Docker
sudo nano /etc/docker/daemon.json
{
  "storage-driver": "overlay2",
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

### **Resource Limits in Docker Compose**

```yaml
# Add to docker-compose.yml
services:
  dfs-optimizer:
    deploy:
      resources:
        limits:
          cpus: '4.0'
          memory: 6G
        reservations:
          cpus: '2.0'
          memory: 3G
```

## 🚨 Troubleshooting

### **Common Issues**

#### **Out of Memory**

```bash
# Check memory usage
free -h
docker stats

# Increase swap if needed
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

#### **Port Conflicts**

```bash
# Check what's using ports
sudo netstat -tulpn | grep :8000
sudo lsof -i :8000

# Kill conflicting processes
sudo kill -9 <PID>
```

#### **Docker Issues**

```bash
# Restart Docker service
sudo systemctl restart docker

# Clean up Docker
docker system prune -a
docker volume prune
```

## 📞 Support Commands

### **Quick Diagnostics**

```bash
# System health check
./docker-test.sh

# Full system status
echo "=== System Info ==="
uname -a
echo "=== Memory ==="
free -h
echo "=== Disk ==="
df -h
echo "=== Docker ==="
docker --version
docker-compose ps
echo "=== Services ==="
curl -s http://localhost:8000/health
curl -s http://localhost:8765/health
```

## 🎯 Recommended VM Providers

### **Cloud Providers with Good Performance**

1. **DigitalOcean**: $40/month (4GB RAM, 2 vCPUs, 80GB SSD)
2. **Linode**: $36/month (4GB RAM, 2 vCPUs, 80GB SSD)
3. **Vultr**: $24/month (4GB RAM, 2 vCPUs, 80GB SSD)
4. **AWS EC2**: t3.medium ($30-50/month depending on usage)
5. **Google Cloud**: e2-standard-2 ($35-55/month)

### **Budget Options**

1. **Hetzner**: €15/month (4GB RAM, 2 vCPUs, 40GB SSD)
2. **OVH**: $20/month (4GB RAM, 2 vCPUs, 80GB SSD)
3. **Contabo**: $12/month (8GB RAM, 4 vCPUs, 200GB SSD)

Your DFS Ultimate Optimizer will run smoothly on any of these configurations with Portainer for easy management!
