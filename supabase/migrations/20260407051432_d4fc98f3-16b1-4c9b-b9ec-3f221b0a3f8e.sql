-- Fix: Replace overly permissive conversations UPDATE policy with owner-scoped one
DROP POLICY IF EXISTS "Anyone can update conversations" ON conversations;

CREATE POLICY "Profile owners can update their conversations"
  ON conversations FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Also tighten messages INSERT to restrict to service role only (remove WITH CHECK true)
DROP POLICY IF EXISTS "Service can insert messages" ON messages;

CREATE POLICY "Service role can insert messages"
  ON messages FOR INSERT
  TO service_role
  WITH CHECK (true);