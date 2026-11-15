import {t} from '../../utils/text'
import { useUsage } from '../../context/UsageContext'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { chatAPI } from '../../services/api'
import BrandLogo from '../../components/BrandLogo/BrandLogo'
import './AiChat.css'

const GUEST_PROMPT_LIMIT = 2
const GUEST_COUNT_KEY = 'omni_guest_prompt_count'
const GUEST_DRAFT_KEY = 'omni_guest_draft'
const storageKeyForUser = (userId) => `omni_chats_${userId || 'guest'}`



function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatSessionDate(iso) {
  if (!iso) return 'Today'
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function titleFromText(text) {
  const clean = (text || '').trim().replace(/\s+/g, ' ')
  if (!clean) return 'New Conversation'
  return clean.length > 42 ? `${clean.slice(0, 42)}…` : clean
}

function loadSessions(userId) {
  try {
    const raw = localStorage.getItem(storageKeyForUser(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveSessions(userId, sessions) {
  try {
    localStorage.setItem(storageKeyForUser(userId), JSON.stringify(sessions))
  } catch {
    /* ignore quota errors */
  }
}

function getGuestCount() {
  return Number(localStorage.getItem(GUEST_COUNT_KEY) || 0)
}

function setGuestCount(n) {
  localStorage.setItem(GUEST_COUNT_KEY, String(n))
}

function hasUserMessage(session) {
  return Boolean(session?.messages?.some((m) => m.sender === 'user'))
}

function loadGuestDraft() {
  try {
    const raw = sessionStorage.getItem(GUEST_DRAFT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    const list = Array.isArray(parsed) ? parsed : [parsed]
    return list.filter(hasUserMessage)
  } catch {
    return []
  }
}

function saveGuestDraft(sessions) {
  try {
    const meaningful = (sessions || []).filter(hasUserMessage)
    if (!meaningful.length) {
      sessionStorage.removeItem(GUEST_DRAFT_KEY)
      return
    }
    sessionStorage.setItem(GUEST_DRAFT_KEY, JSON.stringify(meaningful))
  } catch {
    /* ignore quota errors */
  }
}

function createWelcomeMessage() {
  return {
    id: `welcome-${Date.now()}`,
    sender: 'ai',
    time: nowTime(),
    text: `👋 Hi! I'm **Omni AI**. Ask me anything — coding, writing, planning, or problem solving.\n\nSign in to save your conversations permanently and access all features.`,
  }
}

function createEmptySession() {
  const id = `chat-${Date.now()}`
  return {
    id,
    title: 'New Conversation',
    preview: 'Start chatting with Omni AI…',
    updatedAt: new Date().toISOString(),
    messages: [createWelcomeMessage()],
  }
}

export default function AiChat() {
  const consumeUsage = useUsage()
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const userId = user?._id || user?.id || null

  const [sessions, setSessions] = useState(() => {
    if (!userId) {
      const draft = loadGuestDraft()
      return draft.length ? draft : [createEmptySession()]
    }
    const stored = loadSessions(userId)
    return stored.length ? stored : [createEmptySession()]
  })
  const [activeSessionId, setActiveSessionId] = useState(() => {
    if (!userId) {
      const draft = loadGuestDraft()
      return draft[0]?.id || null
    }
    const stored = loadSessions(userId)
    return stored[0]?.id || null
  })

  // Ensure activeSessionId is always valid
  useEffect(() => {
    if (!activeSessionId && sessions[0]?.id) {
      setActiveSessionId(sessions[0].id)
    } else if (activeSessionId && sessions.length && !sessions.some((s) => s.id === activeSessionId)) {
      setActiveSessionId(sessions[0]?.id || null)
    }
  }, [sessions, activeSessionId])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false)
  const [copiedCodeIndex, setCopiedCodeIndex] = useState(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [guestUsed, setGuestUsed] = useState(() => getGuestCount())
  const [errorBanner, setErrorBanner] = useState('')
  const [isListening, setIsListening] = useState(false)

  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const isUserInteractingRef = useRef(false)

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0]
  const messages = activeSession?.messages || []

  // Reload sessions when login state changes
  useEffect(() => {
    if (userId) {
      const stored = loadSessions(userId)
      const draft = loadGuestDraft()
      const merged = [
        ...draft,
        ...stored.filter((session) => !draft.some((item) => item.id === session.id)),
      ]

      if (merged.length) {
        setSessions(merged)
        setActiveSessionId(merged[0].id)
        saveSessions(userId, merged)
      } else {
        const fresh = createEmptySession()
        fresh.messages = [
          {
            id: `welcome-${Date.now()}`,
            sender: 'ai',
            time: nowTime(),
            text: `👋 Welcome back${user?.name ? `, **${user.name}**` : ''}! Your chats are saved in Recent. What would you like to work on?`,
          },
        ]
        setSessions([fresh])
        setActiveSessionId(fresh.id)
        saveSessions(userId, [fresh])
      }
      if (draft.length) sessionStorage.removeItem(GUEST_DRAFT_KEY)
      setGuestUsed(0)
      setShowLoginModal(false)
    } else {
      const draft = loadGuestDraft()
      const next = draft.length ? draft : [createEmptySession()]
      setSessions(next)
      setActiveSessionId(next[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  useEffect(() => {
    if (userId && sessions.length) {
      saveSessions(userId, sessions)
    } else if (!userId) {
      saveGuestDraft(sessions)
    }
  }, [sessions, userId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isUserInteractingRef.current) scrollToBottom()
  }, [messages, isTyping])

  const updateActiveSession = useCallback((updater) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeSessionId) return s
        return typeof updater === 'function' ? updater(s) : { ...s, ...updater }
      })
    )
  }, [activeSessionId])

  const handleSelectSession = (id) => {
    isUserInteractingRef.current = false
    setActiveSessionId(id)
    setMobileHistoryOpen(false)
    setErrorBanner('')
  }

  const handleNewChat = () => {
    isUserInteractingRef.current = false
    const fresh = createEmptySession()
    if (userId) {
      fresh.messages = [
        {
          id: `welcome-${Date.now()}`,
          sender: 'ai',
          time: nowTime(),
          text: `👋 New chat ready. How can Omni AI help you today?`,
        },
      ]
    }
    setSessions((prev) => [fresh, ...prev])
    setActiveSessionId(fresh.id)
    setMobileHistoryOpen(false)
    setErrorBanner('')
  }

  const handleDeleteSession = (e, id) => {
    e.stopPropagation()
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id)
      if (!next.length) {
        const fresh = createEmptySession()
        setActiveSessionId(fresh.id)
        return [fresh]
      }
      if (id === activeSessionId) setActiveSessionId(next[0].id)
      return next
    })
  }

  const buildGeminiHistory = (msgs) =>
    msgs
      .filter((m) => m.sender === 'user' || m.sender === 'ai')
      .filter((m) => !String(m.id || '').startsWith('welcome'))
      .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text,
      }))

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage || '').trim()
    if (!text || isTyping) return
    if (!(await consumeUsage({server:true}))) return

    isUserInteractingRef.current = true
    setErrorBanner('')

    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      time: nowTime(),
      text,
    }

    const priorMessages = messages
    updateActiveSession((s) => ({
      ...s,
      title: s.title === 'New Conversation' ? titleFromText(text) : s.title,
      preview: text.slice(0, 60),
      updatedAt: new Date().toISOString(),
      messages: [...s.messages, userMsg],
    }))
    setInputMessage('')
    setIsTyping(true)

    try {
      const history = buildGeminiHistory(priorMessages)
      const data = await chatAPI.send({
        message: text,
        history,
        token,
      })

      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        time: nowTime(),
        text: data.reply || 'Sorry, I could not generate a response.',
      }

      updateActiveSession((s) => ({
        ...s,
        preview: aiMsg.text.slice(0, 60),
        updatedAt: new Date().toISOString(),
        messages: [...s.messages, aiMsg],
      }))
    } catch (err) {
      const failMsg = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        time: nowTime(),
        text: `⚠️ I couldn't reach Omni AI right now.\n\n${err.message || 'Please try again in a moment.'}`,
      }
      updateActiveSession((s) => ({
        ...s,
        messages: [...s.messages, failMsg],
      }))
      setErrorBanner(err.message || 'Chat failed')
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const copyToClipboard = (text, idx) => {
    navigator.clipboard?.writeText(text)
    setCopiedCodeIndex(idx)
    setTimeout(() => setCopiedCodeIndex(null), 2000)
  }

  const guestRemaining = Math.max(0, GUEST_PROMPT_LIMIT - guestUsed)

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setErrorBanner('Voice input is not supported in this browser.')
      setTimeout(() => setErrorBanner(''), 3000)
      return
    }
    if (isListening) return
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setInputMessage((prev) => (prev ? prev + ' ' + transcript : transcript))
    }
    recognition.start()
  }

  return (
    <div className="aichat-container">
      <div className="aichat-mobile-bar">
        <button
          className="btn-history-toggle"
          onClick={() => setMobileHistoryOpen(!mobileHistoryOpen)}
          aria-label="Toggle chat history"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
          <span>Chat History ({sessions.length})</span>
        </button>

        <div className="mobile-bar-actions">
          <button className="btn-new-chat-mobile" onClick={handleNewChat}>
            + New
          </button>
        </div>
      </div>

      <div className="aichat-layout">
        <aside className={`aichat-sessions-sidebar ${mobileHistoryOpen ? 'mobile-visible' : ''}`}>
          <div className="sessions-header"><span className="chat-history-heading">YOUR CONVERSATIONS</span>
            <button className="btn-new-chat" onClick={handleNewChat}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>New Conversation</span>
            </button>
          </div>

          <div className="sessions-list">
            <div className="sessions-group-title">
              {user ? 'Recent Chats' : 'This Session'}
            </div>
            {!user && (
              <p className="sessions-guest-note">
                Sign in to keep your conversations in this browser.
              </p>
            )}
            {sessions.map((chat) => (
              <button
                key={chat.id}
                type="button"
                className={`session-item ${activeSessionId === chat.id ? 'active' : ''}`}
                onClick={() => handleSelectSession(chat.id)}
              >
                <div className="session-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 11a8 8 0 0 1-8 8H8l-5 3V11a9 9 0 0 1 18 0Z"/></svg></div>
                <div className="session-details">
                  <div className="session-title">{chat.title}</div>
                  <div className="session-preview">{chat.preview}</div>
                </div>
                <div className="session-meta">
                  <span className="session-time">{formatSessionDate(chat.updatedAt)}</span>
                  {user && (
                    <span
                      className="session-delete"
                      role="button"
                      tabIndex={0}
                      title="Delete chat"
                      onClick={(e) => handleDeleteSession(e, chat.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleDeleteSession(e, chat.id)}
                    >
                      ✕
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {mobileHistoryOpen && (
          <div className="aichat-backdrop" onClick={() => setMobileHistoryOpen(false)} />
        )}

        <main className="aichat-main">
          <div className="chat-aurora" aria-hidden="true"><div className="chat-nebula" />{[[12,16],[74,11],[40,26],[88,31],[21,42],[64,48],[8,65],[83,71],[33,81],[56,90],[94,53],[49,12],[16,87],[70,33],[44,63],[91,88]].map(([left,top],i)=><span key={i} className="chat-stardust" style={{left:left+'%',top:top+'%',opacity:.18+(i%4)*.12,width:i%5===0?3:2,height:i%5===0?3:2}} />)}</div>
          <div className="aichat-topbar">
            <div className="topbar-left-brand">
              <BrandLogo size={22} />
              <div><span className="topbar-ai-label">Omni AI</span><span className="chat-topbar-subtitle">Your everyday thinking partner</span></div>
            </div>
            <div className="topbar-right"><span className="chat-workspace-pill"><i /> AI Workspace</span>
              <button className="btn-new-chat-topbar" onClick={handleNewChat}>
                + New
              </button>
            </div>
          </div>

          {errorBanner && (
            <div className="aichat-error-banner">{errorBanner}</div>
          )}

          <div className="aichat-messages-container" ref={messagesContainerRef}>
            {!messages.some((message) => !String(message.id || '').startsWith('welcome')) && !isTyping && (
              <div className="chat-canvas-welcome" aria-hidden="true" />
            )}
            {messages.filter((message) => !String(message.id || '').startsWith('welcome')).map((msg, index) => (
                <div key={msg.id || index} className={`chat-message ${msg.sender === 'user' ? 'user-msg' : 'ai-msg'}`}>
                  <div className="message-body">
                    <span className="chat-speaker">{msg.sender === 'user' ? 'You' : 'Omni AI'}</span>
                    <div className="message-content" dir="auto">
                      {formatMessageWithCode(msg.text, index, copyToClipboard, copiedCodeIndex)}
                      <div className="message-meta-row">
                        <span className="message-time">{msg.time}</span>
                        {msg.sender === 'ai' && (
                          <button
                            type="button"
                            className="btn-bubble-copy"
                            onClick={() => copyToClipboard(msg.text, `full-${index}`)}
                            title="Copy reply"
                            aria-label="Copy reply"
                          >
                            {copiedCodeIndex === `full-${index}` ? (
                              <span className="copied-text">✓ Copied</span>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            {isTyping && (
              <div className="chat-message ai-msg typing-message">
                <div className="message-body">
                  <div className="typing-bubble">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span className="typing-text">Omni AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="aichat-input-area">
            <div className="input-box-wrapper">
              <textarea
                className="chat-textarea"
                rows="1"
                aria-label="Message Omni AI"
                placeholder="Ask Omni AI..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
              />

              <button
                type="button"
                className={`btn-voice-input ${isListening ? 'listening' : ''}`}
                onClick={handleVoiceInput}
                title={isListening ? 'Listening...' : 'Voice input'}
                aria-label="Voice input"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </button>

              <button
                className={`btn-send-message ${inputMessage.trim() ? 'active' : ''}`}
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isTyping}
                aria-label="Send message"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <div className="input-footer-note">
              <span>
                {user
                  ? 'Enter to send / Shift + Enter for a new line'
                  : '2 free uses per tool / Sign in for 10 uses per tool'}
              </span>
            </div>
          </div>
        </main>
      </div>

      {showLoginModal && (
        <div className="aichat-login-backdrop" onClick={() => setShowLoginModal(false)}>
          <div className="aichat-login-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <BrandLogo size={44} />
            <h3>Login required</h3>
            <p>
              Guest users get only <strong>{GUEST_PROMPT_LIMIT} free prompts</strong>.
              Sign in to keep chatting and save your conversations in Recent.
            </p>
            <div className="aichat-login-actions">
              <button
                type="button"
                className="aichat-login-btn primary"
                onClick={() => navigate('/login', { state: { from: '/ai-chat' } })}
              >{t("Login")}</button>
              <button
                type="button"
                className="aichat-login-btn secondary"
                onClick={() => navigate('/register', { state: { from: '/ai-chat' } })}
              >{t("Create Account")}</button>
            </div>
            <button
              type="button"
              className="aichat-login-dismiss"
              onClick={() => setShowLoginModal(false)}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function formatMessageWithCode(text, messageIndex, copyToClipboard, copiedCodeIndex) {
  if (!text) return null
  const parts = text.split(/(```[\s\S]*?```)/g)

  return (
    <div className="text-prose">
      {parts.map((part, index) => {
        if (!part) return null

        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).trim().split('\n')
          const language = lines[0].trim() || 'code'
          const code = lines.slice(1).join('\n')
          const isCopied = copiedCodeIndex === `${messageIndex}-${index}`

          return (
            <div key={index} className="code-block-container">
              <div className="code-block-header">
                <span className="code-lang-tag">{language}</span>
                <button
                  type="button"
                  className="btn-copy-code"
                  onClick={() => copyToClipboard(code, `${messageIndex}-${index}`)}
                >
                  {isCopied ? '✓ Copied' : '📋 Copy code'}
                </button>
              </div>
              <pre className="code-block-content">
                <code>{code}</code>
              </pre>
            </div>
          )
        }

        const cleanPart = part.trim()
        if (!cleanPart) return null

        const blocks = cleanPart.split(/\n\s*\n/)

        return (
          <div key={index} className="prose-chunk">
            {blocks.map((block, bIdx) => {
              const trimmedBlock = block.trim()
              if (!trimmedBlock) return null

              if (trimmedBlock.startsWith('### ')) {
                return (
                  <h4 key={bIdx} className="prose-h3">
                    {renderInlineMarkdown(trimmedBlock.replace(/^###\s*/, ''))}
                  </h4>
                )
              }

              if (trimmedBlock.startsWith('## ')) {
                return (
                  <h3 key={bIdx} className="prose-h2">
                    {renderInlineMarkdown(trimmedBlock.replace(/^##\s*/, ''))}
                  </h3>
                )
              }

              if (trimmedBlock.startsWith('# ')) {
                return (
                  <h2 key={bIdx} className="prose-h1">
                    {renderInlineMarkdown(trimmedBlock.replace(/^#\s*/, ''))}
                  </h2>
                )
              }

              return (
                <p key={bIdx} className="prose-p">
                  {renderInlineMarkdown(trimmedBlock)}
                </p>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

function renderInlineMarkdown(text) {
  const pieces = String(text).split(/(\*\*[^*]+\*\*)/g)
  return pieces.map((piece, i) => {
    if (piece.startsWith('**') && piece.endsWith('**')) {
      return <strong key={i}>{piece.slice(2, -2)}</strong>
    }
    return <React.Fragment key={i}>{piece}</React.Fragment>
  })
}
