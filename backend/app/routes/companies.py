from flask import Blueprint, request, jsonify
from sqlalchemy import or_
from ..extensions import db
from ..models.company import Company
from ..utils.decorators import admin_required

companies_bp = Blueprint("companies", __name__)

PER_PAGE_DEFAULT = 15
PER_PAGE_MAX     = 100


@companies_bp.route("", methods=["GET"])
def get_companies():
    sector   = request.args.get("sector",  type=str, default="").strip()
    search   = request.args.get("search",  type=str, default="").strip()
    page     = request.args.get("page",  1,  type=int)
    per_page = min(request.args.get("per_page", PER_PAGE_DEFAULT, type=int), PER_PAGE_MAX)

    query = Company.query

    if sector:
        query = query.filter(Company.sector == sector)
    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                Company.name.ilike(like),
                Company.sector.ilike(like),
                Company.location.ilike(like),
            )
        )

    paginated = query.order_by(Company.name).paginate(
        page=page, per_page=per_page, error_out=False
    )
    return jsonify({
        "companies":    [c.to_dict() for c in paginated.items],
        "total":        paginated.total,
        "pages":        paginated.pages,
        "current_page": page,
        "per_page":     per_page,
    }), 200


@companies_bp.route("/<int:company_id>", methods=["GET"])
def get_company(company_id):
    company = Company.query.get_or_404(company_id)
    return jsonify(company.to_dict()), 200


@companies_bp.route("", methods=["POST"])
@admin_required
def create_company():
    data = request.get_json(silent=True) or {}
    if not data.get("name"):
        return jsonify({"error": "name is required"}), 400

    company = Company(
        name=data["name"],
        sector=data.get("sector") or None,
        location=data.get("location") or None,
        package_min=data.get("package_min") or None,
        package_max=data.get("package_max") or None,
    )
    db.session.add(company)
    db.session.commit()
    return jsonify(company.to_dict()), 201


@companies_bp.route("/<int:company_id>", methods=["PUT"])
@admin_required
def update_company(company_id):
    company = Company.query.get_or_404(company_id)
    data    = request.get_json(silent=True) or {}
    for field in ["name", "sector", "location", "package_min", "package_max"]:
        if field in data:
            setattr(company, field, data[field] or None)
    db.session.commit()
    return jsonify(company.to_dict()), 200


@companies_bp.route("/<int:company_id>", methods=["DELETE"])
@admin_required
def delete_company(company_id):
    company = Company.query.get_or_404(company_id)
    db.session.delete(company)
    db.session.commit()
    return jsonify({"message": "Company deleted"}), 200
