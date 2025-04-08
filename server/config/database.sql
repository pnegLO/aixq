-- 创建数据库
CREATE DATABASE IF NOT EXISTS chinese_chess_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE chinese_chess_db;

-- 创建游戏表
CREATE TABLE IF NOT EXISTS games (
  id INT AUTO_INCREMENT PRIMARY KEY,
  gameId VARCHAR(36) NOT NULL UNIQUE,
  boardState JSON NOT NULL,
  currentTurn VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'waiting',
  players JSON NOT NULL,
  moveHistory JSON NOT NULL,
  chatMessages JSON NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (gameId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 添加一些提示和说明
-- 注意：此脚本会创建数据库和表结构，可以根据需要修改。
-- 运行方式： mysql -u root -p < config/database.sql 