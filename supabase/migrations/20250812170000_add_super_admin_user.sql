-- Add specific user as super admin in admin_users table
-- User ID: 5d7501b5-741e-4514-8b2a-a65f1007d064

-- First, get the user's email from the users table to use in admin_users
DO $$
DECLARE
    user_email TEXT;
    user_full_name TEXT;
BEGIN
    -- Get user details from public.users table
    SELECT email, full_name INTO user_email, user_full_name
    FROM public.users 
    WHERE id = '5d7501b5-741e-4514-8b2a-a65f1007d064';
    
    -- Only proceed if user exists
    IF user_email IS NOT NULL THEN
        -- Insert or update the user in admin_users table
        INSERT INTO public.admin_users (
            id,
            email,
            password_hash,
            full_name,
            role,
            permissions,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            '5d7501b5-741e-4514-8b2a-a65f1007d064',
            user_email,
            -- Default password hash for 'admin123' - user should change this
            '$2b$10$rKvKpjKp4KVXM7TsNr1sF.xKHtKyVNVGm4KJQGkOyG3CcFP2FxFrm',
            COALESCE(user_full_name, 'Super Administrator'),
            'super_admin',
            jsonb_build_object(
                'users', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
                'products', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
                'orders', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
                'categories', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
                'analytics', jsonb_build_object('read', true),
                'settings', jsonb_build_object('read', true, 'update', true),
                'admin_users', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true)
            ),
            true,
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            role = 'super_admin',
            permissions = jsonb_build_object(
                'users', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
                'products', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
                'orders', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
                'categories', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
                'analytics', jsonb_build_object('read', true),
                'settings', jsonb_build_object('read', true, 'update', true),
                'admin_users', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true)
            ),
            is_active = true,
            updated_at = NOW();
            
        RAISE NOTICE 'User % has been set as super_admin', user_email;
    ELSE
        RAISE WARNING 'User with ID 5d7501b5-741e-4514-8b2a-a65f1007d064 not found in users table';
    END IF;
END $$;

-- Verify the insertion
SELECT 
    id,
    email,
    full_name,
    role,
    is_active,
    created_at
FROM public.admin_users 
WHERE id = '5d7501b5-741e-4514-8b2a-a65f1007d064';

-- Add comment to track this migration
COMMENT ON TABLE public.admin_users IS 'Super admin user added - Migration 2025-08-12 17:00:00';