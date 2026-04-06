
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Profile owners can view messages from their conversations
CREATE POLICY "Profile owners can view messages"
ON public.messages
FOR SELECT
TO public
USING (
  conversation_id IN (
    SELECT c.id FROM public.conversations c
    JOIN public.profiles p ON c.profile_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

-- Anyone can insert messages (edge function uses service role, but public needs this for anon)
CREATE POLICY "Service can insert messages"
ON public.messages
FOR INSERT
TO public
WITH CHECK (true);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
