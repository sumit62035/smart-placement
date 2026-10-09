"""
analytics_service.py

All aggregation queries are centralised here.
Routes in analytics.py call these functions and return the results as JSON.

Median strategy (MySQL has no MEDIAN):
  Use the standard row-number / COUNT trick:
    SELECT AVG(package_lpa) FROM (
        SELECT package_lpa
        FROM   placements [WHERE ...]
        ORDER  BY package_lpa
        LIMIT  2 - (COUNT(*) % 2)      -- 1 row if odd, 2 if even
        OFFSET (COUNT(*) - 1) / 2
    ) t
  We execute this as a raw SQL expression via db.session.execute so it
  stays in a single round-trip.
"""

from __future__ import annotations

from sqlalchemy import func, text
from sqlalchemy.orm import aliased

from ..extensions import db
from ..models.student import Student
from ..models.placement import Placement
from ..models.department import Department
from ..models.company import Company


# ── helpers ───────────────────────────────────────────────────────────────────

def _f(value, decimals: int = 2) -> float:
    """Cast Decimal/None to rounded float safely."""
    return round(float(value), decimals) if value is not None else 0.0


def _median_lpa(year: int | None = None, department_id: int | None = None) -> float:
    """
    Calculate median package_lpa.
    MySQL does not allow subqueries inside LIMIT/OFFSET, so we:
      1. Count rows in Python first
      2. Build a plain integer LIMIT n OFFSET m query
    Returns 0.0 when there are no rows.
    """
    # Step 1 — get the count
    count_q = db.session.query(func.count(Placement.id))
    if year:
        count_q = count_q.filter(Placement.year == year)
    if department_id:
        count_q = count_q.join(Student, Student.id == Placement.student_id)
        count_q = count_q.filter(Student.department_id == department_id)
    total = count_q.scalar() or 0

    if total == 0:
        return 0.0

    # Step 2 — compute plain integer LIMIT and OFFSET
    lim    = 2 - (total % 2)
    offset = (total - 1) // 2

    # Step 3 — build the sorted subquery
    pkg_q = db.session.query(Placement.package_lpa.label("pkg"))
    if year:
        pkg_q = pkg_q.filter(Placement.year == year)
    if department_id:
        pkg_q = pkg_q.join(Student, Student.id == Placement.student_id)
        pkg_q = pkg_q.filter(Student.department_id == department_id)

    pkg_q = pkg_q.order_by(Placement.package_lpa).limit(lim).offset(offset)
    sub   = pkg_q.subquery("median_sub")

    result = db.session.query(func.avg(sub.c.pkg)).scalar()
    return _f(result)

# ── dashboard ─────────────────────────────────────────────────────────────────

def get_dashboard_stats(year: int | None = None) -> dict:
    """
    Returns all KPIs for the main dashboard card row.
    If `year` is given, package stats are filtered to that year;
    student counts are always global (they don't belong to a year).
    """
    # -- Student counts (single query with conditional aggregation) -----------
    student_agg = db.session.query(
        func.count(Student.id).label("total"),
        func.sum(db.case((Student.status == "placed",    1), else_=0)).label("placed"),
        func.sum(db.case((Student.status == "unplaced",  1), else_=0)).label("unplaced"),
        func.sum(db.case((Student.status == "opted_out", 1), else_=0)).label("opted_out"),
    ).one()

    total     = student_agg.total    or 0
    placed    = int(student_agg.placed    or 0)
    unplaced  = int(student_agg.unplaced  or 0)
    opted_out = int(student_agg.opted_out or 0)

    # -- Package stats (single query on placements) ---------------------------
    pkg_q = db.session.query(
        func.count(Placement.id).label("total_placements"),
        func.avg(Placement.package_lpa).label("avg_pkg"),
        func.max(Placement.package_lpa).label("max_pkg"),
        func.min(Placement.package_lpa).label("min_pkg"),
        func.count(func.distinct(Placement.company_id)).label("total_recruiters"),
    )
    if year:
        pkg_q = pkg_q.filter(Placement.year == year)
    pkg = pkg_q.one()

    median = _median_lpa(year=year)

    placement_rate = round((placed / total) * 100, 2) if total else 0.0

    return {
        "total_students":    total,
        "placed_students":   placed,
        "unplaced_students": unplaced,
        "opted_out_students": opted_out,
        "placement_rate":    placement_rate,
        "total_placements":  pkg.total_placements or 0,
        "total_recruiters":  pkg.total_recruiters or 0,
        "avg_package_lpa":   _f(pkg.avg_pkg),
        "max_package_lpa":   _f(pkg.max_pkg),
        "min_package_lpa":   _f(pkg.min_pkg),
        "median_package_lpa": median,
    }


# ── department analytics ──────────────────────────────────────────────────────

def get_department_stats(year: int | None = None) -> list[dict]:
    """
    Per-department breakdown.
    `placed` count = distinct students who have at least one placement record
    (optionally in the given year), not just students with status='placed'.
    This is more accurate when a year filter is applied.
    """
    # Sub-query: placed student IDs (optionally for a year)
    placed_sq = (
        db.session.query(Placement.student_id.label("sid"))
        .distinct()
    )
    if year:
        placed_sq = placed_sq.filter(Placement.year == year)
    placed_sq = placed_sq.subquery("placed_students")

    results = (
        db.session.query(
            Department.id.label("dept_id"),
            Department.name.label("department"),
            func.count(Student.id).label("total_students"),
            func.count(placed_sq.c.sid).label("placed"),
            func.avg(Placement.package_lpa).label("avg_pkg"),
            func.max(Placement.package_lpa).label("max_pkg"),
            func.min(Placement.package_lpa).label("min_pkg"),
            func.count(func.distinct(Placement.company_id)).label("recruiters"),
        )
        .join(Student, Student.department_id == Department.id)
        .outerjoin(placed_sq, placed_sq.c.sid == Student.id)
        .outerjoin(
            Placement,
            (Placement.student_id == Student.id)
            & (Placement.year == year if year else True),
        )
        .group_by(Department.id)
        .order_by(Department.name)
        .all()
    )

    data = []
    for row in results:
        total  = row.total_students or 0
        placed = int(row.placed or 0)
        data.append({
            "department":      row.department,
            "total_students":  total,
            "placed":          placed,
            "unplaced":        total - placed,
            "placement_rate":  round(placed / total * 100, 2) if total else 0.0,
            "avg_package_lpa": _f(row.avg_pkg),
            "max_package_lpa": _f(row.max_pkg),
            "min_package_lpa": _f(row.min_pkg),
            "total_recruiters": row.recruiters or 0,
        })
    return data


# ── company analytics ─────────────────────────────────────────────────────────

def get_company_stats(year: int | None = None, sector: str | None = None) -> list[dict]:
    """
    Per-company recruitment stats.
    """
    query = (
        db.session.query(
            Company.id.label("company_id"),
            Company.name.label("company"),
            Company.sector.label("sector"),
            Company.location.label("location"),
            func.count(Placement.id).label("hires"),
            func.avg(Placement.package_lpa).label("avg_pkg"),
            func.max(Placement.package_lpa).label("max_pkg"),
            func.min(Placement.package_lpa).label("min_pkg"),
            func.count(func.distinct(Placement.student_id)).label("unique_students"),
        )
        .join(Placement, Placement.company_id == Company.id)
    )
    if year:
        query = query.filter(Placement.year == year)
    if sector:
        query = query.filter(Company.sector == sector)

    results = (
        query
        .group_by(Company.id)
        .order_by(func.count(Placement.id).desc())
        .all()
    )

    return [
        {
            "company":         row.company,
            "sector":          row.sector or "—",
            "location":        row.location or "—",
            "hires":           row.hires,
            "unique_students": row.unique_students,
            "avg_package_lpa": _f(row.avg_pkg),
            "max_package_lpa": _f(row.max_pkg),
            "min_package_lpa": _f(row.min_pkg),
        }
        for row in results
    ]


# ── company sector distribution ──────────────────────────────────────────────

def get_sector_stats(year: int | None = None) -> list[dict]:
    """
    Aggregate hires and avg package grouped by sector.
    Used for the sector pie/doughnut chart.
    Rows with NULL sector are grouped as 'Other'.
    """
    sector_label = func.coalesce(Company.sector, "Other").label("sector")

    query = (
        db.session.query(
            sector_label,
            func.count(Placement.id).label("hires"),
            func.count(func.distinct(Placement.student_id)).label("students"),
            func.avg(Placement.package_lpa).label("avg_pkg"),
        )
        .join(Placement, Placement.company_id == Company.id)
    )
    if year:
        query = query.filter(Placement.year == year)

    results = (
        query
        .group_by(sector_label)
        .order_by(func.count(Placement.id).desc())
        .all()
    )

    return [
        {
            "sector":          row.sector,
            "hires":           row.hires,
            "students":        row.students,
            "avg_package_lpa": _f(row.avg_pkg),
        }
        for row in results
    ]


# ── company year-on-year trends ───────────────────────────────────────────────

def get_company_trends(year: int | None = None, sector: str | None = None) -> list[dict]:
    """
    For every (year, company) pair return hires, avg, max package.
    Optional filters: year (single year snapshot still useful for
    cross-company comparison), sector.
    Ordered by year ASC, hires DESC.
    """
    query = (
        db.session.query(
            Placement.year.label("year"),
            Company.id.label("company_id"),
            Company.name.label("company"),
            Company.sector.label("sector"),
            func.count(Placement.id).label("hires"),
            func.avg(Placement.package_lpa).label("avg_pkg"),
            func.max(Placement.package_lpa).label("max_pkg"),
        )
        .join(Placement, Placement.company_id == Company.id)
    )
    if year:
        query = query.filter(Placement.year == year)
    if sector:
        query = query.filter(Company.sector == sector)

    results = (
        query
        .group_by(Placement.year, Company.id)
        .order_by(Placement.year, func.count(Placement.id).desc())
        .all()
    )

    return [
        {
            "year":            row.year,
            "company_id":      row.company_id,
            "company":         row.company,
            "sector":          row.sector or "—",
            "hires":           row.hires,
            "avg_package_lpa": _f(row.avg_pkg),
            "max_package_lpa": _f(row.max_pkg),
        }
        for row in results
    ]


# ── department year-on-year trends ───────────────────────────────────────────

def get_department_trends() -> list[dict]:
    """
    For every (year, department) pair that has at least one placement,
    return placement count, placed-student count, avg/max package.

    Used by the department trend line charts.
    Shape: [ {year, department, dept_id, placements, placed_students,
               avg_package_lpa, max_package_lpa}, ... ]
    ordered by year ASC, then department name ASC.
    """
    results = (
        db.session.query(
            Placement.year.label("year"),
            Department.id.label("dept_id"),
            Department.name.label("department"),
            func.count(Placement.id).label("placements"),
            func.count(func.distinct(Placement.student_id)).label("placed_students"),
            func.avg(Placement.package_lpa).label("avg_pkg"),
            func.max(Placement.package_lpa).label("max_pkg"),
        )
        .join(Student,    Student.id    == Placement.student_id)
        .join(Department, Department.id == Student.department_id)
        .group_by(Placement.year, Department.id)
        .order_by(Placement.year, Department.name)
        .all()
    )

    return [
        {
            "year":             row.year,
            "dept_id":          row.dept_id,
            "department":       row.department,
            "placements":       row.placements,
            "placed_students":  row.placed_students,
            "avg_package_lpa":  _f(row.avg_pkg),
            "max_package_lpa":  _f(row.max_pkg),
        }
        for row in results
    ]


# ── yearly trends ─────────────────────────────────────────────────────────────

def get_yearly_trends() -> list[dict]:
    """
    Year-on-year placement KPIs.
    placed_students = distinct students placed in that year.
    """
    results = (
        db.session.query(
            Placement.year,
            func.count(Placement.id).label("total_placements"),
            func.count(func.distinct(Placement.student_id)).label("placed_students"),
            func.count(func.distinct(Placement.company_id)).label("total_recruiters"),
            func.avg(Placement.package_lpa).label("avg_pkg"),
            func.max(Placement.package_lpa).label("max_pkg"),
            func.min(Placement.package_lpa).label("min_pkg"),
        )
        .group_by(Placement.year)
        .order_by(Placement.year)
        .all()
    )

    rows = []
    for row in results:
        rows.append({
            "year":              row.year,
            "total_placements":  row.total_placements,
            "placed_students":   row.placed_students,
            "total_recruiters":  row.total_recruiters,
            "avg_package_lpa":   _f(row.avg_pkg),
            "max_package_lpa":   _f(row.max_pkg),
            "min_package_lpa":   _f(row.min_pkg),
            "median_package_lpa": _median_lpa(year=row.year),
        })
    return rows
