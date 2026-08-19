CREATE TABLE deposit_batches (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  accounting_period_id BIGINT UNSIGNED NOT NULL,
  bank_account_id BIGINT UNSIGNED NOT NULL,
  deposit_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_deposit_batches_company (company_id),
  KEY idx_deposit_batches_period (accounting_period_id),
  KEY idx_deposit_batches_account_date (bank_account_id, deposit_date),
  CONSTRAINT fk_deposit_batches_company
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE RESTRICT,
  CONSTRAINT fk_deposit_batches_period
    FOREIGN KEY (accounting_period_id) REFERENCES accounting_periods (id) ON DELETE RESTRICT,
  CONSTRAINT fk_deposit_batches_account
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE bank_deposits
  ADD COLUMN batch_id BIGINT UNSIGNED NULL AFTER id,
  ADD KEY idx_bank_deposits_batch (batch_id),
  ADD CONSTRAINT fk_bank_deposits_batch
    FOREIGN KEY (batch_id) REFERENCES deposit_batches (id) ON DELETE RESTRICT;
