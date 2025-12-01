-- ============================================
-- ADD TOKEN COLUMN TO INVITATIONS
-- ============================================
-- For the new accept-invite flow where users click a link first,
-- then login with Google OAuth

-- Add token column for invitation links
ALTER TABLE public.invitations 
ADD COLUMN IF NOT EXISTS token TEXT UNIQUE;

-- Create index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);

-- Function to generate secure random token
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random token (32 characters)
    v_token := encode(gen_random_bytes(24), 'base64');
    v_token := replace(v_token, '/', '_');
    v_token := replace(v_token, '+', '-');
    v_token := replace(v_token, '=', '');
    
    -- Check if token already exists
    SELECT EXISTS(SELECT 1 FROM public.invitations WHERE invitations.token = v_token) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_token;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate token on insert
CREATE OR REPLACE FUNCTION public.set_invitation_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.token IS NULL THEN
    NEW.token := public.generate_invitation_token();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_invitation_insert_set_token
  BEFORE INSERT ON public.invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_invitation_token();

-- Backfill tokens for existing invitations
UPDATE public.invitations
SET token = public.generate_invitation_token()
WHERE token IS NULL;

-- Make token NOT NULL after backfill
ALTER TABLE public.invitations
ALTER COLUMN token SET NOT NULL;

COMMENT ON COLUMN public.invitations.token IS 'Unique token for invitation acceptance link';
COMMENT ON FUNCTION public.generate_invitation_token() IS 'Generate a secure random token for invitation links';

-- ============================================
-- Migration complete!
-- ============================================

