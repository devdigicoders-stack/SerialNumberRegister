import React, { useState, useMemo } from 'react';

export default function ScansReviewModal({
  isOpen,
  onClose,
  patientName,
  crNumber,
  barcodes = [],
  frequencyMap = {},
  records = [],
  onRemoveScan,
  onSaveAll
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'correct' | 'duplicate'

  const analyzedScans = useMemo(() => {
    // Count occurrences inside the current batch
    const batchCounts = {};
    barcodes.forEach((b) => {
      const code = (b || '').trim();
      if (code) {
        batchCounts[code] = (batchCounts[code] || 0) + 1;
      }
    });

    return barcodes
      .map((rawCode, originalIndex) => {
        const code = (rawCode || '').trim();
        if (!code) return null;

        const dbCount = frequencyMap[code] || 0;
        const currentBatchCount = batchCounts[code] || 0;
        const isDuplicate = dbCount > 0 || currentBatchCount > 1;

        // Find past records with this barcode
        const pastEntries = records.filter(
          (r) => (r.barcode || '').trim().toLowerCase() === code.toLowerCase()
        );

        return {
          originalIndex,
          code,
          dbCount,
          currentBatchCount,
          isDuplicate,
          pastEntries
        };
      })
      .filter(Boolean);
  }, [barcodes, frequencyMap, records]);

  const totalCount = analyzedScans.length;
  const duplicateCount = analyzedScans.filter((s) => s.isDuplicate).length;
  const correctCount = analyzedScans.filter((s) => !s.isDuplicate).length;

  const filteredScans = useMemo(() => {
    if (filter === 'correct') return analyzedScans.filter((s) => !s.isDuplicate);
    if (filter === 'duplicate') return analyzedScans.filter((s) => s.isDuplicate);
    return analyzedScans;
  }, [analyzedScans, filter]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target.className === 'modal-overlay' && onClose()}
    >
      <div className="modal-dialog modal-lg scans-review-dialog">
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h3>
              <i className="fa-solid fa-list-check" style={{ color: '#0284c7' }}></i>
              Scans Review & Details
            </h3>
            <div className="scans-review-meta">
              <span>Patient: <b>{patientName || 'Unnamed'}</b></span>
              {crNumber && <span> &bull; CR: <b>{crNumber}</b></span>}
            </div>
          </div>
          <button className="btn-close-modal" onClick={onClose} title="Close">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '16px 20px' }}>
          {/* Quick Metrics Bar */}
          <div className="scans-metrics-grid">
            <div
              className={`metric-chip metric-total ${filter === 'all' ? 'selected' : ''}`}
              onClick={() => setFilter('all')}
            >
              <span className="metric-chip-label">Total Scans</span>
              <span className="metric-chip-val">{totalCount}</span>
            </div>
            <div
              className={`metric-chip metric-correct ${filter === 'correct' ? 'selected' : ''}`}
              onClick={() => setFilter('correct')}
            >
              <span className="metric-chip-label">
                <i className="fa-solid fa-check"></i> Correct
              </span>
              <span className="metric-chip-val">{correctCount}</span>
            </div>
            <div
              className={`metric-chip metric-dup ${filter === 'duplicate' ? 'selected' : ''}`}
              onClick={() => setFilter('duplicate')}
            >
              <span className="metric-chip-label">
                <i className="fa-solid fa-triangle-exclamation"></i> Duplicates
              </span>
              <span className="metric-chip-val">{duplicateCount}</span>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="review-tabs-bar">
            <button
              type="button"
              className={`review-tab-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Scans ({totalCount})
            </button>
            <button
              type="button"
              className={`review-tab-btn tab-correct ${filter === 'correct' ? 'active' : ''}`}
              onClick={() => setFilter('correct')}
            >
              ✓ Correct ({correctCount})
            </button>
            <button
              type="button"
              className={`review-tab-btn tab-dup ${filter === 'duplicate' ? 'active' : ''}`}
              onClick={() => setFilter('duplicate')}
            >
              ⚠️ Duplicates ({duplicateCount})
            </button>
          </div>

          {/* Scans List Container */}
          <div className="review-scans-list">
            {filteredScans.length === 0 ? (
              <div className="empty-review-box">
                <i className="fa-solid fa-folder-open"></i>
                <p>
                  {filter === 'duplicate'
                    ? 'No duplicate scans in this list! All are correct.'
                    : filter === 'correct'
                    ? 'No unique scans found in this filter.'
                    : 'No barcodes scanned yet.'}
                </p>
              </div>
            ) : (
              filteredScans.map((item, index) => (
                <div
                  key={item.originalIndex}
                  className={`review-scan-card ${item.isDuplicate ? 'is-dup-card' : 'is-correct-card'}`}
                >
                  <div className="review-card-left">
                    <div className="review-card-header">
                      <span className="scan-number-pill">#{index + 1}</span>
                      <code className="scan-barcode-code">{item.code}</code>
                      {item.isDuplicate ? (
                        <span className="review-badge badge-duplicate">
                          <i className="fa-solid fa-triangle-exclamation"></i> Duplicate{' '}
                          {item.dbCount > 0 ? `(${item.dbCount}x in DB)` : '(in current scan)'}
                        </span>
                      ) : (
                        <span className="review-badge badge-correct">
                          <i className="fa-solid fa-check"></i> Correct (New)
                        </span>
                      )}
                    </div>

                    {/* Duplicate History / Past Info */}
                    {item.isDuplicate && item.pastEntries.length > 0 && (
                      <div className="dup-history-box">
                        <span className="dup-history-title">
                          <i className="fa-solid fa-history"></i> Previous Record:
                        </span>
                        {item.pastEntries.slice(0, 2).map((past, pIdx) => (
                          <span key={past.id || pIdx} className="dup-past-tag">
                            <b>{past.name}</b> {past.crNumber ? `(CR: ${past.crNumber})` : ''} &bull;{' '}
                            {new Date(past.timestamp).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn-review-remove"
                    onClick={() => onRemoveScan(item.originalIndex)}
                    title="Remove this scan"
                  >
                    <i className="fa-solid fa-trash-can"></i> Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            {totalCount} barcode{totalCount !== 1 ? 's' : ''} ready &bull;{' '}
            <b style={{ color: '#16a34a' }}>{correctCount} Correct</b>,{' '}
            <b style={{ color: duplicateCount > 0 ? '#d97706' : '#64748b' }}>
              {duplicateCount} Duplicates
            </b>
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn-secondary-gray" onClick={onClose}>
              Close
            </button>
            {onSaveAll && totalCount > 0 && (
              <button
                type="button"
                className="btn-primary-blue"
                onClick={() => {
                  onClose();
                  onSaveAll();
                }}
              >
                <i className="fa-solid fa-floppy-disk"></i> Save ({totalCount}) Scans
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
