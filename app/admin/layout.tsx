import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { redirect } from 'next/navigation';

/**
 * Admin Dashboard Layout with Server-Side Auth Protection
 * This layout wraps the admin dashboard and verifies authentication + admin role server-side
 */
export default async function AdminLayout({
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

  // Redirect non-admins to user dashboard
  if (!profile || profile.role !== 'admin') {
    redirect('/user');
  }

  // Check if user is active
  if (profile.status !== 'active') {
    redirect('/auth/access-denied?reason=inactive');
  }

  // User is authenticated and has admin role, render the page
  return <>{children}</>;
}
