# DFS Ultimate Optimizer - Docker Container
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install core Python dependencies first
RUN pip install --no-cache-dir --upgrade pip

# Install dependencies with retries for stability
RUN pip install --no-cache-dir \
    fastapi==0.104.1 \
    uvicorn[standard]==0.24.0 \
    aiohttp==3.9.1 \
    aiohttp-cors==0.7.0 \
    pydantic==2.5.0 \
    pandas==2.1.4 \
    numpy==1.24.4 \
    requests==2.31.0 \
    python-multipart==0.0.6 \
    python-dotenv==1.0.0

# Try to install optional optimization packages
RUN pip install --no-cache-dir pulp==2.7.0 || echo "PuLP installation failed, will use fallback"
RUN pip install --no-cache-dir ortools==9.8.3296 || echo "OR-Tools installation failed, will use PuLP fallback"

# Install remaining requirements
RUN pip install --no-cache-dir -r requirements.txt || echo "Some optional dependencies failed to install"

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p public/data logs

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV DFS_ENV=production

# Expose ports for both services
EXPOSE 8000 8765

# Health check (simplified)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Default command to start both services using Python directly
CMD ["python", "start_live_system.py"]
