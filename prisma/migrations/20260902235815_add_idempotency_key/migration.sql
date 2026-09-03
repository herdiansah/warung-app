/*
  Warnings:

  - A unique constraint covering the columns `[idempotency_key]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Transaction` ADD COLUMN `idempotency_key` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Transaction_idempotency_key_key` ON `Transaction`(`idempotency_key`);
