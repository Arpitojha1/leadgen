import React, { useState } from 'react';

export default function AuthForm({ onAuthSuccess }) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="auth-page">
      <div className="auth-card">
        {/* Brand header */}
        <div className="auth-header">
          <div className="auth-brand">
            <div className="brand-icon">LM</div>
            <div className="auth-brand-text">
              <span className="brand-title">Lead Manager</span>
              <span className="brand-badge">CRM DASHBOARD</span>
            </div>
          </div>
          <h1 className="auth-title">
            {isSignup ? 'Create an account' : 'Welcome back'}
          </h1>
          <p className="auth-subtitle">
            {isSignup
              ? 'Start tracking and converting your sales pipeline'
              : 'Sign in to access your dashboard and lead analytics'}
          </p>
        </div>

        {/* 1-Click Instant Demo Access Box */}
        <div className="demo-callout">
          <div className="demo-callout-header">
            <span className="demo-callout-badge">⚡ INSTANT DEMO</span>
            <span className="demo-callout-hint">Preloaded with 10 leads & charts</span>
          </div>
          <button
            type="button"
            className="btn-demo-quick"
            onClick={handleQuickDemoLogin}
            disabled={isDemoLoading || isSubmitting}
            aria-label="One-click demo sign in"
          >
            {isDemoLoading ? (
              <span>Logging in as Demo User...</span>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                <span>Login as Demo User (1-Click)</span>
              </>
            )}
          </button>
          <div className="demo-credentials-row">
            <span>demo@leadmanager.com &bull; Password123</span>
            <button
              type="button"
              className="btn-fill-creds"
              onClick={handleFillDemoCredentials}
            >
              Fill fields
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="auth-divider">
          <span>or continue with your credentials</span>
        </div>

        {/* Tab switch between Sign In and Sign Up */}
        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={!isSignup}
            className={`auth-tab ${!isSignup ? 'auth-tab-active' : ''}`}
            onClick={() => {
              setIsSignup(false);
              setServerError(null);
              setErrors({});
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isSignup}
            className={`auth-tab ${isSignup ? 'auth-tab-active' : ''}`}
            onClick={() => {
              setIsSignup(true);
              setServerError(null);
              setErrors({});
            }}
          >
            Create Account
          </button>
        </div>

        {/* Login / Signup Form */}
        <form onSubmit={handleSubmit} noValidate>
          {serverError && (
            <div className="form-general-error" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{serverError}</span>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '1.1rem' }}>
            <label className="form-label form-label-required" htmlFor="auth-email">
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              className={`form-input ${errors.email ? 'form-input-error' : ''}`}
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting || isDemoLoading}
              autoComplete="email"
              autoFocus={!isSignup}
            />
            {errors.email && <span className="field-error-text">{errors.email}</span>}
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label form-label-required" htmlFor="auth-password">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              className={`form-input ${errors.password ? 'form-input-error' : ''}`}
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting || isDemoLoading}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
            />
            {errors.password && <span className="field-error-text">{errors.password}</span>}
          </div>

          <button
            type="submit"
            className="btn-primary auth-submit-btn"
            disabled={isSubmitting || isDemoLoading}
          >
            {isSubmitting
              ? isSignup
                ? 'Creating Account...'
                : 'Signing In...'
              : isSignup
              ? 'Create Account'
              : 'Sign In to Dashboard'}
          </button>
        </form>

        {/* Footer switch */}
        <div className="auth-footer-text">
          {isSignup ? 'Already have an account?' : "Don't have an account yet?"}{' '}
          <button
            type="button"
            className="auth-link-btn"
            onClick={() => {
              setIsSignup(!isSignup);
              setServerError(null);
              setErrors({});
            }}
          >
            {isSignup ? 'Sign In' : 'Sign Up for free'}
          </button>
        </div>
      </div>
    </div>
  );
}
