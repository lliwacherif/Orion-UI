-- Migration: Create Admin Table
-- Run this migration to add admin functionality to your Orion database
-- Default credentials: username='admin', password='admin'

-- =============================================
-- STEP 1: Create the admins table
-- =============================================

CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);

-- =============================================
-- STEP 2: Insert default admin user
-- Password: 'admin' hashed with bcrypt
-- You can generate a new hash in Python with:
--   from passlib.context import CryptContext
--   pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
--   print(pwd_context.hash("admin"))
-- =============================================

-- The hash below is for password 'admin'
-- $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.S1gKj8Og5x6b.m
INSERT INTO admins (username, hashed_password) 
VALUES ('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.S1gKj8Og5x6b.m')
ON CONFLICT (username) DO NOTHING;

-- =============================================
-- STEP 3: Add helper views for admin dashboard
-- =============================================

-- View: User statistics for admin dashboard
CREATE OR REPLACE VIEW admin_user_stats AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.full_name,
    u.job_title,
    u.is_active,
    u.plan_type,
    u.created_at,
    COALESCE(conv.conversation_count, 0) as conversation_count,
    COALESCE(msg.message_count, 0) as message_count,
    conv.last_activity
FROM users u
LEFT JOIN (
    SELECT 
        user_id, 
        COUNT(*) as conversation_count,
        MAX(updated_at) as last_activity
    FROM conversations 
    WHERE is_deleted = FALSE
    GROUP BY user_id
) conv ON u.id = conv.user_id
LEFT JOIN (
    SELECT 
        c.user_id,
        COUNT(m.id) as message_count
    FROM conversations c
    JOIN messages m ON c.id = m.conversation_id
    WHERE c.is_deleted = FALSE
    GROUP BY c.user_id
) msg ON u.id = msg.user_id
WHERE u.is_active = TRUE
ORDER BY u.created_at DESC;

-- =============================================
-- STEP 4: Create function to update timestamp
-- =============================================

CREATE OR REPLACE FUNCTION update_admin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS trigger_update_admin_timestamp ON admins;
CREATE TRIGGER trigger_update_admin_timestamp
    BEFORE UPDATE ON admins
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_updated_at();

-- =============================================
-- VERIFICATION QUERIES (run after migration)
-- =============================================

-- Check if admin was created:
-- SELECT * FROM admins;

-- Check if view works:
-- SELECT * FROM admin_user_stats LIMIT 5;

-- =============================================
-- ROLLBACK SCRIPT (if needed)
-- =============================================
-- DROP VIEW IF EXISTS admin_user_stats;
-- DROP TRIGGER IF EXISTS trigger_update_admin_timestamp ON admins;
-- DROP FUNCTION IF EXISTS update_admin_updated_at();
-- DROP TABLE IF EXISTS admins;


