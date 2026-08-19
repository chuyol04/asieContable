CREATE TABLE products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  sku VARCHAR(100) NULL,
  name VARCHAR(191) NOT NULL,
  description TEXT NOT NULL,
  unit VARCHAR(64) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 16.00,
  notes TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_company_sku (company_id, sku),
  KEY idx_products_company_status (company_id, is_active),
  KEY idx_products_company_name (company_id, name),
  CONSTRAINT fk_products_company
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE RESTRICT,
  CONSTRAINT chk_products_name CHECK (CHAR_LENGTH(TRIM(name)) > 0),
  CONSTRAINT chk_products_unit CHECK (CHAR_LENGTH(TRIM(unit)) > 0),
  CONSTRAINT chk_products_unit_price CHECK (unit_price >= 0),
  CONSTRAINT chk_products_tax_rate CHECK (tax_rate >= 0 AND tax_rate <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
