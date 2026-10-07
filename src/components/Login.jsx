import React, { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function Login({ onLogin, showToast }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      showToast('Please enter both username and password', 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Login successful! Welcome Admin.', 'success');
        onLogin(data.user);
      } else {
        showToast(data.message || 'Invalid credentials', 'danger');
      }
    } catch (err) {
      // Fallback if backend server isn't reached
      if (username === 'admin' && password === 'admin123') {
        showToast('Offline Mode: Login successful!', 'success');
        onLogin({ username: 'admin', role: 'administrator' });
      } else {
        showToast('Login failed. Please check credentials or backend connection.', 'danger');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-icon">
            <i className="fa-solid fa-barcode"></i>
          </div>
          <h1>Admin Portal</h1>
          <p>Name & Barcode Register System</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="loginUsername">
              <i className="fa-solid fa-user"></i> Username
            </label>
            <input
              type="text"
              id="loginUsername"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="loginPassword">
              <i className="fa-solid fa-lock"></i> Password
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="loginPassword"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="btn-toggle-pwd"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                <i className={showPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'}></i>
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            <i className="fa-solid fa-right-to-bracket"></i>{' '}
            {loading ? 'Logging in...' : 'Login to Admin Panel'}
          </button>
        </form>
      </div>
    </div>
  );
}
