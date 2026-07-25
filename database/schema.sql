-- ==========================================================
-- Mini CRM - Client Lead Management System
-- MySQL Database Schema
-- ==========================================================

-- Create Database
CREATE DATABASE IF NOT EXISTS mini_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mini_crm;

-- ----------------------------------------------------------
-- Table: admins
-- Stores admin login credentials (password is bcrypt hashed)
-- ----------------------------------------------------------
DROP TABLE IF EXISTS admins;
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Default admin account
-- username: admin
-- password: admin123   (already bcrypt hashed below)
INSERT INTO admins (username, password) VALUES
('admin', '$2a$10$feIoTw16cVppn7KCOh0KkuDZsBKB2s5CLZ9Q4xS5Om5iXLt7TIUZq');

-- ----------------------------------------------------------
-- Table: leads
-- Stores all client lead information
-- ----------------------------------------------------------
DROP TABLE IF EXISTS leads;
CREATE TABLE leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    source ENUM('Website', 'Facebook', 'Instagram', 'LinkedIn', 'Referral') NOT NULL DEFAULT 'Website',
    status ENUM('New', 'Contacted', 'Converted') NOT NULL DEFAULT 'New',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- ----------------------------------------------------------
-- Sample seed data (optional - remove if not needed)
-- ----------------------------------------------------------
INSERT INTO leads (name, email, phone, source, status, notes) VALUES
('Rahul Sharma', 'rahul.sharma@example.com', '9876543210', 'Website', 'New', 'Interested in premium plan.'),
('Priya Verma', 'priya.verma@example.com', '9123456780', 'Facebook', 'Contacted', 'Called on Monday, follow up next week.'),
('Amit Kumar', 'amit.kumar@example.com', '9988776655', 'Referral', 'Converted', 'Signed up for annual subscription.'),
('Sneha Gupta', 'sneha.gupta@example.com', '9090909090', 'Instagram', 'New', 'Sent DM asking for pricing.'),
('Vikram Singh', 'vikram.singh@example.com', '9871234560', 'LinkedIn', 'Contacted', 'Scheduled a demo call.');
