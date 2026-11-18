import React from 'react';

export default function Header({ user, onLogout }) {
  const expiryDate = new Date('2026-11-26T23:59:59');
  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let countdownText = '';
  let isUrgent = diffDays <= 3;

  if (diffDays > 1) {
    countdownText = `${diffDays} days left`;
  } else if (diffDays === 1) {
    countdownText = 'Expires tomorrow';
  } else if (diffDays === 0) {
    countdownText = 'Expires today';
  } else {
    countdownText = 'Expired';
    isUrgent = true;
  }

  return (
    <header className="header-hero">
      <div className="header-top-bar">
        <h1>
          Name–Serial<br />Number Register
        </h1>
        <div className="user-nav-actions">
          <span
            className={`server-expiry-nav-pill ${isUrgent ? 'urgent' : ''}`}
            title="Server Renewal: 26 Nov 2026"
          >
            <i className="fa-solid fa-clock"></i> Expires: 26 Nov
          </span>
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

      {/* Prominent Server Expiry Reminder Badge / Banner */}
      <div className={`server-renewal-banner ${isUrgent ? 'urgent' : ''}`}>
        <div className="renewal-banner-left">
          <i className="fa-solid fa-triangle-exclamation renewal-icon"></i>
          <div className="renewal-text-wrap">
            <span className="renewal-title">⚠️ Server Renewal Reminder:</span>
            <span className="renewal-desc">
              Your server will expire on <b>26 November 2026</b>. Please renew on time to avoid service interruption.
            </span>
          </div>
        </div>
        <span className="renewal-days-badge">{countdownText}</span>
      </div>

      <p>Scan barcode &rarr; record serial number against a name</p>
    </header>
  );
}
