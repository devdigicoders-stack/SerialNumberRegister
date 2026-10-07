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
          <button className="btn-close-modal" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div className="modal-body">
          <p>Are you sure you want to delete this record?</p>
          <div className="delete-record-preview">
            <div>
              <b>Name:</b> {record.name}
            </div>
            <div>
              <b>Barcode:</b> <code>{record.barcode}</code>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-light" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => onConfirm(record.id)}
          >
            <i className="fa-solid fa-trash"></i> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
