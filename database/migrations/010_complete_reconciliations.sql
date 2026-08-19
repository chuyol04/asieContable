ALTER TABLE reconciliations
  DROP CHECK chk_reconciliations_difference,
  ADD COLUMN status ENUM('confirmed') NOT NULL DEFAULT 'confirmed' AFTER difference,
  ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER confirmed_at,
  ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;
