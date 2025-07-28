-- Give admin privileges to 0013rob@gmail.com
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users 
WHERE email = '0013rob@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;