"""
Seed script — creates the DB tables and inserts a default admin.
Run once: python seed.py
"""
from app import create_app
from app.extensions import db
from app.models.admin import Admin


def seed():
    app = create_app()
    with app.app_context():
        db.create_all()
        if not Admin.query.filter_by(username="admin").first():
            admin = Admin(username="admin", email="admin@placement.edu")
            admin.set_password("Admin@1234")
            db.session.add(admin)
            db.session.commit()
            print("Default admin created  →  username: admin  |  password: Admin@1234")
        else:
            print("Admin already exists, skipping seed.")


if __name__ == "__main__":
    seed()
