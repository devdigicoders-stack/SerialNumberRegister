import React, { useState, useRef, useEffect } from 'react';

export default function EntryForm({ onAddEntry, isSoundEnabled, setIsSoundEnabled, frequencyMap }) {
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [continuousScan, setContinuousScan] = useState(true);
  const [liveStatus, setLiveStatus] = useState(null);

  const barcodeInputRef = useRef(null);
  const nameInputRef = useRef(null);

  useEffect(() => {
    focusScanner();
  }, []);

  useEffect(() => {
    const trimmed = barcode.trim();
    if (!trimmed) {
      setLiveStatus(null);
      return;
    }
    const count = frequencyMap[trimmed] || 0;
    if (count > 0) {
      setLiveStatus({
        isDup: true,
        text: `⚠️ Duplicate (${count}x)`
      });
    } else {
      setLiveStatus({
        isDup: false,
        text: '✓ New'
      });
    }
  }, [barcode, frequencyMap]);

  const focusScanner = () => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
      barcodeInputRef.current.select();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanBarcode = barcode.trim();

    if (!cleanName || !cleanBarcode) return;

    onAddEntry(cleanName, cleanBarcode);
    setBarcode('');
    setLiveStatus(null);

    if (!continuousScan) {
      setName('');
      if (nameInputRef.current) nameInputRef.current.focus();
    } else {
      focusScanner();
    }
  };

  const handleClear = () => {
    setBarcode('');
    setLiveStatus(null);
    focusScanner();
  };

  return (
    <section className="app-card">
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <div className="field-label">
            <label htmlFor="entryName">Name</label>
          </div>
          <input
            ref={nameInputRef}
            type="text"
            id="entryName"
            className="input-box"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter name"
            required
            autoComplete="off"
          />
        </div>

        <div className="form-field">
          <div className="field-label">
            <label htmlFor="entryBarcode">Scan Barcode / Serial Number</label>
            {liveStatus && (
              <span className={`live-dup-badge ${liveStatus.isDup ? 'is-dup' : 'is-new'}`}>
                {liveStatus.text}
              </span>
            )}
          </div>
          <input
            ref={barcodeInputRef}
            type="text"
            id="entryBarcode"
            className="input-box barcode-input"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="Scan here..."
            required
            autoComplete="off"
          />
        </div>

        <div className="form-actions-row">
          <button type="submit" className="btn-primary-blue">
            Add Serial Number
          </button>
          <button type="button" className="btn-secondary-gray" onClick={focusScanner}>
            Focus Scanner
          </button>
          <button type="button" className="btn-clear-gray" onClick={handleClear}>
            Clear
          </button>
        </div>

        <div className="form-helper-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={continuousScan}
              onChange={(e) => setContinuousScan(e.target.checked)}
            />
            <span>Keep name for next scan</span>
          </label>

          <button
            type="button"
            className={`sound-toggle-btn ${isSoundEnabled ? 'active' : ''}`}
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            title="Toggle Beep sound"
          >
            <i className={`fa-solid ${isSoundEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}`}></i>
            <span>{isSoundEnabled ? 'Beep On' : 'Muted'}</span>
          </button>
        </div>

        <p className="scanner-hint-text">
          USB/Bluetooth barcode scanners normally type the barcode into the box and send Enter automatically.
        </p>
      </form>
    </section>
  );
}
