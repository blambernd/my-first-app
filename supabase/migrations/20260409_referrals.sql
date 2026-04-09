-- PROJ-18: Empfehlungsprogramm (Referral)

-- Add referral fields to subscriptions
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS referral_bonus_months INTEGER DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS referral_bonus_until TIMESTAMPTZ;

-- Generate referral codes for existing subscriptions that don't have one
UPDATE subscriptions
SET referral_code = substr(md5(random()::text || id::text), 1, 8)
WHERE referral_code IS NULL;

-- Make referral_code NOT NULL after backfill
ALTER TABLE subscriptions ALTER COLUMN referral_code SET NOT NULL;
ALTER TABLE subscriptions ALTER COLUMN referral_code SET DEFAULT substr(md5(random()::text), 1, 8);

CREATE INDEX IF NOT EXISTS idx_subscriptions_referral_code ON subscriptions(referral_code);

-- Referrals tracking table
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(referred_id)
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Referrer can see their own referrals (no personal data of referred user)
CREATE POLICY "Users can read own referrals as referrer" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id);

-- Service role handles all writes (no direct user writes)

CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX idx_referrals_status ON referrals(status);

-- Update create_default_subscription to include referral_code
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (user_id, plan, status, trial_end, referral_code)
  VALUES (
    NEW.id,
    'trial',
    'trialing',
    NOW() + INTERVAL '14 days',
    substr(md5(random()::text || NEW.id::text), 1, 8)
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'create_default_subscription failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process referral after signup (called from on_auth_user_created)
CREATE OR REPLACE FUNCTION process_referral_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  ref_code TEXT;
  referrer_user_id UUID;
BEGIN
  -- Check if the new user has a referral_code in raw_user_meta_data
  ref_code := NEW.raw_user_meta_data ->> 'referral_code';

  IF ref_code IS NOT NULL AND ref_code != '' THEN
    -- Find the referrer by their referral code
    SELECT user_id INTO referrer_user_id
    FROM subscriptions
    WHERE referral_code = ref_code;

    -- Only create referral if referrer exists and is not the same user
    IF referrer_user_id IS NOT NULL AND referrer_user_id != NEW.id THEN
      INSERT INTO referrals (referrer_id, referred_id, referral_code, status)
      VALUES (referrer_user_id, NEW.id, ref_code, 'pending')
      ON CONFLICT (referred_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'process_referral_on_signup failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_referral
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION process_referral_on_signup();
