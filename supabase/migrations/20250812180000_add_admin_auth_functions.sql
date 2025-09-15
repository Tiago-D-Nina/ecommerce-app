-- Add admin authentication functions and improve admin_users table
-- This migration creates the necessary functions for admin login

-- ============================================================================
-- 1. IMPROVE ADMIN_USERS TABLE
-- ============================================================================

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON public.admin_users(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role);

-- ============================================================================
-- 2. ADMIN AUTHENTICATION FUNCTIONS
-- ============================================================================

-- Function to authenticate admin user
CREATE OR REPLACE FUNCTION authenticate_admin(
    admin_email TEXT,
    admin_password TEXT
)
RETURNS jsonb AS $$
DECLARE
    admin_record public.admin_users;
    is_password_valid BOOLEAN := false;
BEGIN
    -- Get admin user by email
    SELECT * INTO admin_record
    FROM public.admin_users
    WHERE email = admin_email AND is_active = true;
    
    -- Check if admin exists
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Invalid credentials',
            'admin', null
        );
    END IF;
    
    -- Verify password (using crypt extension)
    -- Note: In production, you should use a proper password verification
    -- For now, we'll do a simple comparison with the stored hash
    SELECT (admin_record.password_hash = crypt(admin_password, admin_record.password_hash)) INTO is_password_valid;
    
    -- Check password
    IF NOT is_password_valid THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Invalid credentials',
            'admin', null
        );
    END IF;
    
    -- Update last login
    UPDATE public.admin_users 
    SET last_login_at = NOW() 
    WHERE id = admin_record.id;
    
    -- Return success with admin data (excluding password)
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Login successful',
        'admin', jsonb_build_object(
            'id', admin_record.id,
            'email', admin_record.email,
            'full_name', admin_record.full_name,
            'role', admin_record.role,
            'permissions', admin_record.permissions,
            'avatar_url', admin_record.avatar_url,
            'last_login_at', NOW()
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin by ID
CREATE OR REPLACE FUNCTION get_admin_by_id(admin_id UUID)
RETURNS jsonb AS $$
DECLARE
    admin_record public.admin_users;
BEGIN
    SELECT * INTO admin_record
    FROM public.admin_users
    WHERE id = admin_id AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Admin not found',
            'admin', null
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'admin', jsonb_build_object(
            'id', admin_record.id,
            'email', admin_record.email,
            'full_name', admin_record.full_name,
            'role', admin_record.role,
            'permissions', admin_record.permissions,
            'avatar_url', admin_record.avatar_url,
            'last_login_at', admin_record.last_login_at,
            'created_at', admin_record.created_at
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update admin password
CREATE OR REPLACE FUNCTION update_admin_password(
    admin_id UUID,
    current_password TEXT,
    new_password TEXT
)
RETURNS jsonb AS $$
DECLARE
    admin_record public.admin_users;
    is_current_password_valid BOOLEAN := false;
BEGIN
    -- Get admin user
    SELECT * INTO admin_record
    FROM public.admin_users
    WHERE id = admin_id AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Admin not found'
        );
    END IF;
    
    -- Verify current password
    SELECT (admin_record.password_hash = crypt(current_password, admin_record.password_hash)) INTO is_current_password_valid;
    
    IF NOT is_current_password_valid THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Current password is incorrect'
        );
    END IF;
    
    -- Update password
    UPDATE public.admin_users 
    SET 
        password_hash = crypt(new_password, gen_salt('bf')),
        updated_at = NOW()
    WHERE id = admin_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Password updated successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. RLS POLICIES FOR ADMIN FUNCTIONS
-- ============================================================================

-- Note: These functions use SECURITY DEFINER to bypass RLS
-- This is necessary for admin authentication
-- Access will be controlled through the frontend application

-- ============================================================================
-- 4. GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions to authenticated users
-- (Frontend will use service role for admin auth)
GRANT EXECUTE ON FUNCTION authenticate_admin(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_by_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_admin_password(UUID, TEXT, TEXT) TO authenticated;

-- Also grant to anon for initial admin login
GRANT EXECUTE ON FUNCTION authenticate_admin(TEXT, TEXT) TO anon;

-- ============================================================================
-- 5. VERIFICATION QUERIES
-- ============================================================================

-- Test the authenticate_admin function (use actual admin credentials)
-- SELECT authenticate_admin('admin@example.com', 'admin123');

-- Check admin_users table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'admin_users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- List all admin functions created
SELECT routine_name, routine_type, security_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
AND routine_name LIKE '%admin%'
ORDER BY routine_name;

-- Add comment to track this migration
COMMENT ON FUNCTION authenticate_admin(TEXT, TEXT) IS 'Admin authentication function - Created 2025-08-12';