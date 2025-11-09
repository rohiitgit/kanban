import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

/**
 * DELETE /api/admin/invitations/[id]
 * Revoke an invitation (admin only)
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Verify the requester is an admin
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const invitationId = params.id

    // 2. Get the invitation
    const { data: invitation, error: fetchError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', invitationId)
      .single()

    if (fetchError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // 3. Check if already revoked or accepted
    if (invitation.status === 'revoked') {
      return NextResponse.json(
        { error: 'Invitation is already revoked' },
        { status: 400 }
      )
    }

    if (invitation.status === 'accepted') {
      return NextResponse.json(
        { error: 'Cannot revoke an accepted invitation' },
        { status: 400 }
      )
    }

    // 4. Update invitation status to revoked
    const { error: updateError } = await supabase
      .from('invitations')
      .update({ status: 'revoked', updated_at: new Date().toISOString() })
      .eq('id', invitationId)

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json(
        { error: 'Failed to revoke invitation' },
        { status: 500 }
      )
    }

    // 5. Optionally delete the user from auth if they haven't confirmed yet
    // This prevents them from using the invitation link
    const adminClient = createAdminClient()
    const { data: authUsers } = await adminClient.auth.admin.listUsers()
    const authUser = authUsers?.users.find((u) => u.email === invitation.email)

    if (authUser && !authUser.confirmed_at) {
      // User was invited but hasn't confirmed - delete them
      await adminClient.auth.admin.deleteUser(authUser.id)
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation revoked successfully',
    })
  } catch (error: any) {
    console.error('Revoke invitation API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/invitations/[id]
 * Resend an invitation (admin only)
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Verify the requester is an admin
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const invitationId = params.id

    // 2. Get the invitation
    const { data: invitation, error: fetchError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', invitationId)
      .single()

    if (fetchError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // 3. Check if can be resent
    if (invitation.status === 'accepted') {
      return NextResponse.json(
        { error: 'Cannot resend an accepted invitation' },
        { status: 400 }
      )
    }

    // 4. Resend invitation
    const adminClient = createAdminClient()
    const { origin } = new URL(request.url)
    const redirectUrl = `${origin}/auth/set-password`

    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      invitation.email,
      {
        redirectTo: redirectUrl,
        data: {
          role: invitation.role,
          invited_by: user.id,
        },
      }
    )

    if (inviteError) {
      console.error('Resend invitation error:', inviteError)
      return NextResponse.json(
        { error: `Failed to resend invitation: ${inviteError.message}` },
        { status: 500 }
      )
    }

    // 5. Update invitation in database
    const { error: updateError } = await supabase
      .from('invitations')
      .update({
        status: 'pending',
        invited_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitationId)

    if (updateError) {
      console.error('Database error:', updateError)
      // Email was sent but DB update failed - not critical
    }

    return NextResponse.json({
      success: true,
      message: `Invitation resent to ${invitation.email}`,
    })
  } catch (error: any) {
    console.error('Resend invitation API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
