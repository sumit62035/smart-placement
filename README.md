# 🎓 Smart College Placement Analytics & Management System

A full-stack web application for managing, tracking, and visualizing campus placement data — with bulk CSV/XLSX imports, live analytics dashboards, PDF report generation, and AI-driven insights.

> **Live Repo:** [github.com/sumit62035/smart-placement](https://github.com/sumit62035/smart-placement)

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, React Router v6 |
| **UI / Charts** | Bootstrap 5, Bootstrap Icons, Chart.js 4 |
| **Backend** | Python 3, Flask 3.0, Gunicorn |
| **Auth** | JWT (Flask-JWT-Extended), bcrypt |
| **ORM / DB** | SQLAlchemy, Flask-Migrate, MySQL 8.0 |
| **Data Processing** | Pandas, NumPy, scikit-learn |
| **PDF Reports** | ReportLab |
| **Deployment** | Docker, Docker Compose, Nginx |

---

## ✨ Features

### 👩‍💼 Admin Portal (JWT Protected)
- Secure login with bcrypt-hashed passwords
- Full **CRUD** for Students, Companies, Departments, and Placements
- **Bulk upload** placement data via CSV / XLSX (Pandas-powered parser)
- **PDF report generation** — department, company, yearly, and summary reports
- Upload history tracking with status (`pending / processed / failed`)

### 📊 Public Dashboard (No Login Required)
- Live KPIs — total students, placed, unplaced, opted-out, placement rate
- Avg / Max / Min / Median package (LPA) with year filter
- Department-wise analytics with bar + line charts
- Company-wise analytics and sector distribution (doughnut chart)
- Year-on-year trends across all placement cycles

### 🤖 AI Insights
Rule-based plain-English observations generated automatically:
> *"Excellent placement performance: 84% of students are placed this year."*
> *"TCS is the top recruiter with 42 hires."*
> *"Placement count is up by 15 compared to 2023 (78 → 93 in 2024)."*

---

## 🗂️ Project Structure

```
smart-placement/
├── backend/                  # Flask API
│   ├── app/
│   │   ├── models/           # SQLAlchemy models (Student, Company, Placement …)
│   │   ├── routes/           # Blueprints — auth, students, analytics, reports …
│   │   └── utils/            # analytics_service, report_generator, ai_insights
│   ├── schema.sql            # MySQL schema (auto-loaded by Docker)
│   ├── seed.py               # Creates DB tables + default admin
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                 # React + Vite SPA
│   ├── src/
│   │   ├── pages/            # admin/ and public/ page components
│   │   ├── components/       # charts/, common/ UI components
│   │   ├── context/          # AuthContext (JWT state)
│   │   └── api/              # Axios instance + API helpers
│   └── Dockerfile
├── docker-compose.yml        # Dev / production stack
├── docker-compose.prod.yml   # Production overrides
├── .env.example              # Environment variable template
└── Makefile                  # Convenience commands
```

---

## ⚡ Quick Start

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & Docker Compose

### 1. Clone the repo
```bash
git clone https://github.com/sumit62035/smart-placement.git
cd smart-placement
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env and fill in your secret keys and DB credentials
```

### 3. Start all services
```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend (React) | http://localhost |
| Backend API | http://localhost:5000/api |
| MySQL | localhost:3306 |

### 4. Seed the database (first run only)
```bash
docker compose exec backend python seed.py
# Default admin → username: admin | password: Admin@1234
```

---

## 🔌 API Endpoints

| Module | Base Path |
|---|---|
| Authentication | `POST /api/auth/login` |
| Students | `/api/students` |
| Departments | `/api/departments` |
| Companies | `/api/companies` |
| Placements | `/api/placements` |
| Analytics | `/api/analytics` |
| File Upload | `/api/upload` |
| Reports | `/api/reports` |

---

## 🗄️ Database Schema

7 tables: `admins` · `departments` · `students` · `companies` · `placements` · `uploaded_files` · `reports`

The schema is in [`backend/schema.sql`](backend/schema.sql) and is automatically applied when the MySQL container starts for the first time.

---

## 🔐 Security

| Concern | Implementation |
|---|---|
| Authentication | JWT Bearer tokens (8 hr expiry) |
| Passwords | bcrypt hashing |
| Secrets | `.env` file — **never committed to git** |
| CORS | Configurable origin whitelist via `CORS_ORIGINS` env var |
| File uploads | Extension whitelist (`.csv`, `.xlsx`), 32 MB max |
| Production | Startup assertions block weak default secret keys |

---

## 🛠️ Local Development (without Docker)

**Backend**
```bash
cd backend
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements.txt
cp .env.example .env                              # fill in DATABASE_URL
python seed.py                                    # create tables + admin
python run.py                                     # starts Flask on :5000
```

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env                              # set VITE_API_URL
npm run dev                                       # starts Vite on :5173
```

---

## 📄 License

This project is for educational purposes. Feel free to fork and extend.

---

<p align="center">Made with ❤️ by <a href="https://github.com/sumit62035">sumit62035</a></p>
