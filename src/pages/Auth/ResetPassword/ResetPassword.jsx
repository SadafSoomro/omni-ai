import {t} from '../../../utils/text'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { authAPI } from '../../../services/api'
import BrandLogo from '../../../components/BrandLogo/BrandLogo'
import {useAuth} from '../../../context/AuthContext'
import '../Auth.css'

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '' }
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  return { score, label: labels[score] }
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const {logout}=useAuth()
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const defaultEmail = location.state?.email || queryParams.get('email') || ''

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    mode: 'onTouched',
    defaultValues: {
      email: defaultEmail,
      code: '',
      password: '',
      confirmPassword: '',
    },
  })

  const password = watch('password', '')
  const strength = getPasswordStrength(password)
  const strengthClass = ['', 'active-weak', 'active-fair', 'active-good', 'active-strong'][strength.score]

  const onSubmit = async (data) => {
    setIsLoading(true)
    setServerError('')

    try {
      const res = await authAPI.resetPassword({
        email: data.email,
        code: data.code,
        newPassword: data.password,
      })

      if (res.success) {
        logout()
        setSuccess(true)
      } else {
        setServerError(res.message || 'Failed to reset password.')
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

        {!success ? (
          <>
            {/* Key icon */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(62, 207, 207, 0.15), rgba(108, 99, 255, 0.08))',
                border: '1px solid rgba(62, 207, 207, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(62, 207, 207, 0.15)'
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <circle cx="8" cy="15" r="4" stroke="#3ECFCF" strokeWidth="2" />
                  <path d="M12 11l8-8" stroke="#3ECFCF" strokeWidth="2" strokeLinecap="round" />
                  <path d="M18 6l2 2" stroke="#3ECFCF" strokeWidth="2" strokeLinecap="round" />
                  <path d="M20 4l2 2" stroke="#3ECFCF" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            <h1 className="auth-title">Set New Password</h1>
            <p className="auth-subtitle">Enter your reset code and choose a new password</p>

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
              {/* Email Address */}
              <div className="field-group">
                <label className="field-label" htmlFor="reset-email">{t("Email Address")}</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
                      <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                  <input
                    id="reset-email"
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

              {/* Reset Code */}
              <div className="field-group">
                <label className="field-label" htmlFor="reset-code">6-Digit Reset Code</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <input
                    id="reset-code"
                    type="text"
                    maxLength="6"
                    placeholder="e.g. 123456"
                    className={`auth-input ${errors.code ? 'input-error' : ''}`}
                    {...register('code', {
                      required: 'Reset code is required',
                      pattern: {
                        value: /^\d{6}$/,
                        message: 'Please enter the 6-digit code sent to your email',
                      },
                    })}
                  />
                </div>
                {errors.code && (
                  <span className="field-error">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                      <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    {errors.code.message}
                  </span>
                )}
              </div>
              {/* New Password */}
              <div className="field-group">
                <label className="field-label" htmlFor="reset-password">New Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                  <input
                    id="reset-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`auth-input has-toggle ${errors.password ? 'input-error' : ''}`}
                    {...register('password', {
                      required: 'New password is required',
                      minLength: { value: 8, message: 'Password must be at least 8 characters' },
                      pattern: {
                        value: /^(?=.*[A-Za-z])(?=.*\d).{8,}$/,
                        message: 'Password must contain at least one letter and one number',
                      },
                    })}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password"
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" />
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Strength meter */}
                {password && (
                  <div className="password-strength">
                    <div className="strength-bars">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`strength-bar ${i <= strength.score ? strengthClass : ''}`}
                        />
                      ))}
                    </div>
                    <span className="strength-label">{strength.label}</span>
                  </div>
                )}

                {errors.password && (
                  <span className="field-error">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                      <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    {errors.password.message}
                  </span>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="field-group">
                <label className="field-label" htmlFor="reset-confirm">{t("Confirm New Password")}</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                  <input
                    id="reset-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`auth-input has-toggle ${errors.confirmPassword ? 'input-error' : ''}`}
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) =>
                        value === password || 'Passwords do not match',
                    })}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirm(!showConfirm)}
                    aria-label="Toggle confirm password"
                  >
                    {showConfirm ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" />
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="field-error">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                      <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    {errors.confirmPassword.message}
                  </span>
                )}
              </div>

              {/* Submit */}
              <button id="reset-submit" type="submit" className="auth-btn" disabled={isLoading}>
                {isLoading ? (
                  <span className="auth-btn-loading">
                    <span className="spinner" />
                    Resetting...
                  </span>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
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
            <h2 className="success-title">Password Reset Successfully! 🎉</h2>
            <p className="success-text">
              Your password has been changed successfully.
              <br />
              You can now sign in with your new password.
            </p>
            <Link to="/login">
              <button className="auth-btn" style={{ marginTop: '8px' }}>{t("Sign In")}</button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
