-- ============================================
-- ADD INVITATION TRACKING FOR RATE LIMITING
-- ============================================

-- Add columns to track resend attempts
ALTER TABLE public.invitations 
ADD COLUMN IF NOT EXISTS send_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS daily_send_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS daily_send_reset_at DATE DEFAULT CURRENT_DATE;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_invitations_email_status ON public.invitations(email, status);
CREATE INDEX IF NOT EXISTS idx_invitations_daily_reset ON public.invitations(daily_send_reset_at);

-- Function to check if invitation can be resent (max 3 per day)
CREATE OR REPLACE FUNCTION public.can_resend_invitation(
    p_email TEXT,
    p_max_daily_sends INTEGER DEFAULT 3
)
RETURNS BOOLEAN AS $$
DECLARE
    v_invitation RECORD;
    v_can_resend BOOLEAN;
BEGIN
    -- Get latest invitation for this email
    SELECT * INTO v_invitation
    FROM public.invitations
    WHERE email = p_email
    AND status IN ('pending', 'expired')
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If no invitation exists, can send new one
    IF v_invitation IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Check if daily reset needed (new day)
    IF v_invitation.daily_send_reset_at < CURRENT_DATE THEN
        -- New day, reset counter
        RETURN TRUE;
    END IF;
    
    -- Check if under daily limit
    IF v_invitation.daily_send_count < p_max_daily_sends THEN
        RETURN TRUE;
    END IF;
    
    -- Exceeded daily limit
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment send count
CREATE OR REPLACE FUNCTION public.increment_invitation_send_count(
    p_invitation_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_invitation RECORD;
BEGIN
    -- Get current invitation
    SELECT * INTO v_invitation
    FROM public.invitations
    WHERE id = p_invitation_id;
    
    IF v_invitation IS NULL THEN
        RAISE EXCEPTION 'Invitation not found';
    END IF;
    
    -- Check if need to reset daily counter (new day)
    IF v_invitation.daily_send_reset_at < CURRENT_DATE THEN
        -- New day, reset daily counter
        UPDATE public.invitations
        SET 
            send_count = send_count + 1,
            daily_send_count = 1,
            daily_send_reset_at = CURRENT_DATE,
            last_sent_at = NOW(),
            updated_at = NOW()
        WHERE id = p_invitation_id;
    ELSE
        -- Same day, increment counter
        UPDATE public.invitations
        SET 
            send_count = send_count + 1,
            daily_send_count = daily_send_count + 1,
            last_sent_at = NOW(),
            updated_at = NOW()
        WHERE id = p_invitation_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has completed signup (has profile)
CREATE OR REPLACE FUNCTION public.user_has_completed_signup(
    p_email TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- User has completed signup if they have a profile
    RETURN EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE email = p_email
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helpful comments
COMMENT ON COLUMN public.invitations.send_count IS 'Total number of times invitation was sent (including initial send)';
COMMENT ON COLUMN public.invitations.daily_send_count IS 'Number of times sent today (resets daily)';
COMMENT ON COLUMN public.invitations.daily_send_reset_at IS 'Date when daily counter was last reset';
COMMENT ON COLUMN public.invitations.last_sent_at IS 'Timestamp of last send attempt';

COMMENT ON FUNCTION public.can_resend_invitation(TEXT, INTEGER) IS 'Check if invitation can be resent (respects daily limit)';
COMMENT ON FUNCTION public.increment_invitation_send_count(UUID) IS 'Increment send counters when invitation is resent';
COMMENT ON FUNCTION public.user_has_completed_signup(TEXT) IS 'Check if user has completed signup (has profile in database)';

-- ============================================
-- Migration complete!
-- ============================================

