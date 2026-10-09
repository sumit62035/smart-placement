from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
)
from ..models.admin import Admin
from ..extensions import BLOCKLISTED_TOKENS

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)
    if not data or not data.get("username") or not data.get("password"):
        return jsonify({"error": "Username and password required"}), 400

    admin = Admin.query.filter_by(username=data["username"].strip()).first()
    if not admin or not admin.check_password(data["password"]):
        return jsonify({"error": "Invalid credentials"}), 401

    access_token = create_access_token(
        identity=str(admin.id),
        additional_claims={"username": admin.username},
    )
    return jsonify({
        "access_token": access_token,
        "admin": admin.to_dict(),
    }), 200


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    jti = get_jwt()["jti"]
    BLOCKLISTED_TOKENS.add(jti)
    return jsonify({"message": "Logged out successfully"}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    """Validate session and return the current admin's profile."""
    admin_id = int(get_jwt_identity())
    admin = Admin.query.get(admin_id)
    if not admin:
        return jsonify({"error": "Admin not found"}), 404
    return jsonify({"admin": admin.to_dict()}), 200
