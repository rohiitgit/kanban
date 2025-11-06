'use client';

import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Kanban } from 'lucide-react';

export default function Home() {
    const { isAuthenticated, isUser, isAdmin } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated) {
            if (isUser) {
                router.push('/user');
            } else if (isAdmin) {
                router.push('/admin');
            }
        } else {
            router.push('/auth/login');
        }
    }, [isAuthenticated, isUser, isAdmin, router]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center px-4">
            <div className="text-center max-w-3xl">
                {/* Logo/Icon */}
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200 mb-8">
                    <Kanban className="w-10 h-10 text-blue-600" />
                </div>

                {/* Heading */}
                <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
                    Kanban Board
                </h1>
                <p className="text-xl text-slate-600 mb-12 leading-relaxed">
                    Manage your workflow with a clean, intuitive kanban board built for teams and individuals
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                    <a
                        href="/auth/login"
                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
                    >
                        Get Started
                    </a>
                    <a
                        href="#features"
                        className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                    >
                        Learn More
                    </a>
                </div>

                {/* Features Grid */}
                <div id="features" className="grid md:grid-cols-3 gap-6 pt-12 border-t border-slate-200">
                    <div className="p-6">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-2">Powerful & Fast</h3>
                        <p className="text-sm text-slate-600">Drag, drop, and organize with lightning-fast performance</p>
                    </div>
                    <div className="p-6">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3.594a1.5 1.5 0 01-1.5-1.5V5.094a1.5 1.5 0 011.5-1.5h15.812a1.5 1.5 0 011.5 1.5v14.412a1.5 1.5 0 01-1.5 1.5z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-2">Role-Based Access</h3>
                        <p className="text-sm text-slate-600">Separate user and admin accounts with tailored permissions</p>
                    </div>
                    <div className="p-6">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-2">Auto-Sync</h3>
                        <p className="text-sm text-slate-600">Changes saved instantly to your browser storage</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
