'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, AuthContextType } from '@/lib/types';
import { createClient } from '@/utils/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = useRef(createClient()).current;
    const router = useRouter();
    const pathname = usePathname();

    // Convert Supabase user to our User type
    // Fetches role from profiles table (single source of truth)
    const mapSupabaseUserToUser = async (supabaseUser: SupabaseUser): Promise<User> => {
        // Fetch role from profiles table
        let role: 'user' | 'admin' = 'user';
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', supabaseUser.id)
                .maybeSingle();
            
            if (!error && profile?.role) {
                role = profile.role as 'user' | 'admin';
            }
        } catch (error) {
            // Silently fail and default to 'user' - profile might not exist yet
            // This is expected for new users who haven't been assigned a role
        }

        return {
            id: supabaseUser.id,
            name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
            email: supabaseUser.email || '',
            role,
            createdAt: supabaseUser.created_at || new Date().toISOString(),
        };
    };

    // Initialize user from Supabase session
    useEffect(() => {
        let mounted = true;
        let subscription: ReturnType<typeof supabase.auth.onAuthStateChange> | null = null;
        let initializationComplete = false;
        let pendingAuthStateChange: { event: string; session: any } | null = null;

        const initializeAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (!mounted) return;

                if (error) {
                    console.error('Error getting session:', error);
                    if (mounted) {
                        setUser(null);
                        setLoading(false);
                        initializationComplete = true;
                        // Process any pending auth state change
                        if (pendingAuthStateChange) {
                            const { session: pendingSession } = pendingAuthStateChange;
                            pendingAuthStateChange = null;
                            if (pendingSession?.user) {
                                mapSupabaseUserToUser(pendingSession.user).then((mappedUser) => {
                                    if (mounted) {
                                        setUser(mappedUser);
                                        setLoading(false);
                                    }
                                });
                            } else if (mounted) {
                                setUser(null);
                                setLoading(false);
                            }
                        }
                    }
                    return;
                }

                if (session?.user) {
                    try {
                        const mappedUser = await mapSupabaseUserToUser(session.user);
                        if (mounted) {
                            setUser(mappedUser);
                            setLoading(false);
                            initializationComplete = true;
                            // Process any pending auth state change
                            if (pendingAuthStateChange) {
                                const { session: pendingSession } = pendingAuthStateChange;
                                pendingAuthStateChange = null;
                                if (pendingSession?.user) {
                                    mapSupabaseUserToUser(pendingSession.user).then((mappedUser) => {
                                        if (mounted) {
                                            setUser(mappedUser);
                                        }
                                    });
                                } else if (mounted) {
                                    setUser(null);
                                }
                            }
                        }
                    } catch (err) {
                        console.error('Error mapping user:', err);
                        if (mounted) {
                            setUser(null);
                            setLoading(false);
                            initializationComplete = true;
                        }
                    }
                } else {
                    if (mounted) {
                        setUser(null);
                        setLoading(false);
                        initializationComplete = true;
                    }
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
                if (mounted) {
                    setUser(null);
                    setLoading(false);
                    initializationComplete = true;
                }
            }
        };

        // Initialize auth
        initializeAuth();

        // Listen for auth state changes
        const {
            data: { subscription: authSubscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            // If initialization hasn't completed, queue this change
            if (!initializationComplete) {
                pendingAuthStateChange = { event, session };
                return;
            }

            try {
                if (session?.user) {
                    const mappedUser = await mapSupabaseUserToUser(session.user);
                    if (mounted) {
                        setUser(mappedUser);
                        setLoading(false);
                    }
                } else {
                    if (mounted) {
                        setUser(null);
                        setLoading(false);
                    }
                }
            } catch (error) {
                console.error('Error in auth state change:', error);
                if (mounted) {
                    setUser(null);
                    setLoading(false);
                }
            }
        });

        subscription = authSubscription;

        return () => {
            mounted = false;
            initializationComplete = false;
            pendingAuthStateChange = null;
            if (subscription) {
                subscription.unsubscribe();
            }
        };
    }, []);

    // Login function - updates profile table (single source of truth)
    const login = async (newUser: User) => {
        try {
            // Update profile table instead of user_metadata
            const { error } = await supabase
                .from('profiles')
                .update({
                    role: newUser.role,
                })
                .eq('id', newUser.id);

            if (!error) {
                setUser(newUser);
            } else {
                console.error('Error updating profile:', error);
            }
        } catch (error) {
            console.error('Error in login:', error);
        }
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut();
            setUser(null);
            // Redirect to login page after logout
            router.push('/auth/login');
        } catch (error) {
            console.error('Error during logout:', error);
            // Still redirect even if there's an error
            router.push('/auth/login');
        }
    };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        login,
        logout,
        isAdmin: user?.role === 'admin',
        isUser: user?.role === 'user',
    };

    // Show loading state while checking auth
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
