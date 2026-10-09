# ── Stage 1: dependencies ────────────────────────────────────────────────────
FROM python:3.11-slim AS base

# System deps for PyMySQL / Pandas
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy installed packages from base
COPY --from=base /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=base /usr/local/bin /usr/local/bin

# Copy application source
COPY . .

# Create persistent volume directories
RUN mkdir -p uploads reports

# Expose Flask port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/api/analytics/dashboard')" || exit 1

# Production server: Gunicorn (settings in gunicorn.conf.py)
CMD ["gunicorn", "--config", "gunicorn.conf.py", "wsgi:app"]
