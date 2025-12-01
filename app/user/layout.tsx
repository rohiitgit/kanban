import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { redirect } from 'next/navigation';

/**
 * User Dashboard Layout with Server-Side Auth Protection
 * This layout wraps the user dashboard and verifies authentication server-side
 */
export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Server-side auth check - ALWAYS use getUser() not getSession()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/auth/login');
  }

  // Check profile using admin client to avoid RLS issues
  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .maybeSingle();

  // Redirect admins to admin dashboard
  if (profile && profile.role === 'admin') {
    redirect('/admin');
  }

  // Check if user is active
  if (profile && profile.status !== 'active') {
    redirect('/auth/access-denied?reason=inactive');
  }

  // User is authenticated and has user role, render the page
  return <>{children}</>;
}
