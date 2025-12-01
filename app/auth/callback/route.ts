import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

/**
 * OAuth Callback Route Handler
 * Handles the OAuth callback from Google and exchanges the authorization code for a session
 * Also handles Supabase email invitation redirects (hash-based tokens)
 */
export async function GET(request: Request) {
    const { searchParams, origin, hash } = new URL(request.url)
    const code = searchParams.get('code')
    
    // Check for hash-based invitation flow (from Supabase inviteUserByEmail)
    // Supabase invitations use #access_token instead of ?code
    if (hash && hash.includes('access_token')) {
        const hashParams = new URLSearchParams(hash.slice(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const inviteType = hashParams.get('type')
        
        if (accessToken && inviteType === 'invite') {
            console.log('Processing invitation with hash-based tokens')
            
            const supabase = await createClient()
            
            // Set session using tokens from hash
            const { data: { session }, error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || '',
            })
            
            if (sessionError || !session?.user) {
                console.error('Error setting session from invitation:', sessionError)
                return NextResponse.redirect(`${origin}/auth/auth-code-error`)
            }
            
            const user = session.user
            
            // Use admin client to check/create profile
            const adminClient = createAdminClient()
            
            // Wait for trigger to complete
            await new Promise(resolve => setTimeout(resolve, 500))
            
            let { data: profile } = await adminClient
                .from('profiles')
                .select('role, status')
                .eq('id', user.id)
                .maybeSingle()
            
            // If no profile, check invitation and create
            if (!profile) {
                const { data: invitation } = await adminClient
                    .from('invitations')
                    .select('role, status')
                    .eq('email', user.email!)
                    .eq('status', 'accepted')  // Only accepted invitations (from accept-invite page)
                    .maybeSingle()
                
                if (invitation) {
                    const { error: insertError } = await adminClient
                        .from('profiles')
                        .insert({
                            id: user.id,
                            email: user.email!,
                            role: invitation.role,
                            status: 'active',
                            invited_at: new Date().toISOString(),
                            confirmed_at: new Date().toISOString()
                        })
                    
                    if (!insertError) {
                        profile = { role: invitation.role, status: 'active' }
                    }
                } else {
                    await supabase.auth.signOut()
                    return NextResponse.redirect(`${origin}/auth/access-denied?reason=not-invited`)
                }
            }
            
            // If profile exists but is inactive, check for accepted invitation and activate
            if (profile && profile.status === 'inactive') {
                const { data: invitation } = await adminClient
                    .from('invitations')
                    .select('role')
                    .eq('email', user.email!)
                    .eq('status', 'accepted')
                    .maybeSingle()
                
                if (invitation) {
                    // Activate the profile
                    await adminClient
                        .from('profiles')
                        .update({ 
                            status: 'active',
                            confirmed_at: new Date().toISOString(),
                            last_sign_in_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        })
                        .eq('email', user.email!)
                    
                    profile.status = 'active'
                } else {
                    await supabase.auth.signOut()
                    return NextResponse.redirect(`${origin}/auth/access-denied?reason=inactive`)
                }
            }
            
            if (!profile || profile.status !== 'active') {
                await supabase.auth.signOut()
                return NextResponse.redirect(`${origin}/auth/access-denied?reason=inactive`)
            }
            
            // Redirect based on role
            const redirectPath = profile.role === 'admin' ? '/admin' : '/user'
            return NextResponse.redirect(`${origin}${redirectPath}`)
        }
    }

    // Handle normal OAuth flow (with ?code parameter)
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

            // Wait for trigger to complete (profile creation)
            // The handle_new_user trigger runs on auth.users insert
            // Give it a moment to create the profile
            await new Promise(resolve => setTimeout(resolve, 500))

            // Use admin client to check profile (bypasses RLS)
            // This is necessary because during OAuth callback, the user session
            // might not be fully established yet, causing RLS to block the query
            const adminClient = createAdminClient()
            let { data: profile, error: profileError } = await adminClient
                .from('profiles')
                .select('role, status')
                .eq('id', user.id)
                .maybeSingle()

            // If no profile exists after waiting, check invitation and create if needed
            if (!profile && !profileError) {
                // Check if user has a pending invitation (use admin client)
                const { data: invitation } = await adminClient
                    .from('invitations')
                    .select('role, status')
                    .eq('email', user.email)
                    .in('status', ['pending', 'accepted'])
                    .maybeSingle()

                if (invitation) {
                    // User was invited - create profile with invited role (use admin client)
                    const { error: insertError } = await adminClient
                        .from('profiles')
                        .insert({
                            id: user.id,
                            email: user.email,
                            role: invitation.role,
                            status: 'active'
                        })

                    if (!insertError) {
                        // Mark invitation as accepted
                        await adminClient
                            .from('invitations')
                            .update({ status: 'accepted', accepted_at: new Date().toISOString() })
                            .eq('email', user.email)

                        // Fetch the newly created profile
                        const { data: newProfile } = await adminClient
                            .from('profiles')
                            .select('role, status')
                            .eq('id', user.id)
                            .single()

                        profile = newProfile
                    }
                } else {
                    // No invitation - deny access (invite-only system)
                    await supabase.auth.signOut()
                    return NextResponse.redirect(`${origin}/auth/access-denied?reason=not-invited`)
                }
            }

            // If still no profile, deny access
            if (!profile) {
                await supabase.auth.signOut()
                return NextResponse.redirect(`${origin}/auth/access-denied?reason=not-invited`)
            }

            // If there was an error other than "not found", log it
            if (profileError && profileError.code !== 'PGRST116') {
                console.error('Error fetching profile:', profileError)
            }

            // Check if profile is inactive or suspended
            if (profile.status !== 'active') {
                await supabase.auth.signOut()
                return NextResponse.redirect(`${origin}/auth/access-denied?reason=inactive`)
            }

            // User has a profile with role - redirect based on role from profiles table
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
