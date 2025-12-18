CREATE DATABASE scratch;
USE scratch;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE written_code (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    code LONGTEXT,
    presets LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

ALTER TABLE written_code
ADD CONSTRAINT constraint_name UNIQUE (user_id, name);

CREATE USER 'test'@'%' IDENTIFIED BY 'test123';
GRANT ALL PRIVILEGES ON scratch.* TO 'test'@'%';
FLUSH PRIVILEGES;

=============================================================================

-- Enable event scheduler
SET GLOBAL event_scheduler = ON;

-- Create an event
CREATE EVENT delete_old_tokens
ON SCHEDULE EVERY 1 HOUR        -- runs every hour
DO
  DELETE FROM tokens
  WHERE created_at < NOW() - INTERVAL 1 DAY;