from ..extensions import db
from datetime import datetime


class Student(db.Model):
    __tablename__ = "students"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    roll_number = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey("departments.id"), nullable=False)
    batch_year = db.Column(db.SmallInteger, nullable=False)
    cgpa = db.Column(db.Numeric(4, 2))
    status = db.Column(
        db.Enum("placed", "unplaced", "opted_out"), default="unplaced"
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    placements = db.relationship("Placement", backref="student", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "roll_number": self.roll_number,
            "email": self.email,
            "department_id": self.department_id,
            "department": self.department.name if self.department else None,
            "batch_year": self.batch_year,
            "cgpa": float(self.cgpa) if self.cgpa else None,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }
