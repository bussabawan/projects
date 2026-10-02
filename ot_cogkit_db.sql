-- MySQL dump 10.13  Distrib 8.0.19, for Win64 (x86_64)
--
-- Host: localhost    Database: ot_cogkit_db
-- ------------------------------------------------------
-- Server version	8.4.10

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `category_data`
--

DROP TABLE IF EXISTS `category_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category_data` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `category_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `remove` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `category_in_exercises`
--

DROP TABLE IF EXISTS `category_in_exercises`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category_in_exercises` (
  `id` int NOT NULL AUTO_INCREMENT,
  `exercises_id` int NOT NULL,
  `category_id` int NOT NULL,
  `remove` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `exercises_id` (`exercises_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `category_in_exercises_ibfk_1` FOREIGN KEY (`exercises_id`) REFERENCES `exercises_data` (`exercises_id`) ON DELETE CASCADE,
  CONSTRAINT `category_in_exercises_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `category_data` (`category_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `exercises_data`
--

DROP TABLE IF EXISTS `exercises_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exercises_data` (
  `exercises_id` int NOT NULL AUTO_INCREMENT,
  `exercises_name` varchar(255) NOT NULL,
  `remove` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`exercises_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `login_logs`
--

DROP TABLE IF EXISTS `login_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `login_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `login_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `login_time` (`login_time`),
  CONSTRAINT `login_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users_data` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=587 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `matching_exercises_log`
--

DROP TABLE IF EXISTS `matching_exercises_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `matching_exercises_log` (
  `id_matching` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `exercises_id` int DEFAULT NULL,
  `total_questions` int NOT NULL,
  `total_answers` int NOT NULL,
  `click_count` int NOT NULL,
  `correct_count` int NOT NULL,
  `incorrect_count` int NOT NULL,
  `test_date` datetime DEFAULT NULL,
  `remove` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_matching`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `matching_exercises_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users_data` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `matching_question_time_log`
--

DROP TABLE IF EXISTS `matching_question_time_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `matching_question_time_log` (
  `id_time` int NOT NULL AUTO_INCREMENT,
  `id_matching` int NOT NULL,
  `photo_id` int NOT NULL,
  `time_per_question` time NOT NULL,
  `remove` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_time`),
  KEY `id_matching` (`id_matching`),
  KEY `photo_id` (`photo_id`),
  CONSTRAINT `matching_question_time_log_ibfk_1` FOREIGN KEY (`id_matching`) REFERENCES `matching_exercises_log` (`id_matching`) ON DELETE CASCADE,
  CONSTRAINT `matching_question_time_log_ibfk_2` FOREIGN KEY (`photo_id`) REFERENCES `photo_data` (`photo_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=121 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `memory_exercises_log`
--

DROP TABLE IF EXISTS `memory_exercises_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `memory_exercises_log` (
  `id_memory` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `exercises_id` int DEFAULT NULL,
  `total_questions` int NOT NULL,
  `total_answers` int NOT NULL,
  `display_time` int NOT NULL,
  `click_count` int NOT NULL,
  `correct_count` int NOT NULL,
  `incorrect_count` int NOT NULL,
  `test_date` datetime NOT NULL,
  `remove` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_memory`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `memory_exercises_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users_data` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `memory_question_time_log`
--

DROP TABLE IF EXISTS `memory_question_time_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `memory_question_time_log` (
  `id_time` int NOT NULL AUTO_INCREMENT,
  `id_memory` int NOT NULL,
  `photo_id` int NOT NULL,
  `time_per_question` time NOT NULL,
  `remove` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_time`),
  KEY `id_memory` (`id_memory`),
  KEY `photo_id` (`photo_id`),
  CONSTRAINT `memory_question_time_log_ibfk_1` FOREIGN KEY (`id_memory`) REFERENCES `memory_exercises_log` (`id_memory`) ON DELETE CASCADE,
  CONSTRAINT `memory_question_time_log_ibfk_2` FOREIGN KEY (`photo_id`) REFERENCES `photo_data` (`photo_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=200 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `patient_data`
--

DROP TABLE IF EXISTS `patient_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient_data` (
  `patient_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `exercises_id` int NOT NULL,
  `remove` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`patient_id`),
  KEY `user_id` (`user_id`),
  KEY `exercises_id` (`exercises_id`),
  CONSTRAINT `patient_data_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users_data` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `patient_data_ibfk_2` FOREIGN KEY (`exercises_id`) REFERENCES `exercises_data` (`exercises_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=152 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `photo_data`
--

DROP TABLE IF EXISTS `photo_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `photo_data` (
  `photo_id` int NOT NULL AUTO_INCREMENT,
  `photo_name` varchar(255) NOT NULL,
  `photo_title` varchar(255) NOT NULL,
  `audio_name` varchar(255) NOT NULL,
  `audio_time` float DEFAULT NULL,
  `audio_title` varchar(255) NOT NULL,
  `audio_gen` tinyint(1) NOT NULL,
  `remove` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`photo_id`)
) ENGINE=InnoDB AUTO_INCREMENT=220 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `photo_in_category`
--

DROP TABLE IF EXISTS `photo_in_category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `photo_in_category` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `photo_id` int NOT NULL,
  `remove` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  KEY `photo_id` (`photo_id`),
  CONSTRAINT `photo_in_category_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `category_data` (`category_id`) ON DELETE CASCADE,
  CONSTRAINT `photo_in_category_ibfk_2` FOREIGN KEY (`photo_id`) REFERENCES `photo_data` (`photo_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=291 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `photo_in_exercises`
--

DROP TABLE IF EXISTS `photo_in_exercises`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `photo_in_exercises` (
  `id` int NOT NULL AUTO_INCREMENT,
  `exercises_id` int NOT NULL,
  `photo_id` int NOT NULL,
  `remove` tinyint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `exercises_id` (`exercises_id`),
  KEY `photo_id` (`photo_id`),
  CONSTRAINT `photo_in_exercises_ibfk_1` FOREIGN KEY (`exercises_id`) REFERENCES `exercises_data` (`exercises_id`) ON DELETE CASCADE,
  CONSTRAINT `photo_in_exercises_ibfk_2` FOREIGN KEY (`photo_id`) REFERENCES `photo_data` (`photo_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=312 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users_data`
--

DROP TABLE IF EXISTS `users_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users_data` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `user_name` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` tinyint(1) NOT NULL COMMENT '1 = ผู้ป่วย, 2 = Admin',
  `login_quota` int NOT NULL DEFAULT '0',
  `update_time` datetime NOT NULL,
  `remove` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0 = ไม่ลบ, 1 = ลบ',
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'ot_cogkit_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-02 17:53:36
