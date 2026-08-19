ALTER TABLE accounting_periods
  DROP INDEX uq_accounting_periods_company_month_year,
  ADD COLUMN archived_at DATETIME NULL AFTER notes,
  ADD COLUMN active_record TINYINT
    GENERATED ALWAYS AS (CASE WHEN archived_at IS NULL THEN 1 ELSE NULL END) STORED AFTER archived_at,
  ADD UNIQUE KEY uq_accounting_periods_active_company_month_year (company_id, month, year, active_record),
  ADD KEY idx_accounting_periods_archived (archived_at);
