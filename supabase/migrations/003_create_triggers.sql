-- Trigger to automatically create profile when user accepts invitation
-- This runs after a user is created in auth.users

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_invitation RECORD;
BEGIN
  -- Check if there's a pending or accepted invitation for this email
  SELECT * INTO user_invitation
  FROM public.invitations
  WHERE email = NEW.email
    AND status IN ('pending', 'accepted')
  ORDER BY created_at DESC
  LIMIT 1;

  -- If invitation exists, create profile with invited role
  IF user_invitation IS NOT NULL THEN
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

    -- Mark invitation as accepted
    UPDATE public.invitations
    SET
      status = 'accepted',
      accepted_at = NOW()
    WHERE id = user_invitation.id;
  ELSE
    -- No invitation found - create as regular user (failsafe)
    -- In production, you might want to prevent this or mark as 'inactive'
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
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users insert
-- Note: This requires enabling the trigger on the auth schema
-- Run this in Supabase SQL Editor with appropriate permissions
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to sync profile with auth.users metadata
-- Call this when user updates their profile or metadata changes
CREATE OR REPLACE FUNCTION public.sync_profile_with_auth()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET
    last_sign_in_at = NEW.last_sign_in_at,
    confirmed_at = NEW.confirmed_at,
    email = NEW.email
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync on auth.users update
CREATE OR REPLACE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (
    OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at OR
    OLD.confirmed_at IS DISTINCT FROM NEW.confirmed_at OR
    OLD.email IS DISTINCT FROM NEW.email
  )
  EXECUTE FUNCTION public.sync_profile_with_auth();

-- Function to check if a user is invited
-- Used in backend validation
CREATE OR REPLACE FUNCTION public.is_user_invited(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.invitations
    WHERE email = user_email
      AND status IN ('pending', 'accepted')
      AND (expires_at > NOW() OR status = 'accepted')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
-- Helper function for various checks
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically create profile when user signs up';
COMMENT ON FUNCTION public.sync_profile_with_auth() IS 'Keep profile in sync with auth.users';
COMMENT ON FUNCTION public.is_user_invited(TEXT) IS 'Check if email has valid invitation';
COMMENT ON FUNCTION public.is_admin(UUID) IS 'Check if user has admin role';
