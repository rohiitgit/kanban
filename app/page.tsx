import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Kanban } from 'lucide-react';

export default async function Home() {
    const supabase = await createClient();

    // Server-side auth check
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // If user is authenticated, redirect based on role from profiles table
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

        const role = profile?.role || 'user';

        if (role === 'admin') {
            redirect('/admin');
        } else {
            redirect('/user');
        }
    }

    // If not authenticated, redirect to login
    redirect('/auth/login');
}
