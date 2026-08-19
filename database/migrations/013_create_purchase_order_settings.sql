CREATE TABLE purchase_order_settings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  logo_url VARCHAR(255) NULL,
  order_prefix VARCHAR(20) NULL,
  next_order_number BIGINT UNSIGNED NOT NULL DEFAULT 1,
  default_tax_rate DECIMAL(5,2) NOT NULL DEFAULT 16.00,
  header_text TEXT NULL,
  footer_text TEXT NULL,
  left_signature_text VARCHAR(191) NOT NULL DEFAULT 'ELABORADO POR',
  right_signature_text VARCHAR(191) NOT NULL DEFAULT 'ACEPTADA, FIRMA Y/O SELLO Y FECHA',
  default_notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_purchase_order_settings_company (company_id),
  CONSTRAINT fk_purchase_order_settings_company
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE RESTRICT,
  CONSTRAINT chk_purchase_order_settings_next_number CHECK (next_order_number > 0),
  CONSTRAINT chk_purchase_order_settings_tax_rate CHECK (default_tax_rate >= 0 AND default_tax_rate <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
