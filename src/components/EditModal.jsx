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
            <i className="fa-solid fa-pen-to-square"></i> Edit Entry
          </h3>
          <button className="btn-close-modal" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="editName">
                <i className="fa-solid fa-user-tag"></i> Name
              </label>
              <input
                type="text"
                id="editName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="editBarcode">
                <i className="fa-solid fa-barcode"></i> Barcode / Serial Number
              </label>
              <input
                type="text"
                id="editBarcode"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-light" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <i className="fa-solid fa-floppy-disk"></i> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
