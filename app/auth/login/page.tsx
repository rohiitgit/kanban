'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/types';
import { ArrowRight, Kanban, Users, Shield } from 'lucide-react';

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'user' | 'admin'>('user');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!name.trim()) newErrors.name = 'Name is required';
        if (!email.trim()) newErrors.email = 'Email is required';
        if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Please enter a valid email';
        }
        return newErrors;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const newUser: User = {
            id: `user_${Date.now()}`,
            name: name.trim(),
            email: email.trim(),
            role,
            createdAt: new Date().toISOString(),
        };

        // Store user in global users list
        const storedUsers = localStorage.getItem('kanban_all_users');
        let allUsers: User[] = [];
        if (storedUsers) {
            try {
                allUsers = JSON.parse(storedUsers);
            } catch (error) {
                console.error('Failed to load users:', error);
            }
        }
        allUsers.push(newUser);
        localStorage.setItem('kanban_all_users', JSON.stringify(allUsers));

        // Login user
        login(newUser);

        // Redirect based on role
        if (role === 'admin') {
            router.push('/admin');
        } else {
            router.push('/user');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 md:p-10">
                    {/* Logo & Header */}
                    <div className="mb-8 text-center">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200 mb-4">
                            <Kanban className="w-7 h-7 text-blue-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">
                            Kanban Board
                        </h1>
                        <p className="text-slate-600 text-sm">Get started organizing your workflow</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name Field */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-900 mb-2">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    setErrors({ ...errors, name: '' });
                                }}
                                placeholder="Enter your name"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                            {errors.name && <p className="text-sm text-red-600 mt-1.5">{errors.name}</p>}
                        </div>

                        {/* Email Field */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-900 mb-2">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setErrors({ ...errors, email: '' });
                                }}
                                placeholder="your@email.com"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                            {errors.email && <p className="text-sm text-red-600 mt-1.5">{errors.email}</p>}
                        </div>

                        {/* Role Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-900 mb-3">Select Your Role</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setRole('user')}
                                    className={`p-4 rounded-lg border-2 font-medium transition-all flex flex-col items-center gap-2 ${role === 'user'
                                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                                            : 'border-slate-300 bg-slate-50 text-slate-600 hover:border-slate-400 hover:bg-slate-100'
                                        }`}
                                >
                                    <Users className="w-5 h-5" />
                                    <span className="text-xs md:text-sm">User</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('admin')}
                                    className={`p-4 rounded-lg border-2 font-medium transition-all flex flex-col items-center gap-2 ${role === 'admin'
                                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                                            : 'border-slate-300 bg-slate-50 text-slate-600 hover:border-slate-400 hover:bg-slate-100'
                                        }`}
                                >
                                    <Shield className="w-5 h-5" />
                                    <span className="text-xs md:text-sm">Admin</span>
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl mt-7"
                        >
                            Continue
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

                    {/* Role Info Card */}
                    <div className="mt-7 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                        {role === 'user' ? (
                            <div className="flex gap-3">
                                <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-slate-900 mb-1">User Mode</p>
                                    <p className="text-slate-600 text-xs">Create and manage your own kanban boards. Admins can view your progress.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-slate-900 mb-1">Admin Mode</p>
                                    <p className="text-slate-600 text-xs">Manage users and view all kanban boards. You have full control and visibility.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-500 text-xs mt-6">
                    Protected by modern authentication • Your data is secure
                </p>
            </div>
        </div>
    );
}
