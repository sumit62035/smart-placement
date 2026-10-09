from sqlalchemy import func
from ..extensions import db
from ..models.student import Student
from ..models.placement import Placement
from ..models.department import Department
from ..models.company import Company


def generate_insights() -> list:
    """
    Rule-based insight generator using aggregated placement data.
    Returns a list of plain-English insight strings.
    """
    insights = []

    # Overall placement rate
    total = Student.query.count()
    placed = Student.query.filter_by(status="placed").count()
    if total:
        rate = round((placed / total) * 100, 1)
        if rate >= 80:
            insights.append(
                f"Excellent placement performance: {rate}% of students are placed this year."
            )
        elif rate >= 60:
            insights.append(
                f"Good placement rate of {rate}%. Targeting remaining {total - placed} students could push above 80%."
            )
        else:
            insights.append(
                f"Placement rate stands at {rate}%. Significant improvement needed — consider more company tie-ups."
            )

    # Top hiring department
    top_dept = (
        db.session.query(
            Department.name,
            func.count(Placement.id).label("count")
        )
        .join(Student, Student.department_id == Department.id)
        .join(Placement, Placement.student_id == Student.id)
        .group_by(Department.id)
        .order_by(func.count(Placement.id).desc())
        .first()
    )
    if top_dept:
        insights.append(
            f"{top_dept.name} leads in placements with {top_dept.count} offers."
        )

    # Average package
    avg_pkg = db.session.query(func.avg(Placement.package_lpa)).scalar()
    max_pkg = db.session.query(func.max(Placement.package_lpa)).scalar()
    if avg_pkg:
        insights.append(
            f"Average placement package is ₹{round(float(avg_pkg), 2)} LPA, "
            f"with the highest offer at ₹{round(float(max_pkg), 2)} LPA."
        )

    # Top recruiting company
    top_company = (
        db.session.query(
            Company.name,
            func.count(Placement.id).label("hires")
        )
        .join(Placement, Placement.company_id == Company.id)
        .group_by(Company.id)
        .order_by(func.count(Placement.id).desc())
        .first()
    )
    if top_company:
        insights.append(
            f"{top_company.name} is the top recruiter with {top_company.hires} hires."
        )

    # Year-on-year trend
    trends = (
        db.session.query(
            Placement.year,
            func.count(Placement.id).label("count")
        )
        .group_by(Placement.year)
        .order_by(Placement.year)
        .all()
    )
    if len(trends) >= 2:
        last = trends[-1]
        prev = trends[-2]
        delta = last.count - prev.count
        direction = "up" if delta >= 0 else "down"
        insights.append(
            f"Placement count is {direction} by {abs(delta)} compared to {prev.year} "
            f"({prev.count} → {last.count} in {last.year})."
        )

    if not insights:
        insights.append("No placement data available yet. Upload student and placement records to see insights.")

    return insights
