import React, { useState, useRef, useEffect, useMemo } from 'react';
import ScansReviewModal from './ScansReviewModal';

export default function EntryForm({
  onAddEntry,
  isSoundEnabled,
  setIsSoundEnabled,
  frequencyMap,
  records = []
}) {
  const [name, setName] = useState('');
  const [crNumber, setCrNumber] = useState('');
  const [barcodes, setBarcodes] = useState(['']);
  const [continuousScan, setContinuousScan] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const barcodeInputRefs = useRef([]);
  const nameInputRef = useRef(null);

  useEffect(() => {
    focusScanner(0);
  }, []);

  const focusScanner = (index = 0) => {
    const target = barcodeInputRefs.current[index];
    if (target) {
      target.focus();
      target.select();
    }
  };

  const handleBarcodeChange = (index, value) => {
    const updated = [...barcodes];
    updated[index] = value;
    setBarcodes(updated);
  };

  const handleAddScanRow = () => {
    const updated = [...barcodes, ''];
    setBarcodes(updated);
    setTimeout(() => {
      focusScanner(updated.length - 1);
    }, 50);
  };

  const handleRemoveScanRow = (index) => {
    if (barcodes.length <= 1) {
      setBarcodes(['']);
      return;
    }
    const updated = barcodes.filter((_, idx) => idx !== index);
    setBarcodes(updated);
  };

  // Compute live duplicate vs correct analysis for current scans
  const { validScansList, totalCount, duplicateCount, correctCount } = useMemo(() => {
    const batchCounts = {};
    barcodes.forEach((b) => {
      const code = (b || '').trim();
      if (code) {
        batchCounts[code] = (batchCounts[code] || 0) + 1;
      }
    });

    const validList = barcodes
      .map((b, idx) => {
        const code = (b || '').trim();
        if (!code) return null;
        const dbCount = frequencyMap[code] || 0;
        const currentBatchCount = batchCounts[code] || 0;
        const isDuplicate = dbCount > 0 || currentBatchCount > 1;
        return { index: idx, code, isDuplicate, dbCount, currentBatchCount };
      })
      .filter(Boolean);

    const dupCount = validList.filter((s) => s.isDuplicate).length;
    const corrCount = validList.filter((s) => !s.isDuplicate).length;

    return {
      validScansList: validList,
      totalCount: validList.length,
      duplicateCount: dupCount,
      correctCount: corrCount
    };
  }, [barcodes, frequencyMap]);

  const getLiveStatus = (code) => {
    const trimmed = (code || '').trim();
    if (!trimmed) return null;

    // Check duplicate in DB or current list
    const currentOccurrences = barcodes.filter((b) => (b || '').trim() === trimmed).length;
    const dbCount = frequencyMap[trimmed] || 0;

    if (dbCount > 0) {
      return {
        isDup: true,
        text: `⚠️ Duplicate (${dbCount}x in DB)`
      };
    }
    if (currentOccurrences > 1) {
      return {
        isDup: true,
        text: `⚠️ Duplicate in list (${currentOccurrences}x)`
      };
    }
    return {
      isDup: false,
      text: '✓ Correct'
    };
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanName = name.trim();
    const cleanCrNumber = crNumber.trim();
    const validBarcodes = barcodes.map((b) => b.trim()).filter(Boolean);

    if (!cleanName || validBarcodes.length === 0) return;

    onAddEntry(cleanName, validBarcodes, cleanCrNumber);
    setBarcodes(['']);

    if (!continuousScan) {
      setName('');
      setCrNumber('');
      if (nameInputRef.current) nameInputRef.current.focus();
    } else {
      setTimeout(() => focusScanner(0), 50);
    }
  };

  const handleClear = () => {
    setBarcodes(['']);
    focusScanner(0);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  return (
    <>
      <section className="app-card">
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
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
              <label htmlFor="entryCrNumber">CR Number</label>
            </div>
            <input
              type="text"
              id="entryCrNumber"
              className="input-box"
              value={crNumber}
              onChange={(e) => setCrNumber(e.target.value)}
              placeholder="Enter CR number"
              autoComplete="off"
            />
          </div>

          {/* Multiple Barcode Scans */}
          <div className="form-field">
            <div className="field-label">
              <label htmlFor="entryBarcode_0">
                Scan Barcode / Serial Numbers
              </label>

              {totalCount > 0 && (
                <button
                  type="button"
                  className="btn-open-review-badge"
                  onClick={() => setIsReviewModalOpen(true)}
                  title="Click to view detailed scans list"
                >
                  <i className="fa-solid fa-list-check"></i> View Scans List ({totalCount})
                </button>
              )}
            </div>

            {/* Scans Quick Analysis Bar (Clickable) */}
            {totalCount > 0 && (
              <div
                className="scans-summary-strip"
                onClick={() => setIsReviewModalOpen(true)}
                title="Click to see details of duplicate and correct scans"
              >
                <div className="strip-stats-group">
                  <span className="strip-pill pill-total">
                    Total: <b>{totalCount}</b>
                  </span>
                  <span className="strip-pill pill-correct">
                    <i className="fa-solid fa-circle-check"></i> Correct: <b>{correctCount}</b>
                  </span>
                  <span
                    className={`strip-pill ${
                      duplicateCount > 0 ? 'pill-dup' : 'pill-no-dup'
                    }`}
                  >
                    <i className="fa-solid fa-triangle-exclamation"></i> Duplicates: <b>{duplicateCount}</b>
                  </span>
                </div>
                <span className="strip-hint-text">
                  <i className="fa-solid fa-arrow-up-right-from-square"></i> Open List
                </span>
              </div>
            )}

            <div className="barcode-inputs-container">
              {barcodes.map((code, idx) => {
                const liveStatus = getLiveStatus(code);
                return (
                  <div key={idx} className="barcode-input-row">
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input
                        ref={(el) => (barcodeInputRefs.current[idx] = el)}
                        type="text"
                        id={`entryBarcode_${idx}`}
                        className="input-box barcode-input"
                        value={code}
                        onChange={(e) => handleBarcodeChange(idx, e.target.value)}
                        placeholder={
                          barcodes.length > 1
                            ? `Scan barcode #${idx + 1}...`
                            : 'Scan here...'
                        }
                        required={idx === 0 && barcodes.length === 1}
                        autoComplete="off"
                      />
                      {liveStatus && (
                        <span
                          className={`live-dup-badge ${
                            liveStatus.isDup ? 'is-dup' : 'is-new'
                          }`}
                          onClick={() => setIsReviewModalOpen(true)}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            cursor: 'pointer'
                          }}
                          title="Click to review"
                        >
                          {liveStatus.text}
                        </span>
                      )}
                    </div>

                    {barcodes.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove-scan"
                        onClick={() => handleRemoveScanRow(idx)}
                        title="Remove this scan"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className="btn-add-more-scans"
              onClick={handleAddScanRow}
            >
              <i className="fa-solid fa-plus"></i> Add More Scans
            </button>
          </div>

          <div className="form-actions-row">
            <button type="submit" className="btn-primary-blue">
              <i className="fa-solid fa-floppy-disk"></i>{' '}
              {totalCount > 1 ? `Save (${totalCount}) Scans` : 'Add Serial Number'}
            </button>
            <button
              type="button"
              className="btn-secondary-gray"
              onClick={() => focusScanner(barcodes.length - 1)}
            >
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
              <span>Keep name & CR number for next scan</span>
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
            Ek patient ke multiple barcodes scan karne ke liye <b>"Add More Scans"</b> button use karein. Duplicates aur Correct scans ki list dekhne ke liye status bar par click karein.
          </p>
        </form>
      </section>

      {/* Scans Review Details Modal */}
      <ScansReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        patientName={name}
        crNumber={crNumber}
        barcodes={barcodes}
        frequencyMap={frequencyMap}
        records={records}
        onRemoveScan={(idx) => handleRemoveScanRow(idx)}
        onSaveAll={() => handleSubmit()}
      />
    </>
  );
}
