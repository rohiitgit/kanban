'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, Shield } from 'lucide-react';

/**
 * Access Denied Page
 * Shown when a user tries to log in without an invitation
 */
export default function AccessDeniedPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [reason, setReason] = useState<string>('not-invited');

    useEffect(() => {
        const reasonParam = searchParams?.get('reason');
        if (reasonParam) {
            setReason(reasonParam);
        }
    }, [searchParams]);

    const getMessage = () => {
        switch (reason) {
            case 'inactive':
                return {
                    title: 'Account Inactive',
                    description: 'Your account has been deactivated. Please contact an administrator to reactivate your access.',
                };
            case 'suspended':
                return {
                    title: 'Account Suspended',
                    description: 'Your account has been suspended. Please contact an administrator for more information.',
                };
            default:
                return {
                    title: 'Invitation Required',
                    description: 'This is an invite-only application. You need an invitation from an administrator to access this app.',
                };
        }
    };

    const message = getMessage();

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-red-50 to-slate-100 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 md:p-10">
                    {/* Icon & Header */}
                    <div className="mb-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-red-100 to-red-50 border border-red-200 mb-4">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">
                            Access Denied
                        </h1>
                        <p className="text-slate-600 text-sm">{message.title}</p>
                    </div>

                    {/* Message */}
                    <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                            {message.description}
                        </p>
                    </div>

                    {/* Information */}
                    {reason === 'not-invited' && (
                        <div className="mb-8 space-y-4">
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex gap-3">
                                    <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-slate-900 text-sm mb-1">
                                            How to get access
                                        </p>
                                        <ul className="text-xs text-slate-600 space-y-1">
                                            <li>• Contact an existing administrator</li>
                                            <li>• Request an invitation to your email address</li>
                                            <li>• You'll receive an email with a login link</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center text-xs text-slate-500">
                                <p>If you believe this is an error, please contact support.</p>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={() => router.push('/auth/login')}
                            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Login
                        </button>

                        <button
                            onClick={() => router.push('/')}
                            className="w-full px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition-all border border-slate-300"
                        >
                            Go to Home
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-500 text-xs mt-6">
                    Invite-only access • Secured by Supabase
                </p>
            </div>
        </div>
    );
}
