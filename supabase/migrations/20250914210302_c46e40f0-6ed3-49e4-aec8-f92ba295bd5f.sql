-- Add username column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN username text UNIQUE;

-- Add constraint to ensure username format (lowercase alphanumeric with dots, underscores, hyphens)
ALTER TABLE public.profiles 
ADD CONSTRAINT username_format_check 
CHECK (username ~* '^[a-z0-9._-]{3,32}$');

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.username IS 'Username for login (lowercase, 3-32 chars, alphanumeric with ., _, -)';

-- Update existing admin user with username based on role
UPDATE public.profiles 
SET username = 'admin' 
WHERE role = 'admin' AND username IS NULL;