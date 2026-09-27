import React, { useState } from 'react'
import {
  Server,
  Mail,
  Bot,
  Save,
  CheckCircle,
  ExternalLink,
  Download,
  RotateCcw,
} from 'lucide-react'
import type { SystemSettings } from '../types'

interface SettingsViewProps {
  settings: SystemSettings
  onSaveSettings: (settings: SystemSettings) => void
  onExportData: () => void
  onResetDefaults: () => void
  onWipeBlank?: () => void
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onExportData,
  onResetDefaults,
  onWipeBlank,
}) => {
  const [formData, setFormData] = useState<SystemSettings>(settings)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSaveSettings(formData)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">
            System & AI Topology Settings
          </h1>
          <p className="text-xs text-white/60 mt-1">
            Configure local server host bindings, Bexie AI persona behavior, and office escalation addresses.
          </p>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Localhost & Network Topology */}
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
            <Server className="w-4 h-4 text-[#f0b445]" />
            <h2 className="text-sm font-extrabold text-white">
              Multi-Instance Localhost Configuration
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-[#df9e28]/40">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#f0b445] block mb-1">
                Admin Console
              </span>
              <div className="font-mono text-xs font-bold text-white mb-2">
                http://localhost:{formData.adminPort}
              </div>
              <p className="text-[11px] text-white/60 mb-3 leading-relaxed">
                Admin dashboard.
              </p>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> ACTIVE
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 block mb-1">
                Student Chatbot App
              </span>
              <div className="font-mono text-xs font-bold text-white mb-2">
                http://localhost:{formData.studentPort}
              </div>
              <p className="text-[11px] text-white/60 mb-3 leading-relaxed">
                The public and authenticated student interface with ThoughtLine and campus advice.
              </p>
              <a
                href={`http://localhost:${formData.studentPort}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] font-bold text-[#f0b445] bg-[#df9e28]/15 border border-[#df9e28]/35 px-2.5 py-0.5 rounded-md hover:underline"
              >
                <span>OPEN INSTANCE</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400 block mb-1">
                Express Server API
              </span>
              <div className="font-mono text-xs font-bold text-white mb-2">
                http://localhost:{formData.serverPort}
              </div>
              <p className="text-[11px] text-white/60 mb-3 leading-relaxed">
                Node.js & MongoDB backend for tasks, database, and auth endpoints.
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 rounded-md">
                PORT 3000
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: AI Mascot & Personality */}
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
            <Bot className="w-4 h-4 text-[#f0b445]" />
            <h2 className="text-sm font-extrabold text-white">
              Bexie Assistant Persona & Response Rules
            </h2>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-white/80 mb-1">
                  Assistant Display Name
                </label>
                <input
                  type="text"
                  value={formData.botName}
                  onChange={(e) => setFormData({ ...formData, botName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#f0b445]"
                />
              </div>

              <div>
                <label className="block font-bold text-white/80 mb-1">
                  Persona Role Tagline
                </label>
                <input
                  type="text"
                  value={formData.botRole}
                  onChange={(e) => setFormData({ ...formData, botRole: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#f0b445]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-white/80 mb-1">
                Student Welcome Greeting
              </label>
              <textarea
                rows={2}
                value={formData.aiGreeting}
                onChange={(e) => setFormData({ ...formData, aiGreeting: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#f0b445] font-sans leading-relaxed"
              />
            </div>

            <div>
              <label className="block font-bold text-white/80 mb-1">
                Fallback Query Message (When query is outside knowledge base)
              </label>
              <textarea
                rows={2}
                value={formData.aiFallbackResponse}
                onChange={(e) => setFormData({ ...formData, aiFallbackResponse: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#f0b445] font-sans leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Office Escalation Routing */}
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
            <Mail className="w-4 h-4 text-[#f0b445]" />
            <h2 className="text-sm font-extrabold text-white">
              Official Campus Escalation Routing
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-white/80 mb-1">
                Office of the Registrar
              </label>
              <input
                type="email"
                value={formData.escalationEmailRegistrar}
                onChange={(e) =>
                  setFormData({ ...formData, escalationEmailRegistrar: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#f0b445]"
              />
            </div>

            <div>
              <label className="block font-bold text-white/80 mb-1">
                University Cashier / Finance
              </label>
              <input
                type="email"
                value={formData.escalationEmailCashier}
                onChange={(e) =>
                  setFormData({ ...formData, escalationEmailCashier: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#f0b445]"
              />
            </div>

            <div>
              <label className="block font-bold text-white/80 mb-1">
                Hawak Kamay Scholarships
              </label>
              <input
                type="email"
                value={formData.escalationEmailScholarship}
                onChange={(e) =>
                  setFormData({ ...formData, escalationEmailScholarship: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#f0b445]"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onExportData}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border border-white/15 bg-white/5 hover:bg-white/10 text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export System Backup (JSON)</span>
            </button>
            <button
              type="button"
              onClick={onResetDefaults}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border border-[#df9e28]/50 bg-[#df9e28]/15 hover:bg-[#df9e28]/25 text-[#f0b445] transition-colors"
              title="Reset all FAQs and data to brand new campus defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Like New (Defaults)</span>
            </button>
            {onWipeBlank && (
              <button
                type="button"
                onClick={onWipeBlank}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition-colors"
                title="Wipe all tables to 0 records (blank slate)"
              >
                <span>Wipe Blank Slate</span>
              </button>
            )}
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#df9e28] to-[#f0b445] text-[#08170f] shadow-lg shadow-black/30 hover:brightness-110 transition-all"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  )
}
