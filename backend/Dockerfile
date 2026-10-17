# =============================================================================
# LocalIoTCloud Backend – Dockerfile
# =============================================================================
# Multi-stage build: slim production image with required SSH support at runtime.

# ---------------------------------------------------------------------------
# Stage 1 – Builder
# ---------------------------------------------------------------------------
FROM python:3.12-slim AS builder

WORKDIR /build

# Build/runtime libraries needed while installing Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    libmariadb3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Build dependencies only in this stage
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libmariadb-dev-compat \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --upgrade pip \
    && pip install --prefix=/install --no-cache-dir -r requirements.txt


# ---------------------------------------------------------------------------
# Stage 2 – Runtime
# ---------------------------------------------------------------------------
FROM python:3.12-slim AS runtime

WORKDIR /app

# Runtime system dependencies
# openssh-client is required because LocalIoTCloud
# connects to Raspberry Pi/Linux devices over SSH.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libmariadb3 \
    curl \
    openssh-client \
    sshpass \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder
COPY --from=builder /install /usr/local

# Copy Alembic migration configuration
COPY ./alembic.ini ./alembic.ini
COPY ./alembic ./alembic

# Copy application source
COPY ./app ./app

# Create non-root user for security
RUN groupadd --gid 1001 appgroup \
    && useradd --uid 1001 \
    --gid appgroup \
    --shell /bin/bash \
    --create-home appuser \
    && mkdir -p /app/logs \
    && chown -R appuser:appgroup /app

USER appuser

# ---------------------------------------------------------------------------
# Runtime Configuration
# ---------------------------------------------------------------------------
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

EXPOSE 8000

# ---------------------------------------------------------------------------
# Healthcheck
# ---------------------------------------------------------------------------
HEALTHCHECK --interval=30s \
    --timeout=10s \
    --start-period=20s \
    --retries=3 \
    CMD curl -fsS http://localhost:${PORT}/healthz || exit 1

# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
CMD ["uvicorn", "app.main:app", \
    "--host", "0.0.0.0", \
    "--port", "8000", \
    "--workers", "4", \
    "--no-access-log"]