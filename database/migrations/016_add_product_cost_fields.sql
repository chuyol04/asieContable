ALTER TABLE products
  ADD COLUMN purchase_cost DECIMAL(15,2) NULL AFTER unit_price,
  ADD COLUMN default_margin_percentage DECIMAL(5,2) NULL AFTER purchase_cost,
  ADD CONSTRAINT chk_products_purchase_cost CHECK (purchase_cost IS NULL OR purchase_cost >= 0),
  ADD CONSTRAINT chk_products_default_margin CHECK (
    default_margin_percentage IS NULL
    OR (default_margin_percentage >= 0 AND default_margin_percentage <= 100)
  );
