-- CreateTable
CREATE TABLE `DailyClosing` (
    `id` VARCHAR(191) NOT NULL,
    `date` VARCHAR(191) NOT NULL,
    `expected_cash` DECIMAL(65, 30) NOT NULL,
    `actual_cash` DECIMAL(65, 30) NOT NULL,
    `difference` DECIMAL(65, 30) NOT NULL,
    `note` VARCHAR(191) NULL,
    `closed_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DailyClosing_date_key`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DailyClosing` ADD CONSTRAINT `DailyClosing_closed_by_fkey` FOREIGN KEY (`closed_by`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
