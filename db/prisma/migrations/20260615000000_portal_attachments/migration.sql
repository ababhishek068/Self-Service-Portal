CREATE TABLE `portal_attachments` (
  `id` VARCHAR(191) NOT NULL,
  `scope` VARCHAR(191) NOT NULL DEFAULT 'request',
  `owner_key` VARCHAR(191) NOT NULL,
  `request_id` VARCHAR(191) NULL,
  `document_no` VARCHAR(191) NOT NULL DEFAULT '',
  `table_id` INTEGER NOT NULL DEFAULT 0,
  `file_name` VARCHAR(191) NOT NULL,
  `mime_type` VARCHAR(191) NOT NULL DEFAULT 'application/octet-stream',
  `size` INTEGER NOT NULL DEFAULT 0,
  `description` VARCHAR(191) NOT NULL DEFAULT '',
  `content_base64` LONGTEXT NOT NULL,
  `uploaded_by` VARCHAR(191) NOT NULL DEFAULT '',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `portal_attachments_request_id_idx`(`request_id`),
  INDEX `portal_attachments_scope_owner_key_idx`(`scope`, `owner_key`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `portal_attachments`
  ADD CONSTRAINT `portal_attachments_request_id_fkey`
  FOREIGN KEY (`request_id`) REFERENCES `portal_requests`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
