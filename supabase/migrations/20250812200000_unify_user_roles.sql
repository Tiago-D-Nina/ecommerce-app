-- ============================================================================
-- UNIFY USER AUTHENTICATION - REMOVE ADMIN_USERS, ADD ROLE TO USERS
-- Date: 2025-08-12 20:00:00
-- Description: Simplify authentication by using single users table with roles
-- ============================================================================

-- 1. Add role column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin'));

-- 2. Add admin-specific fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- 3. Migrate existing admin_users data to users table (if any exists)
DO $$
DECLARE
    admin_record RECORD;
BEGIN
    -- Check if admin_users table exists and has data
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admin_users' AND table_schema = 'public') THEN
        
        -- Migrate admin users to users table
        FOR admin_record IN 
            SELECT * FROM public.admin_users WHERE is_active = true
        LOOP
            -- Update or insert admin user in users table
            INSERT INTO public.users (
                id, 
                email, 
                full_name, 
                avatar_url, 
                role, 
                permissions, 
                last_login_at,
                created_at, 
                updated_at
            ) VALUES (
                admin_record.id,
                admin_record.email,
                admin_record.full_name,
                admin_record.avatar_url,
                admin_record.role, -- 'super_admin' or 'admin' becomes 'admin'
                admin_record.permissions,
                admin_record.last_login_at,
                admin_record.created_at,
                admin_record.updated_at
            )
            ON CONFLICT (id) DO UPDATE SET
                role = CASE 
                    WHEN admin_record.role IN ('super_admin', 'admin', 'manager') THEN 'admin'
                    ELSE 'customer'
                END,
                permissions = admin_record.permissions,
                last_login_at = admin_record.last_login_at,
                updated_at = NOW();
                
            RAISE NOTICE 'Migrated admin user: %', admin_record.email;
        END LOOP;
        
    END IF;
END $$;

-- 4. Set specific user as admin (the one from previous migrations)
UPDATE public.users 
SET 
    role = 'admin',
    permissions = jsonb_build_object(
        'users', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
        'products', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
        'orders', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
        'categories', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
        'analytics', jsonb_build_object('read', true),
        'settings', jsonb_build_object('read', true, 'update', true),
        'admin_users', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true)
    ),
    updated_at = NOW()
WHERE id = '5d7501b5-741e-4514-8b2a-a65f1007d064';

-- 5. Create function to check if user has admin permissions
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(user_id UUID DEFAULT auth.uid())
RETURNS JSONB AS $$
DECLARE
    user_permissions JSONB;
BEGIN
    SELECT permissions INTO user_permissions
    FROM public.users
    WHERE id = user_id AND role = 'admin';
    
    RETURN COALESCE(user_permissions, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Update last_login function
CREATE OR REPLACE FUNCTION update_last_login(user_id UUID DEFAULT auth.uid())
RETURNS VOID AS $$
BEGIN
    UPDATE public.users 
    SET last_login_at = NOW()
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_role_active ON public.users(role) WHERE role = 'admin';

-- 9. Update RLS policies for role-based access
-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Admin users can manage all data" ON public.users;

-- Create new admin access policy
CREATE POLICY "Admin users can read all user data" ON public.users
    FOR SELECT USING (
        auth.uid() = id OR is_admin(auth.uid())
    );

CREATE POLICY "Admin users can update user roles and permissions" ON public.users
    FOR UPDATE USING (
        auth.uid() = id OR is_admin(auth.uid())
    );

-- 10. Grant permissions for new functions
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_permissions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_last_login(UUID) TO authenticated;

-- 11. Clean up - Drop admin_users table and related functions
DROP TABLE IF EXISTS public.admin_users CASCADE;
DROP FUNCTION IF EXISTS authenticate_admin(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_admin_by_id(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_admin_password(UUID, TEXT, TEXT) CASCADE;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check the updated users table structure
SELECT 
    'Users table structure:' as info,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verify admin user exists
SELECT 
    'Admin user verification:' as info,
    id,
    email,
    full_name,
    role,
    permissions,
    created_at
FROM public.users 
WHERE role = 'admin';

-- Test admin functions
SELECT 
    'Testing admin functions:' as info,
    is_admin('5d7501b5-741e-4514-8b2a-a65f1007d064') as is_user_admin;

-- List available functions
SELECT 
    'Available user functions:' as info,
    routine_name, 
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
AND (routine_name LIKE '%user%' OR routine_name LIKE '%admin%')
ORDER BY routine_name;

-- Success message
SELECT '✅ User role unification completed!' as status;
SELECT 'Admin users can now login with regular authentication!' as message;
SELECT 'Use email + password from users table with role = admin' as instructions;

-- Add comment to track this migration
COMMENT ON COLUMN public.users.role IS 'User role: customer or admin - Unified auth migration 2025-08-12';