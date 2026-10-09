from ..extensions import db
from datetime import datetime


class UploadedFile(db.Model):
    __tablename__ = "uploaded_files"

    id          = db.Column(db.Integer, primary_key=True)
    filename    = db.Column(db.String(255), nullable=False)
    file_type   = db.Column(db.Enum("csv", "xlsx"), nullable=False)
    uploaded_by = db.Column(db.Integer, db.ForeignKey("admins.id"), nullable=False)
    row_count   = db.Column(db.Integer)
    status      = db.Column(
        db.Enum("pending", "processed", "failed"), default="pending"
    )
    # JSON column: {"inserted": n, "updated": n, "skipped": n, "errors": n}
    stats       = db.Column(db.JSON, default=None)
    # JSON column: list of {"row": n, "field": "...", "message": "..."}
    error_log   = db.Column(db.JSON, default=None)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":          self.id,
            "filename":    self.filename,
            "file_type":   self.file_type,
            "uploaded_by": self.uploaded_by,
            "row_count":   self.row_count,
            "status":      self.status,
            "stats":       self.stats,
            "error_log":   self.error_log,
            "uploaded_at": self.uploaded_at.isoformat(),
        }
