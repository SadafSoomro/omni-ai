import {t} from '../../../utils/text'
import GoogleSignIn from '../../../components/GoogleSignIn';
import React, { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../../../services/api'
import BrandLogo from '../../../components/BrandLogo/BrandLogo'
import '../Auth.css'
import './Register.css'

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

export default function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [serverError, setServerError] = useState('')
  const [serverSuccess, setServerSuccess] = useState('')
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ mode: 'onTouched' })

  const password = watch('password', '')
  const strength = getPasswordStrength(password)
  const strengthClass = ['', 'active-weak', 'active-fair', 'active-good', 'active-strong'][strength.score]

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if(!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size>4*1024*1024){setServerError('Choose a JPG, PNG, or WebP image up to 4 MB.');return}
    setValue('profileImage', file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setImagePreview(null)
    setValue('profileImage', null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onSubmit = async (data) => {
    setIsLoading(true)
    setServerError('')
    setServerSuccess('')

    try {
      const formData = new FormData()
      formData.append('name', data.name)
      formData.append('email', data.email)
      formData.append('phone', data.phone || '')
      formData.append('password', data.password)
      if (data.profileImage) {
        formData.append('image', data.profileImage)
      }

      const res = await authAPI.register(formData)

      if (res.success) {
        setServerSuccess(res.message || 'Registration successful! Verification code sent.')
        setTimeout(() => {
          navigate('/verify-email', {
            state: {
              email: data.email,
              message: res.message,
            },
          })
        }, 1200)
      } else {
        setServerError(res.message || 'Registration failed.')
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
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="auth-brand" style={{ marginBottom: 0 }}>
            <BrandLogo size={28} showWordmark />
          </div>
        </div>

        <h1 className="auth-title">{t("Create an Account")}</h1>
        <p className="auth-subtitle">{t("Sign up for free and get started today")}</p>

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

        {serverSuccess && (
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
            {serverSuccess}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>

          {/* ── Profile Image ── */}
          <div className="image-upload-group">
            <div className="image-upload-circle" onClick={() => fileInputRef.current?.click()}>
              {imagePreview ? (
                <img src={imagePreview} alt="Profile preview" className="image-preview" />
              ) : (
                <div className="image-placeholder">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" stroke="#6C63FF" strokeWidth="2" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#6C63FF" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span>{t("Upload Photo")}</span>
                </div>
              )}
              <div className="image-upload-overlay">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />

            <div className="image-upload-actions">
              <button type="button" className="img-btn-choose" onClick={() => fileInputRef.current?.click()}>
                {imagePreview ? 'Change Photo' : 'Choose Photo'}
              </button>
              {imagePreview && (
                <button type="button" className="img-btn-remove" onClick={handleRemoveImage}>{t("Remove")}</button>
              )}
            </div>
          </div>

          {/* ── Two column: Name + Phone ── */}
          <div className="reg-row">
            {/* Full Name */}
            <div className="field-group">
              <label className="field-label" htmlFor="reg-name">{t("Full Name")}</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  id="reg-name"
                  type="text"
                  placeholder=""
                  className={`auth-input ${errors.name ? 'input-error' : ''}`}
                  {...register('name', {
                    required: 'Full name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' },
                    pattern: {
                      value: /^[a-zA-Z\s]+$/,
                      message: 'Name can only contain letters and spaces',
                    },
                  })}
                />
              </div>
              {errors.name && (
                <span className="field-error">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  {errors.name.message}
                </span>
              )}
            </div>

            {/* Phone Number */}
            <div className="field-group">
              <label className="field-label" htmlFor="reg-phone">{t("Phone Number")}</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  id="reg-phone"
                  type="tel"
                  placeholder=""
                  className={`auth-input ${errors.phone ? 'input-error' : ''}`}
                  {...register('phone', {
                    required: 'Phone number is required',
                    pattern: {
                      value: /^[+]?[\d\s\-()]{10,15}$/,
                      message: 'Enter a valid phone number',
                    },
                  })}
                />
              </div>
              {errors.phone && (
                <span className="field-error">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  {errors.phone.message}
                </span>
              )}
            </div>
          </div>

          {/* ── Email ── */}
          <div className="field-group">
            <label className="field-label" htmlFor="reg-email">{t("Email Address")}</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
                  <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              <input
                id="reg-email"
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
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {errors.email.message}
              </span>
            )}
          </div>

          {/* ── Password ── */}
          <div className="field-group">
            <label className="field-label" htmlFor="reg-password">{t("Password")}</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                placeholder=""
                className={`auth-input has-toggle ${errors.password ? 'input-error' : ''}`}
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' },
                  pattern: {
                    value: /^(?=.*[A-Za-z])(?=.*\d).{6,}$/,
                    message: 'Password must contain at least one letter and one number',
                  },
                })}
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password">
                {showPassword ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                  </svg>
                )}
              </button>
            </div>
            {password && (
              <div className="password-strength">
                <div className="strength-bars">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`strength-bar ${i <= strength.score ? strengthClass : ''}`} />
                  ))}
                </div>
                <span className="strength-label">{strength.label}</span>
              </div>
            )}
            {errors.password && (
              <span className="field-error">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {errors.password.message}
              </span>
            )}
          </div>

          {/* ── Confirm Password ── */}
          <div className="field-group">
            <label className="field-label" htmlFor="reg-confirm">{t("Confirm Password")}</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              <input
                id="reg-confirm"
                type={showConfirm ? 'text' : 'password'}
                placeholder=""
                className={`auth-input has-toggle ${errors.confirmPassword ? 'input-error' : ''}`}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === password || 'Passwords do not match',
                })}
              />
              <button type="button" className="password-toggle" onClick={() => setShowConfirm(!showConfirm)} aria-label="Toggle confirm password">
                {showConfirm ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                  </svg>
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="field-error">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {errors.confirmPassword.message}
              </span>
            )}
          </div>

          {/* ── Submit ── */}
          <button id="register-submit" type="submit" className="auth-btn" disabled={isLoading}>
            {isLoading ? (
              <span className="auth-btn-loading">
                <span className="spinner" />{t("Creating account...")}</span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>
        <GoogleSignIn />

        <p className="auth-redirect">{t("Already have an account?")}{' '}
          <Link to="/login" className="auth-link-btn">{t("Sign in")}</Link>
        </p>
      </div>
    </div>
  )
}
