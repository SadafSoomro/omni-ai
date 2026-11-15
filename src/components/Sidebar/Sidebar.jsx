import {useAuth} from '../../context/AuthContext'
import {t} from '../../utils/text'
import React, { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './Sidebar.css'

const sidebarSections = [
  {
    id: 'dashboard',
    heading: 'Dashboard',
    links: [
      { id: 'overview', label: 'Overview', icon: '⊞', path: '/' },
    ],
  },
  {
    id: 'chat-voice',
    heading: 'Chat & Voice',
    links: [
      { id: 'ai-chat', label: 'AI Chat', icon: '💬', path: '/ai-chat' },
      { id: 'ai-voice', label: 'AI Voice', icon: '🎙️', path: '/ai-voice' },
      { id: 'ai-translator', label: 'AI Translator', icon: '🌐', path: '/ai-translator' },
    ],
  },
  {
    id: 'documents',
    heading: 'Documents & Tools',
    links: [
      { id: 'ai-file', label: 'AI File', icon: '📁', path: '/ai-file' },
      { id: 'ai-presentation', label: 'AI Presentation', icon: '📽️', path: '/ai-presentation' },
      { id: 'cam-scanner', label: 'Cam Scanner', icon: '📷', path: '/cam-scanner' },
    ],
  },
  {
    id: 'converters',
    heading: 'File Converters',
    links: [
      { id: 'word-to-pdf', label: 'Word to PDF', icon: '🔄', path: '/word-to-pdf' },
      { id: 'pdf-to-word', label: 'PDF to Word', icon: '📄', path: '/pdf-to-word' },
      { id: 'file-size-converter', label: 'File Converter', icon: '📁', path: '/file-size-converter' },
    ],
  },
  {
    id: 'career',
    heading: 'Career & Resume',
    links: [
      { id: 'ai-career', label: 'AI Career & Skill Gap', icon: '🎯', path: '/ai-career' },
      { id: 'cv-maker', label: 'CV Maker', icon: '📋', path: '/cv-maker' },
    ],
  },
  {
    id: 'account',
    heading: 'Account',
    links: [
      { id: 'settings', label: 'Settings', path: '/settings' },
    ],
  },
]


function NavigationIcon({ id }) {
  const paths = {
    settings: 'M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    overview: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
    'ai-chat': 'M21 11a8 8 0 0 1-8 8H8l-5 3V11a9 9 0 0 1 18 0Z',
    'ai-voice': 'M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0Z M5 10v2a7 7 0 0 0 14 0v-2 M12 19v3 M8 22h8',
    'ai-translator': 'M3 5h12 M9 3v2 M12 5c-1 6-4 9-9 11 M5 9c2 3 4 5 7 6 M13 21l4-10 4 10 M15 17h4',
    'ai-presentation': 'M3 3h18v13H3z M12 16v5 M8 21h8 M7 11V8 M12 11V6 M17 11V9',
    'cam-scanner': 'M8 3H3v5 M16 3h5v5 M21 16v5h-5 M8 21H3v-5 M3 12h18',
    'file-size-converter': 'M4 7h16l-4-4 M20 17H4l4 4 M20 7l-4 4 M4 17l4-4',
    'ai-career': 'M3 7h18v14H3z M8 7V3h8v4 M3 12a24 24 0 0 0 18 0 M12 11v4',
    subscription: 'M12 3 3 9l9 12 9-12Z M3 9h18 M8 9l4 12 4-12 M8 9l4-6 4 6',
    'billing-details': 'M4 3h16v18l-4-2-4 2-4-2-4 2Z M8 8h8 M8 12h8 M8 16h4',
    feedback: 'M21 11a8 8 0 0 1-8 8H8l-5 3V11a9 9 0 0 1 18 0Z M12 7v5 M12 15h.01',
    admin: 'M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6Z M8 12l3 3 5-6',
    profile: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2',
  }
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[id] || 'M14 2H5v20h14V7Z M14 2v6h5 M8 13h8 M8 17h5'} /></svg>
}

export default function Sidebar({ isOpen, onClose }) {
  const {user}=useAuth()
  const sections=user?.role==='admin'?[...sidebarSections,{id:'administration',heading:'Administration',links:[{id:'admin',label:'Admin Dashboard',path:'/admin'}]}]:sidebarSections
  const panelRef = useRef(null)
  useEffect(() => {
    if (!isOpen || !window.matchMedia('(max-width: 900px)').matches) return
    const previous = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.querySelector('button')?.focus()
    const onKey = event => {
      if (event.key === 'Escape') onClose?.()
      if (event.key === 'Tab') {
        const buttons = panelRef.current?.querySelectorAll('button')
        const first = buttons?.[0], last = buttons?.[buttons.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', onKey); previous?.focus() }
  }, [isOpen, onClose])
  const navigate = useNavigate()
  const location = useLocation()

  const handleLinkClick = (path) => {
    if (path && path !== '#') {
      navigate(path, path==='/feedback' ? {state:{from:location.pathname}} : undefined)
    }
    if (onClose) {
      onClose()
    }
  }

  const isLinkActive = (path) => {
    if (path === '/settings') return ['/settings', '/edit-profile', '/subscription', '/subscription-details', '/feedback'].includes(location.pathname)
    if (!path || path === '#') return false
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpen && <div className="sidebar-mobile-backdrop" onClick={onClose} />}

      <aside ref={panelRef} aria-label={t("Main navigation")} className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header-mobile">
          <span className="sidebar-mobile-title">{t("Menu")}</span>
          <button className="sidebar-close-btn" onClick={onClose} aria-label={t("Close menu")}>
            ✕
          </button>
        </div>

        <div className="sidebar-inner">
          {sections.map((section) => (
            <div className="sidebar-section" key={section.id}>
              <h3 className="sidebar-heading">{t(section.heading)}</h3>
              <ul className="sidebar-links">
                {section.links.map((link) => {
                  const active = isLinkActive(link.path)
                  return (
                    <li key={link.id}>
                      <button
                        id={`sidebar-${link.id}`}
                        aria-current={active ? 'page' : undefined}
                        className={`sidebar-link ${active ? 'active' : ''}`}
                        onClick={() => handleLinkClick(link.path)}
                      >
                        <span className="sidebar-link-icon"><NavigationIcon id={link.id} /></span>
                        <span className="sidebar-link-label">{t(link.label)}</span>
                        {active && <span className="sidebar-link-dot" />}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom glow decoration */}
        <div className="sidebar-glow" />
      </aside>
    </>
  )
}
