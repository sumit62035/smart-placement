from ..extensions import db
from datetime import datetime


class Placement(db.Model):
    __tablename__ = "placements"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey("companies.id"), nullable=False)
    package_lpa = db.Column(db.Numeric(6, 2), nullable=False)
    role = db.Column(db.String(150))
    offer_date = db.Column(db.Date)
    year = db.Column(db.SmallInteger, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student_id,
            "student_name": self.student.name if self.student else None,
            "company_id": self.company_id,
            "company_name": self.company.name if self.company else None,
            "package_lpa": float(self.package_lpa),
            "role": self.role,
            "offer_date": self.offer_date.isoformat() if self.offer_date else None,
            "year": self.year,
            "created_at": self.created_at.isoformat(),
        }
