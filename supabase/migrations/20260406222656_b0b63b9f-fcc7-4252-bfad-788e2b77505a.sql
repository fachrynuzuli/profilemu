
ALTER TABLE public.profiles
ADD COLUMN greeting_message text DEFAULT NULL,
ADD COLUMN tone text DEFAULT 'friendly',
ADD COLUMN response_length text DEFAULT 'balanced';
