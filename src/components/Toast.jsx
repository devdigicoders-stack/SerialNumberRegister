import React from 'react';

export default function ToastContainer({ toasts }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => {
        let icon = 'fa-info-circle';
        if (toast.type === 'success') icon = 'fa-circle-check';
        if (toast.type === 'warning') icon = 'fa-triangle-exclamation';
        if (toast.type === 'danger') icon = 'fa-circle-xmark';

        return (
          <div key={toast.id} className={`toast toast-${toast.type || 'info'}`}>
            <i className={`fa-solid ${icon}`} style={{ fontSize: '16px' }}></i>
            <span>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}
