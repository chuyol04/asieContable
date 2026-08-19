ALTER TABLE bank_deposits
  ADD COLUMN company_id BIGINT UNSIGNED NOT NULL AFTER id,
  ADD COLUMN accounting_period_id BIGINT UNSIGNED NOT NULL AFTER company_id,
  CHANGE COLUMN deposited_at deposit_date DATE NOT NULL,
  ADD COLUMN reference VARCHAR(191) NULL AFTER deposit_date,
  ADD COLUMN notes TEXT NULL AFTER reference,
  ADD COLUMN status ENUM('available', 'reconciled') NOT NULL DEFAULT 'available' AFTER notes,
  ADD UNIQUE KEY uq_bank_deposits_account_reference (bank_account_id, reference),
  ADD KEY idx_bank_deposits_company (company_id),
  ADD KEY idx_bank_deposits_period_date (accounting_period_id, deposit_date),
  ADD CONSTRAINT fk_bank_deposits_company
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_bank_deposits_period
    FOREIGN KEY (accounting_period_id) REFERENCES accounting_periods (id) ON DELETE RESTRICT;
