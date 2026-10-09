# Smart College Placement Analytics — Deployment Guide

> **Stack:** React (Vite) · Flask (Gunicorn) · MySQL 8 · Nginx · Docker  
> **Roles:** Public User (analytics viewer) · Admin (JWT-protected portal)

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Project Structure](#2-project-structure)
3. [Environment Variables Reference](#3-environment-variables-reference)
4. [Local Development (No Docker)](#4-local-development-no-docker)
5. [Docker Compose (Recommended — Local + VPS)](#5-docker-compose-recommended)
6. [Deploy to Render](#6-deploy-to-render)
7. [Deploy to Railway](#7-deploy-to-railway)
8. [Deploy to a VPS (Ubuntu/Debian)](#8-deploy-to-a-vps-ubuntudebian)
9. [SSL / HTTPS with Let's Encrypt](#9-ssl--https-with-lets-encrypt)
10. [Post-Deployment Checklist](#10-post-deployment-checklist)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Docker | ≥ 24 | Container runtime |
| Docker Compose | ≥ 2.20 | Multi-service orchestration |
| Python | 3.11+ | Backend (local dev only) |
| Node.js | 20 LTS | Frontend (local dev only) |
| MySQL | 8.0 | Database |
| Git | any | Source control |

---

## 2. Project Structure

```
smart-placement/
├── backend/                  Flask API
│   ├── app/                  Application package
│   ├── Dockerfile            Multi-stage Python image
│   ├── gunicorn.conf.py      Production Gunicorn settings
│   ├── requirements.txt      Python dependencies (includes gunicorn)
│   ├── schema.sql            MySQL DDL — auto-loaded by Docker db init
│   ├── seed.py               Creates default admin: admin / Admin@1234
│   ├── wsgi.py               WSGI entry-point for Gunicorn
│   └── .env.example          Backend env template
│
├── frontend/                 React (Vite) SPA
│   ├── nginx/
│   │   └── default.conf      Nginx reverse-proxy config (baked into image)
│   ├── src/                  React source
│   ├── Dockerfile            Node build → Nginx runtime (multi-stage)
│   └── .env.example          Frontend env template
│
├── docker-compose.yml        Base compose (dev + prod)
├── docker-compose.prod.yml   Production overrides
├── .env.example              Root env template (used by docker-compose)
├── Makefile                  Convenience commands
└── DEPLOYMENT.md             This file
```

---

## 3. Environment Variables Reference

### Root `.env` (used by `docker-compose.yml`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MYSQL_ROOT_PASSWORD` | ✅ | — | MySQL root password |
| `MYSQL_DATABASE` | ✅ | `smart_placement` | Database name |
| `MYSQL_USER` | ✅ | — | App DB user |
| `MYSQL_PASSWORD` | ✅ | — | App DB password |
| `SECRET_KEY` | ✅ | — | Flask secret (64-char hex) |
| `JWT_SECRET_KEY` | ✅ | — | JWT signing secret (64-char hex) |
| `FLASK_ENV` | ✅ | `production` | `development` or `production` |
| `CORS_ORIGINS` | ✅ | `http://localhost` | Comma-separated allowed origins |
| `VITE_API_URL` | ✅ | `/api` | Backend URL for React build |

### Generate strong secrets

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## 4. Local Development (No Docker)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL to your local MySQL

# Create database and tables
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS smart_placement;"
mysql -u root -p smart_placement < schema.sql

# Seed default admin (admin / Admin@1234)
python seed.py

# Start development server
python run.py
# API available at http://localhost:5000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env — VITE_API_URL=http://localhost:5000/api

# Start dev server (hot-reload)
npm run dev
# App available at http://localhost:3000
```

---

## 5. Docker Compose (Recommended)

### First-time setup

```bash
# Clone and enter project
cd smart-placement

# Copy root env file
cp .env.example .env

# Open .env and fill in ALL values — especially:
#   MYSQL_ROOT_PASSWORD, MYSQL_PASSWORD, SECRET_KEY, JWT_SECRET_KEY
nano .env   # or use any editor

# Build and start all services
docker compose up --build
```

### Services started

| Service | Container | Port |
|---------|-----------|------|
| MySQL 8 | `placement_db` | 3306 |
| Flask + Gunicorn | `placement_api` | 5000 |
| React + Nginx | `placement_web` | 80 |

### Seed the database (first run)

```bash
docker compose exec backend python seed.py
# Default admin credentials: admin / Admin@1234
```

### Access the application

- **Public dashboard:** http://localhost
- **Admin portal:** http://localhost/admin/login

### Production mode

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Useful commands

```bash
# View logs
docker compose logs -f

# Stop without deleting data
docker compose down

# Stop AND delete database volume (WARNING: irreversible)
docker compose down -v

# Run database migrations
docker compose exec backend flask db upgrade

# Open a backend shell
docker compose exec backend /bin/sh
```

---

## 6. Deploy to Render

Render can run two separate services (backend Web Service + static site) or you can use a single Docker service.

### Option A — Docker Service (Recommended)

#### Step 1 — Backend Web Service

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repository
3. Set the following:

| Setting | Value |
|---------|-------|
| **Root Directory** | `backend` |
| **Environment** | Docker |
| **Dockerfile Path** | `Dockerfile` |
| **Port** | `5000` |

4. Add environment variables in the Render dashboard:

```
SECRET_KEY=<your-64-char-hex>
JWT_SECRET_KEY=<your-64-char-hex>
DATABASE_URL=mysql+pymysql://<user>:<pass>@<host>/<db>
FLASK_ENV=production
CORS_ORIGINS=https://your-frontend.onrender.com
UPLOAD_FOLDER=/app/uploads
REPORTS_FOLDER=/app/reports
```

5. Add a **Persistent Disk** (Render paid plan) mounted at `/app/uploads` and `/app/reports`

#### Step 2 — Frontend Static Site

1. **New → Static Site**
2. Set:

| Setting | Value |
|---------|-------|
| **Root Directory** | `frontend` |
| **Build Command** | `npm ci && npm run build` |
| **Publish Directory** | `frontend/dist` |

3. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com/api`

4. Add a **Redirect Rule** for SPA routing:
   - Source: `/*`
   - Destination: `/index.html`
   - Status: `200`

#### Step 3 — MySQL Database

Use [PlanetScale](https://planetscale.com) (MySQL-compatible) or [Aiven](https://aiven.io) MySQL:
1. Create a MySQL 8 database
2. Run `schema.sql` via the database console or client
3. Copy the connection string into `DATABASE_URL`

---

### Option B — Render Docker Compose (Blueprint)

Create `render.yaml` in the project root:

```yaml
services:
  - type: web
    name: placement-api
    env: docker
    rootDir: backend
    dockerfilePath: ./Dockerfile
    envVars:
      - key: SECRET_KEY
        generateValue: true
      - key: JWT_SECRET_KEY
        generateValue: true
      - key: DATABASE_URL
        fromDatabase:
          name: placement-db
          property: connectionString
      - key: FLASK_ENV
        value: production
      - key: CORS_ORIGINS
        value: https://placement-web.onrender.com

  - type: web
    name: placement-web
    env: docker
    rootDir: frontend
    dockerfilePath: ./Dockerfile

databases:
  - name: placement-db
    databaseName: smart_placement
    plan: free
```

---

## 7. Deploy to Railway

Railway supports Docker-based deployments with automatic MySQL provisioning.

### Step 1 — Create project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project from directory
cd smart-placement
railway init
```

### Step 2 — Add MySQL plugin

In Railway dashboard → **New Plugin → MySQL**

Copy the `DATABASE_URL` from the plugin's **Connect** tab.

### Step 3 — Deploy backend

```bash
cd backend

# Create Railway service
railway up --service placement-api
```

Set environment variables in **Railway Dashboard → Variables**:

```
SECRET_KEY=<64-char-hex>
JWT_SECRET_KEY=<64-char-hex>
DATABASE_URL=<from MySQL plugin>
FLASK_ENV=production
CORS_ORIGINS=https://<your-frontend-domain>
```

Railway auto-detects the `Dockerfile` and builds it. Gunicorn starts via the `CMD` in `Dockerfile`.

### Step 4 — Initialize database

```bash
# Using Railway shell
railway run python seed.py --service placement-api
```

Or run via Railway Dashboard → **Shell**.

### Step 5 — Deploy frontend

```bash
cd ../frontend
railway up --service placement-web
```

Set:

```
VITE_API_URL=https://<placement-api>.up.railway.app/api
```

Railway builds the Dockerfile (Node → Nginx) and serves on port 80.

### Step 6 — Custom domain (optional)

Railway Dashboard → **Settings → Domains → Add Custom Domain**

---

## 8. Deploy to a VPS (Ubuntu/Debian)

### Prerequisites

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose v2
sudo apt install docker-compose-plugin -y
docker compose version    # should show v2.x
```

### Step 1 — Transfer project files

```bash
# From your local machine
scp -r smart-placement/ user@YOUR_VPS_IP:~/smart-placement
```

Or clone from Git:

```bash
git clone https://github.com/youruser/smart-placement.git
cd smart-placement
```

### Step 2 — Configure environment

```bash
cp .env.example .env
nano .env
```

**Required changes for VPS:**

```env
MYSQL_ROOT_PASSWORD=<strong-password>
MYSQL_USER=placement_user
MYSQL_PASSWORD=<strong-password>
MYSQL_DATABASE=smart_placement

SECRET_KEY=<python -c "import secrets; print(secrets.token_hex(32))">
JWT_SECRET_KEY=<python -c "import secrets; print(secrets.token_hex(32))">

FLASK_ENV=production
CORS_ORIGINS=https://yourdomain.com
VITE_API_URL=/api
```

### Step 3 — Start the stack

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Step 4 — Seed the database

```bash
docker compose exec backend python seed.py
```

### Step 5 — Verify

```bash
# Check all containers are running
docker compose ps

# Check API health
curl http://localhost:5000/api/analytics/dashboard

# Check frontend
curl -I http://localhost
```

### Step 6 — Firewall

```bash
# Allow HTTP and HTTPS
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw deny 3306/tcp  # Block MySQL from public
sudo ufw deny 5000/tcp  # Block Flask from public (Nginx proxies it)
sudo ufw enable
```

---

## 9. SSL / HTTPS with Let's Encrypt

### Option A — Nginx reverse proxy on the host (recommended for VPS)

Install Nginx on the host and use Certbot:

```bash
sudo apt install nginx certbot python3-certbot-nginx -y

# Stop the Docker frontend container from using port 80
# Edit docker-compose.prod.yml — remove frontend port 80 mapping
# Then run: docker compose down && docker compose up -d

# Set up host Nginx
sudo nano /etc/nginx/sites-available/smart-placement
```

```nginx
server {
    server_name yourdomain.com www.yourdomain.com;

    # Forward all requests to Docker frontend
    location / {
        proxy_pass http://127.0.0.1:3000;   # map frontend to 3000
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Forward API to Docker backend
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 32m;
        proxy_read_timeout 120s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/smart-placement /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Issue certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot automatically edits Nginx config to add SSL and auto-renews via cron.

### Option B — Traefik (Docker-native SSL)

Add Traefik to `docker-compose.yml` as an SSL-terminating reverse proxy. This is ideal when the entire stack runs in Docker without a host-level Nginx.

---

## 10. Post-Deployment Checklist

- [ ] All containers show `Up` in `docker compose ps`
- [ ] `GET /api/analytics/dashboard` returns JSON (no 500 errors)
- [ ] Admin login works at `/admin/login` with `admin` / `Admin@1234`
- [ ] **Change the default admin password immediately** after first login
- [ ] CSV upload works end-to-end (test with a small file)
- [ ] Reports PDF download works
- [ ] `SECRET_KEY` and `JWT_SECRET_KEY` are NOT the default placeholder values
- [ ] MySQL port 3306 is NOT exposed to the public internet
- [ ] Flask port 5000 is NOT exposed to the public internet (Nginx proxies it)
- [ ] HTTPS is configured and `CORS_ORIGINS` matches your production domain
- [ ] Database backups scheduled (see below)

### Database backup

```bash
# Manual backup
docker compose exec db mysqldump \
  -u${MYSQL_USER} -p${MYSQL_PASSWORD} ${MYSQL_DATABASE} \
  > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated daily backup via cron (VPS)
# Add to crontab: crontab -e
0 2 * * * docker compose -f ~/smart-placement/docker-compose.yml exec -T db \
  mysqldump -uplacement_user -pYOURPASS smart_placement \
  > ~/backups/placement_$(date +\%Y\%m\%d).sql
```

### Database restore

```bash
docker compose exec -T db mysql \
  -u${MYSQL_USER} -p${MYSQL_PASSWORD} ${MYSQL_DATABASE} \
  < backup_20240101_020000.sql
```

---

## 11. Troubleshooting

### Backend container exits immediately

```bash
docker compose logs backend
```

Common causes:
- `SECRET_KEY` or `JWT_SECRET_KEY` still set to placeholder defaults in production
- `DATABASE_URL` points to wrong host — use `db` (not `localhost`) inside Docker
- MySQL not ready yet — the healthcheck should prevent this, but try `--wait`

### Frontend shows blank page

```bash
docker compose logs frontend
```

Common causes:
- `VITE_API_URL` was wrong at build time — rebuild with correct value
- SPA routing: ensure Nginx `try_files $uri /index.html` is present (it is in `nginx/default.conf`)
- Browser console shows CORS errors — update `CORS_ORIGINS` in backend env

### CORS errors in browser

Set `CORS_ORIGINS` to exactly match your frontend origin (scheme + domain + port):
```env
CORS_ORIGINS=https://yourdomain.com
```
Do **not** include a trailing slash.

### MySQL connection refused / 2003

- Container name inside Docker network must be `db` (matches `docker-compose.yml` service name)
- `DATABASE_URL` must use `@db:3306` not `@localhost:3306`
- Wait for MySQL healthcheck to pass before backend starts (already configured)

### Upload returns 413 Request Entity Too Large

Nginx is configured for `client_max_body_size 32m`. If you need larger files, edit `frontend/nginx/default.conf` and rebuild the frontend image.

### Reports PDF download is empty / broken

- Ensure `REPORTS_FOLDER` path is writable (Docker volume mounts handle this)
- Check `docker compose logs backend` for ReportLab errors

### How to reset admin password

```bash
docker compose exec backend python - <<'EOF'
from app import create_app
from app.extensions import db
from app.models.admin import Admin

app = create_app()
with app.app_context():
    admin = Admin.query.filter_by(username="admin").first()
    admin.set_password("NewSecurePass@1234")
    db.session.commit()
    print("Password updated.")
EOF
```

---

*Generated for Smart College Placement Analytics & Management System v1.0*
