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
CREATE DATABASE IF NOT EXISTS `kasirwarung_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
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

-- Dumping data for table kasirwarung_db.product: ~4 rows (approximately)
INSERT INTO `product` (`id`, `name`, `category`, `purchase_price`, `selling_price`, `stock`, `unit`, `is_active`, `created_at`) VALUES
	('0430664e-272d-45a2-9f2a-c9d25675e36c', 'Kopi Kapal Api', 'Minuman', 1000.000000000000000000000000000000, 1500.000000000000000000000000000000, 100, 'BKS', 1, '2026-03-09 15:38:53.207'),
	('4abf31a1-7ae3-430b-bae7-dd74dc34d6f1', 'Telur Ayam 1kg', 'Sembako', 26000.000000000000000000000000000000, 29000.000000000000000000000000000000, 15, 'KG', 1, '2026-03-09 15:38:53.205'),
	('57e08c90-e4f2-47b6-bbe6-a345394a370d', 'Indomie Goreng', 'Makanan', 2500.000000000000000000000000000000, 3500.000000000000000000000000000000, 50, 'BKS', 1, '2026-03-09 15:38:53.192'),
	('8b7983b4-d8dc-4089-b105-8cac3666f5d1', 'Beras Mentik 5kg', 'Sembako', 60000.000000000000000000000000000000, 65000.000000000000000000000000000000, 10, 'SAK', 1, '2026-03-09 15:38:53.201');

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

-- Dumping data for table kasirwarung_db.user: ~1 rows (approximately)
INSERT INTO `user` (`id`, `name`, `email`, `password_hash`, `created_at`) VALUES
	('fb4c28de-89fc-4902-b2c1-329408524286', 'Owner', 'admin@warung.com', '123456', '2026-03-09 15:38:53.165');

-- Dumping structure for table kasirwarung_db._prisma_migrations
CREATE TABLE IF NOT EXISTS `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table kasirwarung_db._prisma_migrations: ~1 rows (approximately)
INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
	('f3c2a634-a693-4130-bc93-35689354ea4f', 'b5b1497f412cf7700f0753b080efae8c772ea97d85d93359d716bab946378229', '2026-03-09 15:35:50.803', '20260309153550_init_schema', NULL, NULL, '2026-03-09 15:35:50.532', 1);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
