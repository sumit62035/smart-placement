from ..extensions import db
from datetime import datetime
import bcrypt


class Admin(db.Model):
    __tablename__ = "admins"

    id         = db.Column(db.Integer, primary_key=True)
    username   = db.Column(db.String(100), unique=True, nullable=False)
    email      = db.Column(db.String(150), unique=True, nullable=False)
    password   = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # Relationships
    uploaded_files = db.relationship("UploadedFile", backref="uploader", lazy=True)
    reports        = db.relationship("Report",        backref="generator", lazy=True)

    def set_password(self, plain_password: str) -> None:
        self.password = bcrypt.hashpw(
            plain_password.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")

    def check_password(self, plain_password: str) -> bool:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"), self.password.encode("utf-8")
        )

    def to_dict(self) -> dict:
        return {
            "id":         self.id,
            "username":   self.username,
            "email":      self.email,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
