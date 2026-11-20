import React, { useState } from 'react';
import loginArt from '../assets/login-art.webp';

export default function AuthForm({ onAuthSuccess }) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  function validate() {
    const errs = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = 'Please enter a valid email address';
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onAuthSuccess({ email: email.trim(), password }, isSignup);
    } catch (err) {
      setServerError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleQuickDemoLogin() {
    setServerError(null);
    setErrors({});
    setIsDemoLoading(true);
    try {
      await onAuthSuccess({ email: 'demo@leadmanager.com', password: 'Password123' }, false);
    } catch (err) {
      setServerError(err.message || 'Failed to sign in with demo account. Please try again.');
    } finally {
      setIsDemoLoading(false);
    }
  }

  function handleFillDemoCredentials() {
    setEmail('demo@leadmanager.com');
    setPassword('Password123');
    setIsSignup(false);
    setErrors({});
    setServerError(null);
  }

  return (
    <div className="auth-page-ref5">
      <div className="auth-card-ref5">
        {/* Left Column: Form */}
        <div className="auth-form-column">
          <div className="auth-form-inner">
            <div className="auth-header-ref5">
              <h1 className="auth-title-ref5">
                {isSignup ? 'Create an account' : 'Welcome back'}
              </h1>
              <p className="auth-subtitle-ref5">
                {isSignup
                  ? 'Welcome! Please enter your details to register.'
                  : 'Welcome back! Please enter your details.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {serverError && (
                <div className="form-general-error" role="alert" style={{ marginBottom: '16px' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{serverError}</span>
                </div>
              )}

              {/* Email Input */}
              <div className="form-group-ref5">
                <label className="form-label-ref5" htmlFor="auth-email">
                  Email
                </label>
                <input
                  id="auth-email"
                  type="email"
                  className={`form-input-ref5 ${errors.email ? 'form-input-error' : ''}`}
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting || isDemoLoading}
                  autoComplete="email"
                  autoFocus={!isSignup}
                />
                {errors.email && <span className="field-error-text">{errors.email}</span>}
              </div>

              {/* Password Input with show/hide toggle */}
              <div className="form-group-ref5">
                <label className="form-label-ref5" htmlFor="auth-password">
                  Password
                </label>
                <div className="password-input-wrapper">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    className={`form-input-ref5 ${errors.password ? 'form-input-error' : ''}`}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting || isDemoLoading}
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex="-1"
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && <span className="field-error-text">{errors.password}</span>}
              </div>

              {/* Options row (Remember me & Demo shortcut) */}
              <div className="auth-options-row">
                <label className="checkbox-label-ref5">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember for 30 days</span>
                </label>
                <button
                  type="button"
                  className="auth-link-shortcut"
                  onClick={handleFillDemoCredentials}
                >
                  Use Demo
                </button>
              </div>

              {/* Primary Submit */}
              <button
                type="submit"
                className="btn-primary-ref5"
                disabled={isSubmitting || isDemoLoading}
              >
                {isSubmitting
                  ? isSignup
                    ? 'Creating account...'
                    : 'Signing in...'
                  : isSignup
                  ? 'Sign up'
                  : 'Sign in'}
              </button>

              {/* Secondary Demo Button matching ref-5 outline button */}
              <button
                type="button"
                className="btn-outline-ref5"
                onClick={handleQuickDemoLogin}
                disabled={isSubmitting || isDemoLoading}
              >
                {isDemoLoading ? (
                  <span>Accessing Demo Dashboard...</span>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    <span>Sign in with Demo Account</span>
                  </>
                )}
              </button>
            </form>

            {/* Bottom toggle */}
            <div className="auth-footer-ref5">
              {isSignup ? (
                <span>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="auth-link-bold"
                    onClick={() => {
                      setIsSignup(false);
                      setServerError(null);
                      setErrors({});
                    }}
                  >
                    Sign in
                  </button>
                </span>
              ) : (
                <span>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    className="auth-link-bold"
                    onClick={() => {
                      setIsSignup(true);
                      setServerError(null);
                      setErrors({});
                    }}
                  >
                    Sign up for free
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Visual Art (ref-5) */}
        <div className="auth-art-column">
          <img
            src={loginArt}
            alt="Lead Manager Visual Art"
            className="auth-art-image"
          />
        </div>
      </div>
    </div>
  );
}
