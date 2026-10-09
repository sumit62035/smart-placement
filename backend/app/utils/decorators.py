from functools import wraps
from flask_jwt_extended import verify_jwt_in_request
from flask_jwt_extended.exceptions import JWTExtendedException
from jwt.exceptions import PyJWTError


def admin_required(fn):
    """
    Decorator that enforces a valid, non-revoked JWT on every admin route.
    JWT error responses are handled centrally by the callbacks in extensions.py,
    so this decorator simply lets those propagate naturally.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()   # raises → caught by JWT error handlers
        return fn(*args, **kwargs)
    return wrapper
