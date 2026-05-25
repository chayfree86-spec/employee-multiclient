-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 12, 2026 at 07:42 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `employee`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `name`, `email`, `password`, `status`, `created_at`) VALUES
(1, 'Super Admin', 'admin@gmail.com', '$2y$10$4dN61oCOsO./GQDdsxSFEOH8bNeGynQBRtlajGY61Ih/elWWAZ7eu', 1, '2026-03-09 07:19:42');

-- --------------------------------------------------------

--
-- Table structure for table `advances`
--

CREATE TABLE `advances` (
  `id` int(10) UNSIGNED NOT NULL,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `reason` text DEFAULT NULL,
  `date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `advance_overtime_fine`
--

CREATE TABLE `advance_overtime_fine` (
  `id` int(10) UNSIGNED NOT NULL,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `date` date NOT NULL,
  `type` enum('advance','advance_paid','fine','overtime','deduction') NOT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `repay_months` tinyint(1) UNSIGNED NOT NULL DEFAULT 1,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `advance_overtime_fine`
--

INSERT INTO `advance_overtime_fine` (`id`, `employee_id`, `date`, `type`, `amount`, `repay_months`, `notes`, `created_at`) VALUES
(1, 6, '2026-02-08', 'advance', 270.00, 1, 'online payment saman ka', '2026-02-08 10:33:18'),
(5, 10, '2026-02-14', 'advance', 1000.00, 1, 'cash', '2026-02-15 06:24:37'),
(6, 4, '2026-02-13', 'advance', 2000.00, 1, 'cash', '2026-02-15 06:25:24'),
(7, 14, '2026-02-15', 'advance', 233.00, 1, 'online saman', '2026-02-15 06:27:08'),
(8, 8, '2026-02-16', 'advance', 1000.00, 1, 'cash', '2026-02-16 16:38:45'),
(9, 12, '2024-09-27', 'advance', 10000.00, 1, '', '2026-02-19 17:21:06'),
(10, 12, '2024-09-30', 'advance', 15000.00, 1, '', '2026-02-19 17:21:49'),
(11, 12, '2024-10-19', 'advance', 10000.00, 1, '', '2026-02-19 17:22:27'),
(12, 3, '2026-02-21', 'fine', 266.00, 1, 'baat nahi sunta hai', '2026-02-21 12:36:31'),
(25, 3, '2026-02-22', 'deduction', 1000.00, 1, 'cash', '2026-02-22 21:16:27'),
(26, 3, '2026-02-22', 'advance', 1000.00, 1, '', '2026-03-01 11:31:35'),
(27, 3, '2026-02-01', 'advance_paid', 1000.00, 1, 'payroll_id:63', '2026-03-01 11:34:46'),
(28, 4, '2026-02-01', 'advance_paid', 2000.00, 1, 'payroll_id:65', '2026-03-01 11:42:04'),
(29, 6, '2026-02-01', 'advance_paid', 270.00, 1, 'payroll_id:67', '2026-03-01 11:47:14'),
(30, 10, '2026-02-01', 'advance_paid', 1000.00, 1, 'payroll_id:71', '2026-03-01 11:51:32'),
(31, 3, '2026-03-07', 'advance', 30.00, 1, 'mana karene ke baad bhi ek maggie ka order liye the customer bhag gaya ', '2026-03-08 15:14:39'),
(32, 11, '2026-03-07', 'deduction', 350.00, 1, 'horlicks online order payment by admin', '2026-03-08 15:16:51'),
(33, 9, '2026-03-08', 'deduction', 100.00, 1, 'paneer chis sandwich extra banai hai aur use kha gai hai', '2026-03-08 16:20:49');

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

CREATE TABLE `attendance` (
  `id` int(10) UNSIGNED NOT NULL,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `date` date NOT NULL,
  `status` enum('present','absent','half_day','holiday') NOT NULL,
  `source` enum('manual','weekend_rule') NOT NULL DEFAULT 'manual',
  `check_in` time DEFAULT NULL,
  `check_out` time DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `attendance`
--

INSERT INTO `attendance` (`id`, `employee_id`, `date`, `status`, `source`, `check_in`, `check_out`, `created_at`) VALUES
(1, 2, '2026-02-08', 'present', 'manual', NULL, NULL, '2026-02-08 10:14:54'),
(2, 3, '2026-02-08', 'absent', 'manual', NULL, NULL, '2026-02-08 10:14:54'),
(3, 4, '2026-02-08', 'present', 'manual', NULL, NULL, '2026-02-08 10:14:54'),
(4, 5, '2026-02-08', 'present', 'manual', NULL, NULL, '2026-02-08 10:14:54'),
(5, 6, '2026-02-08', 'present', 'manual', NULL, NULL, '2026-02-08 10:14:55'),
(6, 7, '2026-02-08', 'present', 'manual', NULL, NULL, '2026-02-08 10:14:55'),
(7, 8, '2026-02-08', 'present', 'manual', NULL, NULL, '2026-02-08 10:14:55'),
(8, 9, '2026-02-08', 'present', 'manual', NULL, NULL, '2026-02-08 10:14:55'),
(9, 10, '2026-02-08', 'present', 'manual', NULL, NULL, '2026-02-08 10:14:55'),
(10, 11, '2026-02-08', 'present', 'manual', NULL, NULL, '2026-02-08 10:14:55'),
(11, 12, '2026-02-08', 'present', 'manual', NULL, NULL, '2026-02-08 10:14:55'),
(12, 13, '2026-02-08', 'present', 'manual', NULL, NULL, '2026-02-08 10:14:55'),
(13, 14, '2026-02-08', 'present', 'manual', NULL, NULL, '2026-02-08 10:14:55'),
(14, 15, '2026-02-08', 'present', 'manual', NULL, NULL, '2026-02-08 10:14:56'),
(15, 16, '2026-02-08', 'present', 'manual', NULL, NULL, '2026-02-08 10:14:56'),
(16, 17, '2026-02-08', 'present', 'manual', NULL, NULL, '2026-02-08 10:14:56'),
(17, 18, '2026-02-08', 'present', 'manual', NULL, NULL, '2026-02-08 10:14:56'),
(18, 2, '2026-02-07', 'present', 'manual', NULL, NULL, '2026-02-08 10:25:03'),
(19, 3, '2026-02-07', 'present', 'manual', NULL, NULL, '2026-02-08 10:25:03'),
(20, 4, '2026-02-07', 'present', 'manual', NULL, NULL, '2026-02-08 10:25:04'),
(21, 5, '2026-02-07', 'present', 'manual', NULL, NULL, '2026-02-08 10:25:04'),
(22, 6, '2026-02-07', 'present', 'manual', NULL, NULL, '2026-02-08 10:25:04'),
(23, 7, '2026-02-07', 'present', 'manual', NULL, NULL, '2026-02-08 10:25:04'),
(24, 8, '2026-02-07', 'present', 'manual', NULL, NULL, '2026-02-08 10:25:04'),
(25, 9, '2026-02-07', 'present', 'manual', NULL, NULL, '2026-02-08 10:25:04'),
(26, 10, '2026-02-07', 'present', 'manual', NULL, NULL, '2026-02-08 10:25:05'),
(27, 11, '2026-02-07', 'present', 'manual', NULL, NULL, '2026-02-08 10:25:05'),
(28, 12, '2026-02-07', 'present', 'manual', NULL, NULL, '2026-02-08 10:25:05'),
(29, 13, '2026-02-07', 'present', 'manual', NULL, NULL, '2026-02-08 10:25:05'),
(30, 14, '2026-02-07', 'present', 'manual', NULL, NULL, '2026-02-08 10:25:05'),
(31, 15, '2026-02-07', 'present', 'manual', NULL, NULL, '2026-02-08 10:25:05'),
(32, 16, '2026-02-07', 'present', 'manual', NULL, NULL, '2026-02-08 10:25:06'),
(33, 17, '2026-02-07', 'present', 'manual', NULL, NULL, '2026-02-08 10:25:06'),
(34, 18, '2026-02-07', 'present', 'manual', NULL, NULL, '2026-02-08 10:25:06'),
(35, 2, '2026-02-06', 'present', 'manual', NULL, NULL, '2026-02-08 10:28:53'),
(36, 3, '2026-02-06', 'present', 'manual', NULL, NULL, '2026-02-08 10:28:54'),
(37, 4, '2026-02-06', 'present', 'manual', NULL, NULL, '2026-02-08 10:28:54'),
(38, 5, '2026-02-06', 'absent', 'manual', NULL, NULL, '2026-02-08 10:28:54'),
(39, 6, '2026-02-06', 'present', 'manual', NULL, NULL, '2026-02-08 10:28:54'),
(40, 7, '2026-02-06', 'present', 'manual', NULL, NULL, '2026-02-08 10:28:54'),
(41, 8, '2026-02-06', 'present', 'manual', NULL, NULL, '2026-02-08 10:28:54'),
(42, 9, '2026-02-06', 'present', 'manual', NULL, NULL, '2026-02-08 10:28:54'),
(43, 10, '2026-02-06', 'present', 'manual', NULL, NULL, '2026-02-08 10:28:54'),
(44, 11, '2026-02-06', 'present', 'manual', NULL, NULL, '2026-02-08 10:28:55'),
(45, 12, '2026-02-06', 'present', 'manual', NULL, NULL, '2026-02-08 10:28:55'),
(46, 13, '2026-02-06', 'present', 'manual', NULL, NULL, '2026-02-08 10:28:55'),
(47, 14, '2026-02-06', 'present', 'manual', NULL, NULL, '2026-02-08 10:28:55'),
(48, 15, '2026-02-06', 'present', 'manual', NULL, NULL, '2026-02-08 10:28:55'),
(49, 16, '2026-02-06', 'present', 'manual', NULL, NULL, '2026-02-08 10:28:55'),
(50, 17, '2026-02-06', 'present', 'manual', NULL, NULL, '2026-02-08 10:28:55'),
(51, 18, '2026-02-06', 'present', 'manual', NULL, NULL, '2026-02-08 10:28:55'),
(52, 2, '2026-02-05', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:01'),
(53, 3, '2026-02-05', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:01'),
(54, 4, '2026-02-05', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:01'),
(55, 5, '2026-02-05', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:01'),
(56, 6, '2026-02-05', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:01'),
(57, 7, '2026-02-05', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:01'),
(58, 8, '2026-02-05', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:02'),
(59, 9, '2026-02-05', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:02'),
(60, 10, '2026-02-05', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:02'),
(61, 11, '2026-02-05', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:02'),
(62, 12, '2026-02-05', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:02'),
(63, 13, '2026-02-05', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:02'),
(64, 14, '2026-02-05', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:02'),
(65, 15, '2026-02-05', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:02'),
(66, 16, '2026-02-05', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:02'),
(67, 17, '2026-02-05', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:02'),
(68, 18, '2026-02-05', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:03'),
(69, 2, '2026-02-04', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:07'),
(70, 3, '2026-02-04', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:07'),
(71, 4, '2026-02-04', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:07'),
(72, 5, '2026-02-04', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:08'),
(73, 6, '2026-02-04', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:08'),
(74, 7, '2026-02-04', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:08'),
(75, 8, '2026-02-04', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:08'),
(76, 9, '2026-02-04', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:08'),
(77, 10, '2026-02-04', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:08'),
(78, 11, '2026-02-04', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:08'),
(79, 12, '2026-02-04', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:08'),
(80, 13, '2026-02-04', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:08'),
(81, 14, '2026-02-04', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:09'),
(82, 15, '2026-02-04', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:09'),
(83, 16, '2026-02-04', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:09'),
(84, 17, '2026-02-04', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:09'),
(85, 18, '2026-02-04', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:09'),
(86, 2, '2026-02-02', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:36'),
(87, 3, '2026-02-02', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:36'),
(88, 4, '2026-02-02', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:36'),
(89, 5, '2026-02-02', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:36'),
(90, 6, '2026-02-02', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:36'),
(91, 7, '2026-02-02', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:36'),
(92, 8, '2026-02-02', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:36'),
(93, 9, '2026-02-02', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:37'),
(94, 10, '2026-02-02', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:37'),
(95, 11, '2026-02-02', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:37'),
(96, 12, '2026-02-02', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:37'),
(97, 13, '2026-02-02', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:37'),
(98, 14, '2026-02-02', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:37'),
(99, 15, '2026-02-02', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:38'),
(100, 16, '2026-02-02', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:38'),
(101, 17, '2026-02-02', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:38'),
(102, 18, '2026-02-02', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:38'),
(103, 2, '2026-02-01', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:43'),
(104, 3, '2026-02-01', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:43'),
(105, 4, '2026-02-01', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:43'),
(106, 5, '2026-02-01', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:43'),
(107, 6, '2026-02-01', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:43'),
(108, 7, '2026-02-01', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:43'),
(109, 8, '2026-02-01', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:44'),
(110, 9, '2026-02-01', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:44'),
(111, 10, '2026-02-01', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:44'),
(112, 11, '2026-02-01', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:44'),
(113, 12, '2026-02-01', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:44'),
(114, 13, '2026-02-01', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:44'),
(115, 14, '2026-02-01', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:44'),
(116, 15, '2026-02-01', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:44'),
(117, 16, '2026-02-01', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:44'),
(118, 17, '2026-02-01', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:45'),
(119, 18, '2026-02-01', 'present', 'manual', NULL, NULL, '2026-02-08 10:29:45'),
(120, 2, '2026-02-09', 'present', 'manual', NULL, NULL, '2026-02-09 07:33:31'),
(121, 3, '2026-02-09', 'present', 'manual', NULL, NULL, '2026-02-09 07:33:31'),
(122, 4, '2026-02-09', 'present', 'manual', NULL, NULL, '2026-02-09 07:33:31'),
(123, 5, '2026-02-09', 'present', 'manual', NULL, NULL, '2026-02-09 07:33:32'),
(124, 6, '2026-02-09', 'present', 'manual', NULL, NULL, '2026-02-09 07:33:32'),
(125, 7, '2026-02-09', 'present', 'manual', NULL, NULL, '2026-02-09 07:33:32'),
(126, 8, '2026-02-09', 'present', 'manual', NULL, NULL, '2026-02-09 07:33:32'),
(127, 9, '2026-02-09', 'present', 'manual', NULL, NULL, '2026-02-09 07:33:32'),
(128, 10, '2026-02-09', 'present', 'manual', NULL, NULL, '2026-02-09 07:33:32'),
(129, 11, '2026-02-09', 'present', 'manual', NULL, NULL, '2026-02-09 07:33:32'),
(130, 12, '2026-02-09', 'present', 'manual', NULL, NULL, '2026-02-09 07:33:32'),
(131, 13, '2026-02-09', 'present', 'manual', NULL, NULL, '2026-02-09 07:33:33'),
(132, 14, '2026-02-09', 'present', 'manual', NULL, NULL, '2026-02-09 07:33:33'),
(133, 15, '2026-02-09', 'present', 'manual', NULL, NULL, '2026-02-09 07:33:33'),
(134, 16, '2026-02-09', 'present', 'manual', NULL, NULL, '2026-02-09 07:33:33'),
(135, 17, '2026-02-09', 'present', 'manual', NULL, NULL, '2026-02-09 07:33:33'),
(136, 18, '2026-02-09', 'present', 'manual', NULL, NULL, '2026-02-09 07:33:33'),
(137, 2, '2026-02-10', 'holiday', 'manual', NULL, NULL, '2026-02-11 03:07:11'),
(138, 3, '2026-02-10', 'absent', 'manual', NULL, NULL, '2026-02-11 03:07:11'),
(139, 4, '2026-02-10', 'holiday', 'manual', NULL, NULL, '2026-02-11 03:07:12'),
(140, 5, '2026-02-10', 'holiday', 'manual', NULL, NULL, '2026-02-11 03:07:12'),
(141, 6, '2026-02-10', 'holiday', 'manual', NULL, NULL, '2026-02-11 03:07:12'),
(142, 7, '2026-02-10', 'holiday', 'manual', NULL, NULL, '2026-02-11 03:07:12'),
(143, 8, '2026-02-10', 'holiday', 'manual', NULL, NULL, '2026-02-11 03:07:13'),
(144, 9, '2026-02-10', 'holiday', 'manual', NULL, NULL, '2026-02-11 03:07:13'),
(145, 10, '2026-02-10', 'holiday', 'manual', NULL, NULL, '2026-02-11 03:07:13'),
(146, 11, '2026-02-10', 'holiday', 'manual', NULL, NULL, '2026-02-11 03:07:13'),
(147, 12, '2026-02-10', 'holiday', 'manual', NULL, NULL, '2026-02-11 03:07:14'),
(148, 13, '2026-02-10', 'holiday', 'manual', NULL, NULL, '2026-02-11 03:07:14'),
(149, 14, '2026-02-10', 'holiday', 'manual', NULL, NULL, '2026-02-11 03:07:14'),
(150, 15, '2026-02-10', 'holiday', 'manual', NULL, NULL, '2026-02-11 03:07:15'),
(151, 16, '2026-02-10', 'holiday', 'manual', NULL, NULL, '2026-02-11 03:07:15'),
(152, 17, '2026-02-10', 'holiday', 'manual', NULL, NULL, '2026-02-11 03:07:15'),
(153, 18, '2026-02-10', 'holiday', 'manual', NULL, NULL, '2026-02-11 03:07:15'),
(154, 2, '2026-02-11', 'present', 'manual', NULL, NULL, '2026-02-11 04:12:00'),
(155, 3, '2026-02-11', 'present', 'manual', NULL, NULL, '2026-02-11 04:12:00'),
(156, 4, '2026-02-11', 'present', 'manual', NULL, NULL, '2026-02-11 04:12:01'),
(157, 5, '2026-02-11', 'present', 'manual', NULL, NULL, '2026-02-11 04:12:01'),
(158, 6, '2026-02-11', 'present', 'manual', NULL, NULL, '2026-02-11 04:12:02'),
(159, 7, '2026-02-11', 'present', 'manual', NULL, NULL, '2026-02-11 04:12:03'),
(160, 8, '2026-02-11', 'present', 'manual', NULL, NULL, '2026-02-11 04:12:03'),
(161, 9, '2026-02-11', 'present', 'manual', NULL, NULL, '2026-02-11 04:12:04'),
(162, 10, '2026-02-11', 'present', 'manual', NULL, NULL, '2026-02-11 04:12:05'),
(163, 11, '2026-02-11', 'present', 'manual', NULL, NULL, '2026-02-11 04:12:05'),
(164, 12, '2026-02-11', 'present', 'manual', NULL, NULL, '2026-02-11 04:12:06'),
(165, 13, '2026-02-11', 'present', 'manual', NULL, NULL, '2026-02-11 04:12:06'),
(166, 14, '2026-02-11', 'present', 'manual', NULL, NULL, '2026-02-11 04:12:07'),
(167, 15, '2026-02-11', 'present', 'manual', NULL, NULL, '2026-02-11 04:12:07'),
(168, 16, '2026-02-11', 'present', 'manual', NULL, NULL, '2026-02-11 04:12:09'),
(169, 17, '2026-02-11', 'present', 'manual', NULL, NULL, '2026-02-11 04:12:09'),
(170, 18, '2026-02-11', 'present', 'manual', NULL, NULL, '2026-02-11 04:12:10'),
(171, 2, '2026-02-03', 'holiday', 'manual', NULL, NULL, '2026-02-11 04:13:36'),
(172, 3, '2026-02-03', 'absent', 'manual', NULL, NULL, '2026-02-11 04:13:36'),
(173, 4, '2026-02-03', 'holiday', 'manual', NULL, NULL, '2026-02-11 04:13:36'),
(174, 5, '2026-02-03', 'holiday', 'manual', NULL, NULL, '2026-02-11 04:13:37'),
(175, 6, '2026-02-03', 'holiday', 'manual', NULL, NULL, '2026-02-11 04:13:37'),
(176, 7, '2026-02-03', 'holiday', 'manual', NULL, NULL, '2026-02-11 04:13:38'),
(177, 8, '2026-02-03', 'holiday', 'manual', NULL, NULL, '2026-02-11 04:13:38'),
(178, 9, '2026-02-03', 'holiday', 'manual', NULL, NULL, '2026-02-11 04:13:39'),
(179, 10, '2026-02-03', 'holiday', 'manual', NULL, NULL, '2026-02-11 04:13:39'),
(180, 11, '2026-02-03', 'holiday', 'manual', NULL, NULL, '2026-02-11 04:13:39'),
(181, 12, '2026-02-03', 'holiday', 'manual', NULL, NULL, '2026-02-11 04:13:40'),
(182, 13, '2026-02-03', 'holiday', 'manual', NULL, NULL, '2026-02-11 04:13:40'),
(183, 14, '2026-02-03', 'holiday', 'manual', NULL, NULL, '2026-02-11 04:13:41'),
(184, 15, '2026-02-03', 'holiday', 'manual', NULL, NULL, '2026-02-11 04:13:41'),
(185, 16, '2026-02-03', 'holiday', 'manual', NULL, NULL, '2026-02-11 04:13:41'),
(186, 17, '2026-02-03', 'holiday', 'manual', NULL, NULL, '2026-02-11 04:13:42'),
(187, 18, '2026-02-03', 'holiday', 'manual', NULL, NULL, '2026-02-11 04:13:42'),
(188, 2, '2026-02-12', 'present', 'manual', NULL, NULL, '2026-02-12 03:49:16'),
(189, 3, '2026-02-12', 'present', 'manual', NULL, NULL, '2026-02-12 03:49:16'),
(190, 4, '2026-02-12', 'present', 'manual', NULL, NULL, '2026-02-12 03:49:16'),
(191, 5, '2026-02-12', 'present', 'manual', NULL, NULL, '2026-02-12 03:49:17'),
(192, 6, '2026-02-12', 'present', 'manual', NULL, NULL, '2026-02-12 03:49:17'),
(193, 7, '2026-02-12', 'present', 'manual', NULL, NULL, '2026-02-12 03:49:17'),
(194, 8, '2026-02-12', 'present', 'manual', NULL, NULL, '2026-02-12 03:49:17'),
(195, 9, '2026-02-12', 'present', 'manual', NULL, NULL, '2026-02-12 03:49:18'),
(196, 10, '2026-02-12', 'present', 'manual', NULL, NULL, '2026-02-12 03:49:18'),
(197, 11, '2026-02-12', 'present', 'manual', NULL, NULL, '2026-02-12 03:49:18'),
(198, 12, '2026-02-12', 'present', 'manual', NULL, NULL, '2026-02-12 03:49:18'),
(199, 13, '2026-02-12', 'present', 'manual', NULL, NULL, '2026-02-12 03:49:19'),
(200, 14, '2026-02-12', 'present', 'manual', NULL, NULL, '2026-02-12 03:49:19'),
(201, 15, '2026-02-12', 'present', 'manual', NULL, NULL, '2026-02-12 03:49:19'),
(202, 16, '2026-02-12', 'present', 'manual', NULL, NULL, '2026-02-12 03:49:19'),
(203, 17, '2026-02-12', 'present', 'manual', NULL, NULL, '2026-02-12 03:49:20'),
(204, 18, '2026-02-12', 'present', 'manual', NULL, NULL, '2026-02-12 03:49:20'),
(205, 2, '2026-02-13', 'present', 'manual', NULL, NULL, '2026-02-13 04:43:30'),
(206, 3, '2026-02-13', 'present', 'manual', NULL, NULL, '2026-02-13 04:43:30'),
(207, 4, '2026-02-13', 'present', 'manual', NULL, NULL, '2026-02-13 04:43:30'),
(208, 5, '2026-02-13', 'present', 'manual', NULL, NULL, '2026-02-13 04:43:30'),
(209, 6, '2026-02-13', 'present', 'manual', NULL, NULL, '2026-02-13 04:43:30'),
(210, 7, '2026-02-13', 'present', 'manual', NULL, NULL, '2026-02-13 04:43:31'),
(211, 8, '2026-02-13', 'present', 'manual', NULL, NULL, '2026-02-13 04:43:31'),
(212, 9, '2026-02-13', 'present', 'manual', NULL, NULL, '2026-02-13 04:43:31'),
(213, 10, '2026-02-13', 'present', 'manual', NULL, NULL, '2026-02-13 04:43:31'),
(214, 11, '2026-02-13', 'present', 'manual', NULL, NULL, '2026-02-13 04:43:31'),
(215, 12, '2026-02-13', 'present', 'manual', NULL, NULL, '2026-02-13 04:43:31'),
(216, 13, '2026-02-13', 'present', 'manual', NULL, NULL, '2026-02-13 04:43:31'),
(217, 14, '2026-02-13', 'present', 'manual', NULL, NULL, '2026-02-13 04:43:32'),
(218, 15, '2026-02-13', 'present', 'manual', NULL, NULL, '2026-02-13 04:43:32'),
(219, 16, '2026-02-13', 'present', 'manual', NULL, NULL, '2026-02-13 04:43:32'),
(220, 17, '2026-02-13', 'present', 'manual', NULL, NULL, '2026-02-13 04:43:32'),
(221, 18, '2026-02-13', 'present', 'manual', NULL, NULL, '2026-02-13 04:43:32'),
(222, 2, '2026-02-15', 'present', 'manual', NULL, NULL, '2026-02-15 04:36:21'),
(223, 3, '2026-02-15', 'absent', 'manual', NULL, NULL, '2026-02-15 04:36:21'),
(224, 4, '2026-02-15', 'present', 'manual', NULL, NULL, '2026-02-15 04:36:21'),
(225, 5, '2026-02-15', 'present', 'manual', NULL, NULL, '2026-02-15 04:36:22'),
(226, 6, '2026-02-15', 'present', 'manual', NULL, NULL, '2026-02-15 04:36:22'),
(227, 7, '2026-02-15', 'present', 'manual', NULL, NULL, '2026-02-15 04:36:22'),
(228, 8, '2026-02-15', 'present', 'manual', NULL, NULL, '2026-02-15 04:36:23'),
(229, 9, '2026-02-15', 'present', 'manual', NULL, NULL, '2026-02-15 04:36:23'),
(230, 10, '2026-02-15', 'present', 'manual', NULL, NULL, '2026-02-15 04:36:23'),
(231, 11, '2026-02-15', 'present', 'manual', NULL, NULL, '2026-02-15 04:36:24'),
(232, 12, '2026-02-15', 'present', 'manual', NULL, NULL, '2026-02-15 04:36:24'),
(233, 13, '2026-02-15', 'present', 'manual', NULL, NULL, '2026-02-15 04:36:24'),
(234, 14, '2026-02-15', 'present', 'manual', NULL, NULL, '2026-02-15 04:36:24'),
(235, 15, '2026-02-15', 'present', 'manual', NULL, NULL, '2026-02-15 04:36:25'),
(236, 16, '2026-02-15', 'present', 'manual', NULL, NULL, '2026-02-15 04:36:25'),
(237, 17, '2026-02-15', 'present', 'manual', NULL, NULL, '2026-02-15 04:36:25'),
(238, 18, '2026-02-15', 'present', 'manual', NULL, NULL, '2026-02-15 04:36:26'),
(239, 2, '2026-02-14', 'present', 'manual', NULL, NULL, '2026-02-15 04:36:30'),
(240, 3, '2026-02-14', 'present', 'manual', NULL, NULL, '2026-02-15 04:36:31'),
(241, 4, '2026-02-14', 'present', 'manual', NULL, NULL, '2026-02-15 04:36:31'),
(242, 5, '2026-02-14', 'present', 'manual', NULL, NULL, '2026-02-15 04:36:31'),
(243, 6, '2026-02-14', 'present', 'manual', NULL, NULL, '2026-02-15 04:36:32'),
(244, 7, '2026-02-14', 'present', 'manual', NULL, NULL, '2026-02-15 04:36:32'),
(245, 8, '2026-02-14', 'present', 'manual', NULL, NULL, '2026-02-15 04:36:32'),
(246, 9, '2026-02-14', 'present', 'manual', NULL, NULL, '2026-02-15 04:36:32'),
(247, 10, '2026-02-14', 'present', 'manual', NULL, NULL, '2026-02-15 04:36:33'),
(248, 11, '2026-02-14', 'present', 'manual', NULL, NULL, '2026-02-15 04:36:33'),
(249, 12, '2026-02-14', 'present', 'manual', NULL, NULL, '2026-02-15 04:36:33'),
(250, 13, '2026-02-14', 'present', 'manual', NULL, NULL, '2026-02-15 04:36:33'),
(251, 14, '2026-02-14', 'present', 'manual', NULL, NULL, '2026-02-15 04:36:34'),
(252, 15, '2026-02-14', 'present', 'manual', NULL, NULL, '2026-02-15 04:36:34'),
(253, 16, '2026-02-14', 'present', 'manual', NULL, NULL, '2026-02-15 04:36:34'),
(254, 17, '2026-02-14', 'present', 'manual', NULL, NULL, '2026-02-15 04:36:34'),
(255, 18, '2026-02-14', 'present', 'manual', NULL, NULL, '2026-02-15 04:36:35'),
(256, 2, '2026-02-16', 'present', 'manual', NULL, NULL, '2026-02-16 08:28:41'),
(257, 3, '2026-02-16', 'present', 'manual', NULL, NULL, '2026-02-16 08:28:41'),
(258, 4, '2026-02-16', 'present', 'manual', NULL, NULL, '2026-02-16 08:28:41'),
(259, 5, '2026-02-16', 'present', 'manual', NULL, NULL, '2026-02-16 08:28:42'),
(260, 6, '2026-02-16', 'present', 'manual', NULL, NULL, '2026-02-16 08:28:42'),
(261, 7, '2026-02-16', 'present', 'manual', NULL, NULL, '2026-02-16 08:28:42'),
(262, 8, '2026-02-16', 'present', 'manual', NULL, NULL, '2026-02-16 08:28:42'),
(263, 9, '2026-02-16', 'present', 'manual', NULL, NULL, '2026-02-16 08:28:43'),
(264, 10, '2026-02-16', 'present', 'manual', NULL, NULL, '2026-02-16 08:28:43'),
(265, 11, '2026-02-16', 'present', 'manual', NULL, NULL, '2026-02-16 08:28:43'),
(266, 12, '2026-02-16', 'present', 'manual', NULL, NULL, '2026-02-16 08:28:44'),
(267, 13, '2026-02-16', 'present', 'manual', NULL, NULL, '2026-02-16 08:28:44'),
(268, 14, '2026-02-16', 'present', 'manual', NULL, NULL, '2026-02-16 08:28:45'),
(269, 15, '2026-02-16', 'present', 'manual', NULL, NULL, '2026-02-16 08:28:46'),
(270, 16, '2026-02-16', 'present', 'manual', NULL, NULL, '2026-02-16 08:28:46'),
(271, 17, '2026-02-16', 'present', 'manual', NULL, NULL, '2026-02-16 08:28:46'),
(272, 18, '2026-02-16', 'present', 'manual', NULL, NULL, '2026-02-16 08:28:46'),
(273, 3, '2026-02-17', 'absent', 'weekend_rule', NULL, NULL, '2026-02-16 10:57:56'),
(275, 12, '2026-02-18', 'absent', 'manual', NULL, NULL, '2026-02-18 09:58:26'),
(277, 2, '2026-02-18', 'present', 'manual', NULL, NULL, '2026-02-18 12:23:36'),
(278, 3, '2026-02-18', 'present', 'manual', NULL, NULL, '2026-02-18 12:23:36'),
(279, 4, '2026-02-18', 'present', 'manual', NULL, NULL, '2026-02-18 12:23:36'),
(280, 5, '2026-02-18', 'present', 'manual', NULL, NULL, '2026-02-18 12:23:37'),
(281, 6, '2026-02-18', 'present', 'manual', NULL, NULL, '2026-02-18 12:23:37'),
(282, 7, '2026-02-18', 'present', 'manual', NULL, NULL, '2026-02-18 12:23:37'),
(283, 8, '2026-02-18', 'present', 'manual', NULL, NULL, '2026-02-18 12:23:37'),
(284, 9, '2026-02-18', 'present', 'manual', NULL, NULL, '2026-02-18 12:23:37'),
(285, 10, '2026-02-18', 'present', 'manual', NULL, NULL, '2026-02-18 12:23:37'),
(286, 11, '2026-02-18', 'present', 'manual', NULL, NULL, '2026-02-18 12:23:38'),
(287, 13, '2026-02-18', 'present', 'manual', NULL, NULL, '2026-02-18 12:23:38'),
(288, 14, '2026-02-18', 'present', 'manual', NULL, NULL, '2026-02-18 12:23:38'),
(289, 15, '2026-02-18', 'present', 'manual', NULL, NULL, '2026-02-18 12:23:38'),
(290, 16, '2026-02-18', 'present', 'manual', NULL, NULL, '2026-02-18 12:23:39'),
(291, 17, '2026-02-18', 'present', 'manual', NULL, NULL, '2026-02-18 12:23:39'),
(292, 18, '2026-02-18', 'present', 'manual', NULL, NULL, '2026-02-18 12:23:39'),
(293, 12, '2026-02-17', 'absent', 'weekend_rule', NULL, NULL, '2026-02-18 12:23:55'),
(294, 2, '2026-02-19', 'present', 'manual', NULL, NULL, '2026-02-19 17:12:30'),
(295, 3, '2026-02-19', 'present', 'manual', NULL, NULL, '2026-02-19 17:12:30'),
(296, 4, '2026-02-19', 'present', 'manual', NULL, NULL, '2026-02-19 17:12:31'),
(297, 5, '2026-02-19', 'present', 'manual', NULL, NULL, '2026-02-19 17:12:31'),
(298, 6, '2026-02-19', 'present', 'manual', NULL, NULL, '2026-02-19 17:12:31'),
(299, 7, '2026-02-19', 'present', 'manual', NULL, NULL, '2026-02-19 17:12:31'),
(300, 8, '2026-02-19', 'present', 'manual', NULL, NULL, '2026-02-19 17:12:31'),
(301, 9, '2026-02-19', 'present', 'manual', NULL, NULL, '2026-02-19 17:12:31'),
(302, 10, '2026-02-19', 'present', 'manual', NULL, NULL, '2026-02-19 17:12:31'),
(303, 11, '2026-02-19', 'present', 'manual', NULL, NULL, '2026-02-19 17:12:31'),
(304, 12, '2026-02-19', 'absent', 'manual', NULL, NULL, '2026-02-19 17:12:31'),
(305, 13, '2026-02-19', 'present', 'manual', NULL, NULL, '2026-02-19 17:12:32'),
(306, 14, '2026-02-19', 'present', 'manual', NULL, NULL, '2026-02-19 17:12:32'),
(307, 15, '2026-02-19', 'present', 'manual', NULL, NULL, '2026-02-19 17:12:32'),
(308, 16, '2026-02-19', 'present', 'manual', NULL, NULL, '2026-02-19 17:12:32'),
(309, 17, '2026-02-19', 'present', 'manual', NULL, NULL, '2026-02-19 17:12:32'),
(310, 18, '2026-02-19', 'present', 'manual', NULL, NULL, '2026-02-19 17:12:32'),
(311, 2, '2026-02-20', 'present', 'manual', NULL, NULL, '2026-02-21 04:00:03'),
(312, 3, '2026-02-20', 'present', 'manual', NULL, NULL, '2026-02-21 04:00:03'),
(313, 4, '2026-02-20', 'present', 'manual', NULL, NULL, '2026-02-21 04:00:04'),
(314, 5, '2026-02-20', 'present', 'manual', NULL, NULL, '2026-02-21 04:00:04'),
(315, 6, '2026-02-20', 'present', 'manual', NULL, NULL, '2026-02-21 04:00:04'),
(316, 7, '2026-02-20', 'present', 'manual', NULL, NULL, '2026-02-21 04:00:05'),
(317, 8, '2026-02-20', 'present', 'manual', NULL, NULL, '2026-02-21 04:00:05'),
(318, 9, '2026-02-20', 'present', 'manual', NULL, NULL, '2026-02-21 04:00:05'),
(319, 10, '2026-02-20', 'present', 'manual', NULL, NULL, '2026-02-21 04:00:06'),
(320, 11, '2026-02-20', 'present', 'manual', NULL, NULL, '2026-02-21 04:00:06'),
(321, 12, '2026-02-20', 'absent', 'manual', NULL, NULL, '2026-02-21 04:00:06'),
(322, 13, '2026-02-20', 'present', 'manual', NULL, NULL, '2026-02-21 04:00:07'),
(323, 14, '2026-02-20', 'present', 'manual', NULL, NULL, '2026-02-21 04:00:07'),
(324, 15, '2026-02-20', 'present', 'manual', NULL, NULL, '2026-02-21 04:00:07'),
(325, 16, '2026-02-20', 'present', 'manual', NULL, NULL, '2026-02-21 04:00:07'),
(326, 17, '2026-02-20', 'present', 'manual', NULL, NULL, '2026-02-21 04:00:08'),
(327, 18, '2026-02-20', 'present', 'manual', NULL, NULL, '2026-02-21 04:00:08'),
(328, 2, '2026-02-21', 'present', 'manual', NULL, NULL, '2026-02-21 04:00:38'),
(329, 3, '2026-02-21', 'present', 'manual', NULL, NULL, '2026-02-21 04:00:38'),
(330, 4, '2026-02-21', 'present', 'manual', NULL, NULL, '2026-02-21 04:00:38'),
(331, 5, '2026-02-21', 'present', 'manual', NULL, NULL, '2026-02-21 04:00:39'),
(332, 6, '2026-02-21', 'present', 'manual', NULL, NULL, '2026-02-21 04:00:39'),
(333, 7, '2026-02-21', 'present', 'manual', NULL, NULL, '2026-02-21 04:00:39'),
(334, 8, '2026-02-21', 'present', 'manual', NULL, NULL, '2026-02-21 04:00:39'),
(335, 9, '2026-02-21', 'present', 'manual', NULL, NULL, '2026-02-21 04:00:40'),
(336, 10, '2026-02-21', 'present', 'manual', NULL, NULL, '2026-02-21 04:00:40'),
(337, 11, '2026-02-21', 'present', 'manual', NULL, NULL, '2026-02-21 04:00:40'),
(338, 12, '2026-02-21', 'absent', 'manual', NULL, NULL, '2026-02-21 04:00:41'),
(339, 13, '2026-02-21', 'present', 'manual', NULL, NULL, '2026-02-21 04:00:41'),
(340, 14, '2026-02-21', 'present', 'manual', NULL, NULL, '2026-02-21 04:00:41'),
(341, 15, '2026-02-21', 'present', 'manual', NULL, NULL, '2026-02-21 04:00:41'),
(342, 16, '2026-02-21', 'present', 'manual', NULL, NULL, '2026-02-21 04:00:42'),
(343, 17, '2026-02-21', 'present', 'manual', NULL, NULL, '2026-02-21 04:00:42'),
(344, 18, '2026-02-21', 'present', 'manual', NULL, NULL, '2026-02-21 04:00:42'),
(345, 2, '2026-02-22', 'present', 'manual', NULL, NULL, '2026-02-22 10:08:59'),
(346, 3, '2026-02-22', 'present', 'manual', NULL, NULL, '2026-02-22 10:09:00'),
(347, 4, '2026-02-22', 'present', 'manual', NULL, NULL, '2026-02-22 10:09:00'),
(348, 5, '2026-02-22', 'present', 'manual', NULL, NULL, '2026-02-22 10:09:00'),
(349, 6, '2026-02-22', 'present', 'manual', NULL, NULL, '2026-02-22 10:09:01'),
(350, 7, '2026-02-22', 'present', 'manual', NULL, NULL, '2026-02-22 10:09:01'),
(351, 8, '2026-02-22', 'present', 'manual', NULL, NULL, '2026-02-22 10:09:01'),
(352, 9, '2026-02-22', 'present', 'manual', NULL, NULL, '2026-02-22 10:09:02'),
(353, 10, '2026-02-22', 'present', 'manual', NULL, NULL, '2026-02-22 10:09:02'),
(354, 11, '2026-02-22', 'present', 'manual', NULL, NULL, '2026-02-22 10:09:02'),
(355, 12, '2026-02-22', 'present', 'manual', NULL, NULL, '2026-02-22 10:09:03'),
(356, 13, '2026-02-22', 'present', 'manual', NULL, NULL, '2026-02-22 10:09:03'),
(357, 14, '2026-02-22', 'present', 'manual', NULL, NULL, '2026-02-22 10:09:03'),
(358, 15, '2026-02-22', 'present', 'manual', NULL, NULL, '2026-02-22 10:09:04'),
(359, 16, '2026-02-22', 'present', 'manual', NULL, NULL, '2026-02-22 10:09:04'),
(360, 17, '2026-02-22', 'present', 'manual', NULL, NULL, '2026-02-22 10:09:04'),
(361, 18, '2026-02-22', 'present', 'manual', NULL, NULL, '2026-02-22 10:09:05'),
(362, 2, '2026-02-23', 'present', 'manual', NULL, NULL, '2026-02-23 19:27:22'),
(363, 3, '2026-02-23', 'present', 'manual', NULL, NULL, '2026-02-23 19:27:23'),
(364, 4, '2026-02-23', 'present', 'manual', NULL, NULL, '2026-02-23 19:27:23'),
(365, 5, '2026-02-23', 'present', 'manual', NULL, NULL, '2026-02-23 19:27:23'),
(366, 6, '2026-02-23', 'present', 'manual', NULL, NULL, '2026-02-23 19:27:24'),
(367, 7, '2026-02-23', 'present', 'manual', NULL, NULL, '2026-02-23 19:27:24'),
(368, 8, '2026-02-23', 'present', 'manual', NULL, NULL, '2026-02-23 19:27:24'),
(369, 9, '2026-02-23', 'present', 'manual', NULL, NULL, '2026-02-23 19:27:24'),
(370, 10, '2026-02-23', 'present', 'manual', NULL, NULL, '2026-02-23 19:27:25'),
(371, 11, '2026-02-23', 'present', 'manual', NULL, NULL, '2026-02-23 19:27:25'),
(372, 12, '2026-02-23', 'present', 'manual', NULL, NULL, '2026-02-23 19:27:25'),
(373, 13, '2026-02-23', 'present', 'manual', NULL, NULL, '2026-02-23 19:27:26'),
(374, 14, '2026-02-23', 'present', 'manual', NULL, NULL, '2026-02-23 19:27:26'),
(375, 15, '2026-02-23', 'present', 'manual', NULL, NULL, '2026-02-23 19:27:26'),
(376, 16, '2026-02-23', 'present', 'manual', NULL, NULL, '2026-02-23 19:27:27'),
(377, 17, '2026-02-23', 'present', 'manual', NULL, NULL, '2026-02-23 19:27:27'),
(378, 18, '2026-02-23', 'present', 'manual', NULL, NULL, '2026-02-23 19:27:27'),
(379, 20, '2026-02-13', 'present', 'manual', NULL, NULL, '2026-02-25 11:02:24'),
(380, 20, '2026-02-14', 'present', 'manual', NULL, NULL, '2026-02-25 11:02:27'),
(381, 20, '2026-02-15', 'present', 'manual', NULL, NULL, '2026-02-25 11:02:29'),
(382, 20, '2026-02-16', 'present', 'manual', NULL, NULL, '2026-02-25 11:02:31'),
(383, 20, '2026-02-18', 'present', 'manual', NULL, NULL, '2026-02-25 11:02:34'),
(384, 20, '2026-02-19', 'present', 'manual', NULL, NULL, '2026-02-25 11:02:36'),
(385, 20, '2026-02-20', 'present', 'manual', NULL, NULL, '2026-02-25 11:02:37'),
(386, 20, '2026-02-21', 'present', 'manual', NULL, NULL, '2026-02-25 11:02:39'),
(387, 20, '2026-02-22', 'present', 'manual', NULL, NULL, '2026-02-25 11:02:41'),
(388, 20, '2026-02-23', 'present', 'manual', NULL, NULL, '2026-02-25 11:02:43'),
(389, 20, '2026-02-25', 'present', 'manual', NULL, NULL, '2026-02-25 11:02:46'),
(390, 2, '2026-02-25', 'present', 'manual', NULL, NULL, '2026-02-25 11:03:02'),
(391, 3, '2026-02-25', 'present', 'manual', NULL, NULL, '2026-02-25 11:03:02'),
(392, 3, '2026-02-24', 'absent', 'weekend_rule', NULL, NULL, '2026-02-25 11:03:02'),
(393, 4, '2026-02-25', 'present', 'manual', NULL, NULL, '2026-02-25 11:03:02'),
(394, 5, '2026-02-25', 'present', 'manual', NULL, NULL, '2026-02-25 11:03:02'),
(395, 6, '2026-02-25', 'present', 'manual', NULL, NULL, '2026-02-25 11:03:02'),
(396, 7, '2026-02-25', 'present', 'manual', NULL, NULL, '2026-02-25 11:03:02'),
(397, 8, '2026-02-25', 'present', 'manual', NULL, NULL, '2026-02-25 11:03:03'),
(398, 9, '2026-02-25', 'present', 'manual', NULL, NULL, '2026-02-25 11:03:03'),
(399, 10, '2026-02-25', 'present', 'manual', NULL, NULL, '2026-02-25 11:03:03'),
(400, 11, '2026-02-25', 'present', 'manual', NULL, NULL, '2026-02-25 11:03:03'),
(401, 12, '2026-02-25', 'present', 'manual', NULL, NULL, '2026-02-25 11:03:03'),
(402, 12, '2026-02-24', 'absent', 'weekend_rule', NULL, NULL, '2026-02-25 11:03:03'),
(403, 13, '2026-02-25', 'present', 'manual', NULL, NULL, '2026-02-25 11:03:03'),
(404, 14, '2026-02-25', 'present', 'manual', NULL, NULL, '2026-02-25 11:03:03'),
(405, 15, '2026-02-25', 'present', 'manual', NULL, NULL, '2026-02-25 11:03:04'),
(406, 16, '2026-02-25', 'present', 'manual', NULL, NULL, '2026-02-25 11:03:04'),
(407, 17, '2026-02-25', 'present', 'manual', NULL, NULL, '2026-02-25 11:03:04'),
(408, 18, '2026-02-25', 'present', 'manual', NULL, NULL, '2026-02-25 11:03:04'),
(409, 2, '2026-02-27', 'present', 'manual', NULL, NULL, '2026-02-27 22:11:37'),
(410, 3, '2026-02-27', 'present', 'manual', NULL, NULL, '2026-02-27 22:11:37'),
(411, 4, '2026-02-27', 'present', 'manual', NULL, NULL, '2026-02-27 22:11:37'),
(412, 5, '2026-02-27', 'present', 'manual', NULL, NULL, '2026-02-27 22:11:38'),
(413, 6, '2026-02-27', 'present', 'manual', NULL, NULL, '2026-02-27 22:11:39'),
(414, 7, '2026-02-27', 'present', 'manual', NULL, NULL, '2026-02-27 22:11:39'),
(415, 8, '2026-02-27', 'present', 'manual', NULL, NULL, '2026-02-27 22:11:39'),
(416, 9, '2026-02-27', 'present', 'manual', NULL, NULL, '2026-02-27 22:11:40'),
(417, 10, '2026-02-27', 'present', 'manual', NULL, NULL, '2026-02-27 22:11:40'),
(418, 11, '2026-02-27', 'present', 'manual', NULL, NULL, '2026-02-27 22:11:40'),
(419, 12, '2026-02-27', 'present', 'manual', NULL, NULL, '2026-02-27 22:11:41'),
(420, 13, '2026-02-27', 'half_day', 'manual', NULL, NULL, '2026-02-27 22:11:41'),
(421, 14, '2026-02-27', 'present', 'manual', NULL, NULL, '2026-02-27 22:11:41'),
(422, 15, '2026-02-27', 'present', 'manual', NULL, NULL, '2026-02-27 22:11:42'),
(423, 16, '2026-02-27', 'present', 'manual', NULL, NULL, '2026-02-27 22:11:42'),
(424, 17, '2026-02-27', 'present', 'manual', NULL, NULL, '2026-02-27 22:11:42'),
(425, 18, '2026-02-27', 'present', 'manual', NULL, NULL, '2026-02-27 22:11:43'),
(426, 20, '2026-02-27', 'present', 'manual', NULL, NULL, '2026-02-27 22:11:43'),
(427, 2, '2026-02-26', 'present', 'manual', NULL, NULL, '2026-02-27 22:13:00'),
(428, 3, '2026-02-26', 'present', 'manual', NULL, NULL, '2026-02-27 22:13:01'),
(429, 4, '2026-02-26', 'present', 'manual', NULL, NULL, '2026-02-27 22:13:01'),
(430, 5, '2026-02-26', 'present', 'manual', NULL, NULL, '2026-02-27 22:13:01'),
(431, 6, '2026-02-26', 'present', 'manual', NULL, NULL, '2026-02-27 22:13:02'),
(432, 7, '2026-02-26', 'present', 'manual', NULL, NULL, '2026-02-27 22:13:02'),
(433, 8, '2026-02-26', 'present', 'manual', NULL, NULL, '2026-02-27 22:13:02'),
(434, 9, '2026-02-26', 'present', 'manual', NULL, NULL, '2026-02-27 22:13:03'),
(435, 10, '2026-02-26', 'present', 'manual', NULL, NULL, '2026-02-27 22:13:03'),
(436, 11, '2026-02-26', 'present', 'manual', NULL, NULL, '2026-02-27 22:13:03'),
(437, 12, '2026-02-26', 'absent', 'manual', NULL, NULL, '2026-02-27 22:13:04'),
(438, 13, '2026-02-26', 'present', 'manual', NULL, NULL, '2026-02-27 22:13:04'),
(439, 14, '2026-02-26', 'present', 'manual', NULL, NULL, '2026-02-27 22:13:04'),
(440, 15, '2026-02-26', 'present', 'manual', NULL, NULL, '2026-02-27 22:13:05'),
(441, 16, '2026-02-26', 'present', 'manual', NULL, NULL, '2026-02-27 22:13:05'),
(442, 17, '2026-02-26', 'present', 'manual', NULL, NULL, '2026-02-27 22:13:05'),
(443, 18, '2026-02-26', 'present', 'manual', NULL, NULL, '2026-02-27 22:13:06'),
(444, 20, '2026-02-26', 'present', 'manual', NULL, NULL, '2026-02-27 22:13:06'),
(445, 2, '2026-02-28', 'present', 'manual', NULL, NULL, '2026-03-01 10:57:12'),
(446, 3, '2026-02-28', 'present', 'manual', NULL, NULL, '2026-03-01 10:57:12'),
(447, 4, '2026-02-28', 'present', 'manual', NULL, NULL, '2026-03-01 10:57:12'),
(448, 5, '2026-02-28', 'present', 'manual', NULL, NULL, '2026-03-01 10:57:12'),
(449, 6, '2026-02-28', 'present', 'manual', NULL, NULL, '2026-03-01 10:57:12'),
(450, 7, '2026-02-28', 'present', 'manual', NULL, NULL, '2026-03-01 10:57:12'),
(451, 8, '2026-02-28', 'present', 'manual', NULL, NULL, '2026-03-01 10:57:12'),
(452, 9, '2026-02-28', 'present', 'manual', NULL, NULL, '2026-03-01 10:57:12'),
(453, 10, '2026-02-28', 'present', 'manual', NULL, NULL, '2026-03-01 10:57:12'),
(454, 11, '2026-02-28', 'present', 'manual', NULL, NULL, '2026-03-01 10:57:13'),
(455, 12, '2026-02-28', 'present', 'manual', NULL, NULL, '2026-03-01 10:57:13'),
(456, 13, '2026-02-28', 'present', 'manual', NULL, NULL, '2026-03-01 10:57:13'),
(457, 14, '2026-02-28', 'present', 'manual', NULL, NULL, '2026-03-01 10:57:13'),
(458, 15, '2026-02-28', 'present', 'manual', NULL, NULL, '2026-03-01 10:57:13'),
(459, 16, '2026-02-28', 'present', 'manual', NULL, NULL, '2026-03-01 10:57:13'),
(460, 17, '2026-02-28', 'present', 'manual', NULL, NULL, '2026-03-01 10:57:14'),
(461, 18, '2026-02-28', 'present', 'manual', NULL, NULL, '2026-03-01 10:57:14'),
(462, 20, '2026-02-28', 'present', 'manual', NULL, NULL, '2026-03-01 10:57:14'),
(463, 2, '2026-03-02', 'present', 'manual', NULL, NULL, '2026-03-02 14:11:58'),
(464, 3, '2026-03-02', 'present', 'manual', NULL, NULL, '2026-03-02 14:11:58'),
(465, 4, '2026-03-02', 'present', 'manual', NULL, NULL, '2026-03-02 14:11:58'),
(466, 5, '2026-03-02', 'present', 'manual', NULL, NULL, '2026-03-02 14:11:59'),
(467, 6, '2026-03-02', 'present', 'manual', NULL, NULL, '2026-03-02 14:11:59'),
(468, 7, '2026-03-02', 'present', 'manual', NULL, NULL, '2026-03-02 14:11:59'),
(469, 8, '2026-03-02', 'present', 'manual', NULL, NULL, '2026-03-02 14:12:00'),
(470, 9, '2026-03-02', 'present', 'manual', NULL, NULL, '2026-03-02 14:12:00'),
(471, 10, '2026-03-02', 'present', 'manual', NULL, NULL, '2026-03-02 14:12:00'),
(472, 11, '2026-03-02', 'present', 'manual', NULL, NULL, '2026-03-02 14:12:01'),
(473, 12, '2026-03-02', 'present', 'manual', NULL, NULL, '2026-03-02 14:12:01'),
(474, 13, '2026-03-02', 'present', 'manual', NULL, NULL, '2026-03-02 14:12:01'),
(475, 14, '2026-03-02', 'present', 'manual', NULL, NULL, '2026-03-02 14:12:02'),
(476, 15, '2026-03-02', 'present', 'manual', NULL, NULL, '2026-03-02 14:12:02'),
(477, 16, '2026-03-02', 'present', 'manual', NULL, NULL, '2026-03-02 14:12:02'),
(478, 17, '2026-03-02', 'present', 'manual', NULL, NULL, '2026-03-02 14:12:02'),
(479, 18, '2026-03-02', 'present', 'manual', NULL, NULL, '2026-03-02 14:12:03'),
(480, 20, '2026-03-02', 'present', 'manual', NULL, NULL, '2026-03-02 14:12:03'),
(481, 2, '2026-03-01', 'present', 'manual', NULL, NULL, '2026-03-02 16:45:06'),
(482, 3, '2026-03-01', 'absent', 'manual', NULL, NULL, '2026-03-02 16:45:06'),
(483, 4, '2026-03-01', 'present', 'manual', NULL, NULL, '2026-03-02 16:45:07'),
(484, 5, '2026-03-01', 'present', 'manual', NULL, NULL, '2026-03-02 16:45:07'),
(485, 6, '2026-03-01', 'present', 'manual', NULL, NULL, '2026-03-02 16:45:07'),
(486, 7, '2026-03-01', 'present', 'manual', NULL, NULL, '2026-03-02 16:45:08'),
(487, 8, '2026-03-01', 'present', 'manual', NULL, NULL, '2026-03-02 16:45:08'),
(488, 9, '2026-03-01', 'present', 'manual', NULL, NULL, '2026-03-02 16:45:08'),
(489, 10, '2026-03-01', 'present', 'manual', NULL, NULL, '2026-03-02 16:45:08'),
(490, 11, '2026-03-01', 'present', 'manual', NULL, NULL, '2026-03-02 16:45:09'),
(491, 12, '2026-03-01', 'present', 'manual', NULL, NULL, '2026-03-02 16:45:09'),
(492, 13, '2026-03-01', 'present', 'manual', NULL, NULL, '2026-03-02 16:45:09'),
(493, 14, '2026-03-01', 'present', 'manual', NULL, NULL, '2026-03-02 16:45:09'),
(494, 15, '2026-03-01', 'present', 'manual', NULL, NULL, '2026-03-02 16:45:10'),
(495, 16, '2026-03-01', 'present', 'manual', NULL, NULL, '2026-03-02 16:45:10'),
(496, 17, '2026-03-01', 'present', 'manual', NULL, NULL, '2026-03-02 16:45:10'),
(497, 18, '2026-03-01', 'present', 'manual', NULL, NULL, '2026-03-02 16:45:11'),
(498, 20, '2026-03-01', 'present', 'manual', NULL, NULL, '2026-03-02 16:45:11'),
(499, 2, '2026-03-06', 'present', 'manual', NULL, NULL, '2026-03-06 22:17:26'),
(500, 3, '2026-03-06', 'present', 'manual', NULL, NULL, '2026-03-06 22:17:26'),
(501, 4, '2026-03-06', 'present', 'manual', NULL, NULL, '2026-03-06 22:17:26'),
(502, 5, '2026-03-06', 'present', 'manual', NULL, NULL, '2026-03-06 22:17:26'),
(503, 6, '2026-03-06', 'present', 'manual', NULL, NULL, '2026-03-06 22:17:27'),
(504, 7, '2026-03-06', 'present', 'manual', NULL, NULL, '2026-03-06 22:17:27'),
(505, 8, '2026-03-06', 'present', 'manual', NULL, NULL, '2026-03-06 22:17:27'),
(506, 9, '2026-03-06', 'present', 'manual', NULL, NULL, '2026-03-06 22:17:28'),
(507, 10, '2026-03-06', 'absent', 'manual', NULL, NULL, '2026-03-06 22:17:28'),
(508, 11, '2026-03-06', 'present', 'manual', NULL, NULL, '2026-03-06 22:17:28'),
(509, 12, '2026-03-06', 'present', 'manual', NULL, NULL, '2026-03-06 22:17:29'),
(510, 13, '2026-03-06', 'half_day', 'manual', NULL, NULL, '2026-03-06 22:17:29'),
(511, 14, '2026-03-06', 'present', 'manual', NULL, NULL, '2026-03-06 22:17:29'),
(512, 15, '2026-03-06', 'present', 'manual', NULL, NULL, '2026-03-06 22:17:29'),
(513, 16, '2026-03-06', 'present', 'manual', NULL, NULL, '2026-03-06 22:17:30'),
(514, 17, '2026-03-06', 'present', 'manual', NULL, NULL, '2026-03-06 22:17:30'),
(515, 18, '2026-03-06', 'present', 'manual', NULL, NULL, '2026-03-06 22:17:30'),
(516, 20, '2026-03-06', 'present', 'manual', NULL, NULL, '2026-03-06 22:17:31'),
(517, 2, '2026-03-05', 'present', 'manual', NULL, NULL, '2026-03-06 22:17:48'),
(518, 3, '2026-03-05', 'present', 'manual', NULL, NULL, '2026-03-06 22:17:49'),
(519, 4, '2026-03-05', 'present', 'manual', NULL, NULL, '2026-03-06 22:17:49'),
(520, 5, '2026-03-05', 'present', 'manual', NULL, NULL, '2026-03-06 22:17:49'),
(521, 6, '2026-03-05', 'present', 'manual', NULL, NULL, '2026-03-06 22:17:50'),
(522, 7, '2026-03-05', 'present', 'manual', NULL, NULL, '2026-03-06 22:17:50'),
(523, 8, '2026-03-05', 'present', 'manual', NULL, NULL, '2026-03-06 22:17:50'),
(524, 9, '2026-03-05', 'present', 'manual', NULL, NULL, '2026-03-06 22:17:51'),
(525, 10, '2026-03-05', 'present', 'manual', NULL, NULL, '2026-03-06 22:17:51'),
(526, 11, '2026-03-05', 'present', 'manual', NULL, NULL, '2026-03-06 22:17:51'),
(527, 12, '2026-03-05', 'present', 'manual', NULL, NULL, '2026-03-06 22:17:52'),
(528, 13, '2026-03-05', 'present', 'manual', NULL, NULL, '2026-03-06 22:17:52'),
(529, 14, '2026-03-05', 'present', 'manual', NULL, NULL, '2026-03-06 22:17:52'),
(530, 15, '2026-03-05', 'present', 'manual', NULL, NULL, '2026-03-06 22:17:52'),
(531, 16, '2026-03-05', 'present', 'manual', NULL, NULL, '2026-03-06 22:17:53'),
(532, 17, '2026-03-05', 'present', 'manual', NULL, NULL, '2026-03-06 22:17:53'),
(533, 18, '2026-03-05', 'present', 'manual', NULL, NULL, '2026-03-06 22:17:53'),
(534, 20, '2026-03-05', 'present', 'manual', NULL, NULL, '2026-03-06 22:17:54'),
(535, 2, '2026-03-04', 'holiday', 'manual', NULL, NULL, '2026-03-06 22:18:22'),
(536, 3, '2026-03-04', 'holiday', 'manual', NULL, NULL, '2026-03-06 22:18:22'),
(537, 4, '2026-03-04', 'holiday', 'manual', NULL, NULL, '2026-03-06 22:18:23'),
(538, 5, '2026-03-04', 'holiday', 'manual', NULL, NULL, '2026-03-06 22:18:23'),
(539, 6, '2026-03-04', 'holiday', 'manual', NULL, NULL, '2026-03-06 22:18:24'),
(540, 7, '2026-03-04', 'holiday', 'manual', NULL, NULL, '2026-03-06 22:18:24'),
(541, 8, '2026-03-04', 'holiday', 'manual', NULL, NULL, '2026-03-06 22:18:24'),
(542, 9, '2026-03-04', 'holiday', 'manual', NULL, NULL, '2026-03-06 22:18:24'),
(543, 10, '2026-03-04', 'holiday', 'manual', NULL, NULL, '2026-03-06 22:18:25'),
(544, 11, '2026-03-04', 'holiday', 'manual', NULL, NULL, '2026-03-06 22:18:25'),
(545, 12, '2026-03-04', 'holiday', 'manual', NULL, NULL, '2026-03-06 22:18:25'),
(546, 13, '2026-03-04', 'holiday', 'manual', NULL, NULL, '2026-03-06 22:18:26'),
(547, 14, '2026-03-04', 'holiday', 'manual', NULL, NULL, '2026-03-06 22:18:26'),
(548, 15, '2026-03-04', 'holiday', 'manual', NULL, NULL, '2026-03-06 22:18:26'),
(549, 16, '2026-03-04', 'holiday', 'manual', NULL, NULL, '2026-03-06 22:18:27'),
(550, 17, '2026-03-04', 'holiday', 'manual', NULL, NULL, '2026-03-06 22:18:27'),
(551, 18, '2026-03-04', 'holiday', 'manual', NULL, NULL, '2026-03-06 22:18:28'),
(552, 20, '2026-03-04', 'holiday', 'manual', NULL, NULL, '2026-03-06 22:18:28'),
(553, 2, '2026-03-07', 'present', 'manual', NULL, NULL, '2026-03-07 13:07:13'),
(554, 3, '2026-03-07', 'present', 'manual', NULL, NULL, '2026-03-07 13:07:13'),
(555, 4, '2026-03-07', 'present', 'manual', NULL, NULL, '2026-03-07 13:07:17'),
(556, 5, '2026-03-07', 'present', 'manual', NULL, NULL, '2026-03-07 13:07:17'),
(557, 6, '2026-03-07', 'present', 'manual', NULL, NULL, '2026-03-07 13:07:17'),
(558, 7, '2026-03-07', 'present', 'manual', NULL, NULL, '2026-03-07 13:07:18'),
(559, 8, '2026-03-07', 'present', 'manual', NULL, NULL, '2026-03-07 13:07:18'),
(560, 9, '2026-03-07', 'present', 'manual', NULL, NULL, '2026-03-07 13:07:18'),
(561, 10, '2026-03-07', 'present', 'manual', NULL, NULL, '2026-03-07 13:07:19'),
(562, 11, '2026-03-07', 'present', 'manual', NULL, NULL, '2026-03-07 13:07:19'),
(563, 12, '2026-03-07', 'present', 'manual', NULL, NULL, '2026-03-07 13:07:19'),
(564, 13, '2026-03-07', 'present', 'manual', NULL, NULL, '2026-03-07 13:07:20'),
(565, 14, '2026-03-07', 'present', 'manual', NULL, NULL, '2026-03-07 13:07:20'),
(566, 15, '2026-03-07', 'present', 'manual', NULL, NULL, '2026-03-07 13:07:21'),
(567, 16, '2026-03-07', 'present', 'manual', NULL, NULL, '2026-03-07 13:07:21'),
(568, 17, '2026-03-07', 'present', 'manual', NULL, NULL, '2026-03-07 13:07:21'),
(569, 18, '2026-03-07', 'present', 'manual', NULL, NULL, '2026-03-07 13:07:22'),
(570, 20, '2026-03-07', 'present', 'manual', NULL, NULL, '2026-03-07 13:07:22'),
(571, 2, '2026-03-08', 'present', 'manual', NULL, NULL, '2026-03-08 15:12:37'),
(572, 3, '2026-03-08', 'present', 'manual', NULL, NULL, '2026-03-08 15:12:38'),
(573, 4, '2026-03-08', 'present', 'manual', NULL, NULL, '2026-03-08 15:12:38'),
(574, 5, '2026-03-08', 'present', 'manual', NULL, NULL, '2026-03-08 15:12:38'),
(575, 6, '2026-03-08', 'present', 'manual', NULL, NULL, '2026-03-08 15:12:39'),
(576, 7, '2026-03-08', 'present', 'manual', NULL, NULL, '2026-03-08 15:12:39'),
(577, 8, '2026-03-08', 'present', 'manual', NULL, NULL, '2026-03-08 15:12:39'),
(578, 9, '2026-03-08', 'present', 'manual', NULL, NULL, '2026-03-08 15:12:40'),
(579, 10, '2026-03-08', 'present', 'manual', NULL, NULL, '2026-03-08 15:12:40'),
(580, 11, '2026-03-08', 'present', 'manual', NULL, NULL, '2026-03-08 15:12:40'),
(581, 12, '2026-03-08', 'present', 'manual', NULL, NULL, '2026-03-08 15:12:41'),
(582, 13, '2026-03-08', 'present', 'manual', NULL, NULL, '2026-03-08 15:12:41'),
(583, 14, '2026-03-08', 'present', 'manual', NULL, NULL, '2026-03-08 15:12:41'),
(584, 15, '2026-03-08', 'present', 'manual', NULL, NULL, '2026-03-08 15:12:42'),
(585, 16, '2026-03-08', 'present', 'manual', NULL, NULL, '2026-03-08 15:12:42'),
(586, 17, '2026-03-08', 'present', 'manual', NULL, NULL, '2026-03-08 15:12:43'),
(587, 18, '2026-03-08', 'present', 'manual', NULL, NULL, '2026-03-08 15:12:43'),
(588, 20, '2026-03-08', 'present', 'manual', NULL, NULL, '2026-03-08 15:12:43');

-- --------------------------------------------------------

--
-- Table structure for table `ci_sessions`
--

CREATE TABLE `ci_sessions` (
  `id` varchar(128) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `data` blob NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `mobile` varchar(15) NOT NULL,
  `alternate_mobile` varchar(15) DEFAULT NULL,
  `father_name` varchar(255) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `role` varchar(50) DEFAULT NULL,
  `monthly_salary` decimal(10,2) NOT NULL,
  `join_date` date DEFAULT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`id`, `name`, `mobile`, `alternate_mobile`, `father_name`, `date_of_birth`, `role`, `monthly_salary`, `join_date`, `profile_image`, `status`, `created_at`) VALUES
(2, 'Ajara', '9005770491', NULL, NULL, NULL, NULL, 6000.00, '2026-01-31', NULL, 'active', '2026-02-05 13:58:24'),
(3, 'Ajay', '7234998245', NULL, NULL, NULL, NULL, 8000.00, '2026-01-31', NULL, 'active', '2026-02-05 13:59:16'),
(4, 'Akhilesh Kumar', '9628717190', NULL, NULL, NULL, NULL, 8000.00, '2026-01-31', NULL, 'active', '2026-02-05 14:01:04'),
(5, 'Anil Kumar Rai', '9628487745', NULL, NULL, NULL, NULL, 10000.00, '2026-01-31', NULL, 'active', '2026-02-05 14:01:47'),
(6, 'Kajal', '8840364072', NULL, NULL, NULL, NULL, 8000.00, '2026-01-31', NULL, 'active', '2026-02-05 14:02:47'),
(7, 'Neeraj', '8576959518', NULL, NULL, NULL, NULL, 10000.00, '2026-01-31', NULL, 'active', '2026-02-05 14:03:19'),
(8, 'Priyanka', '7398868505', NULL, NULL, NULL, NULL, 9000.00, '2026-01-31', NULL, 'active', '2026-02-05 14:04:06'),
(9, 'Rishu', '9129074041', NULL, NULL, NULL, NULL, 8000.00, '2026-01-31', NULL, 'active', '2026-02-05 14:04:45'),
(10, 'Rubi', '8707682916', NULL, NULL, NULL, NULL, 6000.00, '2026-01-31', NULL, 'active', '2026-02-05 14:05:17'),
(11, 'Sachin Pathak', '9628752071', NULL, NULL, NULL, NULL, 15000.00, '2026-01-31', NULL, 'active', '2026-02-05 14:05:56'),
(12, 'Sillu', '9170251424', NULL, NULL, NULL, NULL, 9000.00, '2026-01-31', NULL, 'active', '2026-02-05 14:06:32'),
(13, 'Subi', '8423171518', NULL, NULL, NULL, NULL, 6000.00, '2026-01-31', NULL, 'active', '2026-02-05 14:07:27'),
(14, 'Vishal Prajapati', '8858168116', NULL, NULL, NULL, NULL, 8000.00, '2026-01-31', NULL, 'active', '2026-02-05 14:08:08'),
(15, 'Vishal Yadav', '6389725567', NULL, NULL, NULL, NULL, 9000.00, '2026-01-31', NULL, 'active', '2026-02-05 14:08:59'),
(16, 'Vijendra Prajapati', '8853401029', NULL, NULL, NULL, NULL, 15000.00, '2026-01-31', NULL, 'active', '2026-02-05 14:09:53'),
(17, 'Narendra Prajapati', '7607364294', NULL, NULL, NULL, NULL, 15000.00, '2026-01-31', '/uploads/employees/1771734914_29e9b4c63816b5302caa.jpg', 'active', '2026-02-05 14:10:36'),
(18, 'Sandeep Prajapati', '9628717175', NULL, NULL, NULL, NULL, 15000.00, '2026-01-31', '/uploads/employees/1771855103_c562025455cdf12f033f.jpg', 'active', '2026-02-05 14:10:56'),
(20, 'Aanchal', '8853531183', NULL, NULL, NULL, NULL, 8000.00, '2026-02-13', NULL, 'active', '2026-02-25 11:02:03');

-- --------------------------------------------------------

--
-- Table structure for table `hold_salary`
--

CREATE TABLE `hold_salary` (
  `id` int(11) UNSIGNED NOT NULL,
  `employee_id` int(11) UNSIGNED NOT NULL,
  `initial_hold_days` decimal(10,2) NOT NULL,
  `remaining_hold_days` decimal(10,2) NOT NULL,
  `daily_rate` decimal(10,2) NOT NULL,
  `payroll_id` int(11) UNSIGNED DEFAULT NULL,
  `total` decimal(10,2) NOT NULL,
  `status` enum('active','released','cancelled') DEFAULT 'active',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `hold_salary_releases`
--

CREATE TABLE `hold_salary_releases` (
  `id` int(10) UNSIGNED NOT NULL,
  `hold_salary_id` int(10) UNSIGNED NOT NULL,
  `payroll_id` int(10) UNSIGNED NOT NULL,
  `release_type` enum('auto','manual') NOT NULL DEFAULT 'auto',
  `days_released` decimal(5,2) NOT NULL DEFAULT 0.00,
  `amount_released` decimal(10,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `version` varchar(255) NOT NULL,
  `class` varchar(255) NOT NULL,
  `group` varchar(255) NOT NULL,
  `namespace` varchar(255) NOT NULL,
  `time` int(11) NOT NULL,
  `batch` int(11) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `version`, `class`, `group`, `namespace`, `time`, `batch`) VALUES
(1, '2026-02-05-000001', 'App\\Database\\Migrations\\AllTablesFromDbSchema', 'default', 'App', 1770468677, 1),
(2, '2026-02-05-100000', 'App\\Database\\Migrations\\AdvanceOvertimeFineAndPayrollRename', 'default', 'App', 1770468677, 1),
(3, '2026-02-05-200000', 'App\\Database\\Migrations\\AdvanceOvertimeFineTypeAmount', 'default', 'App', 1770468677, 1),
(4, '2026-02-05-300000', 'App\\Database\\Migrations\\AddJoinDateToEmployees', 'default', 'App', 1770468677, 1),
(5, '2026-02-05-400000', 'App\\Database\\Migrations\\AddRepayMonthsToAdvance', 'default', 'App', 1770468677, 1),
(6, '2026-02-07-133000', 'App\\Database\\Migrations\\ForceAddRepayMonths', 'default', 'App', 1770469876, 2),
(7, '2026_02_08_000001', 'App\\Database\\Migrations\\AddWeekendColumnsToPayroll', 'default', 'App', 1770504687, 3),
(8, '2026_02_09_000001', 'App\\Database\\Migrations\\HoldSalaryTables', 'default', 'App', 1770512343, 4),
(9, '2026_02_09_000002', 'App\\Database\\Migrations\\AddHoldDeductionToPayroll', 'default', 'App', 1770514631, 5),
(10, '2026_02_10_000001', 'App\\Database\\Migrations\\AddSourceToAttendance', 'default', 'App', 1770533898, 6),
(11, '2026_02_11_000001', 'App\\Database\\Migrations\\HoldSalaryMultipleRowsAndPayrollId', 'default', 'App', 1770542502, 7),
(12, '2026_02_11_000002', 'App\\Database\\Migrations\\DropHoldSalaryUniqueEmployee', 'default', 'App', 1770543240, 8),
(13, '2026_03_09_000001', 'EmployeeApi\\Database\\Migrations\\CreateAdminsTable', 'default', 'App', 1773048740, 9),
(14, '2026_03_09_000002', 'EmployeeApi\\Database\\Migrations\\AddCompanyFieldsToUsers', 'default', 'App', 1773048742, 9),
(15, '2026_03_09_000003', 'EmployeeApi\\Database\\Migrations\\AddCompanyProfileFieldsToUsers', 'default', 'App', 1773051672, 10);

-- --------------------------------------------------------

--
-- Table structure for table `payroll`
--

CREATE TABLE `payroll` (
  `id` int(10) UNSIGNED NOT NULL,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `month` int(11) NOT NULL,
  `year` int(11) NOT NULL,
  `total_days` int(11) NOT NULL,
  `days_divisor` int(11) NOT NULL DEFAULT 30,
  `present_days` int(11) NOT NULL,
  `half_days` int(11) NOT NULL,
  `absent_days` int(11) NOT NULL,
  `weekend_holiday_days` int(11) DEFAULT 0,
  `weekend_absent_days` int(11) DEFAULT 0,
  `weekend_holiday_amount` decimal(10,2) DEFAULT 0.00,
  `base_salary` decimal(10,2) NOT NULL,
  `overtime` decimal(10,2) DEFAULT 0.00,
  `fine` decimal(10,2) DEFAULT 0.00,
  `advance_deduction` decimal(10,2) DEFAULT 0.00,
  `deduction` decimal(10,2) DEFAULT 0.00,
  `hold_salary_released` decimal(10,2) DEFAULT 0.00,
  `hold_deduction` decimal(10,2) DEFAULT 0.00,
  `total_salary` decimal(10,2) NOT NULL,
  `paid` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payroll`
--

INSERT INTO `payroll` (`id`, `employee_id`, `month`, `year`, `total_days`, `present_days`, `half_days`, `absent_days`, `weekend_holiday_days`, `weekend_absent_days`, `weekend_holiday_amount`, `base_salary`, `overtime`, `fine`, `advance_deduction`, `deduction`, `hold_salary_released`, `hold_deduction`, `total_salary`, `paid`, `created_at`, `updated_at`) VALUES
(63, 3, 2, 2026, 28, 22, 0, 6, 0, 4, 0.00, 8000.00, 0.00, 266.00, 1000.00, 0.00, 0.00, 0.00, 4600.67, 1, '2026-03-01 11:34:30', NULL),
(64, 2, 2, 2026, 24, 24, 0, 0, 4, 0, 800.00, 6000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 5600.00, 1, '2026-03-01 11:40:41', NULL),
(65, 4, 2, 2026, 24, 24, 0, 0, 4, 0, 1066.67, 8000.00, 0.00, 0.00, 2000.00, 0.00, 0.00, 0.00, 4400.00, 1, '2026-03-01 11:41:11', NULL),
(66, 5, 2, 2026, 24, 23, 0, 1, 4, 0, 1333.33, 10000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 9000.00, 1, '2026-03-01 11:44:33', NULL),
(67, 6, 2, 2026, 24, 24, 0, 0, 4, 0, 1066.67, 8000.00, 0.00, 0.00, 270.00, 0.00, 0.00, 0.00, 6130.00, 1, '2026-03-01 11:46:21', NULL),
(68, 7, 2, 2026, 24, 24, 0, 0, 4, 0, 1333.33, 10000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 9333.33, 1, '2026-03-01 11:47:38', NULL),
(69, 8, 2, 2026, 24, 24, 0, 0, 4, 0, 1200.00, 9000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8400.00, 1, '2026-03-01 11:47:38', NULL),
(70, 9, 2, 2026, 24, 24, 0, 0, 4, 0, 1066.67, 8000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 7466.67, 1, '2026-03-01 11:47:38', NULL),
(71, 10, 2, 2026, 24, 24, 0, 0, 4, 0, 800.00, 6000.00, 0.00, 0.00, 1000.00, 0.00, 0.00, 0.00, 3800.00, 1, '2026-03-01 11:47:38', NULL),
(72, 11, 2, 2026, 24, 24, 0, 0, 4, 0, 2000.00, 15000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 14000.00, 1, '2026-03-01 11:47:38', NULL),
(73, 12, 2, 2026, 28, 19, 0, 9, 0, 4, 0.00, 9000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 5700.00, 1, '2026-03-01 11:47:38', NULL),
(74, 13, 2, 2026, 24, 23, 1, 0, 4, 0, 800.00, 6000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 5500.00, 1, '2026-03-01 11:47:38', NULL),
(75, 14, 2, 2026, 24, 24, 0, 0, 4, 0, 1066.67, 8000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 7466.67, 0, '2026-03-01 11:47:38', NULL),
(76, 15, 2, 2026, 24, 24, 0, 0, 4, 0, 1200.00, 9000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8400.00, 0, '2026-03-01 11:47:38', NULL),
(77, 16, 2, 2026, 24, 24, 0, 0, 4, 0, 2000.00, 15000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 14000.00, 0, '2026-03-01 11:47:38', NULL),
(78, 17, 2, 2026, 24, 24, 0, 0, 4, 0, 2000.00, 15000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 14000.00, 0, '2026-03-01 11:47:38', NULL),
(79, 18, 2, 2026, 24, 24, 0, 0, 4, 0, 2000.00, 15000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 14000.00, 0, '2026-03-01 11:47:38', NULL),
(80, 20, 2, 2026, 14, 14, 0, 0, 2, 0, 533.33, 8000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 4266.66, 0, '2026-03-01 11:47:38', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','user') DEFAULT 'user',
  `profile_image` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `company_code` varchar(30) DEFAULT NULL,
  `company_name` varchar(150) DEFAULT NULL,
  `owner_name` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `plan_tier` enum('starter','pro','enterprise') DEFAULT 'starter',
  `company_status` enum('active','suspended','expired') DEFAULT 'active',
  `plan_expires_on` date DEFAULT NULL,
  `platform_access` enum('web','mobile','both') DEFAULT 'web',
  `last_login_at` datetime DEFAULT NULL,
  `last_login_ip` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`, `profile_image`, `status`, `company_code`, `company_name`, `owner_name`, `phone`, `address`, `plan_tier`, `company_status`, `plan_expires_on`, `platform_access`, `last_login_at`, `last_login_ip`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'admin@example.com', '$2y$10$BiNZeoZWXhNZRjd4SoNF1.hFzj2FFrphihtnN4dhv9nTUoBdoczJ2', 'admin', '/uploads/company/1773055968_c51b5ca8c069835013b5.png', 'active', NULL, 'Admin', 'Admin', '+91 7878787878', 'terwdfasdfa', 'starter', 'active', '2026-06-07', 'both', NULL, NULL, '2026-02-05 06:47:44', '2026-02-22 10:04:32');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_admins_email` (`email`);

--
-- Indexes for table `advances`
--
ALTER TABLE `advances`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_advances_employee_date` (`employee_id`,`date`);

--
-- Indexes for table `advance_overtime_fine`
--
ALTER TABLE `advance_overtime_fine`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_aof_employee_date` (`employee_id`,`date`);

--
-- Indexes for table `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_employee_date` (`employee_id`,`date`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `ci_sessions`
--
ALTER TABLE `ci_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ci_sessions_timestamp` (`timestamp`);

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `hold_salary`
--
ALTER TABLE `hold_salary`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `hold_salary_releases`
--
ALTER TABLE `hold_salary_releases`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_hold_salary` (`hold_salary_id`),
  ADD KEY `idx_payroll` (`payroll_id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payroll`
--
ALTER TABLE `payroll`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_employee_month_year` (`employee_id`,`month`,`year`),
  ADD KEY `idx_paid` (`paid`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `company_code` (`company_code`),
  ADD KEY `idx_status` (`status`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `advances`
--
ALTER TABLE `advances`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `advance_overtime_fine`
--
ALTER TABLE `advance_overtime_fine`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `attendance`
--
ALTER TABLE `attendance`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=589;

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `hold_salary`
--
ALTER TABLE `hold_salary`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `hold_salary_releases`
--
ALTER TABLE `hold_salary_releases`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `payroll`
--
ALTER TABLE `payroll`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=81;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `advances`
--
ALTER TABLE `advances`
  ADD CONSTRAINT `fk_advances_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `advance_overtime_fine`
--
ALTER TABLE `advance_overtime_fine`
  ADD CONSTRAINT `fk_aof_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `fk_attendance_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `hold_salary_releases`
--
ALTER TABLE `hold_salary_releases`
  ADD CONSTRAINT `fk_release_hold` FOREIGN KEY (`hold_salary_id`) REFERENCES `hold_salary` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_release_payroll` FOREIGN KEY (`payroll_id`) REFERENCES `payroll` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `payroll`
--
ALTER TABLE `payroll`
  ADD CONSTRAINT `fk_payroll_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `setting_name` varchar(100) NOT NULL,
  `setting_value` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_name` (`setting_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`setting_name`, `setting_value`, `created_at`, `updated_at`) VALUES
('payroll_mode', 'monthly', NOW(), NOW()),
('monthly_days', '30', NOW(), NOW());

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
