import {t} from '../../../utils/text'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../../../services/api'
import BrandLogo from '../../../components/BrandLogo/BrandLogo'
import '../Auth.css'

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [serverError, setServerError] = useState('')
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: 'onTouched' })

  const onSubmit = async (data) => {
    setIsLoading(true)
    setServerError('')

    try {
      const res = await authAPI.forgotPassword({ email: data.email })
      if (res.success) {
        setSubmittedEmail(data.email)
        setSubmitted(true)
      } else {
        setServerError(res.message || 'Failed to send password reset code.')
      }
    } catch (err) {
      setServerError('Unable to connect to the authentication server.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-grid" />

      {/* Back button */}
      <button
        type="button"
        className="auth-page-back-btn"
        onClick={() => {
          if (window.history.length > 1) {
            navigate(-1)
          } else {
            navigate('/login')
          }
        }}
        aria-label={t("Back")}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>{t("Back")}</span>
      </button>

      <div className="auth-card">
        {/* Brand & Back Navigation */}
        <div className="auth-card-header">
          <button
            type="button"
            className="auth-card-back-btn"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1)
              } else {
                navigate('/login')
              }
            }}
            title="Go Back"
            aria-label="Go Back"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="auth-brand" style={{ marginBottom: 0 }}>
            <BrandLogo size={28} showWordmark />
          </div>
        </div>

        {!submitted ? (
          <>
            {/* Lock icon */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.15), rgba(62, 207, 207, 0.08))',
                border: '1px solid rgba(108, 99, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(108, 99, 255, 0.15)'
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="#a78bfa" strokeWidth="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="16" r="1.5" fill="#a78bfa" />
                </svg>
              </div>
            </div>

            <h1 className="auth-title">Forgot Your Password?</h1>
            <p className="auth-subtitle">
              Enter your registered email and we'll send you a 6-digit reset code
            </p>

            {serverError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  marginBottom: '16px',
                  textAlign: 'center',
                }}
              >
                {serverError}
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
              {/* Email */}
              <div className="field-group">
                <label className="field-label" htmlFor="forgot-email">{t("Email Address")}</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
                      <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                  <input
                    id="forgot-email"
                    type="email"
                    placeholder="you@example.com"
                    className={`auth-input ${errors.email ? 'input-error' : ''}`}
                    {...register('email', {
                      required: 'Email address is required',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Please enter a valid email address',
                      },
                    })}
                  />
                </div>
                {errors.email && (
                  <span className="field-error">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                      <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    {errors.email.message}
                  </span>
                )}
              </div>

              {/* Submit */}
              <button id="forgot-submit" type="submit" className="auth-btn" disabled={isLoading}>
                {isLoading ? (
                  <span className="auth-btn-loading">
                    <span className="spinner" />{t("Sending...")}</span>
                ) : (
                  'Send Reset Code'
                )}
              </button>
            </form>

            <p className="auth-redirect">
              <Link to="/login">← Back to Login</Link>
            </p>
          </>
        ) : (
          /* Success State */
          <div className="auth-success">
            <div className="success-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#34d399" strokeWidth="2" />
                <path d="M8 12l3 3 5-5" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="success-title">Code Sent! ✉️</h2>
            <p className="success-text">
              We've sent a 6-digit password reset code to <strong style={{ color: '#a78bfa' }}>{submittedEmail}</strong>.
              <br />
              Please check your inbox (and spam folder).
            </p>
            <button
              className="auth-btn"
              style={{ marginTop: '8px' }}
              onClick={() => navigate('/reset-password', { state: { email: submittedEmail } })}
            >
              Enter Reset Code →
            </button>
            <Link to="/login" style={{ color: '#6C63FF', fontSize: '0.85rem', marginTop: '12px' }}>
              ← Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
