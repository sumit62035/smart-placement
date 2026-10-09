# ─────────────────────────────────────────────────────────────────────────────
#  Smart College Placement Analytics — Makefile
#  Convenience commands for development and production.
# ─────────────────────────────────────────────────────────────────────────────

.PHONY: help setup dev prod build stop logs clean seed shell-backend shell-db

# Detect OS for open command
ifeq ($(OS),Windows_NT)
  OPEN = start
else
  UNAME := $(shell uname -s)
  ifeq ($(UNAME),Darwin)
    OPEN = open
  else
    OPEN = xdg-open
  endif
endif

help: ## Show this help message
	@echo ""
	@echo "  Smart Placement — Available commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ── Environment ───────────────────────────────────────────────────────────────
setup: ## Copy .env.example → .env (first-time setup)
	@if [ ! -f .env ]; then cp .env.example .env; echo "✔ Created .env — fill in your secrets!"; \
	else echo "⚠  .env already exists, skipping."; fi

# ── Development ───────────────────────────────────────────────────────────────
dev: ## Start full stack in development mode (hot-reload)
	docker compose up --build

dev-detach: ## Start full stack detached
	docker compose up --build -d

# ── Production ────────────────────────────────────────────────────────────────
prod: ## Start production stack (detached)
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

build: ## Build Docker images without starting
	docker compose build --no-cache

stop: ## Stop all containers
	docker compose down

stop-clean: ## Stop containers AND remove volumes (WARNING: deletes DB data)
	docker compose down -v

# ── Logs ──────────────────────────────────────────────────────────────────────
logs: ## Tail logs from all services
	docker compose logs -f

logs-backend: ## Tail Flask API logs
	docker compose logs -f backend

logs-db: ## Tail MySQL logs
	docker compose logs -f db

# ── Database ──────────────────────────────────────────────────────────────────
seed: ## Run seed.py to create default admin (admin / Admin@1234)
	docker compose exec backend python seed.py

migrate: ## Run Flask-Migrate upgrade
	docker compose exec backend flask db upgrade

migrate-init: ## Init Flask-Migrate (first time only)
	docker compose exec backend flask db init

migrate-generate: ## Auto-generate a new migration
	docker compose exec backend flask db migrate -m "auto"

# ── Shells ────────────────────────────────────────────────────────────────────
shell-backend: ## Open a shell inside the backend container
	docker compose exec backend /bin/sh

shell-db: ## Open a MySQL shell
	docker compose exec db mysql -u$(MYSQL_USER) -p$(MYSQL_PASSWORD) $(MYSQL_DATABASE)

# ── Local dev (no Docker) ─────────────────────────────────────────────────────
local-backend: ## Run Flask locally (requires venv)
	cd backend && python run.py

local-frontend: ## Run Vite dev server locally
	cd frontend && npm run dev

local-install: ## Install all deps locally
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

# ── Cleanup ───────────────────────────────────────────────────────────────────
clean: ## Remove Python cache files
	find backend -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null; true
	find backend -name "*.pyc" -delete 2>/dev/null; true
