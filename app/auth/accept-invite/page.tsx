'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle, XCircle, ArrowRight } from 'lucide-react'

/**
 * Accept Invite Page
 * 
 * Flow:
 * 1. User clicks invitation link with token
 * 2. Verify token and mark invitation as accepted
 * 3. Redirect to /auth/login for Google OAuth
 * 4. On OAuth success, profile is created and activated
 */
export default function AcceptInvitePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'processing' | 'success' | 'error' | 'already-accepted'>('processing')
  const [message, setMessage] = useState('Verifying your invitation...')
  const [details, setDetails] = useState('')
  const [role, setRole] = useState<string>('')
  const [errorCode, setErrorCode] = useState<string>('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid invitation link')
      setDetails('The invitation link is missing a token. Please check the link you received.')
      return
    }

    acceptInvitation(token)
  }, [token])

  const acceptInvitation = async (token: string) => {
    try {
      const response = await fetch('/api/auth/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      const data = await response.json()

      if (!response.ok) {
        // Check if invitation was already accepted/registered
        if (data.code === 'ALREADY_REGISTERED' || data.code === 'ALREADY_ACCEPTED') {
          setStatus('already-accepted')
          setMessage(data.error || 'Already Accepted')
          setDetails(data.details || 'This invitation has already been used.')
          setRole(data.role || '')
          setErrorCode(data.code)
          return
        }

        setStatus('error')
        setMessage(data.error || 'Failed to accept invitation')
        setDetails(data.details || 'Please contact an administrator for assistance.')
        return
      }

      // Success!
      setStatus('success')
      setMessage('Invitation Accepted!')
      setRole(data.role)
      setDetails(`You've been invited as ${data.role === 'admin' ? 'an Admin' : 'a User'}. Click below to sign in with Google.`)

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)

    } catch (error) {
      console.error('Error accepting invitation:', error)
      setStatus('error')
      setMessage('Network Error')
      setDetails('Failed to connect to the server. Please check your internet connection and try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center">
          {/* Logo/Branding */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Kanban Board</h1>
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            {status === 'processing' && (
              <div className="relative">
                <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="bg-green-100 rounded-full p-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            )}
            {status === 'already-accepted' && (
              <div className="bg-blue-100 rounded-full p-4">
                <CheckCircle className="w-12 h-12 text-blue-600" />
              </div>
            )}
            {status === 'error' && (
              <div className="bg-red-100 rounded-full p-4">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
            )}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {status === 'processing' && 'Processing Invitation...'}
            {status === 'success' && message}
            {status === 'already-accepted' && message}
            {status === 'error' && message}
          </h2>

          {/* Details */}
          <p className="text-gray-600 mb-6">
            {details}
          </p>

          {/* Role Badge (success and already-accepted) */}
          {(status === 'success' || status === 'already-accepted') && role && (
            <div className={`inline-flex items-center px-4 py-2 ${
              status === 'already-accepted' ? 'bg-blue-50 border-blue-200' : 'bg-indigo-50 border-indigo-200'
            } border rounded-full mb-6`}>
              <span className={`text-sm font-semibold ${
                status === 'already-accepted' ? 'text-blue-700' : 'text-indigo-700'
              }`}>
                Role: {role.charAt(0).toUpperCase() + role.slice(1)}
              </span>
            </div>
          )}

          {/* Action buttons */}
          {status === 'success' && (
            <>
              <button
                onClick={() => router.push('/auth/login')}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-lg"
              >
                Continue to Sign In
                <ArrowRight className="w-5 h-5" />
              </button>
              <p className="text-xs text-gray-500 mt-4">
                You'll be redirected automatically in a moment...
              </p>
            </>
          )}

          {status === 'already-accepted' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${
                errorCode === 'ALREADY_REGISTERED' 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <p className={`text-sm ${
                  errorCode === 'ALREADY_REGISTERED' ? 'text-blue-800' : 'text-yellow-800'
                }`}>
                  {errorCode === 'ALREADY_REGISTERED' 
                    ? '✓ Your account is already set up and active.'
                    : '⚠️ You accepted this invitation but haven\'t completed sign in yet.'
                  }
                </p>
              </div>
              <button
                onClick={() => router.push('/auth/login')}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                {errorCode === 'ALREADY_REGISTERED' ? 'Sign In' : 'Complete Sign In'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <button
                onClick={() => router.push('/auth/login')}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Go to Login
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Go to Home
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

