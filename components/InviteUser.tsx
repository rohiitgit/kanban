'use client'

import { useState } from 'react'
import { UserPlus, Copy, CheckCircle, AlertCircle } from 'lucide-react'

interface InvitationResponse {
  success: boolean
  message: string
  inviteLink?: string
  email?: string
  role?: string
  expiresIn?: string
  note?: string
  invitationStats?: {
    sendCount: number
    dailySendCount: number
    remainingToday: number
  }
  error?: string
}

export default function InviteUser() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'user' | 'admin'>('user')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<InvitationResponse | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setCopied(false)

    try {
      const response = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, role, message }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
        setEmail('')
        setMessage('')
      } else {
        setResult({ success: false, message: data.error || 'Failed to send invitation', error: data.error })
      }
    } catch (error) {
      console.error('Error inviting user:', error)
      setResult({ success: false, message: 'Network error. Please try again.', error: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  const copyInviteLink = async () => {
    if (result?.inviteLink) {
      await navigator.clipboard.writeText(result.inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <UserPlus className="w-6 h-6" />
        Invite New User
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="user@example.com"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={loading}
          >
            <option value="user">User (Can view and drag cards)</option>
            <option value="admin">Admin (Full access)</option>
          </select>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Custom Message (Optional)
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Welcome to our team!"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating Invitation...
            </>
          ) : (
            <>
              <UserPlus className="w-5 h-5" />
              Generate Invitation Link
            </>
          )}
        </button>
      </form>

      {result && (
        <div className={`mt-6 p-4 rounded-lg border-2 ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className={`font-semibold ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                {result.success ? 'Invitation Link Generated!' : 'Error'}
              </h3>
              <p className={`text-sm mt-1 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.message}
              </p>

              {result.success && result.inviteLink && (
                <div className="mt-4 space-y-3">
                  <div className="bg-white rounded-lg p-3 border border-green-300">
                    <p className="text-xs text-gray-600 mb-1">Invitation Link:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm text-gray-800 break-all flex-1 font-mono bg-gray-50 p-2 rounded">
                        {result.inviteLink}
                      </code>
                      <button
                        onClick={copyInviteLink}
                        className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 flex-shrink-0"
                        title="Copy to clipboard"
                      >
                        {copied ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {result.note && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>📧 Next Steps:</strong> {result.note}
                      </p>
                    </div>
                  )}

                  {result.invitationStats && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white rounded p-2 border border-green-200">
                        <p className="text-xs text-gray-600">Total Sent</p>
                        <p className="text-lg font-bold text-gray-900">{result.invitationStats.sendCount}</p>
                      </div>
                      <div className="bg-white rounded p-2 border border-green-200">
                        <p className="text-xs text-gray-600">Sent Today</p>
                        <p className="text-lg font-bold text-gray-900">{result.invitationStats.dailySendCount}/3</p>
                      </div>
                      <div className="bg-white rounded p-2 border border-green-200">
                        <p className="text-xs text-gray-600">Remaining</p>
                        <p className="text-lg font-bold text-gray-900">{result.invitationStats.remainingToday}</p>
                      </div>
                    </div>
                  )}

                  {result.expiresIn && (
                    <p className="text-xs text-gray-600 text-center">
                      Link expires in {result.expiresIn}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
