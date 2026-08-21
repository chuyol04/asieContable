CREATE TABLE client_payroll_companies (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  client_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(191) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_client_payroll_companies_name (client_id, name),
  KEY idx_client_payroll_companies_active (client_id, is_active),
  CONSTRAINT fk_client_payroll_companies_client
    FOREIGN KEY (client_id) REFERENCES clients(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT chk_client_payroll_companies_name CHECK (CHAR_LENGTH(TRIM(name)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO client_payroll_companies (client_id, name)
SELECT id, name FROM clients;

ALTER TABLE client_payroll_files
  ADD COLUMN payroll_company_id BIGINT UNSIGNED NULL AFTER client_id;

UPDATE client_payroll_files AS payroll
INNER JOIN client_payroll_companies AS payroll_company
  ON payroll_company.client_id = payroll.client_id
SET payroll.payroll_company_id = payroll_company.id;

ALTER TABLE client_payroll_files
  MODIFY COLUMN payroll_company_id BIGINT UNSIGNED NOT NULL,
  ADD KEY idx_client_payroll_company_period (payroll_company_id, period_year, period_month),
  ADD CONSTRAINT fk_client_payroll_company
    FOREIGN KEY (payroll_company_id) REFERENCES client_payroll_companies(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT;
