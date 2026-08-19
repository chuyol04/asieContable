CREATE TABLE cash_deliveries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  accounting_period_id BIGINT UNSIGNED NOT NULL,
  delivery_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  delivered_by VARCHAR(191) NOT NULL,
  received_by VARCHAR(191) NOT NULL,
  notes TEXT NULL,
  status ENUM('pending_signature', 'confirmed', 'cancelled') NOT NULL DEFAULT 'pending_signature',
  signature_reference VARCHAR(255) NULL,
  signed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_cash_deliveries_company (company_id),
  KEY idx_cash_deliveries_period_status (accounting_period_id, status),
  CONSTRAINT fk_cash_deliveries_company
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE RESTRICT,
  CONSTRAINT fk_cash_deliveries_period
    FOREIGN KEY (accounting_period_id) REFERENCES accounting_periods (id) ON DELETE RESTRICT,
  CONSTRAINT chk_cash_deliveries_amount CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
