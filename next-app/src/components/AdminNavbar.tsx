import React from 'react'
import { ExternalLink, ShieldCheck, Search, LogOut, RotateCcw } from 'lucide-react'
import upangLogo from '../assets/upang logo.png'

interface AdminNavbarProps {
  adminName: string
  onLogout: () => void
  onToggleSidebar?: () => void
  onResetLikeNew?: () => void
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({
  adminName,
  onLogout,
  onToggleSidebar,
  onResetLikeNew,
}) => {

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-white/10 bg-[#0a1a12]/90 backdrop-blur-xl px-4 md:px-6 transition-colors shadow-lg">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        <div className="flex items-center gap-3">
          {/* Brand Emblem matching user UI */}
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-white/15 to-[#df9e28]/30 p-1.5 flex items-center justify-center border border-[#df9e28]/50 shadow-md">
            <img src={upangLogo} alt="PHINMA UPang" className="h-full w-full object-contain drop-shadow-[0_1px_4px_rgba(240,180,69,0.3)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight gold-gradient-text">
                UPang Assist
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold bg-[#df9e28]/15 text-[#f0b445] rounded-full border border-[#f0b445]/40 shadow-xs">
                <ShieldCheck className="w-3 h-3 text-[#f0b445]" /> ADMIN CONSOLE
              </span>
            </div>
            <p className="text-[10px] text-white/50 tracking-wide font-medium hidden sm:block">PHINMA UNIVERSITY OF PANGASINAN</p>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search FAQs, student logs, campus directory..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/40 focus:outline-none focus:border-[#f0b445]/60 focus:bg-white/8 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Link to Student App on localhost:5173 matching user UI */}
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-[#34d399] bg-[#34d399]/10 border border-[#34d399]/30 hover:bg-[#34d399]/20 hover:text-white transition-all shadow-xs"
          title="Open Student Chatbot (localhost:5173)"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <span className="hidden sm:inline">Student Chatbot</span>
          <span className="font-mono text-[10px] opacity-80">:5173</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        {/* Quick Reset Data Like New */}
        {onResetLikeNew && (
          <button
            onClick={onResetLikeNew}
            className="p-2 rounded-xl text-white/70 hover:text-[#f0b445] hover:bg-white/10 transition-colors"
            title="Reset All Admin Data Like New"
            aria-label="Reset All Admin Data Like New"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        {/* User Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/10">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#10b981] to-[#047857] text-white flex items-center justify-center font-bold text-xs shadow-md border border-white/15">
            {adminName.slice(0, 1).toUpperCase()}
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-bold text-white leading-tight">{adminName}</div>
            <div className="text-[10px] text-[#f0b445] font-medium leading-tight">Administator</div>
          </div>
          <button
            onClick={onLogout}
            className="p-1.5 rounded-xl text-white/50 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1"
            title="Log Out Admin"
            aria-label="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
