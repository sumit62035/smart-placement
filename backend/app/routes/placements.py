from flask import Blueprint, request, jsonify
from sqlalchemy import or_
from ..extensions import db
from ..models.placement import Placement
from ..models.student import Student
from ..models.company import Company
from ..utils.decorators import admin_required

placements_bp = Blueprint("placements", __name__)

PER_PAGE_DEFAULT = 15
PER_PAGE_MAX     = 100


@placements_bp.route("", methods=["GET"])
@admin_required
def get_placements():
    year          = request.args.get("year",          type=int)
    company_id    = request.args.get("company_id",    type=int)
    department_id = request.args.get("department_id", type=int)
    search        = request.args.get("search",        type=str, default="").strip()
    page          = request.args.get("page",  1,       type=int)
    per_page      = min(request.args.get("per_page", PER_PAGE_DEFAULT, type=int), PER_PAGE_MAX)

    # Always join student + company so we can search and sort by name
    query = (
        db.session.query(Placement)
        .join(Placement.student)
        .join(Placement.company)
    )

    if year:
        query = query.filter(Placement.year == year)
    if company_id:
        query = query.filter(Placement.company_id == company_id)
    if department_id:
        query = query.filter(Student.department_id == department_id)
    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                Student.name.ilike(like),
                Student.roll_number.ilike(like),
                Company.name.ilike(like),
                Placement.role.ilike(like),
            )
        )

    paginated = query.order_by(Placement.year.desc(), Student.name).paginate(
        page=page, per_page=per_page, error_out=False
    )
    return jsonify({
        "placements":   [p.to_dict() for p in paginated.items],
        "total":        paginated.total,
        "pages":        paginated.pages,
        "current_page": page,
        "per_page":     per_page,
    }), 200


@placements_bp.route("/<int:placement_id>", methods=["GET"])
@admin_required
def get_placement(placement_id):
    placement = Placement.query.get_or_404(placement_id)
    return jsonify(placement.to_dict()), 200


@placements_bp.route("", methods=["POST"])
@admin_required
def create_placement():
    data = request.get_json(silent=True) or {}
    required = ["student_id", "company_id", "package_lpa", "year"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    placement = Placement(
        student_id=data["student_id"],
        company_id=data["company_id"],
        package_lpa=data["package_lpa"],
        role=data.get("role") or None,
        offer_date=data.get("offer_date") or None,
        year=data["year"],
    )
    db.session.add(placement)

    student = Student.query.get(data["student_id"])
    if student:
        student.status = "placed"

    db.session.commit()
    return jsonify(placement.to_dict()), 201


@placements_bp.route("/<int:placement_id>", methods=["PUT"])
@admin_required
def update_placement(placement_id):
    placement = Placement.query.get_or_404(placement_id)
    data      = request.get_json(silent=True) or {}
    for field in ["package_lpa", "role", "offer_date", "year", "company_id"]:
        if field in data:
            setattr(placement, field, data[field] or None if field in ("role", "offer_date") else data[field])
    db.session.commit()
    return jsonify(placement.to_dict()), 200


@placements_bp.route("/<int:placement_id>", methods=["DELETE"])
@admin_required
def delete_placement(placement_id):
    placement = Placement.query.get_or_404(placement_id)
    db.session.delete(placement)
    db.session.commit()
    return jsonify({"message": "Placement deleted"}), 200
