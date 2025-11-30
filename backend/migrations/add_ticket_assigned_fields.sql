-- Migration: Add assigned_name and assigned_role fields to ticket table
-- Date: 2025-11-29

-- Add new columns for text-based assignment
ALTER TABLE ticket 
ADD COLUMN IF NOT EXISTS assigned_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS assigned_role VARCHAR(255);

-- Add comments for documentation
COMMENT ON COLUMN ticket.assigned_name IS 'Tên người được phân công xử lý ticket';
COMMENT ON COLUMN ticket.assigned_role IS 'Chức vụ/vai trò của người được phân công (VD: Thợ điện, Thợ sửa chữa, Bảo vệ)';
