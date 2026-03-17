
-- Add theme_preference to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme_preference text DEFAULT 'system';

-- Create error_logs table for tracking enhancement failures
CREATE TABLE public.error_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  error_type text NOT NULL,
  error_message text NOT NULL,
  error_code integer,
  mode text,
  model_used text,
  provider text,
  request_context jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all error logs
CREATE POLICY "Admins can view all error logs"
ON public.error_logs
FOR SELECT
TO authenticated
USING (public.has_admin_role(auth.uid()));

-- Users can insert their own error logs
CREATE POLICY "Users can insert error logs"
ON public.error_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Anonymous can insert error logs
CREATE POLICY "Anonymous can insert error logs"
ON public.error_logs
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

-- Create index for efficient querying
CREATE INDEX idx_error_logs_created_at ON public.error_logs (created_at DESC);
CREATE INDEX idx_error_logs_error_type ON public.error_logs (error_type);
