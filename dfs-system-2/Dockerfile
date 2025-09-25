# STAGE 1: Builder
# Use a full Python image to build dependencies, which may require build tools.
FROM python:3.11 as builder

# Set working directory
WORKDIR /app

# Install system dependencies needed for building Python packages
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install poetry for dependency management
RUN pip install poetry

# Copy only the files necessary for dependency installation to leverage Docker cache
COPY poetry.lock pyproject.toml ./

# Install dependencies using poetry
# --no-interaction: Do not ask any interactive questions
# --no-ansi: Disable ANSI output
RUN poetry config virtualenvs.create false && \
    poetry install --no-interaction --no-ansi --no-root


# STAGE 2: Final Image
# Use a slim Python image for the final application to reduce size.
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set non-root user for security
RUN useradd --create-home appuser
USER appuser
WORKDIR /home/appuser/app

# Copy installed dependencies from the builder stage
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /app ./

# Copy the application source code
COPY --chown=appuser:appuser . .

# Create data directory
RUN mkdir -p data

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/api/healthz || exit 1

# Environment variables
ENV PYTHONPATH=/home/appuser/app
ENV FIXTURES_DIR=/home/appuser/app/apps/api-python/fixtures

# Run the application
WORKDIR /home/appuser/app/apps/api-python
CMD ["python3", "simple_main.py"]
