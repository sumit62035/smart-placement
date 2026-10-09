from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_migrate import Migrate

db      = SQLAlchemy()
jwt     = JWTManager()
cors    = CORS()
migrate = Migrate()

# In-memory token blocklist for logout invalidation.
# For multi-process deployments replace this with a Redis set.
BLOCKLISTED_TOKENS: set = set()


@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload: dict) -> bool:
    return jwt_payload["jti"] in BLOCKLISTED_TOKENS


@jwt.revoked_token_loader
def revoked_token_response(jwt_header, jwt_payload):
    from flask import jsonify
    return jsonify({"error": "Token has been revoked. Please log in again."}), 401


@jwt.expired_token_loader
def expired_token_response(jwt_header, jwt_payload):
    from flask import jsonify
    return jsonify({"error": "Session expired. Please log in again."}), 401


@jwt.invalid_token_loader
def invalid_token_response(error_string):
    from flask import jsonify
    return jsonify({"error": "Invalid token."}), 401


@jwt.unauthorized_loader
def missing_token_response(error_string):
    from flask import jsonify
    return jsonify({"error": "Authentication required."}), 401
