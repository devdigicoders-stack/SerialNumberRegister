import React from 'react';

export default function Header({ user, onLogout }) {
  return (
    <header className="header-hero">
      <div className="header-top-bar">
        <h1>Name–Serial<br />Number Register</h1>
        <div className="user-nav-actions">
          <span className="admin-badge">
            <i className="fa-solid fa-user-shield"></i> {user?.username || 'admin'}
          </span>
          <button
            className="btn-logout-icon"
            onClick={onLogout}
            title="Logout"
          >
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
          </button>
        </div>
      </div>
      <p>Scan barcode &rarr; record serial number against a name</p>
    </header>
  );
}
