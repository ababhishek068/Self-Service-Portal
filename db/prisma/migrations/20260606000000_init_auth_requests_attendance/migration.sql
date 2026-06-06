-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_no` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `last_name` VARCHAR(191) NOT NULL DEFAULT '',
    `roles` VARCHAR(191) NOT NULL DEFAULT '',
    `email` VARCHAR(191) NOT NULL DEFAULT '',
    `department` VARCHAR(191) NOT NULL DEFAULT '',
    `department_name` VARCHAR(191) NOT NULL DEFAULT '',
    `branch_code` VARCHAR(191) NOT NULL DEFAULT '',
    `branch_name` VARCHAR(191) NOT NULL DEFAULT '',
    `job_title` VARCHAR(191) NOT NULL DEFAULT '',
    `job_grade` VARCHAR(191) NOT NULL DEFAULT '',
    `place_of_duty` VARCHAR(191) NOT NULL DEFAULT '',
    `account_number` VARCHAR(191) NOT NULL DEFAULT '',
    `manager_employee_no` VARCHAR(191) NOT NULL DEFAULT '',
    `leave_balance` INTEGER NOT NULL DEFAULT 0,
    `responsible_center` VARCHAR(191) NOT NULL DEFAULT '',
    `permission_departments` VARCHAR(191) NOT NULL DEFAULT '',
    `phone_number` VARCHAR(191) NOT NULL DEFAULT '',
    `gender` VARCHAR(191) NOT NULL DEFAULT '',
    `password_hash` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Active',
    `hod` BOOLEAN NOT NULL DEFAULT false,
    `ceo` BOOLEAN NOT NULL DEFAULT false,
    `must_change_password` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_employee_no_key`(`employee_no`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `portal_requests` (
    `id` VARCHAR(191) NOT NULL,
    `request_no` VARCHAR(191) NOT NULL,
    `request_type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Draft',
    `maker_employee_no` VARCHAR(191) NOT NULL,
    `maker_name` VARCHAR(191) NOT NULL,
    `department_code` VARCHAR(191) NOT NULL DEFAULT '',
    `department_name` VARCHAR(191) NOT NULL DEFAULT '',
    `responsible_center` VARCHAR(191) NOT NULL DEFAULT '',
    `amount` DOUBLE NOT NULL DEFAULT 0,
    `source_document_no` VARCHAR(191) NOT NULL,
    `source_document_entity` VARCHAR(191) NOT NULL,
    `submitted_at` DATETIME(3) NULL,
    `approver_employee_no` VARCHAR(191) NULL,
    `approver_name` VARCHAR(191) NULL,
    `payload` JSON NOT NULL,
    `attachments` JSON NOT NULL,
    `approval_steps` JSON NOT NULL,
    `audit_trail` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `portal_requests_request_no_key`(`request_no`),
    INDEX `portal_requests_request_type_idx`(`request_type`),
    INDEX `portal_requests_status_idx`(`status`),
    INDEX `portal_requests_maker_employee_no_idx`(`maker_employee_no`),
    INDEX `portal_requests_approver_employee_no_idx`(`approver_employee_no`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendance_records` (
    `id` VARCHAR(191) NOT NULL,
    `employee_no` VARCHAR(191) NOT NULL,
    `staff_name` VARCHAR(191) NOT NULL,
    `date` VARCHAR(191) NOT NULL,
    `time_in` VARCHAR(191) NOT NULL,
    `time_out` VARCHAR(191) NULL,
    `hours_worked` VARCHAR(191) NULL,
    `location` VARCHAR(191) NOT NULL DEFAULT '',
    `comments` VARCHAR(191) NOT NULL DEFAULT '',
    `department_code` VARCHAR(191) NOT NULL DEFAULT '',
    `department_name` VARCHAR(191) NOT NULL DEFAULT '',
    `manager_employee_no` VARCHAR(191) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `attendance_records_employee_no_idx`(`employee_no`),
    INDEX `attendance_records_date_idx`(`date`),
    INDEX `attendance_records_department_code_idx`(`department_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payroll_slips` (
    `id` VARCHAR(191) NOT NULL,
    `employee_no` VARCHAR(191) NOT NULL,
    `employee_name` VARCHAR(191) NOT NULL,
    `department_code` VARCHAR(191) NOT NULL DEFAULT '',
    `department_name` VARCHAR(191) NOT NULL DEFAULT '',
    `year` INTEGER NOT NULL,
    `month` VARCHAR(191) NOT NULL,
    `gross_pay` DOUBLE NOT NULL DEFAULT 0,
    `total_deductions` DOUBLE NOT NULL DEFAULT 0,
    `net_pay` DOUBLE NOT NULL DEFAULT 0,
    `lines` JSON NOT NULL,
    `generated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payroll_slips_employee_no_year_month_key`(`employee_no`, `year`, `month`),
    INDEX `payroll_slips_year_month_idx`(`year`, `month`),
    INDEX `payroll_slips_department_code_idx`(`department_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `policy_documents` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `updated_on` VARCHAR(191) NOT NULL DEFAULT '',
    `file_name` VARCHAR(191) NOT NULL,
    `mime_type` VARCHAR(191) NOT NULL DEFAULT 'text/plain',
    `content` LONGTEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `policy_documents_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `performance_reviews` (
    `id` VARCHAR(191) NOT NULL,
    `employee_no` VARCHAR(191) NOT NULL,
    `employee_name` VARCHAR(191) NOT NULL,
    `period` VARCHAR(191) NOT NULL,
    `supervisor_employee_no` VARCHAR(191) NOT NULL DEFAULT '',
    `supervisor_name` VARCHAR(191) NOT NULL DEFAULT '',
    `department_code` VARCHAR(191) NOT NULL DEFAULT '',
    `department_name` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'Open',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `performance_reviews_employee_no_period_key`(`employee_no`, `period`),
    INDEX `performance_reviews_department_code_idx`(`department_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `employee_no` VARCHAR(191) NOT NULL,
    `sector` VARCHAR(191) NOT NULL DEFAULT '',
    `division` VARCHAR(191) NOT NULL DEFAULT '',
    `district` VARCHAR(191) NOT NULL DEFAULT '',
    `marital_status` VARCHAR(191) NOT NULL DEFAULT '',
    `employment_type` VARCHAR(191) NOT NULL DEFAULT '',
    `date_of_join` VARCHAR(191) NOT NULL DEFAULT '',
    `contract_start_date` VARCHAR(191) NOT NULL DEFAULT '',
    `contract_end_date` VARCHAR(191) NOT NULL DEFAULT '',
    `probation_end_date` VARCHAR(191) NOT NULL DEFAULT '',
    `next_of_kin` JSON NOT NULL,
    `employment_history` JSON NOT NULL,
    `qualifications` JSON NOT NULL,
    `assigned_assets` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `employee_profiles_employee_no_key`(`employee_no`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
