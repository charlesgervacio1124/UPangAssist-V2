import React, { useState } from 'react'
import {
  MessageSquareText,
  Search,
  Star,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  X,
  Filter,
} from 'lucide-react'
import type { InquiryLog } from '../types'

interface InquiriesViewProps {
  inquiries: InquiryLog[]
  onUpdateStatus: (id: string, newStatus: InquiryLog['status']) => void
}

export const InquiriesView: React.FC<InquiriesViewProps> = ({
  inquiries,
  onUpdateStatus,
}) => {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [categoryFilter, setCategoryFilter] = useState<string>('All')
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryLog | null>(null)

  const filtered = inquiries.filter((inq) => {
    const matchesSearch =
      inq.studentName.toLowerCase().includes(search.toLowerCase()) ||
      inq.studentId.toLowerCase().includes(search.toLowerCase()) ||
      inq.query.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'All' || inq.status === statusFilter
    const matchesCategory = categoryFilter === 'All' || inq.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">
              Student Inquiry Logs & AI Sentiment
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#df9e28]/20 text-[#f0b445] border border-[#df9e28]/40">
              {inquiries.length} Inquiries Logged
            </span>
          </div>
          <p className="text-xs text-white/60 mt-1">
            Real-time chat transcripts and student satisfaction ratings from the Upang Assist Assistant.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 glass-panel p-3 rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, ID, or query text..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/40 focus:outline-none focus:border-[#f0b445]"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-white/50 mr-1">
            <Filter className="w-3.5 h-3.5 text-[#f0b445]" />
            <span>Filter:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-white/10 bg-[#08170f] text-white focus:outline-none focus:border-[#f0b445]"
          >
            <option value="All">All Statuses</option>
            <option value="Resolved">Resolved</option>
            <option value="Escalated">Escalated</option>
            <option value="Pending Review">Pending Review</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-white/10 bg-[#08170f] text-white focus:outline-none focus:border-[#f0b445]"
          >
            <option value="All">All Categories</option>
            <option value="Registrar & Records">Registrar</option>
            <option value="Tuition & Cashier">Tuition</option>
            <option value="Scholarships (Hawak Kamay)">Scholarships</option>
            <option value="Campus Buildings & Rooms">Buildings</option>
            <option value="Enrollment & Advising">Enrollment</option>
            <option value="Clinic & Student Health">Clinic</option>
          </select>
        </div>
      </div>

      {/* Inquiries Table */}
      <div className="glass-panel rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 text-white/50 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Student Query</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Satisfaction</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((inq) => (
                <tr key={inq.id} className="hover:bg-white/[0.04] transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-white">{inq.studentName}</div>
                    <div className="font-mono text-[10px] text-white/40">{inq.studentId}</div>
                  </td>

                  <td className="py-3 px-4 max-w-xs">
                    <p className="font-medium text-white/90 truncate" title={inq.query}>
                      {inq.query}
                    </p>
                    <p className="text-[11px] text-white/40 truncate mt-0.5 font-mono">
                      {inq.responseSnippet}
                    </p>
                  </td>

                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#df9e28]/15 text-[#f0b445] border border-[#df9e28]/30">
                      {inq.category}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < inq.rating
                              ? 'text-[#f0b445] fill-[#f0b445]'
                              : 'text-white/20'
                          }`}
                        />
                      ))}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        inq.status === 'Resolved'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : inq.status === 'Escalated'
                          ? 'bg-[#df9e28]/20 text-[#f0b445] border border-[#df9e28]/40'
                          : 'bg-white/10 text-white/60'
                      }`}
                    >
                      {inq.status === 'Resolved' && <CheckCircle2 className="w-3 h-3" />}
                      {inq.status === 'Escalated' && <AlertTriangle className="w-3 h-3" />}
                      {inq.status === 'Pending Review' && <Clock className="w-3 h-3" />}
                      {inq.status}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-mono text-[11px] text-white/40 whitespace-nowrap">
                    {inq.timestamp}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedInquiry(inq)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-[#f0b445] bg-[#df9e28]/15 hover:bg-[#df9e28]/25 border border-[#df9e28]/35 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <MessageSquareText className="w-8 h-8 text-white/30 mx-auto mb-2" />
            <p className="text-sm font-bold text-white">No matching inquiries</p>
            <p className="text-xs text-white/50 mt-1">Try relaxing your search terms or filters.</p>
          </div>
        )}
      </div>

      {/* Inquiry Detail Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0c2217] rounded-3xl border border-[#df9e28]/40 w-full max-w-lg shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-sm font-extrabold text-white">Inquiry Inspection</h3>
                <span className="text-[11px] text-[#f0b445] font-mono">{selectedInquiry.id}</span>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
                <span className="text-[10px] font-bold uppercase text-[#f0b445] block mb-1">Student</span>
                <div className="font-bold text-white text-sm">
                  {selectedInquiry.studentName} ({selectedInquiry.studentId})
                </div>
                <div className="text-[11px] text-white/40 mt-0.5">Asked {selectedInquiry.timestamp}</div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-white/60 block mb-1">Student Question</span>
                <div className="p-3.5 rounded-2xl bg-[#df9e28]/15 border border-[#df9e28]/35 text-white font-medium leading-relaxed">
                  {selectedInquiry.query}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-white/60 block mb-1">Assistant Response</span>
                <div className="p-3.5 rounded-2xl bg-black/30 border border-white/10 text-white/80 leading-relaxed font-sans">
                  {selectedInquiry.responseSnippet}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-white/60 font-medium">Update Resolution:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onUpdateStatus(selectedInquiry.id, 'Resolved')
                      setSelectedInquiry({ ...selectedInquiry, status: 'Resolved' })
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedInquiry.status === 'Resolved'
                        ? 'bg-[#10b981] text-white shadow-md'
                        : 'bg-white/10 text-white/70 hover:bg-white/15'
                    }`}
                  >
                    Resolved
                  </button>
                  <button
                    onClick={() => {
                      onUpdateStatus(selectedInquiry.id, 'Escalated')
                      setSelectedInquiry({ ...selectedInquiry, status: 'Escalated' })
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedInquiry.status === 'Escalated'
                        ? 'bg-[#df9e28] text-[#08170f] shadow-md'
                        : 'bg-white/10 text-white/70 hover:bg-white/15'
                    }`}
                  >
                    Escalated
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setSelectedInquiry(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
