CREATE TABLE suppliers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  legal_name VARCHAR(255) NOT NULL,
  tax_id VARCHAR(32) NULL,
  fiscal_address TEXT NULL,
  phone VARCHAR(32) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_suppliers_company_name (company_id, legal_name),
  UNIQUE KEY uq_suppliers_company_tax_id (company_id, tax_id),
  KEY idx_suppliers_company_status (company_id, is_active),
  CONSTRAINT fk_suppliers_company
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE RESTRICT,
  CONSTRAINT chk_suppliers_legal_name CHECK (CHAR_LENGTH(TRIM(legal_name)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
