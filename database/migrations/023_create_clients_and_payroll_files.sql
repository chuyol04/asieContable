CREATE TABLE clients (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(191) NOT NULL,
  legal_name VARCHAR(255) NULL,
  tax_id VARCHAR(32) NULL,
  user_email VARCHAR(191) NOT NULL,
  firebase_uid VARCHAR(128) NOT NULL,
  phone VARCHAR(32) NULL,
  website VARCHAR(500) NULL,
  notes TEXT NULL,
  drive_folder_id VARCHAR(255) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_clients_user_email (user_email),
  UNIQUE KEY uq_clients_firebase_uid (firebase_uid),
  KEY idx_clients_name (name),
  KEY idx_clients_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE client_payroll_files (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  client_id BIGINT UNSIGNED NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(16) NOT NULL,
  drive_file_id VARCHAR(255) NOT NULL,
  drive_url VARCHAR(1000) NOT NULL,
  payroll_date DATE NULL,
  period_month TINYINT UNSIGNED NOT NULL,
  period_year SMALLINT UNSIGNED NOT NULL,
  notes TEXT NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_client_payroll_drive_file (drive_file_id),
  KEY idx_client_payroll_period (client_id, period_year, period_month),
  KEY idx_client_payroll_active (client_id, is_active),
  CONSTRAINT fk_client_payroll_client
    FOREIGN KEY (client_id) REFERENCES clients(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT chk_client_payroll_type CHECK (file_type IN ('pdf', 'xls', 'xlsx')),
  CONSTRAINT chk_client_payroll_month CHECK (period_month BETWEEN 1 AND 12),
  CONSTRAINT chk_client_payroll_year CHECK (period_year BETWEEN 2000 AND 2200)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
