-- DataGrip / MySQL console checks for the Self-Service Portal database.
-- Run the Prisma migration first, then run these queries against your schema.
-- If your database name is different, change the USE statement.

CREATE DATABASE IF NOT EXISTS `ssp_portal`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ssp_portal;

SHOW TABLES;

DESCRIBE users;
DESCRIBE employee_profiles;
DESCRIBE portal_requests;
DESCRIBE attendance_records;
DESCRIBE payroll_slips;
DESCRIBE policy_documents;
DESCRIBE performance_reviews;

SELECT COUNT(*) AS users_count FROM users;
SELECT COUNT(*) AS employee_profiles_count FROM employee_profiles;
SELECT COUNT(*) AS portal_requests_count FROM portal_requests;
SELECT COUNT(*) AS attendance_records_count FROM attendance_records;
SELECT COUNT(*) AS payroll_slips_count FROM payroll_slips;
SELECT COUNT(*) AS policy_documents_count FROM policy_documents;
SELECT COUNT(*) AS performance_reviews_count FROM performance_reviews;

SELECT employee_no, name, last_name, roles, department, department_name, hod, ceo, status
FROM users
ORDER BY employee_no;

SELECT employee_no, sector, division, employment_type, date_of_join
FROM employee_profiles
ORDER BY employee_no;

SELECT request_no, request_type, title, status, maker_employee_no, approver_employee_no, created_at
FROM portal_requests
ORDER BY created_at DESC
LIMIT 25;

SELECT request_type, status, COUNT(*) AS total
FROM portal_requests
GROUP BY request_type, status
ORDER BY request_type, status;

SELECT employee_no, staff_name, date, time_in, time_out, hours_worked, location
FROM attendance_records
ORDER BY date DESC, created_at DESC
LIMIT 25;

SELECT employee_no, employee_name, year, month, gross_pay, total_deductions, net_pay
FROM payroll_slips
ORDER BY year DESC, month, employee_no;

SELECT id, title, category, updated_on, file_name, mime_type
FROM policy_documents
ORDER BY category, title;

SELECT employee_no, employee_name, period, supervisor_name, department_name, status
FROM performance_reviews
ORDER BY period DESC, employee_no;
