import { useState, useEffect, useRef } from 'react'
import upangLogo from './assets/upang logo.png'
import Bexie from './assets/Bexie.jpg'
import ThoughtLine from './ThoughtLine'
import './App.css'

const quickPrompts = [
  "Where is the Registrar's Office?",
  'Where can I pay my tuition?',
  'How can I apply for a scholarship?',
  'Where are the campus buildings located?',
]

// Use the same origin in production. During local development, Vite proxies
// this path to the API server (see vite.config.js).
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

// Mock responses tailored to PHINMA University of Pangasinan
function generateCampusResponse(query) {
  const lower = query.toLowerCase()

  if (lower.includes('registrar') || lower.includes('tor') || lower.includes('transcript') || lower.includes('record')) {
    return {
      text: `The **Office of the University Registrar** is located on the **Ground Floor of the Main Building** (Administration Wing).\n\n• **Window Hours:** Monday to Friday, 8:00 AM – 5:00 PM | Saturday, 8:00 AM – 12:00 PM\n• **Services:** Transcript of Records (TOR), Honorable Dismissal, Certificate of Good Moral, True Copy of Grades (TCG), and CAV authentication.\n• **Document Processing:** You can submit document requests online via the Student Portal or visit Window 1 & 2 for document claiming.\n\n*Tip: Bring your Valid Student ID and official receipt when claiming documents.*`,
      followUps: ['How to request Honorable Dismissal?', 'What are the fees for Transcript of Records?'],
    }
  }

  if (lower.includes('tuition') || lower.includes('pay') || lower.includes('cashier') || lower.includes('fee') || lower.includes('installment')) {
    return {
      text: `PHINMA UPang offers flexible installment payment plans:\n\n**1. On-Campus Payment:**\n• **Location:** University Cashier, Ground Floor, Admin Wing\n• **Hours:** Mon–Fri 8:00 AM – 4:30 PM\n\n**2. Online / Bank Channels:**\n• **GCash / Maya:** Search for "PHINMA University of Pangasinan" in Bills Payment\n• **Landbank / BDO:** Over-the-counter or online bank deposit using your Student Number as Reference\n• **Student Portal:** Settle balances directly through the integrated payment gateway\n\n*Note: Allow 24 to 48 hours for online payments to reflect in your official ledger.*`,
      followUps: ['Where can I see my remaining balance?', 'Promissory note procedures'],
    }
  }

  if (lower.includes('scholarship') || lower.includes('hawak kamay') || lower.includes('discount') || lower.includes('grant')) {
    return {
      text: `PHINMA UPang is committed to accessible education through the **Hawak Kamay (HK) Scholarship**:\n\n• **Coverage:** Up to 50% – 75% tuition and miscellaneous discount.\n• **Eligibility:** Open to high school graduates and continuing students with a heart to learn. No maintaining honors grade required — just pass your enrolled subjects!\n• **Requirements:**\n  1. Accomplished HK Application Form\n  2. Certificate of Indigency or Proof of Income (ITR)\n  3. Latest Report Card or Transcript of Grades\n  4. 2x2 ID Photo\n• **Where to apply:** Student Development & Scholarships Office, 2nd Floor Student Pavilion.`,
      followUps: ['Are there scholarships for Dean\'s Listers?', 'CHED Tulong Dunong requirements'],
    }
  }

  if (lower.includes('building') || lower.includes('cea') || lower.includes('cbt') || lower.includes('library') || lower.includes('map') || lower.includes('where')) {
    return {
      text: `Here is a quick directory of key campus landmarks at PHINMA UPang Dagupan:\n\n• 🏛️ **Main Building:** Administration, Registrar, Cashier, and College of Education.\n• 🏗️ **CEA Building:** College of Engineering & Architecture, drafting laboratories, CAD labs, and civil testing rooms.\n• 💼 **CBT Building:** College of Business and Technology, IT/Computer laboratories, and business mock offices.\n• 📖 **University Library:** 3rd & 4th Floors of the Student Center Building with quiet study carrels, online catalog access, and discussion rooms.\n• 🏀 **University Gymnasium:** Located near the athletic field for physical education classes and university assemblies.`,
      followUps: ['Where is the IT laboratory located?', 'Where is the Student Pavilion?'],
    }
  }

  if (lower.includes('enroll') || lower.includes('subject') || lower.includes('advising') || lower.includes('schedule')) {
    return {
      text: `Step-by-Step Enrollment Guide for PHINMA UPang Wildcats:\n\n1. **Step 1 — Advising:** Log in to the UPang Student Portal or visit your College Dean's Office for curriculum evaluation.\n2. **Step 2 — Sectioning:** Select your course load and class schedules.\n3. **Step 3 — Assessment:** Review your breakdown of tuition and payment schedule.\n4. **Step 4 — Downpayment:** Settle the minimum downpayment through online channels or the Cashier.\n5. **Step 5 — Official Registration:** Your Certificate of Matriculation (COM) will be generated and marked ENROLLED.`,
      followUps: ['Can I add or drop subjects after enrollment?', 'How to shift programs?'],
    }
  }

  if (lower.includes('clinic') || lower.includes('guidance') || lower.includes('counseling') || lower.includes('health') || lower.includes('doctor')) {
    return {
      text: `Student Health & Wellness Facilities:\n\n• 🩺 **University Clinic:** Ground Floor, Student Pavilion.\n  - Open Monday to Friday, 8:00 AM – 5:00 PM.\n  - Offers free physician consultations, routine checkups, emergency first aid, and basic over-the-counter medicine.\n\n• 💬 **Guidance & Counseling Center:** 2nd Floor, Main Wing.\n  - Provides academic counseling, career assessments, and psychological wellness counseling.\n  - Consultations are strictly confidential. Walk-ins and appointments are welcome.`,
      followUps: ['Medical certificate requirement for absences', 'How to schedule a guidance appointment'],
    }
  }

  return {
    text: `Hello, Wildcat! I am here to assist you with anything regarding **PHINMA University of Pangasinan**.\n\nYou can ask me about:\n• 🏛️ Registrar window hours, TOR requests, and certifications\n• 💳 Tuition payments, installment plans, and cashier lines\n• 🎓 Hawak Kamay scholarships, grants, and discounts\n• 🗺️ Campus buildings, IT labs, and library facilities\n• 📋 Enrollment procedures and curriculum advising\n\nHow can I best help you today?`,
    followUps: ['Where is the Registrar\'s Office?', 'How to apply for Hawak Kamay scholarship?'],
  }
}

let nextUniqueId = 1000
function getNextId(prefix = 'item') {
  nextUniqueId += 1
  return `${prefix}_${nextUniqueId}`
}

export default function App() {
  const [view, setView] = useState('assistant')
  const [isLoadingHome, setIsLoadingHome] = useState(false)
  const [userName, setUserName] = useState('')
  const [userRole, setUserRole] = useState('')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [showThoughtLine, setShowThoughtLine] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeHistoryId, setActiveHistoryId] = useState(null)
  const [historyList, setHistoryList] = useState([
    { id: 'h1', title: "Where is the Registrar's Office?" },
    { id: 'h2', title: 'Hawak Kamay scholarship requirements' },
    { id: 'h3', title: 'Tuition payment channels' },
  ])

  const chatEndRef = useRef(null)
  const inputRef = useRef(null)
  const streamBufferRef = useRef('')
  const thoughtHideTimerRef = useRef(null)

  const clearPendingChatTimers = () => {
    if (thoughtHideTimerRef.current) {
      window.clearTimeout(thoughtHideTimerRef.current)
      thoughtHideTimerRef.current = null
    }
  }

  const enterHome = (name = 'Guest', role = 'Guest') => {
    setUserName(name)
    setUserRole(role)
    setIsLoadingHome(true)
    window.setTimeout(() => {
      setView('assistant')
      setIsLoadingHome(false)
    }, 1200)
  }

  const handleAccountAction = () => {
    if (userName) {
      clearPendingChatTimers()
      setMessages([])
      setInput('')
      setIsTyping(false)
      setShowThoughtLine(false)
      setActiveHistoryId(null)
      setUserName('')
      setUserRole('')
    }
    setView('login')
  }

  // Scroll to bottom when messages update
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping])

  const handleSendMessage = async (textToSend) => {
    const trimmed = (textToSend || input).trim()
    if (!trimmed || isTyping) return

    const userMessage = {
      id: getNextId('user_msg'),
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsTyping(true)
    setShowThoughtLine(true)
    if (thoughtHideTimerRef.current) {
      window.clearTimeout(thoughtHideTimerRef.current)
      thoughtHideTimerRef.current = null
    }

    // Save to history if this is a fresh conversation
    if (messages.length === 0) {
      const newHistoryItem = {
        id: getNextId('hist'),
        title: trimmed.length > 32 ? trimmed.substring(0, 32) + '...' : trimmed,
      }
      setHistoryList((prev) => [newHistoryItem, ...prev])
      setActiveHistoryId(newHistoryItem.id)
    }

    const assistantMsgId = getNextId('asst_msg')
    const assistantTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    try {
      const response = await fetch(`${apiBaseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmed, stream: true }),
      })

      if (!response.ok) {
        throw new Error('Chat request failed')
      }

      const contentType = response.headers.get('content-type') || ''

      if (contentType.includes('application/json')) {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Chat request failed')
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
            sender: 'assistant',
            text: data.text,
            followUps: [],
            timestamp: assistantTimestamp,
          },
        ])
        setIsTyping(false)
      } else {
        // Stream text chunk-by-chunk for real-time typewriter display
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        streamBufferRef.current = ''

        // Create empty assistant bubble first
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
            sender: 'assistant',
            text: '',
            followUps: [],
            timestamp: assistantTimestamp,
          },
        ])
        setIsTyping(false)

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const accumulatedText = streamBufferRef.current + decoder.decode(value, { stream: true })
          streamBufferRef.current = accumulatedText

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, text: accumulatedText } : msg
            )
          )
        }
      }
    } catch (err) {
      console.error('Chat error:', err)
      const fallbackResponse = generateCampusResponse(trimmed)
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === assistantMsgId)
        const fallbackMsg = {
          id: assistantMsgId,
          sender: 'assistant',
          text: fallbackResponse.text,
          followUps: fallbackResponse.followUps,
          timestamp: assistantTimestamp,
        }
        return exists
          ? prev.map((m) => (m.id === assistantMsgId ? fallbackMsg : m))
          : [...prev, fallbackMsg]
      })
    } finally {
      setIsTyping(false)
      thoughtHideTimerRef.current = window.setTimeout(() => {
        setShowThoughtLine(false)
        thoughtHideTimerRef.current = null
      }, 900)
    }
  }

  const handlePromptClick = (prompt) => {
    handleSendMessage(prompt)
  }

  const handleNewConversation = () => {
    clearPendingChatTimers()
    setMessages([])
    setInput('')
    setIsTyping(false)
    setShowThoughtLine(false)
    setActiveHistoryId(null)
    if (window.innerWidth <= 900) {
      setSidebarOpen(false)
    }
  }

  const handleSelectHistory = (item) => {
    clearPendingChatTimers()
    setIsTyping(false)
    setActiveHistoryId(item.id)
    setShowThoughtLine(false)
    const responseData = generateCampusResponse(item.title)
    setMessages([
      {
        id: getNextId('hist_usr'),
        sender: 'user',
        text: item.title,
        timestamp: 'Just now',
      },
      {
        id: getNextId('hist_asst'),
        sender: 'assistant',
        text: responseData.text,
        followUps: responseData.followUps,
        timestamp: 'Just now',
      },
    ])
    if (window.innerWidth <= 900) {
      setSidebarOpen(false)
    }
  }

  const handleDeleteHistory = (e, id) => {
    e.stopPropagation()
    setHistoryList((prev) => prev.filter((item) => item.id !== id))
    if (activeHistoryId === id) {
      handleNewConversation()
    }
  }

  if (isLoadingHome) {
    return <HomeLoadingScreen />
  }

  if (view === 'login') {
    return <LoginPage onGuest={enterHome} onGoogle={enterHome} onSignUp={() => setView('signup')} onEnterHome={enterHome} />
  }

  if (view === 'signup') {
    return <SignupPage onBack={() => setView('login')} onGoogle={enterHome} onEnterHome={enterHome} />
  }

  return (
    <div className="app-shell">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Brand Header */}
        <div className="brand" aria-label="Upang Assist brand">
          <div className="brand-badge">
            <img src={upangLogo} alt="PHINMA UPang Logo" className="brand-logo-img" />
          </div>
          <h1>Upang Assist</h1>
          <button
            className="sidebar-close-btn"
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* New Conversation Button */}
        <button
          className="new-conversation"
          type="button"
          onClick={handleNewConversation}
        >
          <span className="plus">+</span>
          <span>New Conversation</span>
        </button>

        {/* History Section */}
        <div className="history-label">History</div>
        <ul className="history-list">
          {historyList.map((item) => (
            <li
              key={item.id}
              className={`history-item ${activeHistoryId === item.id ? 'active' : ''}`}
              onClick={() => handleSelectHistory(item)}
            >
              <span className="history-title">{item.title}</span>
              <button
                type="button"
                className="history-delete-btn"
                onClick={(e) => handleDeleteHistory(e, item.id)}
                title="Delete conversation"
                aria-label="Delete item"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        {/* Sidebar Links & Log In */}
        <div className="sidebar-links">
          <span>Help</span>
          <span>Settings</span>
          <span>About</span>
        </div>

        <button
          className={`login-btn ${userName ? 'account-btn' : ''}`}
          type="button"
          onClick={handleAccountAction}
          title={userName ? 'Log out' : 'Log in'}
        >
          {userName ? (
            <>
              <span className="account-details">
                <span className="account-name">Hi, {userName}</span>
                <span className="account-role">{userRole || 'Guest'}</span>
              </span>
              <svg className="logout-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </>
          ) : 'LOG IN'}
        </button>
      </aside>

      {/* Main Panel */}
      <main className="main-panel">
        {/* Top Header Bar */}
        <header className="main-topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-trigger"
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>

            <div className="campus-badge">
              <span className="status-dot" aria-hidden="true"></span>Upang<span>Ai</span>
            </div>
          </div>

          <div className="topbar-right">
            {messages.length > 0 && (
              <button
                className="reset-chat-btn"
                type="button"
                onClick={handleNewConversation}
                title="Start a new conversation"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                  <path d="M21 3v5h-5"></path>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                  <path d="M8 16H3v5"></path>
                </svg>
                <span>Clear Chat</span>
              </button>
            )}
          </div>
        </header>

        {/* Content Area: Welcome Center Screen OR Chat Thread */}
        <div className="main-content-scroll">
          {messages.length === 0 ? (
            <div className="welcome-center">
              <div className="hero-emblem-badge">
                <img src={upangLogo} alt="UPang Torch" className="hero-torch-img" />
              </div>

              <header className="welcome-block">
                <h2>
                  Welcome, <span>{userName || 'Guest'}</span>
                </h2>
                <p className="welcome-tagline">
                  What can I help you today?
                </p>
              </header>

              <div className="welcome-insights" aria-label="Campus assistance overview">
                <div className="insight-card insight-gold">
                  <span className="insight-icon">🏛️</span>
                  <span className="insight-label">Quick Help</span>
                  <strong>Registrar</strong>
                  <small>Office hours & TOR requests</small>
                </div>
                <div className="insight-card insight-green">
                  <span className="insight-icon">💳</span>
                  <span className="insight-label">Payment</span>
                  <strong>Tuition</strong>
                  <small>Installments & cashier guidance</small>
                </div>
                <div className="insight-card insight-amber">
                  <span className="insight-icon">🎓</span>
                  <span className="insight-label">Support</span>
                  <strong>Scholarships</strong>
                  <small>Programs & eligibility essentials</small>
                </div>
              </div>

              <form
                className="prompt-box"
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendMessage()
                }}
              >
                <span className="prompt-plus" aria-hidden="true">+</span>
                <input
                  ref={inputRef}
                  className="prompt-input"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Anything"
                  aria-label="Ask a question"
                />
                {input && (
                  <button
                    type="button"
                    className="prompt-clear-btn"
                    onClick={() => setInput('')}
                    aria-label="Clear input text"
                  >
                    ✕
                  </button>
                )}
                <button
                  className={`send-btn ${input.trim() ? 'send-btn-active' : ''}`}
                  type="submit"
                  aria-label="Send message"
                  disabled={!input.trim() || isTyping}
                >
                  <span className="send-arrow" aria-hidden="true">→</span>
                </button>
              </form>

              <div className="suggestion-list">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="suggestion-item"
                    onClick={() => handlePromptClick(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="chat-thread">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message-row ${msg.sender === 'user' ? 'message-user' : 'message-assistant'}`}
                >
                  {msg.sender === 'assistant' && (
                    <div className="message-avatar" aria-hidden="true">
                      <img src={Bexie} alt="Bexie" className="avatar-torch" />
                    </div>
                  )}

                  <div className="message-bubble-wrap">
                    <div className="message-meta">
                      <span className="sender-name">
                        {msg.sender === 'user' ? 'You' : 'Bexie'}
                      </span>
                      <span className="message-time">{msg.timestamp}</span>
                    </div>

                    <div className="message-bubble">
                      {msg.sender === 'assistant' ? (
                        <div
                          className="formatted-content"
                          dangerouslySetInnerHTML={{
                            __html: formatMarkdown(msg.text),
                          }}
                        />
                      ) : (
                        <p>{msg.text}</p>
                      )}
                    </div>

                    {msg.followUps && msg.followUps.length > 0 && (
                      <div className="followup-chips">
                        {msg.followUps.map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            className="followup-chip-btn"
                            onClick={() => handleSendMessage(chip)}
                          >
                            <span>{chip}</span>
                            <span className="chip-plus">+</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {msg.sender === 'user' && (
                    <div className="user-avatar-bubble" aria-hidden="true">
                      <span>U</span>
                    </div>
                  )}
                </div>
              ))}

              {(isTyping || showThoughtLine) && (
                <div className="message-row message-assistant">
                  <div className="message-avatar" aria-hidden="true">
                    <img src={upangLogo} alt="Bexie" className="avatar-torch" />
                  </div>
                  <div className="message-bubble-wrap">
                    <ThoughtLine
                      working={isTyping}
                      steps={['Reading the question', 'Searching your notes', 'Drafting an answer']}
                      label="Thinking…"
                      doneLabel="Thought for"
                      glyph="sparkle"
                      fontSize={16}
                      breathPeriod={2.6}
                      breathDepth={0.45}
                      settleDuration={550}
                      settleBlur={2}
                      collapsible
                      collapseOnSettle
                      showTimer
                      onSettle={(seconds) => console.log(`thought for ${seconds}s`)}
                    />
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Docked Prompt Box for ongoing chat */}
        {messages.length > 0 && (
          <div className="chat-composer-wrap">
            <form
              className="prompt-box prompt-box-docked"
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
            >
              <span className="prompt-plus" aria-hidden="true">+</span>
              <input
                ref={inputRef}
                className="prompt-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Anything"
                aria-label="Ask a question"
              />
              {input && (
                <button
                  type="button"
                  className="prompt-clear-btn"
                  onClick={() => setInput('')}
                  aria-label="Clear input text"
                >
                  ✕
                </button>
              )}
              <button
                className={`send-btn ${input.trim() ? 'send-btn-active' : ''}`}
                type="submit"
                aria-label="Send message"
                disabled={!input.trim() || isTyping}
              >
                <span className="send-arrow" aria-hidden="true">→</span>
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}

function HomeLoadingScreen() {
  return (
    <main className="home-loading" role="status" aria-live="polite">
      <div className="home-loading-mark">
        <img src={upangLogo} alt="" className="home-loading-logo" />
      </div>
      <p className="home-loading-kicker">UPANG ASSIST</p>
      <h1>Preparing your campus assistant</h1>
      <div className="home-loading-bar" aria-hidden="true"><span></span></div>
      <p className="home-loading-note">Loading your personalized experience...</p>
    </main>
  )
}

// Markdown formatter for clean assistant text display
function formatMarkdown(text) {
  if (!text) return ''

  let formatted = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>')

  const lines = formatted.split('\n')
  let inList = false
  let result = []

  for (let line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
      if (!inList) {
        result.push('<ul class="chat-md-list">')
        inList = true
      }
      result.push(`<li>${trimmed.substring(2)}</li>`)
    } else {
      if (inList) {
        result.push('</ul>')
        inList = false
      }
      if (trimmed === '') {
        result.push('<div class="chat-md-gap"></div>')
      } else {
        result.push(`<p class="chat-md-p">${line}</p>`)
      }
    }
  }

  if (inList) {
    result.push('</ul>')
  }

  return result.join('')
}

function GoogleIcon() {
  return (
    <svg className="social-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.6 3.8-5.4 3.8-3.2 0-5.8-2.7-5.8-6s2.6-6 5.8-6c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.7 3.1 14.6 2.2 12 2.2 6.9 2.2 2.8 6.3 2.8 11.4s4.1 9.2 9.2 9.2c5.3 0 8.8-3.7 8.8-8.9 0-.6-.1-1.1-.2-1.5H12Z"/>
      <path fill="#4285F4" d="M3.7 7.1l3.5 2.6c1-1.9 3.1-3.1 5.8-3.1 1.8 0 3 .8 3.7 1.5l2.5-2.4C16.7 3.1 14.6 2.2 12 2.2c-3.7 0-6.9 2.1-8.3 5.1Z"/>
      <path fill="#FBBC05" d="M3.8 15.6A9.3 9.3 0 0 1 3.3 11c0-.9.2-1.8.5-2.6L.9 6.1A11.2 11.2 0 0 0 0 11c0 1.8.4 3.5 1.2 5l2.6-1.4Z"/>
      <path fill="#34A853" d="M12 21.7c2.5 0 4.5-.8 6-2.2l-2.9-2.4c-.8.5-1.9.9-3.1.9-2.7 0-4.9-1.9-5.4-4.3l-3 2.3A9.2 9.2 0 0 0 12 21.7Z"/>
    </svg>
  )
}

function LoginPage({ onGuest, onGoogle, onSignUp, onEnterHome }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const handleSubmit = (event) => {
    event.preventDefault()
    const displayName = email.split('@')[0]
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
    onEnterHome(displayName || 'Student', 'Student')
  }

  return (
    <main className="login-page">
      <section className="login-visual" aria-label="University campus">
        <div className="login-visual-overlay"></div>
        <div className="login-visual-copy">
          <div className="visual-emblem-badge">
            <img src={upangLogo} alt="PHINMA UPang Logo" className="visual-logo-img" />
          </div>
          <span>University of Pangasinan</span>
          <strong>UpangAssist</strong>
          <p className="login-campus-label">DAGUPAN CITY CAMPUS</p>
          <p className="login-campus-description">
            Your digital campus assistant for<br />
            PHINMA University of Pangasinan.
          </p>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-panel-topbar">
          <div className="login-mode-switch" aria-label="Account mode">
            <span className="active">Log In</span>
            <button type="button" onClick={onSignUp}>Sign Up</button>
          </div>
        </div>
        <div className="login-content">
          <p className="login-kicker">STUDENT & FACULTY PORTAL</p>
          <h1>Welcome Back to <span>Upang Assist</span></h1>
          <p className="login-description">Enter your official credentials to access personalized campus records.</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="email">Student Email Address</label>
            <div className="input-with-icon">
              <svg className="field-prefix-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <input
                id="email"
                type="email"
                placeholder="student@up.phinma.edu.ph"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="password-label-row">
              <label htmlFor="password">Password:</label>
              <button type="button" className="forgot-link">Forgot password?</button>
            </div>
            <div className="input-with-icon">
              <svg className="field-prefix-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>

            <label className="remember-row">
              <input type="checkbox" />
              Remember this device
            </label>

            <button className="login-submit" type="submit">Log In</button>
          </form>

          <div className="login-divider"><span>Or Continue With:</span></div>

          <div className="social-login">
            <button type="button" className="google-login-btn" onClick={() => onGoogle ? onGoogle() : onEnterHome('Google User', 'Student')}>
              <GoogleIcon />
              Continue with Google
            </button>
            <button type="button" onClick={() => onGuest()}><strong className="guest-mark">✣</strong> Continue as Guest</button>
          </div>

          <p className="login-footer">
            Don't have an account yet? <button type="button" onClick={onSignUp}>Sign Up Now</button>
          </p>
        </div>
      </section>
    </main>
  )
}

function SignupPage({ onBack, onGoogle, onEnterHome }) {
  const [form, setForm] = useState({
    fullName: '',
    role: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onEnterHome(form.fullName.trim() || 'Student', form.role === 'faculty' ? 'Faculty Member' : 'Student')
  }

  return (
    <main className="login-page signup-page">
      <section className="login-visual" aria-label="University campus">
        <div className="login-visual-overlay"></div>
        <div className="login-visual-copy">
          <div className="visual-emblem-badge">
            <img src={upangLogo} alt="PHINMA UPang Logo" className="visual-logo-img" />
          </div>
          <span>University of Pangasinan</span>
          <strong>UpangAssist</strong>
          <p className="login-campus-label">DAGUPAN CITY CAMPUS</p>
          <p className="login-campus-description">
            Your digital campus assistant for<br />
            PHINMA University of Pangasinan
          </p>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-panel-topbar">
          <div className="login-mode-switch" aria-label="Account mode">
            <button type="button" onClick={onBack}>Log In</button>
            <span className="active">Sign Up</span>
          </div>
        </div>

        <div className="login-content signup-content">
          <p className="login-kicker">GET STARTED</p>
          <h2>Sign Up</h2>
          <p className="login-description">Create your account to get helpful answers about campus life.</p>

          <div className="social-login signup-social-login">
            <button type="button" className="google-login-btn" onClick={() => onGoogle ? onGoogle() : onEnterHome('Google User', 'Student')}>
              <GoogleIcon />
              Sign up with Google
            </button>
          </div>

          <div className="login-divider"><span>Or sign up with email</span></div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="full-name">Full Name:</label>
            <div className="input-with-icon">
              <svg className="field-prefix-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <input
                id="full-name"
                name="fullName"
                type="text"
                placeholder="e.g. Juan Dela Cruz"
                value={form.fullName}
                onChange={handleChange}
                required
              />
            </div>

            <label htmlFor="signup-role">I am a:</label>
            <div className="input-with-icon signup-select-wrap">
              <svg className="field-prefix-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <select
                id="signup-role"
                name="role"
                value={form.role}
                onChange={handleChange}
                required
              >
                <option value="" disabled>Select your role</option>
                <option value="student">Student</option>
                <option value="faculty">Faculty Member</option>
              </select>
            </div>

            <label htmlFor="signup-email">Email Address:</label>
            <div className="input-with-icon">
              <svg className="field-prefix-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <input
                id="signup-email"
                name="email"
                type="email"
                placeholder="student@gmail.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <label htmlFor="signup-password">Password:</label>
            <div className="input-with-icon">
              <svg className="field-prefix-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input
                id="signup-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>

            <label htmlFor="confirm-password">Confirm Password:</label>
            <div className="input-with-icon">
              <svg className="field-prefix-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input
                id="confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>

            <button className="login-submit signup-submit" type="submit">CREATE ACCOUNT</button>
          </form>

          <div className="terms-row">
            <label>
              <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} />
              Terms and Conditions
            </label>
            <label>
              <input type="checkbox" checked={acceptedPrivacy} onChange={(event) => setAcceptedPrivacy(event.target.checked)} />
              Privacy Policy
            </label>
          </div>

          <p className="agreement-copy">
            By signing in you agree to our <strong>Terms and Privacy Policy</strong>
          </p>
          <p className="login-footer signup-login-footer">
            You have an account? <button type="button" onClick={onBack}>Log In</button>
          </p>
        </div>
      </section>
    </main>
  )
}
