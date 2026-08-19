ALTER TABLE products
  DROP CHECK chk_products_tax_rate,
  MODIFY COLUMN tax_rate DECIMAL(5,2) NULL DEFAULT NULL,
  ADD CONSTRAINT chk_products_tax_rate CHECK (tax_rate IS NULL OR (tax_rate >= 0 AND tax_rate <= 100));
