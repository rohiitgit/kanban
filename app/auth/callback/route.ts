import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

/**
 * OAuth Callback Route Handler
 * Handles the OAuth callback from Google and exchanges the authorization code for a session
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser()

      if (!user || !user.email) {
        // No user found or no email - redirect to error
        return NextResponse.redirect(`${origin}/auth/auth-code-error`)
      }

      // Check if user has a profile (which means they were invited)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', user.id)
        .single()

      // If no profile exists, check if there's a valid invitation
      if (!profile) {
        const { data: invitation } = await supabase
          .from('invitations')
          .select('*')
          .eq('email', user.email)
          .in('status', ['pending', 'accepted'])
          .single()

        if (!invitation) {
          // No invitation found - sign them out and redirect to access denied
          await supabase.auth.signOut()
          return NextResponse.redirect(`${origin}/auth/access-denied`)
        }

        // Invitation exists but no profile yet
        // The trigger should create it, but if it didn't, redirect to setup
        return NextResponse.redirect(`${origin}/auth/set-password`)
      }

      // Check if profile is inactive or suspended
      if (profile.status !== 'active') {
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/auth/access-denied?reason=inactive`)
      }

      // User is invited and has a profile - redirect based on role
      const redirectPath = profile.role === 'admin' ? '/admin' : '/user'

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${redirectPath}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirectPath}`)
      } else {
        return NextResponse.redirect(`${origin}${redirectPath}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
