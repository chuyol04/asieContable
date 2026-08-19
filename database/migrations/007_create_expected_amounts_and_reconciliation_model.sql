CREATE TABLE expected_amount_imports (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  accounting_period_id BIGINT UNSIGNED NOT NULL,
  source_name VARCHAR(255) NULL,
  amount_column VARCHAR(191) NOT NULL,
  row_count INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_expected_amount_imports_period (accounting_period_id),
  CONSTRAINT fk_expected_amount_imports_period
    FOREIGN KEY (accounting_period_id) REFERENCES accounting_periods (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE expected_amounts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  accounting_period_id BIGINT UNSIGNED NOT NULL,
  import_id BIGINT UNSIGNED NOT NULL,
  source_row_number INT UNSIGNED NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  reference_data JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_expected_amounts_import_row (import_id, source_row_number),
  KEY idx_expected_amounts_period_amount (accounting_period_id, amount),
  CONSTRAINT fk_expected_amounts_period
    FOREIGN KEY (accounting_period_id) REFERENCES accounting_periods (id) ON DELETE RESTRICT,
  CONSTRAINT fk_expected_amounts_import
    FOREIGN KEY (import_id) REFERENCES expected_amount_imports (id) ON DELETE RESTRICT,
  CONSTRAINT chk_expected_amounts_positive CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Estructura únicamente para la futura importación/captura bancaria; esta fase no agrega UI de depósitos.
CREATE TABLE bank_deposits (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  bank_account_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  deposited_at DATE NULL,
  reference_data JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_bank_deposits_account_amount (bank_account_id, amount),
  CONSTRAINT fk_bank_deposits_account
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts (id) ON DELETE RESTRICT,
  CONSTRAINT chk_bank_deposits_positive CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reconciliations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  expected_amount_id BIGINT UNSIGNED NOT NULL,
  bank_deposit_id BIGINT UNSIGNED NOT NULL,
  match_type ENUM('exact', 'similar', 'manual') NOT NULL,
  expected_amount DECIMAL(15,2) NOT NULL,
  deposit_amount DECIMAL(15,2) NOT NULL,
  difference DECIMAL(15,2) NOT NULL,
  confirmed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reconciliations_expected_amount (expected_amount_id),
  UNIQUE KEY uq_reconciliations_bank_deposit (bank_deposit_id),
  CONSTRAINT fk_reconciliations_expected_amount
    FOREIGN KEY (expected_amount_id) REFERENCES expected_amounts (id) ON DELETE RESTRICT,
  CONSTRAINT fk_reconciliations_bank_deposit
    FOREIGN KEY (bank_deposit_id) REFERENCES bank_deposits (id) ON DELETE RESTRICT,
  CONSTRAINT chk_reconciliations_difference CHECK (difference >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO system_settings (setting_key, setting_value)
VALUES ('reconciliation_similar_tolerance', '0.10');
