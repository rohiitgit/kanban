import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

/**
 * Accept Invitation API Route
 * 
 * Flow:
 * 1. Verify invitation token
 * 2. Check invitation is valid (pending, not expired)
 * 3. Create INACTIVE profile with invited role
 * 4. Mark invitation as accepted
 * 5. Return success (user will then login with Google OAuth to activate)
 */
export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required', details: 'The invitation link is missing a token.' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // 1. Find invitation by token
    const { data: invitation, error: invitationError } = await adminClient
      .from('invitations')
      .select('*')
      .eq('token', token)
      .maybeSingle()

    if (invitationError) {
      console.error('Error fetching invitation:', invitationError)
      return NextResponse.json(
        { error: 'Database error', details: 'Failed to verify invitation token.' },
        { status: 500 }
      )
    }

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation', details: 'This invitation link is not valid. It may have been revoked.' },
        { status: 404 }
      )
    }

    // 2. Check invitation status
    if (invitation.status === 'accepted') {
      // Check if user already has an active profile
      const { data: existingProfile } = await adminClient
        .from('profiles')
        .select('id, email, role, status')
        .eq('email', invitation.email)
        .maybeSingle()

      if (existingProfile && existingProfile.status === 'active') {
        // User completed signup - direct them to login
        return NextResponse.json(
          { 
            error: 'Already registered',
            details: 'You have already accepted this invitation and completed your account setup. Please sign in with Google.',
            code: 'ALREADY_REGISTERED',
            email: invitation.email,
            role: invitation.role
          },
          { status: 400 }
        )
      } else {
        // Invitation accepted but OAuth not completed yet - allow them to continue
        return NextResponse.json(
          { 
            error: 'Invitation already accepted',
            details: 'You already accepted this invitation. Please complete sign in with Google to activate your account.',
            code: 'ALREADY_ACCEPTED',
            email: invitation.email,
            role: invitation.role
          },
          { status: 400 }
        )
      }
    }

    if (invitation.status === 'expired') {
      return NextResponse.json(
        { error: 'Invitation expired', details: 'This invitation has expired. Please contact an administrator for a new invitation.' },
        { status: 400 }
      )
    }

    if (invitation.status === 'revoked') {
      return NextResponse.json(
        { error: 'Invitation revoked', details: 'This invitation has been revoked. Please contact an administrator.' },
        { status: 400 }
      )
    }

    // 3. Check expiration date
    if (new Date(invitation.expires_at) < new Date()) {
      // Update status to expired
      await adminClient
        .from('invitations')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', invitation.id)

      return NextResponse.json(
        { error: 'Invitation expired', details: 'This invitation has expired. Please contact an administrator for a new invitation.' },
        { status: 400 }
      )
    }

    // 4. Check if profile already exists
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id, email, role, status')
      .eq('email', invitation.email)
      .maybeSingle()

    if (existingProfile && existingProfile.status === 'active') {
      return NextResponse.json(
        { error: 'Already registered', details: 'This email is already registered. Please sign in with Google.' },
        { status: 400 }
      )
    }

    // 5. Mark invitation as accepted (profile will be created during OAuth login)
    const { error: updateError } = await adminClient
      .from('invitations')
      .update({ 
        status: 'accepted', 
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', invitation.id)

    if (updateError) {
      console.error('Error updating invitation:', updateError)
      return NextResponse.json(
        { error: 'Failed to accept invitation', details: 'An error occurred while processing your invitation.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted! Please sign in with Google to complete your account setup.',
      email: invitation.email,
      role: invitation.role
    })

  } catch (error) {
    console.error('Error in accept-invite:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}

