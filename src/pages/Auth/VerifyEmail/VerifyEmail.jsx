import {t} from '../../../utils/text'
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import BrandLogo from '../../../components/BrandLogo/BrandLogo';
import '../Auth.css';

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const queryParams = new URLSearchParams(location.search);
  const initialEmail = location.state?.email || queryParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState(
    location.state?.message || 'Please enter the 6-digit code sent to your email.'
  );
  const [timer, setTimer] = useState(60);
  const inputsRef = useRef([]);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (index, value) => {
    if(/^\d{6}$/.test(value)){setCode(value.split(''));inputsRef.current[5]?.focus();return;}
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split('');
      setCode(digits);
      inputsRef.current[5]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    if (!email) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authAPI.verifyCode({ email, code: fullCode });
      if (res.success) {
        setSuccessMessage('Email verified successfully! Redirecting to login page...');
        setTimeout(() => {
          navigate('/login', {
            state: {
              message: 'Account verified successfully! Please log in with your credentials.',
              email: email,
            },
          });
        }, 1200);
      } else {
        setErrorMessage(res.message || 'Verification failed. Please check the code.');
      }
    } catch (err) {
      setErrorMessage('Failed to connect to the server. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || !email) return;
    setIsResending(true);
    setErrorMessage('');
    try {
      const res = await authAPI.resendCode({ email });
      if (res.success) {
        setSuccessMessage('A fresh verification code has been sent to your email.');
        setTimer(60);
      } else {
        setErrorMessage(res.message || 'Failed to resend code.');
      }
    } catch {
      setErrorMessage('Server connection error while resending code.');
    } finally {
      setIsResending(false);
    }
  };

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
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="auth-brand" style={{ marginBottom: 0 }}>
            <BrandLogo size={28} showWordmark />
          </div>
        </div>

        {/* Mail Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(62, 207, 207, 0.15), rgba(108, 99, 255, 0.08))',
              border: '1px solid rgba(62, 207, 207, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(62, 207, 207, 0.15)',
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="4" width="20" height="16" rx="3" stroke="#3ECFCF" strokeWidth="2" />
              <path d="M2 8l10 6 10-6" stroke="#3ECFCF" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <h1 className="auth-title">Verify Your Email</h1>
        <p className="auth-subtitle">
          {email ? (
            <>
              Code sent to <span style={{ color: '#a78bfa' }}>{email}</span>
            </>
          ) : (
            'Enter your registered email and the 6-digit code'
          )}
        </p>

        {errorMessage && (
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
            {errorMessage}
          </div>
        )}

        {successMessage && (
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
            {successMessage}
          </div>
        )}

        <form className="auth-form" onSubmit={handleVerify}>
          {!initialEmail && (
            <div className="field-group">
              <label className="field-label">{t("Email Address")}</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="auth-input"
                  required
                />
              </div>
            </div>
          )}

          {/* 6-digit OTP Inputs */}
          <div className="field-group">
            <label className="field-label" style={{ textAlign: 'center', display: 'block' }}>
              6-Digit Code
            </label>
            <div
              style={{
                display: 'flex',
                gap: '8px',
                justifyContent: 'center',
                margin: '10px 0',
              }}
              onPaste={handlePaste}
            >
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputsRef.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  aria-label={`Verification digit ${index + 1}`}
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  maxLength={index===0?6:1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  style={{
                    width: '42px',
                    height: '48px',
                    textAlign: 'center',
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6C63FF';
                    e.target.style.boxShadow = '0 0 12px rgba(108, 99, 255, 0.3)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              ))}
            </div>
          </div>

          <button id="verify-submit" type="submit" className="auth-btn" disabled={isLoading}>
            {isLoading ? (
              <span className="auth-btn-loading">
                <span className="spinner" />
                Verifying...
              </span>
            ) : (
              'Verify & Activate Account'
            )}
          </button>
        </form>

        {/* Resend Code Section */}
        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.85rem', color: '#94a3b8' }}>
          Didn't receive the code?{' '}
          {timer > 0 ? (
            <span style={{ color: '#a78bfa' }}>Resend in {timer}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              style={{
                background: 'none',
                border: 'none',
                color: '#6C63FF',
                cursor: 'pointer',
                fontWeight: '600',
                padding: '0',
                textDecoration: 'underline',
              }}
            >
              {isResending ? 'Sending...' : 'Resend Code'}
            </button>
          )}
        </div>

        <p className="auth-redirect" style={{ marginTop: '20px' }}>
          <Link to="/login">← Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
