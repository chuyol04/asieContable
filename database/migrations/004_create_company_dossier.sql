ALTER TABLE companies
  ADD COLUMN fiscal_address TEXT NULL AFTER tax_id,
  ADD COLUMN phone VARCHAR(32) NULL AFTER fiscal_address,
  ADD COLUMN email VARCHAR(191) NULL AFTER phone,
  ADD COLUMN website VARCHAR(255) NULL AFTER email,
  ADD COLUMN incorporation_date DATE NULL AFTER website,
  ADD COLUMN notary VARCHAR(191) NULL AFTER incorporation_date,
  ADD COLUMN deed_number VARCHAR(100) NULL AFTER notary,
  ADD COLUMN observations TEXT NULL AFTER deed_number;

UPDATE companies
SET observations = description
WHERE observations IS NULL AND description IS NOT NULL;

CREATE TABLE company_representatives (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  full_name VARCHAR(191) NOT NULL,
  position VARCHAR(191) NOT NULL,
  email VARCHAR(191) NULL,
  phone VARCHAR(32) NULL,
  observations TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_company_representatives_company (company_id),
  CONSTRAINT fk_company_representatives_company
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE RESTRICT,
  CONSTRAINT chk_company_representatives_name
    CHECK (CHAR_LENGTH(TRIM(full_name)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE company_documents (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  document_type VARCHAR(64) NOT NULL,
  document_name VARCHAR(191) NOT NULL,
  document_date DATE NOT NULL,
  expiration_date DATE NULL,
  external_url VARCHAR(2048) NULL,
  observations TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_company_documents_company (company_id),
  CONSTRAINT fk_company_documents_company
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE RESTRICT,
  CONSTRAINT chk_company_documents_name
    CHECK (CHAR_LENGTH(TRIM(document_name)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE bank_accounts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  bank_id BIGINT UNSIGNED NOT NULL,
  alias VARCHAR(191) NOT NULL,
  account_number VARCHAR(64) NOT NULL,
  clabe CHAR(18) NOT NULL,
  branch VARCHAR(100) NOT NULL,
  city VARCHAR(100) NULL,
  currency CHAR(3) NOT NULL DEFAULT 'MXN',
  holder VARCHAR(191) NOT NULL,
  observations TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bank_accounts_bank_number (bank_id, account_number),
  UNIQUE KEY uq_bank_accounts_clabe (clabe),
  KEY idx_bank_accounts_company (company_id),
  CONSTRAINT fk_bank_accounts_company
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE RESTRICT,
  CONSTRAINT fk_bank_accounts_bank
    FOREIGN KEY (bank_id) REFERENCES banks (id) ON DELETE RESTRICT,
  CONSTRAINT chk_bank_accounts_alias CHECK (CHAR_LENGTH(TRIM(alias)) > 0),
  CONSTRAINT chk_bank_accounts_clabe CHECK (clabe REGEXP '^[0-9]{18}$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
