import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/admin/invitations
 * List all invitations (admin only)
 *
 * Query params:
 * - status?: 'pending' | 'accepted' | 'expired' | 'revoked' | 'all' (default: 'all')
 * - limit?: number (default: 100)
 * - offset?: number (default: 0)
 */
export async function GET(request: Request) {
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

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 3. Build query
    let query = supabase
      .from('invitations')
      .select(
        `
        *,
        invited_by_profile:profiles!invitations_invited_by_fkey(
          email,
          first_name,
          last_name
        )
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by status if not 'all'
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: invitations, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch invitations' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      invitations: invitations || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error('List invitations API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
