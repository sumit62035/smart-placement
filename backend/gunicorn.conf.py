# Gunicorn production configuration
# Referenced automatically by: gunicorn --config gunicorn.conf.py wsgi:app

import multiprocessing
import os

# ── Binding ───────────────────────────────────────────────────────────────────
bind = "0.0.0.0:5000"

# ── Workers ───────────────────────────────────────────────────────────────────
# Rule of thumb: (2 × CPU cores) + 1
workers = int(os.environ.get("GUNICORN_WORKERS", multiprocessing.cpu_count() * 2 + 1))
threads = int(os.environ.get("GUNICORN_THREADS", 2))
worker_class = "gthread"

# ── Timeouts ──────────────────────────────────────────────────────────────────
timeout = 120          # long-running CSV upload / report generation
graceful_timeout = 30
keepalive = 5

# ── Logging ───────────────────────────────────────────────────────────────────
accesslog = "-"        # stdout
errorlog  = "-"        # stderr
loglevel  = os.environ.get("LOG_LEVEL", "info")
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)sµs'

# ── Process naming ────────────────────────────────────────────────────────────
proc_name = "smart-placement-api"

# ── Security ──────────────────────────────────────────────────────────────────
limit_request_line    = 8190
limit_request_fields  = 100
limit_request_field_size = 8190
