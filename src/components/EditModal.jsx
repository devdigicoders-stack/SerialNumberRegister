import React, { useState, useEffect } from 'react';

export default function EditModal({ record, onClose, onSave }) {
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');

  useEffect(() => {
    if (record) {
      setName(record.name || '');
      setBarcode(record.barcode || '');
    }
  }, [record]);

  if (!record) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !barcode.trim()) return;
    onSave(record.id, name.trim(), barcode.trim());
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && onClose()}>
      <div className="modal-dialog">
        <div className="modal-header">
          <h3>
            <i className="fa-solid fa-pen-to-square" style={{ color: '#1976d2' }}></i> Edit Entry
          </h3>
          <button className="btn-close-modal" onClick={onClose} title="Close">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-field">
              <label className="field-label" htmlFor="editName">
                <span><i className="fa-solid fa-user" style={{ marginRight: '6px', color: '#64748b' }}></i> Name</span>
              </label>
              <input
                type="text"
                id="editName"
                className="input-box"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
                required
              />
            </div>

            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="field-label" htmlFor="editBarcode">
                <span><i className="fa-solid fa-barcode" style={{ marginRight: '6px', color: '#64748b' }}></i> Barcode / Serial Number</span>
              </label>
              <input
                type="text"
                id="editBarcode"
                className="input-box barcode-input"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Enter barcode"
                required
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary-gray" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-blue">
              <i className="fa-solid fa-floppy-disk"></i> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
