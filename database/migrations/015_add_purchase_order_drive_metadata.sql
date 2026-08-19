ALTER TABLE purchase_orders
  ADD COLUMN drive_file_id VARCHAR(255) NULL AFTER status,
  ADD COLUMN drive_file_name VARCHAR(255) NULL AFTER drive_file_id,
  ADD COLUMN drive_url VARCHAR(2048) NULL AFTER drive_file_name,
  ADD COLUMN drive_folder_id VARCHAR(255) NULL AFTER drive_url,
  ADD COLUMN drive_uploaded_at DATETIME NULL AFTER drive_folder_id,
  ADD COLUMN sent_to_accounting_at DATETIME NULL AFTER drive_uploaded_at,
  ADD UNIQUE KEY uq_purchase_orders_drive_file_id (drive_file_id);
