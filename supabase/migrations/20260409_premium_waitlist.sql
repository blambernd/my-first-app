-- Premium waitlist: collect emails of users interested in Premium plan
CREATE TABLE IF NOT EXISTS premium_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(email)
);

-- RLS
ALTER TABLE premium_waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can insert their own entry
CREATE POLICY "Users can join waitlist"
  ON premium_waitlist FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can see their own entry
CREATE POLICY "Users can view own waitlist entry"
  ON premium_waitlist FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
