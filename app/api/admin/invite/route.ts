import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

/**
 * POST /api/admin/invite
 * Invite a user by email (admin only)
 *
 * Request body:
 * {
 *   email: string,
 *   role?: 'user' | 'admin',
 *   message?: string
 * }
 */
export async function POST(request: Request) {
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

    // 2. Parse request body
    const body = await request.json()
    const { email, role = 'user', message } = body

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    if (role && !['user', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "user" or "admin"' },
        { status: 400 }
      )
    }

    // 3. Check if user already exists
    const adminClient = createAdminClient()
    const { data: existingUsers } = await adminClient.auth.admin.listUsers()
    const userExists = existingUsers?.users.some((u) => u.email === email)

    if (userExists) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // 4. Check if there's already a pending invitation
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('*')
      .eq('email', email)
      .eq('status', 'pending')
      .single()

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'There is already a pending invitation for this email' },
        { status: 400 }
      )
    }

    // 5. Send invitation using admin client
    const { origin } = new URL(request.url)
    const redirectUrl = `${origin}/auth/set-password`

    const { data: invitedUser, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(email, {
        redirectTo: redirectUrl,
        data: {
          role: role,
          invited_by: user.id,
        },
      })

    if (inviteError) {
      console.error('Invitation error:', inviteError)
      return NextResponse.json(
        { error: `Failed to send invitation: ${inviteError.message}` },
        { status: 500 }
      )
    }

    // 6. Create invitation record in database
    const { error: dbError } = await supabase.from('invitations').insert({
      email,
      invited_by: user.id,
      role,
      message,
      status: 'pending',
    })

    if (dbError) {
      console.error('Database error:', dbError)
      // Invitation email was sent but DB record failed
      // Not critical, but log it
    }

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${email}`,
      user: invitedUser.user,
    })
  } catch (error: any) {
    console.error('Invite API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
