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

    // Check if user is admin (use admin client to avoid RLS recursion)
    const adminClient = createAdminClient()
    const { data: adminProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!adminProfile || adminProfile.role !== 'admin') {
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

    // 3. Check if user has completed signup (has active profile)
    // (adminClient already created above for role check)
    const { data: userProfile } = await adminClient
      .from('profiles')
      .select('id, email, status')
      .eq('email', email)
      .maybeSingle()

    // Only block if user has ACTIVE profile (completed signup)
    if (userProfile && userProfile.status === 'active') {
      return NextResponse.json(
        { error: 'User with this email is already active in the system' },
        { status: 400 }
      )
    }

    // If user has INACTIVE profile, check if they actually completed OAuth
    // If not, we'll delete both profile and auth user to allow fresh invite
    if (userProfile && userProfile.status === 'inactive') {
      console.log(`User ${email} has inactive profile. Checking if signup was completed...`)
      
      // Check auth.users
      const { data: authUsersData } = await adminClient.auth.admin.listUsers()
      const authUser = authUsersData?.users.find((u) => u.email === email)
      
      if (authUser) {
        // Delete both profile and auth user for fresh invite
        console.log(`Deleting inactive profile and auth user for ${email} to allow fresh invitation`)
        
        // Delete profile first
        await adminClient.from('profiles').delete().eq('id', userProfile.id)
        
        // Then delete auth user
        await adminClient.auth.admin.deleteUser(authUser.id)
        
        // Wait for deletions to propagate
        await new Promise(resolve => setTimeout(resolve, 500))
        console.log(`Deleted inactive user ${email} successfully - ready for fresh invite`)
      } else {
        // Profile exists but no auth user - orphaned profile, delete it
        console.log(`Orphaned inactive profile found for ${email}, deleting...`)
        await adminClient.from('profiles').delete().eq('id', userProfile.id)
      }
    }

    // 4. Check if there's already a pending invitation
    const { data: existingInvitation } = await adminClient
      .from('invitations')
      .select('*, send_count, daily_send_count, daily_send_reset_at, last_sent_at')
      .eq('email', email)
      .in('status', ['pending', 'expired'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingInvitation) {
      // Check daily rate limit (max 3 per day)
      const today = new Date().toISOString().split('T')[0]
      const resetDate = existingInvitation.daily_send_reset_at?.split('T')[0]
      
      const dailyCount = resetDate === today ? (existingInvitation.daily_send_count || 0) : 0
      
      if (dailyCount >= 3) {
        return NextResponse.json(
          { 
            error: 'Daily invitation limit reached (max 3 per day). Please try again tomorrow.',
            dailyCount,
            lastSentAt: existingInvitation.last_sent_at
          },
          { status: 429 } // Too Many Requests
        )
      }
      
      // Can resend - update existing invitation
      const { error: updateError } = await adminClient
        .from('invitations')
        .update({
          status: 'pending',
          send_count: (existingInvitation.send_count || 1) + 1,
          daily_send_count: dailyCount + 1,
          daily_send_reset_at: today,
          last_sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          role, // Update role in case it changed
          message, // Update message
        })
        .eq('id', existingInvitation.id)
        
      if (updateError) {
        console.error('Error updating invitation:', updateError)
      }
    }

    // 5. Check if user exists in auth.users but hasn't completed signup (no active profile)
    // If user exists in auth.users but NO profile (or inactive profile already deleted above)
    const { data: authUsersData } = await adminClient.auth.admin.listUsers()
    const authUser = authUsersData?.users.find((u) => u.email === email)
    
    if (authUser) {
      // User exists in auth.users - check if they have a profile now
      const { data: currentProfile } = await adminClient
        .from('profiles')
        .select('id, status')
        .eq('id', authUser.id)
        .maybeSingle()
      
      if (!currentProfile || currentProfile.status !== 'active') {
        // No profile or inactive profile - safe to delete auth user for fresh invite
        console.log(`User ${email} exists in auth.users without active profile. Deleting for fresh invitation.`)
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(authUser.id)
        
        if (deleteError) {
          console.error(`Failed to delete user ${email}:`, deleteError)
          return NextResponse.json(
            { error: 'Unable to process invitation. Please try again or contact support.' },
            { status: 500 }
          )
        }
        
        // Wait a moment for deletion to propagate
        await new Promise(resolve => setTimeout(resolve, 500))
        console.log(`Deleted auth user ${email} successfully - ready for fresh invite`)
      }
    }

    // 6. Create or update invitation record in database (token auto-generated by trigger)
    const today = new Date().toISOString().split('T')[0]
    let invitationId: string
    let inviteToken: string

    if (existingInvitation) {
      // Update existing invitation
      const newSendCount = (existingInvitation.send_count || 1) + 1
      const newDailyCount = (existingInvitation.daily_send_reset_at?.split('T')[0] === today) 
        ? (existingInvitation.daily_send_count || 0) + 1 
        : 1
      const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

      const { data: updated, error: updateError } = await adminClient
        .from('invitations')
        .update({
          send_count: newSendCount,
          daily_send_count: newDailyCount,
          daily_send_reset_at: today,
          last_sent_at: new Date().toISOString(),
          expires_at: newExpiresAt,
          status: 'pending', // Reset to pending
          role: role, // Update role if changed
          message, // Update message
          updated_at: new Date().toISOString()
        })
        .eq('id', existingInvitation.id)
        .select('id, token')
        .single()

      if (updateError) {
        console.error('Error updating invitation:', updateError)
        return NextResponse.json(
          { error: 'Failed to update invitation' },
          { status: 500 }
        )
      }

      invitationId = updated!.id
      inviteToken = updated!.token
    } else {
      // Create new invitation (token will be auto-generated by trigger)
      const { data: created, error: createError } = await adminClient
        .from('invitations')
        .insert({
          email,
          invited_by: user.id,
          role,
          message,
          status: 'pending',
          invited_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          send_count: 1,
          daily_send_count: 1,
          daily_send_reset_at: today,
          last_sent_at: new Date().toISOString()
        })
        .select('id, token')
        .single()

      if (createError) {
        console.error('Error creating invitation:', createError)
        return NextResponse.json(
          { error: 'Failed to create invitation' },
          { status: 500 }
        )
      }

      invitationId = created!.id
      inviteToken = created!.token
    }

    // 7. Generate invitation link using configured base URL
    // Priority: NEXT_PUBLIC_APP_URL > NEXT_PUBLIC_SITE_URL > fallback to localhost
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL 
      || process.env.NEXT_PUBLIC_SITE_URL 
      || 'http://localhost:3000'
    
    const inviteLink = `${baseUrl}/auth/accept-invite?token=${inviteToken}`

    console.log(`Invitation created for ${email} with role ${role}`)
    console.log(`Invitation link: ${inviteLink}`)

    const dailyCountInfo = existingInvitation 
      ? { 
          sendCount: (existingInvitation.send_count || 1) + 1,
          dailySendCount: ((existingInvitation.daily_send_reset_at?.split('T')[0] === today) 
            ? (existingInvitation.daily_send_count || 0) + 1 
            : 1),
          remainingToday: 3 - ((existingInvitation.daily_send_reset_at?.split('T')[0] === today) 
            ? (existingInvitation.daily_send_count || 0) + 1 
            : 1)
        }
      : { sendCount: 1, dailySendCount: 1, remainingToday: 2 }

    // TODO: Send email with invitation link using email service (Resend, SendGrid, etc.)
    // For now, return the link for manual sharing

    return NextResponse.json({
      success: true,
      message: existingInvitation 
        ? `Invitation link generated for ${email}` 
        : `Invitation created for ${email}`,
      inviteLink,
      email,
      role,
      expiresIn: '30 days',
      invitationStats: dailyCountInfo,
      note: 'Share this link with the user. They need to click it first, then sign in with Google.'
    })
  } catch (error: any) {
    console.error('Invite API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
