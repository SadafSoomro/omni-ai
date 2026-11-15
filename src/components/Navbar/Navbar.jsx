import {t} from '../../utils/text'
import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import BrandLogo from '../BrandLogo/BrandLogo'
import './Navbar.css'

function AppearanceIcon({sun}) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{sun?<><circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity=".12"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>:<path d="M20.9 13.1A9 9 0 0 1 10.9 3a9 9 0 1 0 10 10.1Z" fill="currentColor" fillOpacity=".12"/>}</svg>
}

export default function Navbar({ onToggleSidebar }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('ai_theme') || 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.classList.toggle('light-theme', theme === 'light')
    if (document.body) {
      document.body.setAttribute('data-theme', theme)
      document.body.classList.toggle('light-theme', theme === 'light')
    }
    localStorage.setItem('ai_theme', theme)
  }, [theme])

  useEffect(() => {
    const close = event => { if (event.key === 'Escape') setDropdownOpen(false) }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen)

  const handleNav = (path) => {
    setDropdownOpen(false)
    navigate(path, path==='/feedback' ? {state:{from:location.pathname}} : undefined)
  }

  const handleLogout = () => {
    setDropdownOpen(false)
    logout()
    navigate('/login')
  }

  return (
    <nav aria-label="Account and appearance" className="navbar">
      <div className="navbar-left">
        {/* Mobile Hamburger Button */}
        <button
          className="navbar-hamburger-btn"
          onClick={onToggleSidebar}
          aria-label={t("Toggle Navigation Menu")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Logo */}
        <button type="button" aria-label="Omni AI overview" className="navbar-logo" onClick={() => navigate('/')}>
          <BrandLogo size={32} showWordmark />
        </button>
      </div>

      {/* Right Actions: Theme Toggle + Subscription + Profile */}
      <div className="navbar-right">
        <button
          className="navbar-theme-btn" data-mode={theme}
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <>
              <span className="theme-btn-icon" aria-hidden="true"><AppearanceIcon sun={theme === 'dark'} /></span>
              <span className="theme-btn-label">{t("Light")}</span>
            </>
          ) : (
            <>
              <span className="theme-btn-icon" aria-hidden="true"><AppearanceIcon sun={theme === 'dark'} /></span>
              <span className="theme-btn-label">{t("Dark")}</span>
            </>
          )}
        </button>

        <button
          className="navbar-sub-btn"
          onClick={() => handleNav('/subscription')}
          title="View Subscription Plans"
          aria-label={t("Subscription Plans")}
        >
          <span className="navbar-sub-icon" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 9 6-9 12L3 9l9-6Z" fill="currentColor" fillOpacity=".12"/><path d="M3 9h18M8 9l4 12 4-12M8 9l4-6 4 6"/></svg></span>
          <span className="navbar-sub-text">{t("Subscription")}</span>
        </button>

        {/* Profile Icon with Dropdown */}
        <div className="navbar-profile">
          <button
            className="profile-btn"
            onClick={toggleDropdown}
            aria-label={t("Profile menu")}
            aria-expanded={dropdownOpen}
          >
            <div className="profile-avatar">
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : user ? (
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#a78bfa' }}>
                  {user.name?.charAt(0).toUpperCase()}
                </span>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke="#a78bfa" strokeWidth="2" fill="none" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" fill="none" />
                </svg>
              )}
            </div>
            <svg
              className={`chevron-icon ${dropdownOpen ? 'open' : ''}`}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path d="M6 9l6 6 6-6" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="dropdown-menu">
              {user ? (
                <>
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div className="dropdown-account-name" style={{ fontSize: '0.88rem', fontWeight: '600' }}>{user.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', wordBreak: 'break-all' }}>{user.email}</div>
                    <div style={{ marginTop: '4px', display: 'inline-block', fontSize: '0.68rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399' }}>
                      {user.role === 'admin' ? '👑 Admin' : '✓ Verified User'}
                    </div>
                  </div>
                  {user.role==='admin' && <button type="button" className="dropdown-item" onClick={()=>handleNav('/admin')}>Admin Dashboard</button>}
                  <button type="button" className="dropdown-item" id="nav-edit-profile" onClick={() => handleNav('/edit-profile')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>{t("Edit Profile")}</button>
                  <button type="button" className="dropdown-item" id="nav-subscription" onClick={() => handleNav('/subscription')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>{t("Subscription Plans")}</button>
                  <button type="button" className="dropdown-item" onClick={() => handleNav('/subscription-details')}>{t('Subscription Details')}</button>
                  <button type="button" className="dropdown-item" onClick={() => handleNav('/feedback')}>{t('Feedback & Support')}</button>
                  <div className="dropdown-divider" style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />
                  <button type="button" className="dropdown-item dropdown-item-danger" id="nav-logout" onClick={handleLogout}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>{t("Logout")}</button>
                </>
              ) : (
                <>
                  <button type="button" className="dropdown-item" id="nav-login" onClick={() => handleNav('/login')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>{t("Login")}</button>
                  <button type="button" className="dropdown-item" id="nav-register" onClick={() => handleNav('/register')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 8v6M22 11h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>{t("Register")}</button>
                  <div className="dropdown-divider" style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />
                  <button type="button" className="dropdown-item" id="nav-guest-subscription" onClick={() => handleNav('/subscription')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>{t("Subscription Plans")}</button>
                </>
              )}
            </div>
          )}

          {dropdownOpen && (
            <div className="dropdown-overlay" onClick={() => setDropdownOpen(false)} />
          )}
        </div>
      </div>
    </nav>
  )
}
