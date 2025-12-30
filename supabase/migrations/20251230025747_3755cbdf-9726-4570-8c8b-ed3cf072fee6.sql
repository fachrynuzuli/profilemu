-- Create conversations table to track chat analytics
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  visitor_id TEXT, -- anonymous identifier for the visitor
  messages_count INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Profile owners can view their own conversation analytics
CREATE POLICY "Profile owners can view their conversations"
ON public.conversations
FOR SELECT
USING (
  profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Anyone can insert conversations (for anonymous visitors chatting)
CREATE POLICY "Anyone can create conversations"
ON public.conversations
FOR INSERT
WITH CHECK (true);

-- Anyone can update conversations (to increment message count)
CREATE POLICY "Anyone can update conversations"
ON public.conversations
FOR UPDATE
USING (true);

-- Create index for faster queries
CREATE INDEX idx_conversations_profile_id ON public.conversations(profile_id);
CREATE INDEX idx_conversations_started_at ON public.conversations(started_at);