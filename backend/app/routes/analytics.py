from flask import Blueprint, request, jsonify

from ..utils.analytics_service import (
    get_dashboard_stats,
    get_department_stats,
    get_department_trends,
    get_company_stats,
    get_sector_stats,
    get_company_trends,
    get_yearly_trends,
)

analytics_bp = Blueprint("analytics", __name__)


# ── /api/analytics/dashboard ─────────────────────────────────────────────────
# Public. Optional ?year=YYYY filter scopes package KPIs to that year.
#
# Response fields:
#   total_students, placed_students, unplaced_students, opted_out_students,
#   placement_rate, total_placements, total_recruiters,
#   avg_package_lpa, max_package_lpa, min_package_lpa, median_package_lpa
@analytics_bp.route("/dashboard", methods=["GET"])
def dashboard():
    year = request.args.get("year", type=int)
    return jsonify(get_dashboard_stats(year=year)), 200


# ── /api/analytics/departments ───────────────────────────────────────────────
# Public. Optional ?year=YYYY.
#
# Response: array of {
#   department, total_students, placed, unplaced, placement_rate,
#   avg_package_lpa, max_package_lpa, min_package_lpa, total_recruiters
# }
@analytics_bp.route("/departments", methods=["GET"])
def department_analytics():
    year = request.args.get("year", type=int)
    return jsonify(get_department_stats(year=year)), 200


# ── /api/analytics/companies ─────────────────────────────────────────────────
# Public. Optional ?year=YYYY and ?sector=<string>.
#
# Response: array of {
#   company, sector, location, hires, unique_students,
#   avg_package_lpa, max_package_lpa, min_package_lpa
# }
@analytics_bp.route("/companies", methods=["GET"])
def company_analytics():
    year   = request.args.get("year",   type=int)
    sector = request.args.get("sector", type=str)
    return jsonify(get_company_stats(year=year, sector=sector)), 200


# ── /api/analytics/companies/sectors ─────────────────────────────────────────
# Public. Optional ?year=YYYY.
# Response: array of { sector, hires, students, avg_package_lpa }
@analytics_bp.route("/companies/sectors", methods=["GET"])
def company_sectors():
    year = request.args.get("year", type=int)
    return jsonify(get_sector_stats(year=year)), 200


# ── /api/analytics/companies/trends ──────────────────────────────────────────
# Public. Optional ?year=YYYY and ?sector=<string>.
# Response: array of { year, company_id, company, sector, hires,
#                       avg_package_lpa, max_package_lpa }
@analytics_bp.route("/companies/trends", methods=["GET"])
def company_trends():
    year   = request.args.get("year",   type=int)
    sector = request.args.get("sector", type=str)
    return jsonify(get_company_trends(year=year, sector=sector)), 200


# ── /api/analytics/departments/trends ────────────────────────────────────────
# Public. No filters — returns all (year × department) pairs ordered by year.
#
# Response: array of {
#   year, dept_id, department, placements, placed_students,
#   avg_package_lpa, max_package_lpa
# }
@analytics_bp.route("/departments/trends", methods=["GET"])
def department_trends():
    return jsonify(get_department_trends()), 200


# ── /api/analytics/trends ────────────────────────────────────────────────────
# Public. No filters — always returns all years ordered ascending.
#
# Response: array of {
#   year, total_placements, placed_students, total_recruiters,
#   avg_package_lpa, max_package_lpa, min_package_lpa, median_package_lpa
# }
@analytics_bp.route("/trends", methods=["GET"])
def yearly_trends():
    return jsonify(get_yearly_trends()), 200
