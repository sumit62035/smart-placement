import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from sqlalchemy import func
from ..extensions import db
from ..models.student import Student
from ..models.placement import Placement
from ..models.department import Department
from ..models.company import Company


def generate_pdf_report(report, output_folder: str) -> str:
    filename = f"report_{report.id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.pdf"
    file_path = os.path.join(output_folder, filename)

    doc = SimpleDocTemplate(file_path, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    # Title
    title_style = ParagraphStyle(
        "Title", parent=styles["Heading1"],
        fontSize=18, spaceAfter=12, textColor=colors.HexColor("#1a3c5e")
    )
    story.append(Paragraph("Smart College Placement Analytics", title_style))
    story.append(Paragraph(report.title, styles["Heading2"]))
    story.append(Paragraph(
        f"Generated: {datetime.utcnow().strftime('%d %B %Y, %H:%M UTC')}",
        styles["Normal"]
    ))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.grey))
    story.append(Spacer(1, 0.5 * cm))

    report_type = report.report_type

    if report_type == "summary" or report_type == "yearly":
        _add_summary_section(story, styles)

    if report_type == "department" or report_type == "summary":
        _add_department_section(story, styles)

    if report_type == "company" or report_type == "summary":
        _add_company_section(story, styles)

    doc.build(story)
    return file_path


def _add_summary_section(story, styles):
    story.append(Paragraph("Overall Summary", styles["Heading3"]))
    total = Student.query.count()
    placed = Student.query.filter_by(status="placed").count()
    avg_pkg = db.session.query(func.avg(Placement.package_lpa)).scalar()
    max_pkg = db.session.query(func.max(Placement.package_lpa)).scalar()

    data = [
        ["Metric", "Value"],
        ["Total Students", str(total)],
        ["Placed Students", str(placed)],
        ["Placement Rate", f"{round(placed / total * 100, 1)}%" if total else "N/A"],
        ["Avg Package (LPA)", f"₹{round(float(avg_pkg), 2)}" if avg_pkg else "N/A"],
        ["Highest Package (LPA)", f"₹{round(float(max_pkg), 2)}" if max_pkg else "N/A"],
    ]
    story.append(_build_table(data))
    story.append(Spacer(1, 0.5 * cm))


def _add_department_section(story, styles):
    story.append(Paragraph("Department-wise Placements", styles["Heading3"]))
    results = (
        db.session.query(
            Department.name,
            func.count(Student.id).label("total"),
            func.sum(db.case((Student.status == "placed", 1), else_=0)).label("placed"),
            func.avg(Placement.package_lpa).label("avg_pkg"),
        )
        .join(Student, Student.department_id == Department.id)
        .outerjoin(Placement, Placement.student_id == Student.id)
        .group_by(Department.id)
        .all()
    )

    data = [["Department", "Total", "Placed", "Rate %", "Avg LPA"]]
    for row in results:
        total = row.total or 0
        placed = int(row.placed or 0)
        rate = round(placed / total * 100, 1) if total else 0
        avg = round(float(row.avg_pkg), 2) if row.avg_pkg else 0
        data.append([row.name, str(total), str(placed), f"{rate}%", f"₹{avg}"])

    story.append(_build_table(data))
    story.append(Spacer(1, 0.5 * cm))


def _add_company_section(story, styles):
    story.append(Paragraph("Top Recruiting Companies", styles["Heading3"]))
    results = (
        db.session.query(
            Company.name,
            Company.sector,
            func.count(Placement.id).label("hires"),
            func.avg(Placement.package_lpa).label("avg_pkg"),
        )
        .join(Placement, Placement.company_id == Company.id)
        .group_by(Company.id)
        .order_by(func.count(Placement.id).desc())
        .limit(20)
        .all()
    )

    data = [["Company", "Sector", "Hires", "Avg LPA"]]
    for row in results:
        avg = round(float(row.avg_pkg), 2) if row.avg_pkg else 0
        data.append([row.name, row.sector or "—", str(row.hires), f"₹{avg}"])

    story.append(_build_table(data))


def _build_table(data):
    table = Table(data, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a3c5e")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f0f4f8")]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return table
