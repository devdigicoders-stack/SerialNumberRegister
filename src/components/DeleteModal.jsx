import React from 'react';

export default function DeleteModal({ record, onClose, onConfirm }) {
  if (!record) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && onClose()}>
      <div className="modal-dialog modal-sm">
        <div className="modal-header modal-header-danger">
          <h3>
            <i className="fa-solid fa-triangle-exclamation"></i> Confirm Delete
          </h3>
          <button className="btn-close-modal" onClick={onClose} title="Close">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: '14px', color: '#475569', marginBottom: '10px' }}>
            Are you sure you want to delete this record? This action cannot be undone.
          </p>
          <div className="delete-record-preview">
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: '#64748b' }}>Name:</span> <b>{record.name}</b>
            </div>
            {record.crNumber && (
              <div style={{ marginBottom: '4px' }}>
                <span style={{ color: '#64748b' }}>CR Number:</span> <b style={{ color: '#0284c7' }}>{record.crNumber}</b>
              </div>
            )}
            <div>
              <span style={{ color: '#64748b' }}>Barcode:</span> <code style={{ fontWeight: 700, color: '#1e293b' }}>{record.barcode}</code>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn-secondary-gray" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-danger-red"
            onClick={() => onConfirm(record.id)}
          >
            <i className="fa-solid fa-trash"></i> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
