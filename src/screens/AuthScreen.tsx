import React, { useState } from 'react'
import { BackIcon } from '../components/Icons'

export function AuthScreen({
  onSignIn,
  onSignUp,
  onGuest,
  onClose
}: {
  onSignIn: (email: string, pass: string) => Promise<void>
  onSignUp: (email: string, pass: string, name: string, phone: string) => Promise<void>
  onGuest: () => void
  onClose?: () => void
}) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isLogin) {
        await onSignIn(email, password)
      } else {
        if (!name.trim() || !phone.trim()) {
          throw new Error('Name and phone number are required.')
        }
        await onSignUp(email, password, name, phone)
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#f7f5f1] overflow-y-auto px-6 py-12 justify-center">
      {onClose && (
        <button 
          onClick={onClose} 
          className="absolute top-12 left-4 w-9 h-9 rounded-full bg-white border border-[#e2ddd8] flex items-center justify-center text-stone-500 hover:text-stone-700 active:scale-95 transition-transform"
        >
          <BackIcon />
        </button>
      )}

      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#1a3d2b] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#1a3d2b]/20">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: '#141414' }}>
            Nestly
          </h2>
          <p className="text-xs mt-1" style={{ color: '#7a7570' }}>
            Your portal to verified spaces
          </p>
        </div>

        <div className="flex bg-[#e2ddd8] p-1 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(''); }}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
            style={isLogin ? { background: '#1a3d2b', color: '#fff', boxShadow: '0 2px 8px rgba(26,61,43,0.15)' } : { color: '#5a5550' }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(''); }}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
            style={!isLogin ? { background: '#1a3d2b', color: '#fff', boxShadow: '0 2px 8px rgba(26,61,43,0.15)' } : { color: '#5a5550' }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl text-xs font-semibold animate-shake" style={{ background: '#fdf0e8', color: '#d4652a', border: '1px solid rgba(212,101,42,0.15)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#7a7570] uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  placeholder="Kabir Singh"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-[#e2ddd8] focus:border-[#1a3d2b] transition-colors"
                  style={{ background: '#fff', color: '#141414' }}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#7a7570] uppercase tracking-wider">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-[#e2ddd8] focus:border-[#1a3d2b] transition-colors"
                  style={{ background: '#fff', color: '#141414' }}
                  required
                />
              </div>
            </>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[#7a7570] uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-[#e2ddd8] focus:border-[#1a3d2b] transition-colors"
              style={{ background: '#fff', color: '#141414' }}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-[#7a7570] uppercase tracking-wider">Password</label>
              {isLogin && (
                <button type="button" className="text-[10px] font-bold text-[#1a3d2b] hover:underline bg-none border-none cursor-pointer">
                  Forgot?
                </button>
              )}
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-[#e2ddd8] focus:border-[#1a3d2b] transition-colors"
              style={{ background: '#fff', color: '#141414' }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 rounded-xl text-sm font-bold text-white shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
            style={{ background: '#1a3d2b', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.75 : 1 }}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Signing in...
              </>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="text-center mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onGuest}
            className="text-xs font-bold text-[#1a3d2b] hover:underline bg-none border-none cursor-pointer mx-auto"
          >
            Continue as Guest
          </button>
          <a
            href="https://homenext-five.vercel.app/#/admin"
            className="text-xs font-bold text-stone-500 hover:text-stone-700 hover:underline cursor-pointer mx-auto mt-1"
          >
            Admin Login
          </a>
          <div className="h-[1px] bg-[#e2ddd8] w-full my-1"></div>
          <p className="text-[10px] text-[#7a7570]">
            By continuing, you agree to Nestly's Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthScreen
