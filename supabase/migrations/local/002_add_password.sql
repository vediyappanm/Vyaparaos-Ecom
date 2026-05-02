-- Add password field to users table
ALTER TABLE public.users ADD COLUMN password_hash TEXT;

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON public.users(email);
