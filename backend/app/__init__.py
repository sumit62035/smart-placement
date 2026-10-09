from flask import Flask
from .config import get_config
from .extensions import db, jwt, cors, migrate


def create_app(config_class=None):
    app = Flask(__name__)

    cfg = config_class or get_config()
    app.config.from_object(cfg)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)

    # CORS: use origins from config (env-driven for production)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=True,
    )
    migrate.init_app(app, db)

    # Ensure upload / report directories exist
    import os
    os.makedirs(app.config["UPLOAD_FOLDER"],  exist_ok=True)
    os.makedirs(app.config["REPORTS_FOLDER"], exist_ok=True)

    # Register blueprints
    from .routes.auth        import auth_bp
    from .routes.students    import students_bp
    from .routes.departments import departments_bp
    from .routes.companies   import companies_bp
    from .routes.placements  import placements_bp
    from .routes.analytics   import analytics_bp
    from .routes.uploads     import uploads_bp
    from .routes.reports     import reports_bp

    app.register_blueprint(auth_bp,        url_prefix="/api/auth")
    app.register_blueprint(students_bp,    url_prefix="/api/students")
    app.register_blueprint(departments_bp, url_prefix="/api/departments")
    app.register_blueprint(companies_bp,   url_prefix="/api/companies")
    app.register_blueprint(placements_bp,  url_prefix="/api/placements")
    app.register_blueprint(analytics_bp,   url_prefix="/api/analytics")
    app.register_blueprint(uploads_bp,     url_prefix="/api/upload")
    app.register_blueprint(reports_bp,     url_prefix="/api/reports")

    return app
