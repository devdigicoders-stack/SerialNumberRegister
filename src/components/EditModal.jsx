import React, { useState, useEffect } from 'react';

export default function EditModal({ record, onClose, onSave }) {
  const [name, setName] = useState('');
  const [crNumber, setCrNumber] = useState('');
  const [barcodes, setBarcodes] = useState(['']);

  useEffect(() => {
    if (record) {
      setName(record.name || '');
      setCrNumber(record.crNumber || '');
      const list = Array.isArray(record.barcodes) && record.barcodes.length > 0
        ? record.barcodes
        : (record.barcode ? [record.barcode] : ['']);
      setBarcodes(list);
    }
  }, [record]);

  if (!record) return null;

  const handleBarcodeChange = (index, val) => {
    const updated = [...barcodes];
    updated[index] = val;
    setBarcodes(updated);
  };

  const handleAddBarcode = () => {
    setBarcodes([...barcodes, '']);
  };

  const handleRemoveBarcode = (index) => {
    if (barcodes.length <= 1) {
      setBarcodes(['']);
      return;
    }
    setBarcodes(barcodes.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanCrNumber = crNumber.trim();
    const validBarcodes = barcodes.map((b) => b.trim()).filter(Boolean);

    if (!cleanName || validBarcodes.length === 0) return;
    onSave(record.id, cleanName, validBarcodes, cleanCrNumber);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && onClose()}>
      <div className="modal-dialog scans-review-dialog" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <h3>
            <i className="fa-solid fa-pen-to-square" style={{ color: '#1976d2' }}></i> Edit Patient Entry
          </h3>
          <button className="btn-close-modal" onClick={onClose} title="Close">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
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

            <div className="form-field">
              <label className="field-label" htmlFor="editCrNumber">
                <span><i className="fa-solid fa-hashtag" style={{ marginRight: '6px', color: '#64748b' }}></i> CR Number</span>
              </label>
              <input
                type="text"
                id="editCrNumber"
                className="input-box"
                value={crNumber}
                onChange={(e) => setCrNumber(e.target.value)}
                placeholder="Enter CR number"
              />
            </div>

            <div className="form-field" style={{ marginBottom: 0 }}>
              <div className="field-label">
                <span><i className="fa-solid fa-barcode" style={{ marginRight: '6px', color: '#64748b' }}></i> Barcode / Serial Numbers ({barcodes.filter(b => b.trim()).length})</span>
              </div>

              <div className="barcode-inputs-container">
                {barcodes.map((code, idx) => (
                  <div key={idx} className="barcode-input-row">
                    <input
                      type="text"
                      className="input-box barcode-input"
                      value={code}
                      onChange={(e) => handleBarcodeChange(idx, e.target.value)}
                      placeholder={`Barcode #${idx + 1}...`}
                      required={idx === 0 && barcodes.length === 1}
                    />
                    {barcodes.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove-scan"
                        onClick={() => handleRemoveBarcode(idx)}
                        title="Remove scan"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="btn-add-more-scans"
                onClick={handleAddBarcode}
                style={{ marginTop: '8px' }}
              >
                <i className="fa-solid fa-plus"></i> Add Another Barcode
              </button>
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
