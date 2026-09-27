import React, { useState } from 'react'
import { Lock, Mail, ExternalLink, ArrowRight } from 'lucide-react'
import upangLogo from '../assets/upang logo.png'

interface AdminLoginProps {
  onLoginSuccess: (name: string, role: string) => void
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@up.phinmaed.com')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please provide administrator credentials.')
      return
    }

    const name = email.split('@')[0]
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
    onLoginSuccess(name || 'Engr. Jeremy', 'Super Administrator')
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background visual accents matching user UI */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#df9e28]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#10b981]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="glass-panel border border-[#df9e28]/40 rounded-3xl p-8 shadow-2xl backdrop-blur-2xl">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-white/15 to-[#df9e28]/35 p-2.5 items-center justify-center shadow-lg border border-[#df9e28]/60 mb-4">
              <img src={upangLogo} alt="PHINMA UPang" className="h-full w-full object-contain drop-shadow-[0_2px_8px_rgba(240,180,69,0.4)]" />
            </div>


            <h1 className="text-2xl font-black text-white tracking-tight gold-gradient-text">
              UPang Assist Admin
            </h1>
            <p className="text-xs text-white/60 mt-1 font-medium">
              PHINMA University of Pangasinan
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white/80 mb-1.5">
                Admin Official Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@up.phinmaed.com"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-[#f0b445] font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/80 mb-1.5">
                Access Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-[#f0b445] font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-3 py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-[#df9e28] to-[#f0b445] hover:brightness-110 text-[#08170f] shadow-lg shadow-black/40 transition-all flex items-center justify-center gap-2"
            >
              <span>Access Admin Dashboard</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          {/* Quick link back to student app */}
          <div className="mt-6 text-center text-xs text-white/50">
            <span>Want to open the student interface? </span>
            <a
              href="http://localhost:5173"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#f0b445] hover:underline font-bold"
            >
              <span>Student Chatbot (:5173)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
