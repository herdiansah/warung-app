-- Preserve the purchase cost at the moment of sale so historical profit
-- remains correct after a product's purchase price changes.
ALTER TABLE `TransactionItem`
  ADD COLUMN `unit_cost` DECIMAL(65, 30) NOT NULL DEFAULT 0;
