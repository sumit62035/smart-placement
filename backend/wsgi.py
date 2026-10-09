"""
WSGI entry-point for production.
Gunicorn command (from /backend):
    gunicorn wsgi:app --bind 0.0.0.0:5000 --workers 4 --threads 2 --timeout 120
"""
from app import create_app

app = create_app()
