import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class Config:
    # ── Core ─────────────────────────────────────────────────────────────────
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "mysql+pymysql://root:password@localhost/smart_placement"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,       # detect stale connections
        "pool_recycle": 1800,        # recycle connections every 30 min
        "pool_size": 10,
        "max_overflow": 20,
    }

    # ── JWT ───────────────────────────────────────────────────────────────────
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "jwt-dev-secret-change-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"

    # ── File storage ──────────────────────────────────────────────────────────
    UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", "uploads")
    MAX_CONTENT_LENGTH = 32 * 1024 * 1024   # 32 MB
    REPORTS_FOLDER = os.environ.get("REPORTS_FOLDER", "reports")
    ALLOWED_EXTENSIONS = {"csv", "xlsx"}

    # ── CORS ──────────────────────────────────────────────────────────────────
    # Comma-separated origins, e.g. "https://yourdomain.com,https://www.yourdomain.com"
    # In Docker Compose the frontend proxies /api so "*" is acceptable on localhost.
    CORS_ORIGINS = [
        o.strip()
        for o in os.environ.get("CORS_ORIGINS", "*").split(",")
        if o.strip()
    ]


class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }


class ProductionConfig(Config):
    DEBUG = False
    TESTING = False
    # Enforce strong secret keys in production
    @classmethod
    def init_app(cls, app):
        Config.init_app(app) if hasattr(Config, "init_app") else None
        assert cls.SECRET_KEY != "dev-secret-key-change-in-production", \
            "SECRET_KEY must be set to a secure value in production!"
        assert cls.JWT_SECRET_KEY != "jwt-dev-secret-change-in-production", \
            "JWT_SECRET_KEY must be set to a secure value in production!"


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=5)


# ── Config selector ───────────────────────────────────────────────────────────
config = {
    "development": DevelopmentConfig,
    "production":  ProductionConfig,
    "testing":     TestingConfig,
    "default":     DevelopmentConfig,
}


def get_config():
    env = os.environ.get("FLASK_ENV", "development")
    return config.get(env, DevelopmentConfig)
