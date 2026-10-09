from ..extensions import db
from datetime import datetime


class Report(db.Model):
    __tablename__ = "reports"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    report_type = db.Column(
        db.Enum("department", "company", "yearly", "summary"), nullable=False
    )
    generated_by = db.Column(db.Integer, db.ForeignKey("admins.id"), nullable=False)
    file_path = db.Column(db.String(500))
    filters_used = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "report_type": self.report_type,
            "generated_by": self.generated_by,
            "file_path": self.file_path,
            "filters_used": self.filters_used,
            "created_at": self.created_at.isoformat(),
        }
