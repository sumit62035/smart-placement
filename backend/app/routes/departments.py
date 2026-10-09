from flask import Blueprint, request, jsonify
from ..extensions import db
from ..models.department import Department
from ..utils.decorators import admin_required

departments_bp = Blueprint("departments", __name__)


@departments_bp.route("", methods=["GET"])
def get_departments():
    departments = Department.query.all()
    return jsonify([d.to_dict() for d in departments]), 200


@departments_bp.route("/<int:dept_id>", methods=["GET"])
def get_department(dept_id):
    dept = Department.query.get_or_404(dept_id)
    return jsonify(dept.to_dict()), 200


@departments_bp.route("", methods=["POST"])
@admin_required
def create_department():
    data = request.get_json()
    if not data.get("name") or not data.get("code"):
        return jsonify({"error": "name and code are required"}), 400

    dept = Department(name=data["name"], code=data["code"])
    db.session.add(dept)
    db.session.commit()
    return jsonify(dept.to_dict()), 201


@departments_bp.route("/<int:dept_id>", methods=["PUT"])
@admin_required
def update_department(dept_id):
    dept = Department.query.get_or_404(dept_id)
    data = request.get_json()
    if "name" in data:
        dept.name = data["name"]
    if "code" in data:
        dept.code = data["code"]
    db.session.commit()
    return jsonify(dept.to_dict()), 200


@departments_bp.route("/<int:dept_id>", methods=["DELETE"])
@admin_required
def delete_department(dept_id):
    dept = Department.query.get_or_404(dept_id)
    db.session.delete(dept)
    db.session.commit()
    return jsonify({"message": "Department deleted"}), 200
