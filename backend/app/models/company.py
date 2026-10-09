from ..extensions import db
from datetime import datetime


class Company(db.Model):
    __tablename__ = "companies"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    sector = db.Column(db.String(100))
    location = db.Column(db.String(150))
    package_min = db.Column(db.Numeric(10, 2))
    package_max = db.Column(db.Numeric(10, 2))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    placements = db.relationship("Placement", backref="company", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "sector": self.sector,
            "location": self.location,
            "package_min": float(self.package_min) if self.package_min else None,
            "package_max": float(self.package_max) if self.package_max else None,
            "created_at": self.created_at.isoformat(),
        }
