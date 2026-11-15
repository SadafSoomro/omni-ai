import { useUsage } from '../../context/UsageContext'
import React, { useState, useRef, useEffect } from 'react'
import { chatAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import './AiFile.css'

async function extractTextFromFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  try {
    if (['txt', 'csv', 'json', 'md', 'log', 'html', 'js', 'py'].includes(ext)) {
      const text = await file.text()
      return text.slice(0, 35000)
    }
    if (ext === 'pdf') {
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href
      const arrayBuffer = await file.arrayBuffer()
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise
      let fullText = ''
      const maxPages = Math.min(pdf.numPages, 12)
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = textContent.items.map((item) => item.str).join(' ')
        fullText += `[Page ${i}]\n${pageText}\n\n`
      }
      return fullText.slice(0, 35000)
    }
    if (ext === 'docx') {
      const { default: mammoth } = await import('mammoth')
      const arrayBuffer = await file.arrayBuffer()
      const res = await mammoth.extractRawText({ arrayBuffer })
      return (res?.value || '').slice(0, 35000)
    }
  } catch (err) {
    console.warn('Text extraction fallback:', err)
  }
  return ''
}

function formatBubbleText(text) {
  if (!text) return ''
  const lines = text.split('\n')
  return lines.map((line, lineIdx) => {
    if (line.startsWith('### ')) {
      return (
        <h4 key={lineIdx} style={{ margin: '8px 0 4px', color: '#c4b5fd', fontSize: '0.96rem', fontWeight: 700 }}>
          {line.replace('### ', '')}
        </h4>
      )
    }
    if (line.startsWith('## ')) {
      return (
        <h3 key={lineIdx} style={{ margin: '10px 0 6px', color: '#a78bfa', fontSize: '1.05rem', fontWeight: 700 }}>
          {line.replace('## ', '')}
        </h3>
      )
    }

    const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ')
    const content = isBullet ? line.trim().slice(2) : line

    const parts = content.split(/(\*\*[^*]+\*\*)/g)
    const formattedParts = parts.map((part, partIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={partIdx} className="aifile-bold-text" style={{ color: '#ffffff', fontWeight: 600 }}>
            {part.slice(2, -2)}
          </strong>
        )
      }
      return part
    })

    if (isBullet) {
      return (
        <div key={lineIdx} style={{ display: 'flex', gap: '8px', marginLeft: '6px', margin: '3px 0' }}>
          <span style={{ color: '#8b5cf6' }}>•</span>
          <span>{formattedParts}</span>
        </div>
      )
    }

    return (
      <p key={lineIdx} style={{ margin: line ? '4px 0' : '6px 0', minHeight: line ? 'auto' : '8px' }}>
        {formattedParts}
      </p>
    )
  })
}

const INITIAL_FILES = [
  {
    id: 'f1',
    name: 'Q3_Financial_Performance_Report.pdf',
    type: 'pdf',
    size: '2.4 MB',
    pages: '14 pages',
    date: 'Oct 10, 2026',
    status: 'Ready',
    tokens: '12,450 tokens',
    content: 'Q3 Financial Highlights: Total Revenue: $48.2M (+21.4% YoY). Operating Margin: 28.6%. Gross Profit: $34.1M. AI Workflow Investments: $6.2M allocated to automated document pipelines, customer intelligence agents, and infrastructure scaling. Operational Risks: Primary risk involves cloud compute price volatility and multi-region replication latency (~12ms). Cash position remains strong at $82.4M.',
    sampleQuestions: [
      'Summarize Q3 revenue growth and profit margin',
      'How much was invested in AI workflows?',
      'What are the primary operational risks?',
    ],
  },
  {
    id: 'f2',
    name: 'Customer_Churn_Analysis_2026.csv',
    type: 'csv',
    size: '4.8 MB',
    pages: '24,500 rows',
    date: 'Oct 08, 2026',
    status: 'Ready',
    tokens: '48,100 tokens',
    content: 'Customer Churn Analysis 2026 Dataset Summary: Total subscribers analyzed: 124,000. Enterprise Tier Churn: 1.8%, Pro Tier Churn: 4.2%, Starter/Free Tier Churn: 9.6%. Top churn indicators: Customers opening >3 support tickets in first 14 days had 42% higher cancellation probability. Recommendations: 1) Automated onboarding check-ins, 2) Proactive success alerts for accounts with declining weekly active usage, 3) Flexible billing cycles for annual commitment discounts.',
    sampleQuestions: [
      'Which subscriber tier has the highest churn rate?',
      'Show correlation between tickets and renewals',
      'What are the top 3 retention recommendations?',
    ],
  },
  {
    id: 'f3',
    name: 'Cloud_Architecture_Specification_v3.docx',
    type: 'docx',
    size: '1.2 MB',
    pages: '8 pages',
    date: 'Oct 04, 2026',
    status: 'Ready',
    tokens: '7,800 tokens',
    content: 'Cloud Architecture Spec v3: Primary Region: us-east-1 (N. Virginia), Secondary Failover: us-west-2 (Oregon). RTO (Recovery Time Objective): <90 seconds via automated DNS route failover. RPO: <5 seconds via cross-region asynchronous database replication. Authentication: Asymmetric RS256 JWT tokens with 15-minute expiration and Redis distributed token revocation blacklist. Database Architecture: MongoDB Atlas multi-region replica set with read preferences targeted to closest edge node.',
    sampleQuestions: [
      'What is the failover strategy if primary region fails?',
      'How are authentication tokens validated?',
      'What database replication model is specified?',
    ],
  },
]

function formatBytes(bytes) {
  if (!bytes) return '1.5 MB'
  if (bytes < 1024) return bytes + ' B'
  const kb = bytes / 1024
  if (kb < 1024) return kb.toFixed(1) + ' KB'
  const mb = kb / 1024
  return mb.toFixed(1) + ' MB'
}

export default function AiFile() {
  const consumeUsage = useUsage()
  const { token } = useAuth()
  const [files, setFiles] = useState(INITIAL_FILES)
  // Initially null so user FIRST sees the file add / upload option!
  const [activeFileId, setActiveFileId] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  // Map of fileId -> messages[]
  const [fileChats, setFileChats] = useState({})

  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  const activeFile = files.find((f) => f.id === activeFileId) || null
  const currentMessages = activeFile ? fileChats[activeFile.id] || [] : []

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (activeFileId) {
      scrollToBottom()
    }
  }, [currentMessages, isTyping, activeFileId])

  // Select a file and open chat
  const handleSelectFile = (file) => {
    setActiveFileId(file.id)

    // If chat doesn't exist yet for this file, initialize it
    if (!fileChats[file.id]) {
      setFileChats((prev) => ({
        ...prev,
        [file.id]: [
          {
            id: `init-${file.id}`,
            sender: 'ai',
            time: 'Just now',
            text: `Hello! I have loaded and indexed **${file.name}** (${file.size} • ${file.tokens || 'Ready'}).\n\nYou can ask any questions regarding this document, request an executive summary, or extract specific data points.`,
          },
        ],
      }))
    }
  }

  // Real file upload handler with text extraction
  const handleFileUpload = async (file) => {
    if (!file) return
    setIsUploading(true)

    const ext = file.name.split('.').pop().toLowerCase()
    const newId = `f-${Date.now()}`
    const sizeStr = formatBytes(file.size)
    const tokenStr = `${Math.round(file.size / 38).toLocaleString()} tokens`

    let extractedText = ''
    try {
      extractedText = await extractTextFromFile(file)
    } catch (e) {
      console.warn('Could not extract text:', e)
    }

    const newFileObj = {
      id: newId,
      name: file.name,
      type: ext || 'doc',
      size: sizeStr,
      pages: 'Indexed',
      date: 'Just now',
      status: 'Ready',
      tokens: tokenStr,
      content: extractedText,
      sampleQuestions: [
        `Summarize the key points of ${file.name}`,
        'What are the core findings and takeaways?',
        'Extract important data points and metrics',
      ],
    }

    setFiles((prev) => [newFileObj, ...prev])
    setActiveFileId(newId)
    setFileChats((prev) => ({
      ...prev,
      [newId]: [
        {
          id: `init-${newId}`,
          sender: 'ai',
          time: 'Just now',
          text: `📄 Successfully uploaded and indexed **${file.name}** (${sizeStr} • ${tokenStr})!\n\nAI Document Chat is now ready with live AI analysis. What would you like to explore or summarize from this file?`,
        },
      ],
    }))
    setIsUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) handleFileUpload(file)
  }

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || chatInput
    if (!text.trim() || !activeFile || isTyping) return
    if (!(await consumeUsage({server:true}))) return

    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: text.trim(),
    }

    const fileId = activeFile.id
    const prevHistory = fileChats[fileId] || []

    setFileChats((prev) => ({
      ...prev,
      [fileId]: [...(prev[fileId] || []), userMsg],
    }))
    setChatInput('')
    setIsTyping(true)

    try {
      const docContext = activeFile.content && activeFile.content.trim()
        ? `\n\n--- DOCUMENT CONTENT (${activeFile.name}) ---\n${activeFile.content.slice(0, 15000)}\n--- END DOCUMENT CONTENT ---\n`
        : `\n\nDocument Name: ${activeFile.name}\nSize: ${activeFile.size}\nType: ${activeFile.type}\n`

      const promptWithDoc = `You are Omni AI analyzing the document "${activeFile.name}".\n\n${docContext}\nUser Question: ${text.trim()}\n\nPlease provide a clear, accurate, and helpful response based on the document.`

      const geminiHistory = prevHistory
        .filter((m) => m && m.text && m.sender !== 'system')
        .slice(-10)
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          text: m.text,
        }))

      const res = await chatAPI.send({
        message: promptWithDoc,
        history: geminiHistory,
        token,
      })

      const replyText = res.reply || 'No response generated.'

      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: replyText,
      }

      setFileChats((prev) => ({
        ...prev,
        [fileId]: [...(prev[fileId] || []), aiMsg],
      }))
    } catch (err) {
      console.error('AI File chat error:', err)
      const errorMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `⚠️ Could not generate an AI response: ${err.message || 'Please check your connection and try again.'}`,
      }
      setFileChats((prev) => ({
        ...prev,
        [fileId]: [...(prev[fileId] || []), errorMsg],
      }))
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
    setCopiedIndex(idx)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const getFileBadgeColor = (type) => {
    switch (type) {
      case 'pdf': return '#ef4444'
      case 'csv': return '#10b981'
      case 'docx':
      case 'doc': return '#3b82f6'
      case 'json': return '#f59e0b'
      default: return '#8b5cf6'
    }
  }

  return (
    <div className="aifile-page-wrapper">
      {/* Hidden Real File Input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={(e) => handleFileUpload(e.target.files?.[0])}
        accept=".pdf,.docx,.doc,.txt,.csv,.json,.xlsx"
        style={{ display: 'none' }}
      />

      {/* STEP 1: INITIAL UPLOAD / FILE ADD SCREEN */}
      {!activeFile ? (
        <div className="aifile-upload-hero-container">
          <div className="aifile-hero-header">
            <div className="aifile-hero-badge">
              <span>✦</span>
              <span>Document Intelligence Studio</span>
            </div>
            <h1 className="aifile-hero-title">AI File Chat</h1>
            <p className="aifile-hero-subtitle">
              Pehle document add karein, uske baad AI ke sath interactive chat, summary aur data extraction shuru karein.
            </p>
          </div>

          {/* Upload Dropzone */}
          <div
            className={`aifile-main-dropzone ${isDragging ? 'dragging' : ''}`}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="aifile-dropzone-icon">
              {isUploading ? '⏳' : '📁'}
            </div>

            <h3 className="aifile-dropzone-title">
              {isUploading ? 'Uploading & Indexing Document...' : 'Choose or Drag File Here'}
            </h3>

            <p className="aifile-dropzone-sub">
              Supports PDF, Word (.docx), CSV, JSON, and Text documents up to 50 MB
            </p>

            <button
              type="button"
              className="aifile-btn-browse"
              disabled={isUploading}
            >
              {isUploading ? 'Processing...' : '+ Upload Document to Chat'}
            </button>
          </div>


        </div>
      ) : (
        /* STEP 2: FULLSCREEN CHAT WITH THE ACTIVE FILE */
        <div className="aifile-chat-screen">
          {/* Topbar: Fixed & Clean, Zero Collisions */}
          <header className="aifile-chat-topbar">
            <div className="aifile-topbar-left">
              <button
                type="button"
                className="btn-back-to-files"
                onClick={() => setActiveFileId(null)}
                title="Change or upload different file"
              >
                ← Back
              </button>

              <div
                className="topbar-doc-badge"
                style={{ background: `${getFileBadgeColor(activeFile.type)}22`, color: getFileBadgeColor(activeFile.type) }}
              >
                {activeFile.type.toUpperCase()}
              </div>

              <div className="topbar-doc-meta">
                <span className="topbar-doc-name" title={activeFile.name}>
                  {activeFile.name}
                </span>
                <span className="topbar-doc-size">
                  {activeFile.size} • {activeFile.tokens || 'Active'}
                </span>
              </div>
            </div>

            <div className="aifile-topbar-right">
              <button
                type="button"
                className="btn-add-file-action"
                onClick={() => fileInputRef.current?.click()}
                title="Add another file"
              >
                + Add File
              </button>
            </div>
          </header>

          {/* Message Stream */}
          <div className="aifile-messages-box" ref={messagesContainerRef}>
            {currentMessages.map((msg, idx) => (
              <div key={msg.id || idx} className={`aifile-msg-row ${msg.sender === 'user' ? 'user' : 'ai'}`}>
                <div className="aifile-msg-bubble">
                  <div className="aifile-msg-text" style={{ whiteSpace: 'pre-line' }}>
                    {formatBubbleText(msg.text)}
                  </div>

                  <div className="aifile-msg-meta-row">
                    <span className="aifile-msg-time">{msg.time}</span>
                    {msg.sender === 'ai' && (
                      <button
                        type="button"
                        className="btn-bubble-copy"
                        onClick={() => copyToClipboard(msg.text, idx)}
                        title="Copy reply"
                        aria-label="Copy reply"
                      >
                        {copiedIndex === idx ? (
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
            ))}

            {isTyping && (
              <div className="aifile-msg-row ai typing">
                <div className="aifile-msg-bubble typing-bubble">
                  <div className="aifile-typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span className="typing-status-text">Analyzing {activeFile.name}...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Bar: Quick Chips & Chat Input */}
          <footer className="aifile-chat-footer">
            {/* Input Row */}
            <div className="aifile-input-box">
              <textarea
                className="aifile-textarea"
                rows="1"
                placeholder="Ask anything about this file..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />

              <button
                type="button"
                className={`btn-send-aifile ${chatInput.trim() ? 'active' : ''}`}
                onClick={() => handleSendMessage()}
                disabled={!chatInput.trim() || isTyping}
                aria-label="Send message"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </footer>
        </div>
      )}
    </div>
  )
}
