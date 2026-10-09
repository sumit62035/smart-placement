-- ============================================================
-- Smart College Placement Analytics & Management System
-- MySQL Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS smart_placement
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smart_placement;

-- ============================================================
-- 1. admins
--    Stores admin accounts that can log in to the system.
-- ============================================================
CREATE TABLE admins (
    id          INT             UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(100)    NOT NULL,
    email       VARCHAR(150)    NOT NULL,
    password    VARCHAR(255)    NOT NULL,          -- bcrypt hash
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_admins_username UNIQUE (username),
    CONSTRAINT uq_admins_email    UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 2. departments
--    Academic departments (CSE, ECE, MBA, etc.)
--    Referenced by students.
-- ============================================================
CREATE TABLE departments (
    id          INT             UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    code        VARCHAR(20)     NOT NULL,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_departments_name UNIQUE (name),
    CONSTRAINT uq_departments_code UNIQUE (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 3. students
--    One student belongs to one department.
--    A student can appear in many placements.
-- ============================================================
CREATE TABLE students (
    id              INT             UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150)    NOT NULL,
    roll_number     VARCHAR(50)     NOT NULL,
    email           VARCHAR(150)    NOT NULL,
    department_id   INT             UNSIGNED NOT NULL,
    batch_year      YEAR            NOT NULL,
    cgpa            DECIMAL(4,2)    DEFAULT NULL,
    status          ENUM('placed','unplaced','opted_out') NOT NULL DEFAULT 'unplaced',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_students_roll  UNIQUE (roll_number),
    CONSTRAINT uq_students_email UNIQUE (email),

    CONSTRAINT fk_students_dept
        FOREIGN KEY (department_id) REFERENCES departments (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    INDEX idx_students_dept       (department_id),
    INDEX idx_students_batch      (batch_year),
    INDEX idx_students_status     (status),
    INDEX idx_students_dept_batch (department_id, batch_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 4. companies
--    Companies that recruit students.
--    A company can have many placements.
-- ============================================================
CREATE TABLE companies (
    id              INT             UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150)    NOT NULL,
    sector          VARCHAR(100)    DEFAULT NULL,
    location        VARCHAR(150)    DEFAULT NULL,
    package_min     DECIMAL(10,2)   DEFAULT NULL,   -- LPA
    package_max     DECIMAL(10,2)   DEFAULT NULL,   -- LPA
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_companies_sector (sector)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 5. placements
--    Core fact table linking one student to one company
--    for a given year.
--    One student can have multiple placements (multiple offers).
-- ============================================================
CREATE TABLE placements (
    id              INT             UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id      INT             UNSIGNED NOT NULL,
    company_id      INT             UNSIGNED NOT NULL,
    package_lpa     DECIMAL(6,2)    NOT NULL,
    role            VARCHAR(150)    DEFAULT NULL,
    offer_date      DATE            DEFAULT NULL,
    year            YEAR            NOT NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_placements_student
        FOREIGN KEY (student_id) REFERENCES students (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_placements_company
        FOREIGN KEY (company_id) REFERENCES companies (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    INDEX idx_placements_student (student_id),
    INDEX idx_placements_company (company_id),
    INDEX idx_placements_year    (year),
    INDEX idx_placements_pkg     (package_lpa),
    INDEX idx_placements_yr_co   (year, company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 6. uploaded_files
--    Tracks every CSV / XLSX file an admin uploads.
--    Linked to the admin who uploaded it.
-- ============================================================
CREATE TABLE uploaded_files (
    id              INT             UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    filename        VARCHAR(255)    NOT NULL,
    file_type       ENUM('csv','xlsx') NOT NULL,
    uploaded_by     INT             UNSIGNED NOT NULL,
    row_count       INT             UNSIGNED DEFAULT NULL,
    status          ENUM('pending','processed','failed') NOT NULL DEFAULT 'pending',
    uploaded_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_uploaded_files_admin
        FOREIGN KEY (uploaded_by) REFERENCES admins (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    INDEX idx_uploaded_files_admin  (uploaded_by),
    INDEX idx_uploaded_files_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 7. reports
--    Stores metadata for every PDF report generated.
--    Linked to the admin who generated it.
-- ============================================================
CREATE TABLE reports (
    id              INT             UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(255)    NOT NULL,
    report_type     ENUM('department','company','yearly','summary') NOT NULL,
    generated_by    INT             UNSIGNED NOT NULL,
    file_path       VARCHAR(500)    DEFAULT NULL,
    filters_used    JSON            DEFAULT NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_reports_admin
        FOREIGN KEY (generated_by) REFERENCES admins (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    INDEX idx_reports_admin (generated_by),
    INDEX idx_reports_type  (report_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
