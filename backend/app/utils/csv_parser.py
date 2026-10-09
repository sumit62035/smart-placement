"""
csv_parser.py
Validates and imports placement data from CSV / XLSX files.

Returns a result dict:
{
    "row_count":  <total rows in file>,
    "stats": {
        "inserted": <new records created>,
        "updated":  <existing records updated>,
        "skipped":  <rows skipped due to errors>,
        "errors":   <total error count>
    },
    "error_log": [
        {"row": <1-based>, "field": "<column>", "message": "<reason>"},
        ...
    ]
}
"""

from __future__ import annotations

import re
from datetime import datetime, date

import pandas as pd

from ..extensions import db
from ..models.student import Student
from ..models.company import Company
from ..models.placement import Placement
from ..models.department import Department

# ── Constants ────────────────────────────────────────────────────────────────

REQUIRED_COLUMNS = {
    "student_name",
    "roll_number",
    "email",
    "department",
    "batch_year",
    "company_name",
    "package_lpa",
    "year",
}

CURRENT_YEAR = datetime.utcnow().year
MIN_YEAR     = 2000
MAX_PACKAGE  = 500.0   # LPA ceiling (sanity check)
MIN_PACKAGE  = 0.1     # LPA floor

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


# ── Public entry point ───────────────────────────────────────────────────────

def process_file(file_path: str, ext: str) -> dict:
    """
    Load, validate, and persist placement data.
    Returns the result dict described in the module docstring.
    """
    df = _load(file_path, ext)
    _normalise_columns(df)
    _check_required_columns(df)        # raises ValueError if missing

    errors:   list[dict] = []
    stats = {"inserted": 0, "updated": 0, "skipped": 0, "errors": 0}

    # Cache valid department names from DB for fast lookup
    valid_depts = {d.name.lower(): d for d in Department.query.all()}

    for raw_idx, row in df.iterrows():
        row_num   = int(raw_idx) + 2   # 1-based, +1 for header
        row_errors: list[dict] = []

        def err(field: str, msg: str) -> None:
            row_errors.append({"row": row_num, "field": field, "message": msg})

        # ── 1. Required / missing value checks ────────────────────────────
        student_name = _str(row, "student_name")
        roll_number  = _str(row, "roll_number")
        email        = _str(row, "email")
        dept_name    = _str(row, "department")
        company_name = _str(row, "company_name")

        if not student_name:
            err("student_name", "Missing student name")
        if not roll_number:
            err("roll_number", "Missing roll number")
        if not email:
            err("email", "Missing email")
        elif not EMAIL_RE.match(email):
            err("email", f"Invalid email format: '{email}'")
        if not dept_name:
            err("department", "Missing department")
        if not company_name:
            err("company_name", "Missing company name")

        # ── 2. batch_year validation ───────────────────────────────────────
        batch_year = _int(row, "batch_year")
        if batch_year is None:
            err("batch_year", "Missing or non-numeric batch_year")
        elif not (MIN_YEAR <= batch_year <= CURRENT_YEAR + 4):
            err("batch_year", f"batch_year {batch_year} is out of range "
                              f"({MIN_YEAR}–{CURRENT_YEAR + 4})")

        # ── 3. placement year validation ───────────────────────────────────
        place_year = _int(row, "year")
        if place_year is None:
            err("year", "Missing or non-numeric placement year")
        elif not (MIN_YEAR <= place_year <= CURRENT_YEAR + 1):
            err("year", f"Placement year {place_year} is out of range "
                        f"({MIN_YEAR}–{CURRENT_YEAR + 1})")

        # ── 4. package_lpa validation ──────────────────────────────────────
        package_lpa = _float(row, "package_lpa")
        if package_lpa is None:
            err("package_lpa", "Missing or non-numeric package_lpa")
        elif package_lpa < MIN_PACKAGE:
            err("package_lpa", f"package_lpa {package_lpa} is below minimum ({MIN_PACKAGE})")
        elif package_lpa > MAX_PACKAGE:
            err("package_lpa", f"package_lpa {package_lpa} exceeds maximum ({MAX_PACKAGE})")

        # ── 5. department must exist in DB ─────────────────────────────────
        dept_obj = valid_depts.get(dept_name.lower()) if dept_name else None
        if dept_name and dept_obj is None:
            err("department", f"Department '{dept_name}' not found in database. "
                              "Create it first via the Departments page.")

        # ── 6. CGPA range (optional column) ───────────────────────────────
        cgpa = _float(row, "cgpa")
        if cgpa is not None and not (0.0 <= cgpa <= 10.0):
            err("cgpa", f"CGPA {cgpa} is out of range (0–10)")

        # ── Collect row-level errors and skip if any ───────────────────────
        if row_errors:
            errors.extend(row_errors)
            stats["errors"] += len(row_errors)
            stats["skipped"] += 1
            continue

        # ── 7. Duplicate-in-file check (roll_number seen twice) ───────────
        #    We rely on the DB upsert below; in-file duplicates simply update.

        # ── Persist ───────────────────────────────────────────────────────
        try:
            inserted, updated = _upsert_row(
                student_name=student_name,
                roll_number=roll_number,
                email=email,
                dept_obj=dept_obj,
                batch_year=batch_year,
                cgpa=cgpa,
                company_name=company_name,
                sector=_str(row, "sector"),
                location=_str(row, "location"),
                package_lpa=package_lpa,
                role=_str(row, "role"),
                offer_date=_date(row, "offer_date"),
                place_year=place_year,
            )
            stats["inserted"] += inserted
            stats["updated"]  += updated
        except Exception as exc:
            errors.append({"row": row_num, "field": "db", "message": str(exc)})
            stats["errors"] += 1
            stats["skipped"] += 1
            db.session.rollback()

    db.session.commit()

    return {
        "row_count": len(df),
        "stats":     stats,
        "error_log": errors,
    }


# ── DB upsert ────────────────────────────────────────────────────────────────

def _upsert_row(
    *,
    student_name: str,
    roll_number:  str,
    email:        str,
    dept_obj:     Department,
    batch_year:   int,
    cgpa,
    company_name: str,
    sector:       str | None,
    location:     str | None,
    package_lpa:  float,
    role:         str | None,
    offer_date,
    place_year:   int,
) -> tuple[int, int]:
    """
    Upsert one row.  Returns (inserted_count, updated_count) where each is
    the number of *placement* records created or updated in this call.
    """
    inserted = updated = 0

    # Student — upsert by roll_number
    student = Student.query.filter_by(roll_number=roll_number).first()
    if not student:
        student = Student(
            name=student_name,
            roll_number=roll_number,
            email=email,
            department_id=dept_obj.id,
            batch_year=batch_year,
            cgpa=cgpa,
            status="unplaced",
        )
        db.session.add(student)
        db.session.flush()
    else:
        # Update mutable fields if they have changed
        student.name          = student_name
        student.email         = email
        student.department_id = dept_obj.id
        student.batch_year    = batch_year
        if cgpa is not None:
            student.cgpa = cgpa

    # Company — upsert by name
    company = Company.query.filter_by(name=company_name).first()
    if not company:
        company = Company(name=company_name, sector=sector, location=location)
        db.session.add(company)
        db.session.flush()

    # Placement — upsert by (student, company, year)
    placement = Placement.query.filter_by(
        student_id=student.id,
        company_id=company.id,
        year=place_year,
    ).first()

    if not placement:
        placement = Placement(
            student_id=student.id,
            company_id=company.id,
            package_lpa=package_lpa,
            role=role,
            offer_date=offer_date,
            year=place_year,
        )
        db.session.add(placement)
        student.status = "placed"
        inserted = 1
    else:
        # Update if package or role changed
        placement.package_lpa = package_lpa
        if role:
            placement.role = role
        if offer_date:
            placement.offer_date = offer_date
        updated = 1

    return inserted, updated


# ── Helpers ──────────────────────────────────────────────────────────────────

def _load(file_path: str, ext: str) -> pd.DataFrame:
    if ext == "csv":
        df = pd.read_csv(file_path, dtype=str, keep_default_na=False)
    else:
        df = pd.read_excel(file_path, dtype=str, keep_default_na=False)
    return df


def _normalise_columns(df: pd.DataFrame) -> None:
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]


def _check_required_columns(df: pd.DataFrame) -> None:
    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise ValueError(
            f"File is missing required columns: {', '.join(sorted(missing))}"
        )


def _str(row, col: str) -> str | None:
    val = row.get(col, "")
    return val.strip() if isinstance(val, str) and val.strip() else None


def _int(row, col: str) -> int | None:
    try:
        val = row.get(col, "")
        if val == "" or val is None:
            return None
        return int(float(str(val).strip()))
    except (ValueError, TypeError):
        return None


def _float(row, col: str) -> float | None:
    try:
        val = row.get(col, "")
        if val == "" or val is None:
            return None
        return float(str(val).strip())
    except (ValueError, TypeError):
        return None


def _date(row, col: str):
    val = row.get(col, "")
    if not val or val == "":
        return None
    try:
        return pd.to_datetime(str(val)).date()
    except Exception:
        return None
