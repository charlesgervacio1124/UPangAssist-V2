import { useState, useEffect } from 'react'
import { AdminNavbar } from './components/AdminNavbar'
import { AdminSidebar, type AdminTab } from './components/AdminSidebar'
import { DashboardView } from './components/DashboardView'
import { KnowledgeBaseView } from './components/KnowledgeBaseView'
import { InquiriesView } from './components/InquiriesView'
import { UsersView } from './components/UsersView'
import { SettingsView } from './components/SettingsView'
import { AdminLogin } from './components/AdminLogin'
import upangLogo from './assets/upang logo.png'
import {
  INITIAL_KNOWLEDGE,
  INITIAL_INQUIRIES,
  INITIAL_USERS,
  INITIAL_SETTINGS,
} from './data/mockData'
import type { KnowledgeItem, InquiryLog, UserAccount, SystemSettings } from './types'

// Automatic versioned reset to guarantee a completely fresh "like new" state on load
const FRESH_VERSION = 'upang_admin_v9_full_reset'
if (typeof window !== 'undefined' && localStorage.getItem('upang_storage_ver') !== FRESH_VERSION) {
  localStorage.removeItem('upang_kb_data')
  localStorage.removeItem('upang_inquiries_data')
  localStorage.removeItem('upang_broadcasts_data')
  localStorage.removeItem('upang_users_data')
  localStorage.removeItem('upang_settings_data')
  localStorage.removeItem('upang_admin_auth')
  localStorage.removeItem('upang_admin_name')
  localStorage.setItem('upang_storage_ver', FRESH_VERSION)
}

if (typeof window !== 'undefined' && localStorage.getItem('upang_broadcasts_removed') !== 'true') {
  localStorage.removeItem('upang_broadcasts_data')
  localStorage.setItem('upang_broadcasts_removed', 'true')
}

export function App() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timeout = window.setTimeout(() => setIsLoading(false), 650)
    return () => window.clearTimeout(timeout)
  }, [])

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('upang_admin_auth') === 'true'
  })
  const [adminName, setAdminName] = useState<string>(() => {
    return localStorage.getItem('upang_admin_name') || 'Engr. Jeremy'
  })

  // Navigation State
  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Data States with LocalStorage Persistence
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>(() => {
    const saved = localStorage.getItem('upang_kb_data')
    return saved ? JSON.parse(saved) : INITIAL_KNOWLEDGE
  })

  const [inquiries, setInquiries] = useState<InquiryLog[]>(() => {
    const saved = localStorage.getItem('upang_inquiries_data')
    return saved ? JSON.parse(saved) : INITIAL_INQUIRIES
  })

  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('upang_users_data')
    return saved ? JSON.parse(saved) : INITIAL_USERS
  })

  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('upang_settings_data')
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS
  })

  // Modals
  const [isAddKnowledgeOpen, setIsAddKnowledgeOpen] = useState(false)

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('upang_kb_data', JSON.stringify(knowledgeItems))
  }, [knowledgeItems])

  useEffect(() => {
    localStorage.setItem('upang_inquiries_data', JSON.stringify(inquiries))
  }, [inquiries])

  useEffect(() => {
    localStorage.setItem('upang_users_data', JSON.stringify(users))
  }, [users])

  useEffect(() => {
    localStorage.setItem('upang_settings_data', JSON.stringify(settings))
  }, [settings])

  // Login handler
  const handleLogin = (name: string) => {
    setIsAuthenticated(true)
    setAdminName(name)
    localStorage.setItem('upang_admin_auth', 'true')
    localStorage.setItem('upang_admin_name', name)
  }

  // Logout handler
  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('upang_admin_auth')
  }

  // Knowledge base actions
  const handleAddKnowledge = (
    item: Omit<KnowledgeItem, 'id' | 'viewsCount' | 'updatedAt'>
  ) => {
    const newItem: KnowledgeItem = {
      ...item,
      id: `kb-${Date.now()}`,
      viewsCount: 0,
      updatedAt: new Date().toISOString().split('T')[0],
    }
    setKnowledgeItems((prev) => [newItem, ...prev])
  }

  const handleUpdateKnowledge = (id: string, updated: Partial<KnowledgeItem>) => {
    setKnowledgeItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    )
  }

  const handleDeleteKnowledge = (id: string) => {
    setKnowledgeItems((prev) => prev.filter((item) => item.id !== id))
  }

  // Inquiry actions
  const handleUpdateInquiryStatus = (
    id: string,
    status: InquiryLog['status']
  ) => {
    setInquiries((prev) =>
      prev.map((inq) => (inq.id === id ? { ...inq, status } : inq))
    )
  }

  // Users actions
  const handleAddUser = (user: Omit<UserAccount, 'id' | 'lastActive'>) => {
    const newUser: UserAccount = {
      ...user,
      id: `usr-${Date.now()}`,
      lastActive: 'Just now',
    }
    setUsers((prev) => [newUser, ...prev])
  }

  const handleUpdateUserRole = (id: string, role: UserAccount['role']) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role } : u))
    )
  }

  // Settings actions
  const handleSaveSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings)
  }

  const handleExportData = () => {
    const backup = {
      exportDate: new Date().toISOString(),
      knowledgeItems,
      inquiries,
      users,
      settings,
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `upang-assist-admin-backup-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleResetDefaults = () => {
    if (window.confirm('Reset all Admin data like new to initial campus defaults?')) {
      localStorage.removeItem('upang_kb_data')
      localStorage.removeItem('upang_inquiries_data')
      localStorage.removeItem('upang_users_data')
      localStorage.removeItem('upang_settings_data')
      setKnowledgeItems([])
      setInquiries([])
      setUsers([])
      setSettings(INITIAL_SETTINGS)
      alert('All admin data has been reset like brand new!')
    }
  }

  const handleWipeBlank = () => {
    if (window.confirm('Are you sure you want to wipe all records to a clean blank slate?')) {
      localStorage.removeItem('upang_kb_data')
      localStorage.removeItem('upang_inquiries_data')
      localStorage.removeItem('upang_users_data')
      setKnowledgeItems([])
      setInquiries([])
      setUsers([])
      setSettings(INITIAL_SETTINGS)
      alert('All admin tables wiped to a clean blank slate.')
    }
  }

  if (isLoading) {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center gap-5 bg-[#08170f] text-white"
        role="status"
        aria-live="polite"
      >
        <img src={upangLogo} alt="PHINMA UPang" className="h-16 w-16 object-contain" />
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-[#f0b445]" />
        <p className="text-sm font-medium text-white/70">Loading admin portal…</p>
      </main>
    )
  }

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLogin} />
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-white">
      {/* Top Navbar */}
      <AdminNavbar
        adminName={adminName}
        onLogout={handleLogout}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onResetLikeNew={handleResetDefaults}
      />

      <div className="flex flex-1">
        {/* Sidebar */}
        <AdminSidebar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          isOpen={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {currentTab === 'dashboard' && (
            <DashboardView
              inquiries={inquiries}
              knowledgeItems={knowledgeItems}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onOpenAddKnowledge={() => {
                setCurrentTab('knowledge')
                setIsAddKnowledgeOpen(true)
              }}
            />
          )}

          {currentTab === 'knowledge' && (
            <KnowledgeBaseView
              items={knowledgeItems}
              onAddItem={handleAddKnowledge}
              onUpdateItem={handleUpdateKnowledge}
              onDeleteItem={handleDeleteKnowledge}
              isAddModalOpen={isAddKnowledgeOpen}
              setIsAddModalOpen={setIsAddKnowledgeOpen}
            />
          )}

          {currentTab === 'inquiries' && (
            <InquiriesView
              inquiries={inquiries}
              onUpdateStatus={handleUpdateInquiryStatus}
            />
          )}

          {currentTab === 'users' && (
            <UsersView
              users={users}
              onAddUser={handleAddUser}
              onUpdateRole={handleUpdateUserRole}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onExportData={handleExportData}
              onResetDefaults={handleResetDefaults}
              onWipeBlank={handleWipeBlank}
            />
          )}
        </main>
      </div>
    </div>
  )
}

export default App
