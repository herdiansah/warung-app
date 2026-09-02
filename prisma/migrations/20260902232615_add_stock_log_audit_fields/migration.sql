-- AlterTable
ALTER TABLE `StockLog` ADD COLUMN `actor` VARCHAR(191) NULL,
    ADD COLUMN `reason` VARCHAR(191) NULL,
    ADD COLUMN `reference_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `TransactionItem` ALTER COLUMN `unit_cost` DROP DEFAULT;

-- CreateTable
CREATE TABLE `Setting` (
    `key` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
