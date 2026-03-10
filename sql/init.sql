-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.0.30 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.1.0.6537
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for kasirwarung_db
CREATE DATABASE IF NOT EXISTS `kasirwarung_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `kasirwarung_db`;

-- Dumping structure for table kasirwarung_db.product
CREATE TABLE IF NOT EXISTS `product` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `purchase_price` decimal(65,30) NOT NULL,
  `selling_price` decimal(65,30) NOT NULL,
  `stock` int NOT NULL DEFAULT '0',
  `unit` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Product_name_idx` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table kasirwarung_db.product: ~2 rows (approximately)
INSERT INTO `product` (`id`, `name`, `category`, `purchase_price`, `selling_price`, `stock`, `unit`, `is_active`, `created_at`) VALUES
	('4856db6a-6057-4c93-972f-95867adf55cb', 'Kopi Kapal Api', 'Minuman', 1000.000000000000000000000000000000, 1500.000000000000000000000000000000, 99, 'BKS', 0, '2026-03-10 15:23:05.710'),
	('6fe3520c-95a8-4ece-b169-ef9e6cbf2045', 'Beras Mentik 5kg', 'Sembako', 60000.000000000000000000000000000000, 67000.000000000000000000000000000000, 10, 'SAK', 1, '2026-03-10 15:23:05.707'),
	('77bbce5b-24ec-49b3-9351-1c8d110d6212', 'Telur Bebek', 'Sembako', 10000.000000000000000000000000000000, 12000.000000000000000000000000000000, 9, 'kg', 1, '2026-03-10 15:30:57.572'),
	('9281e27b-e040-4fdc-a44d-bcf397dcae40', 'Telur Puyuh 1kg', 'Sembako', 10000.000000000000000000000000000000, 11000.000000000000000000000000000000, 9, 'kg', 1, '2026-03-10 15:36:29.747'),
	('a020d8db-388b-468b-bcf0-1f3e62c0379f', 'Kopi Kapal Api', 'Sembako', 2500.000000000000000000000000000000, 3500.000000000000000000000000000000, 10, 'pcs', 1, '2026-03-10 16:14:46.232'),
	('d8346483-64d2-4dd9-b8bf-b5a6b536c40e', 'Indomie Goreng', 'Makanan', 2500.000000000000000000000000000000, 3500.000000000000000000000000000000, 47, 'BKS', 0, '2026-03-10 15:23:05.703'),
	('ebdd439e-0dcb-478a-be64-a8f5bfab07d4', 'Telur Ayam 1kg', 'Sembako', 26000.000000000000000000000000000000, 29000.000000000000000000000000000000, 14, 'KG', 1, '2026-03-10 15:23:05.709');

-- Dumping structure for table kasirwarung_db.setting
CREATE TABLE IF NOT EXISTS `setting` (
  `key` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table kasirwarung_db.setting: ~2 rows (approximately)
INSERT INTO `setting` (`key`, `value`, `updated_at`) VALUES
	('low_stock_threshold', '5', '2026-03-10 16:10:23.867'),
	('min_margin_percent', '10', '2026-03-10 16:10:23.907');

-- Dumping structure for table kasirwarung_db.stocklog
CREATE TABLE IF NOT EXISTS `stocklog` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `change_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `qty` int NOT NULL,
  `stock_before` int NOT NULL,
  `stock_after` int NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `StockLog_product_id_fkey` (`product_id`),
  CONSTRAINT `StockLog_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table kasirwarung_db.stocklog: ~0 rows (approximately)
INSERT INTO `stocklog` (`id`, `product_id`, `change_type`, `qty`, `stock_before`, `stock_after`, `created_at`) VALUES
	('07b733bf-2a46-4e8b-82a7-e3f9326c5305', '4856db6a-6057-4c93-972f-95867adf55cb', 'delete_sale_restore', 1, 98, 99, '2026-03-10 16:12:14.205'),
	('0df7a14e-7ad8-40fd-bf0c-a192b1e1fa68', '9281e27b-e040-4fdc-a44d-bcf397dcae40', 'initial_stock', 10, 0, 10, '2026-03-10 15:36:29.750'),
	('0f662854-1606-4c1c-a9c1-59a5f9feeb55', '6fe3520c-95a8-4ece-b169-ef9e6cbf2045', 'sale', 2, 9, 7, '2026-03-10 15:39:47.415'),
	('1216b43c-7f9b-48e2-aded-5c9701eab316', 'ebdd439e-0dcb-478a-be64-a8f5bfab07d4', 'sale', 1, 11, 10, '2026-03-10 15:55:29.606'),
	('13bf7cea-1832-433e-8030-7b68f3562479', '6fe3520c-95a8-4ece-b169-ef9e6cbf2045', 'delete_sale_restore', 1, 7, 8, '2026-03-10 15:40:05.178'),
	('25b1c8d0-97df-46f9-b5d3-8d3fc1fdcd0d', '77bbce5b-24ec-49b3-9351-1c8d110d6212', 'sale', 1, 10, 9, '2026-03-10 16:08:24.152'),
	('5cee75a4-a5f2-42f4-83c7-f77d9c3196d1', '6fe3520c-95a8-4ece-b169-ef9e6cbf2045', 'delete_sale_restore', 2, 8, 10, '2026-03-10 16:12:14.211'),
	('7ef7253c-ae7a-41b6-acc1-52fc7e46a1a3', '6fe3520c-95a8-4ece-b169-ef9e6cbf2045', 'sale', 1, 10, 9, '2026-03-10 15:38:38.701'),
	('8d4130b2-113c-43fb-9788-beb50f7ab0e5', '77bbce5b-24ec-49b3-9351-1c8d110d6212', 'initial_stock', 10, 0, 10, '2026-03-10 15:30:57.575'),
	('9806909c-93e7-47d0-9984-c7dc211eb1f9', 'd8346483-64d2-4dd9-b8bf-b5a6b536c40e', 'sale', 3, 50, 47, '2026-03-10 15:55:29.595'),
	('98f68d78-0f0c-4d90-a5d4-0a14a79fcb05', '9281e27b-e040-4fdc-a44d-bcf397dcae40', 'sale', 1, 10, 9, '2026-03-10 16:08:24.144'),
	('9b3e53c2-c4d9-4ed2-861b-be8c412db818', 'ebdd439e-0dcb-478a-be64-a8f5bfab07d4', 'sale', 4, 15, 11, '2026-03-10 15:39:47.420'),
	('a1ac5af8-2fa6-4096-aff0-f0a4e8f15614', '4856db6a-6057-4c93-972f-95867adf55cb', 'sale', 1, 99, 98, '2026-03-10 15:55:29.601'),
	('de2de885-69e3-4e72-bf8c-74ef6c3f9458', 'a020d8db-388b-468b-bcf0-1f3e62c0379f', 'initial_stock', 10, 0, 10, '2026-03-10 16:14:46.233'),
	('e6c64f08-e7a0-4c7e-9242-2fa8f1b246a9', 'ebdd439e-0dcb-478a-be64-a8f5bfab07d4', 'delete_sale_restore', 4, 10, 14, '2026-03-10 16:12:14.215'),
	('ea9101d8-2f31-4533-846b-846d311e2823', '4856db6a-6057-4c93-972f-95867adf55cb', 'sale', 1, 100, 99, '2026-03-10 15:39:47.410');

-- Dumping structure for table kasirwarung_db.transaction
CREATE TABLE IF NOT EXISTS `transaction` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transaction_date` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `total_amount` decimal(65,30) NOT NULL,
  `created_by` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Transaction_transaction_date_idx` (`transaction_date`),
  KEY `Transaction_created_by_fkey` (`created_by`),
  CONSTRAINT `Transaction_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table kasirwarung_db.transaction: ~0 rows (approximately)
INSERT INTO `transaction` (`id`, `transaction_date`, `total_amount`, `created_by`, `created_at`) VALUES
	('45adc16e-a15d-4053-be63-b0b5991d7654', '2026-03-10 15:55:29.608', 41000.000000000000000000000000000000, '155b0c33-c7d6-4201-8d38-bc2132bc9029', '2026-03-10 15:55:29.608'),
	('82721dbd-e2e6-4d09-87ed-43bef8f2ca98', '2026-03-10 16:08:24.155', 23000.000000000000000000000000000000, '155b0c33-c7d6-4201-8d38-bc2132bc9029', '2026-03-10 16:08:24.155');

-- Dumping structure for table kasirwarung_db.transactionitem
CREATE TABLE IF NOT EXISTS `transactionitem` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transaction_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `qty` int NOT NULL,
  `price` decimal(65,30) NOT NULL,
  `subtotal` decimal(65,30) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `TransactionItem_product_id_idx` (`product_id`),
  KEY `TransactionItem_transaction_id_fkey` (`transaction_id`),
  CONSTRAINT `TransactionItem_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `TransactionItem_transaction_id_fkey` FOREIGN KEY (`transaction_id`) REFERENCES `transaction` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table kasirwarung_db.transactionitem: ~0 rows (approximately)
INSERT INTO `transactionitem` (`id`, `transaction_id`, `product_id`, `product_name`, `qty`, `price`, `subtotal`) VALUES
	('010e940c-c450-4827-ad08-fa3318be7c7f', '82721dbd-e2e6-4d09-87ed-43bef8f2ca98', '9281e27b-e040-4fdc-a44d-bcf397dcae40', 'Telur Puyuh 1kg', 1, 11000.000000000000000000000000000000, 11000.000000000000000000000000000000),
	('1cfbbea8-8492-4a84-abc8-1d7eed542d51', '82721dbd-e2e6-4d09-87ed-43bef8f2ca98', '77bbce5b-24ec-49b3-9351-1c8d110d6212', 'Telur Bebek', 1, 12000.000000000000000000000000000000, 12000.000000000000000000000000000000),
	('2067e1c9-1984-4d0b-93b9-cb33b48df72b', '45adc16e-a15d-4053-be63-b0b5991d7654', 'ebdd439e-0dcb-478a-be64-a8f5bfab07d4', 'Telur Ayam 1kg', 1, 29000.000000000000000000000000000000, 29000.000000000000000000000000000000),
	('90a1f7d6-be7a-4836-b3e7-dc3a97c61bf2', '45adc16e-a15d-4053-be63-b0b5991d7654', 'd8346483-64d2-4dd9-b8bf-b5a6b536c40e', 'Indomie Goreng', 3, 3500.000000000000000000000000000000, 10500.000000000000000000000000000000),
	('c9f6b597-0f6e-4bce-9a60-a3a233806718', '45adc16e-a15d-4053-be63-b0b5991d7654', '4856db6a-6057-4c93-972f-95867adf55cb', 'Kopi Kapal Api', 1, 1500.000000000000000000000000000000, 1500.000000000000000000000000000000);

-- Dumping structure for table kasirwarung_db.user
CREATE TABLE IF NOT EXISTS `user` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table kasirwarung_db.user: ~0 rows (approximately)
INSERT INTO `user` (`id`, `name`, `email`, `password_hash`, `created_at`) VALUES
	('155b0c33-c7d6-4201-8d38-bc2132bc9029', 'Owner', 'admin@warung.com', '123456', '2026-03-10 15:23:05.697');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
