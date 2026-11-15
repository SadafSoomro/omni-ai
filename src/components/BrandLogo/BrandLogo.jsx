import React from 'react'

/** Shared Omni AI mark — neural spark logo */
export default function BrandLogo({ size = 32, showWordmark = false, className = '' }) {
  const uid = React.useId().replace(/:/g, '')

  return (
    <span className={`brand-logo ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id={`nx-${uid}`} x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6C63FF" />
            <stop offset="55%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#3ECFCF" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="36" height="36" rx="11" fill={`url(#nx-${uid})`} />
        {/* AI neural spark */}
        <circle cx="20" cy="20" r="4.2" fill="#fff" />
        <circle cx="12" cy="13" r="2.2" fill="#fff" opacity="0.95" />
        <circle cx="28" cy="13" r="2.2" fill="#fff" opacity="0.95" />
        <circle cx="12" cy="27" r="2.2" fill="#fff" opacity="0.95" />
        <circle cx="28" cy="27" r="2.2" fill="#fff" opacity="0.95" />
        <path d="M14 14.5 L17.2 17.8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.9" />
        <path d="M26 14.5 L22.8 17.8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.9" />
        <path d="M14 25.5 L17.2 22.2" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.9" />
        <path d="M26 25.5 L22.8 22.2" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.9" />
      </svg>
      {showWordmark && <span className="logo-text">Omni AI</span>}
    </span>
  )
}
