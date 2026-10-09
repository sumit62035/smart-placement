import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from flask_jwt_extended import get_jwt_identity

from ..extensions import db
from ..models.uploaded_file import UploadedFile
from ..utils.decorators import admin_required
from ..utils.csv_parser import process_file

uploads_bp = Blueprint("uploads", __name__)


def _allowed(filename: str) -> bool:
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower()
        in current_app.config["ALLOWED_EXTENSIONS"]
    )


@uploads_bp.route("", methods=["POST"])
@admin_required
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file part in request"}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "No file selected"}), 400

    if not _allowed(file.filename):
        return jsonify({"error": "Only CSV and XLSX files are allowed"}), 400

    # Prefix filename with a uuid fragment to avoid collisions
    original_name = secure_filename(file.filename)
    ext           = original_name.rsplit(".", 1)[1].lower()
    unique_name   = f"{uuid.uuid4().hex[:8]}_{original_name}"

    upload_folder = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_folder, exist_ok=True)
    file_path = os.path.join(upload_folder, unique_name)
    file.save(file_path)

    admin_id = int(get_jwt_identity())
    record = UploadedFile(
        filename=original_name,
        file_type=ext,
        uploaded_by=admin_id,
        status="pending",
    )
    db.session.add(record)
    db.session.commit()

    try:
        result = process_file(file_path, ext)
    except ValueError as exc:
        # Missing required columns or structural problem
        record.status    = "failed"
        record.error_log = [{"row": 0, "field": "structure", "message": str(exc)}]
        db.session.commit()
        return jsonify({
            "error":      str(exc),
            "upload":     record.to_dict(),
        }), 422
    except Exception as exc:
        record.status    = "failed"
        record.error_log = [{"row": 0, "field": "server", "message": str(exc)}]
        db.session.commit()
        return jsonify({
            "error":  f"Processing failed: {str(exc)}",
            "upload": record.to_dict(),
        }), 500

    # Persist stats and error log
    record.row_count = result["row_count"]
    record.stats     = result["stats"]
    record.error_log = result["error_log"] if result["error_log"] else None
    record.status    = (
        "failed"    if result["stats"]["inserted"] == 0 and result["stats"]["updated"] == 0
        else "processed"
    )
    db.session.commit()

    return jsonify({
        "upload":    record.to_dict(),
        "row_count": result["row_count"],
        "stats":     result["stats"],
        "errors":    result["error_log"],
    }), 201


@uploads_bp.route("", methods=["GET"])
@admin_required
def list_uploads():
    uploads = UploadedFile.query.order_by(UploadedFile.uploaded_at.desc()).all()
    return jsonify([u.to_dict() for u in uploads]), 200


@uploads_bp.route("/<int:upload_id>", methods=["GET"])
@admin_required
def get_upload(upload_id):
    record = UploadedFile.query.get_or_404(upload_id)
    return jsonify(record.to_dict()), 200
