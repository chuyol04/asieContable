ALTER TABLE cash_deliveries
  ADD COLUMN stored_amount DECIMAL(15,2) NULL AFTER delivery_date;

UPDATE cash_deliveries
SET stored_amount = amount;

ALTER TABLE cash_deliveries
  MODIFY stored_amount DECIMAL(15,2) NOT NULL,
  ADD CONSTRAINT chk_cash_deliveries_stored_amount CHECK (stored_amount >= amount);
