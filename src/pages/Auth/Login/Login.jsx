import {t} from '../../../utils/text'
import GoogleSignIn from '../../../components/GoogleSignIn';
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { authAPI } from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import BrandLogo from '../../../components/BrandLogo/BrandLogo'
import '../Auth.css'

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [unverifiedEmail, setUnverifiedEmail] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [notification, setNotification] = useState(location.state?.message || '')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: 'onTouched',
    defaultValues: {
      email: location.state?.email || '',
      password: '',
    },
  })

  const onSubmit = async (data) => {
    setIsLoading(true)
    setServerError('')
    setNotification('')
    setUnverifiedEmail(null)

    try {
      const res = await authAPI.login({
        email: data.email,
        password: data.password,
      })

      if (res.success) {
        login(res.user, res.token)
        navigate(location.state?.from || (res.user?.role==='admin'?'/admin':'/'))
      } else {
        setServerError(res.message || 'Login failed')
        if (res.isUnverified) {
          setUnverifiedEmail(data.email)
        }
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
            navigate('/')
          }
        }}
        aria-label="Back to home"
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
                navigate('/')
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

        <h1 className="auth-title">{t("Welcome Back")}</h1>
        <p className="auth-subtitle">{t("Sign in to your account to continue")}</p>

        {notification && (
          <div
            style={{
              background: 'rgba(52, 211, 153, 0.12)',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              color: '#34d399',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              marginBottom: '16px',
              textAlign: 'center',
            }}
          >
            {notification}
          </div>
        )}

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
            {unverifiedEmail && (
              <div style={{ marginTop: '8px' }}>
                <Link
                  to="/verify-email"
                  state={{ email: unverifiedEmail }}
                  style={{
                    color: '#3ECFCF',
                    fontWeight: '600',
                    textDecoration: 'underline',
                    fontSize: '0.85rem',
                  }}
                >{t("Verify your account now →")}</Link>
              </div>
            )}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Email */}
          <div className="field-group">
            <label className="field-label" htmlFor="login-email">{t("Email Address")}</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
                  <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              <input
                id="login-email"
                type="email"
                placeholder=""
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

          {/* Password */}
          <div className="field-group">
            <label className="field-label" htmlFor="login-password">{t("Password")}</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder=""
                className={`auth-input has-toggle ${errors.password ? 'input-error' : ''}`}
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' },
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

          {/* Forgot password */}
          <div className="auth-forgot">
            <Link to="/forgot-password">{t("Forgot password?")}</Link>
          </div>

          {/* Submit */}
          <button id="login-submit" type="submit" className="auth-btn" disabled={isLoading}>
            {isLoading ? (
              <span className="auth-btn-loading">
                <span className="spinner" />{t("Logging in...")}</span>
            ) : (
              'Login'
            )}
          </button>
        </form>
        <GoogleSignIn />

        {/* Redirect */}
        <p className="auth-redirect">{t("Don't have an account?")}{' '}
          <Link to="/register" className="auth-link-btn">{t("Create one")}</Link>
        </p>
      </div>
    </div>
  )
}
