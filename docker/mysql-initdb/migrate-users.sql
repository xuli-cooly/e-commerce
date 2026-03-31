-- 数据迁移：将 trading.users 数据复制到 auth.users
-- 执行前请确保 auth 数据库已创建（docker-compose 启动时自动创建）
-- 注意：auth-service 会通过 AutoMigrate 创建 users 表，请先启动 auth-service 再执行本迁移

INSERT INTO auth.users (id, phone, role, password, created_at, updated_at)
SELECT id, phone, role, password, created_at, updated_at
FROM trading.users
ON DUPLICATE KEY UPDATE
  phone = VALUES(phone),
  role = VALUES(role),
  password = VALUES(password),
  updated_at = VALUES(updated_at);
