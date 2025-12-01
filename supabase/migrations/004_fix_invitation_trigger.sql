-- ============================================
-- FIX INVITATION TRIGGER
-- Only create profile after email is confirmed
-- ============================================

-- Drop old trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_invitation RECORD;
BEGIN
  -- IMPORTANT: Only create profile if email is confirmed
  -- This prevents profiles being created when user just clicks invite link
  -- Profile is created only after successful OAuth completion
  IF NEW.email_confirmed_at IS NULL THEN
    RAISE NOTICE 'User % created but email not confirmed yet - skipping profile creation', NEW.email;
    RETURN NEW;
  END IF;

  -- Check if there's a pending or accepted invitation for this email
  SELECT * INTO user_invitation
  FROM public.invitations
  WHERE email = NEW.email
    AND status IN ('pending', 'accepted')
  ORDER BY created_at DESC
  LIMIT 1;

  -- If invitation exists, create profile with invited role
  IF user_invitation IS NOT NULL THEN
    -- Check if profile already exists (prevent duplicates)
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
      INSERT INTO public.profiles (
        id,
        email,
        role,
        invited_at,
        confirmed_at,
        status
      ) VALUES (
        NEW.id,
        NEW.email,
        user_invitation.role, -- Use role from invitation
        user_invitation.invited_at,
        NEW.confirmed_at,
        'active'
      );
      
      -- Mark invitation as accepted (only after successful profile creation)
      UPDATE public.invitations
      SET
        status = 'accepted',
        accepted_at = NOW()
      WHERE id = user_invitation.id;
      
      RAISE NOTICE 'Profile created for user % with role %', NEW.email, user_invitation.role;
    ELSE
      RAISE NOTICE 'Profile already exists for user %', NEW.email;
    END IF;
  ELSE
    -- No invitation found - create as inactive user (invite-only system)
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
      INSERT INTO public.profiles (
        id,
        email,
        role,
        status
      ) VALUES (
        NEW.id,
        NEW.email,
        'user',
        'inactive' -- Inactive until admin approves
      );
      
      RAISE NOTICE 'No invitation found for % - created inactive profile', NEW.email;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Also trigger on UPDATE (when email gets confirmed)
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- This fix ensures:
-- 1. Profile created ONLY after successful OAuth
-- 2. User can click invitation link multiple times
-- 3. Invitation status updated only after profile creation
-- 4. No duplicate profiles
-- ============================================

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates user profile only after email confirmation - allows multi-click invitation links';

