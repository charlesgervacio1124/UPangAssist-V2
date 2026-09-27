import React from 'react'
import {
  LayoutDashboard,
  BookOpen,
  MessageSquareText,
  Users,
  Settings,
  X,
} from 'lucide-react'

export type AdminTab = 'dashboard' | 'knowledge' | 'inquiries' | 'users' | 'settings'

interface AdminSidebarProps {
  currentTab: AdminTab
  onSelectTab: (tab: AdminTab) => void
  isOpen: boolean
  onCloseMobile?: () => void
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
  { id: 'inquiries', label: 'Inquiries', icon: MessageSquareText },
  { id: 'users', label: 'Users & Roles', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onCloseMobile,
}) => {
  const handleNavClick = (tab: AdminTab) => {
    onSelectTab(tab)
    onCloseMobile?.()
  }

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 shrink-0 flex-col border-r border-white/10 bg-[#0a1a12] transition-transform duration-200 md:sticky md:top-16 md:z-20 md:h-[calc(100vh-4rem)] md:w-64 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 md:hidden">
          <span className="font-bold text-sm gold-gradient-text">UPang Assist Admin</span>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation"
            className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav aria-label="Admin navigation" className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = currentTab === id

            return (
              <button
                key={id}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => handleNavClick(id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-medium transition-colors ${
                  isActive
                    ? 'border border-[#f0b445]/40 bg-[#df9e28]/15 text-white'
                    : 'text-white/65 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#f0b445]' : 'text-white/50'}`} />
                <span>{label}</span>
              </button>
            )
          })}
        </nav>

      </aside>
    </>
  )
}
