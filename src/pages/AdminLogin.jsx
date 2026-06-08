// src/pages/AdminLogin.jsx
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import './AdminLogin.css';

export default function AdminLogin() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // App.jsx will react to the auth state change automatically
      window.history.pushState({}, '', '/items');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">

      {/* Background grid decoration */}
      <div className="login-bg" />

      {/* Card */}
      <div className="login-card">

        <p className="login-card__eyebrow">Admin Portal</p>

        <div className="login-card__logo-wrap">
          <img src="./logo.png" alt="Divaio" className="login-card__logo" />
        </div>

        <div className="login-card__header">
          <h1 className="login-card__title">Admin Access</h1>
          <p className="login-card__sub">Sign in to manage your store</p>
        </div>

        {/* Error */}
        {error && (
          <div className="login-error" role="alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-form__group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="admin@divaio.com"
            />
          </div>

          <div className="login-form__group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="login-btn"
          >
            {loading ? (
              <span className="login-btn__spinner" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="login-card__footer">
          <a href="/">← Back to store</a>
        </p>

      </div>
    </div>
  );
}
