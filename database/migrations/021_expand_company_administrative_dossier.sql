CREATE TABLE company_contacts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  contact_type ENUM('email', 'phone') NOT NULL,
  contact_value VARCHAR(191) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_company_contacts_value (company_id, contact_type, contact_value),
  KEY idx_company_contacts_company (company_id, contact_type, is_active),
  CONSTRAINT fk_company_contacts_company
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE RESTRICT,
  CONSTRAINT chk_company_contacts_value CHECK (CHAR_LENGTH(TRIM(contact_value)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO company_contacts (company_id, contact_type, contact_value, is_primary)
SELECT id, 'email', TRIM(email), TRUE FROM companies WHERE email IS NOT NULL AND TRIM(email) <> '';

INSERT IGNORE INTO company_contacts (company_id, contact_type, contact_value, is_primary)
SELECT id, 'phone', TRIM(phone), TRUE FROM companies WHERE phone IS NOT NULL AND TRIM(phone) <> '';

ALTER TABLE company_representatives
  ADD COLUMN tax_id VARCHAR(32) NULL AFTER position,
  ADD COLUMN curp VARCHAR(32) NULL AFTER tax_id;

ALTER TABLE company_documents
  MODIFY COLUMN document_date DATE NULL,
  ADD COLUMN representative_id BIGINT UNSIGNED NULL AFTER company_id,
  ADD COLUMN file_id VARCHAR(255) NULL AFTER external_url,
  ADD COLUMN file_name VARCHAR(255) NULL AFTER file_id,
  ADD COLUMN file_url VARCHAR(2048) NULL AFTER file_name,
  ADD COLUMN storage_provider VARCHAR(32) NULL AFTER file_url,
  ADD COLUMN uploaded_at TIMESTAMP NULL AFTER storage_provider,
  ADD KEY idx_company_documents_representative (representative_id),
  ADD CONSTRAINT fk_company_documents_representative
    FOREIGN KEY (representative_id) REFERENCES company_representatives (id) ON DELETE SET NULL;
