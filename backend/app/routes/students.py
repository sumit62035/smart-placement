from flask import Blueprint, request, jsonify
from sqlalchemy import or_
from ..extensions import db
from ..models.student import Student
from ..models.department import Department
from ..utils.decorators import admin_required

students_bp = Blueprint("students", __name__)

PER_PAGE_DEFAULT = 15
PER_PAGE_MAX     = 100


@students_bp.route("", methods=["GET"])
@admin_required
def get_students():
    dept_id    = request.args.get("department_id", type=int)
    batch_year = request.args.get("batch_year",    type=int)
    status     = request.args.get("status")
    search     = request.args.get("search",        type=str, default="").strip()
    page       = request.args.get("page",     1,   type=int)
    per_page   = min(request.args.get("per_page", PER_PAGE_DEFAULT, type=int), PER_PAGE_MAX)

    query = Student.query

    if dept_id:
        query = query.filter(Student.department_id == dept_id)
    if batch_year:
        query = query.filter(Student.batch_year == batch_year)
    if status:
        query = query.filter(Student.status == status)
    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                Student.name.ilike(like),
                Student.roll_number.ilike(like),
                Student.email.ilike(like),
            )
        )

    paginated = query.order_by(Student.name).paginate(
        page=page, per_page=per_page, error_out=False
    )
    return jsonify({
        "students":     [s.to_dict() for s in paginated.items],
        "total":        paginated.total,
        "pages":        paginated.pages,
        "current_page": page,
        "per_page":     per_page,
    }), 200


@students_bp.route("/<int:student_id>", methods=["GET"])
@admin_required
def get_student(student_id):
    student = Student.query.get_or_404(student_id)
    return jsonify(student.to_dict()), 200


@students_bp.route("", methods=["POST"])
@admin_required
def create_student():
    data = request.get_json(silent=True) or {}
    required = ["name", "roll_number", "email", "department_id", "batch_year"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    if Student.query.filter_by(roll_number=data["roll_number"]).first():
        return jsonify({"error": "Roll number already exists"}), 409
    if Student.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already exists"}), 409

    student = Student(
        name=data["name"],
        roll_number=data["roll_number"],
        email=data["email"],
        department_id=data["department_id"],
        batch_year=data["batch_year"],
        cgpa=data.get("cgpa") or None,
        status=data.get("status", "unplaced"),
    )
    db.session.add(student)
    db.session.commit()
    return jsonify(student.to_dict()), 201


@students_bp.route("/<int:student_id>", methods=["PUT"])
@admin_required
def update_student(student_id):
    student = Student.query.get_or_404(student_id)
    data    = request.get_json(silent=True) or {}

    # Uniqueness checks on mutable unique fields
    if "email" in data and data["email"] != student.email:
        if Student.query.filter(Student.email == data["email"], Student.id != student_id).first():
            return jsonify({"error": "Email already in use"}), 409

    for field in ["name", "email", "department_id", "batch_year", "cgpa", "status"]:
        if field in data:
            setattr(student, field, data[field] or None if field == "cgpa" else data[field])

    db.session.commit()
    return jsonify(student.to_dict()), 200


@students_bp.route("/<int:student_id>", methods=["DELETE"])
@admin_required
def delete_student(student_id):
    student = Student.query.get_or_404(student_id)
    db.session.delete(student)
    db.session.commit()
    return jsonify({"message": "Student deleted"}), 200
