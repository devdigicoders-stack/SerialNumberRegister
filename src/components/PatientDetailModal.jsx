import React, { useState, useMemo } from 'react';

export default function PatientDetailModal({
  record,
  allRecords = [],
  onClose,
  onEdit,
  onDelete
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'unique' | 'duplicate'

  const barcodeDetails = useMemo(() => {
    if (!record) return [];

    const barcodeList = Array.isArray(record.barcodes) && record.barcodes.length > 0
      ? record.barcodes
      : [record.barcode || ''];

    // Map each barcode with past records
    return barcodeList.map((rawCode, index) => {
      const code = (rawCode || '').trim();
      
      // Find all records across the system containing this barcode
      const matchingRecords = allRecords.filter((r) => {
        const list = Array.isArray(r.barcodes) && r.barcodes.length > 0
          ? r.barcodes
          : [r.barcode || ''];
        return list.some((b) => (b || '').trim().toLowerCase() === code.toLowerCase());
      });

      // Count occurrences
      let totalOccurrences = 0;
      allRecords.forEach((r) => {
        const list = Array.isArray(r.barcodes) && r.barcodes.length > 0
          ? r.barcodes
          : [r.barcode || ''];
        list.forEach((b) => {
          if ((b || '').trim().toLowerCase() === code.toLowerCase()) {
            totalOccurrences++;
          }
        });
      });

      const isDuplicate = totalOccurrences > 1;

      return {
        index,
        code,
        totalOccurrences,
        isDuplicate,
        matchingRecords
      };
    });
  }, [record, allRecords]);

  const totalScans = barcodeDetails.length;
  const duplicateScans = barcodeDetails.filter((b) => b.isDuplicate).length;
  const uniqueScans = barcodeDetails.filter((b) => !b.isDuplicate).length;

  const filteredDetails = useMemo(() => {
    if (filter === 'unique') return barcodeDetails.filter((b) => !b.isDuplicate);
    if (filter === 'duplicate') return barcodeDetails.filter((b) => b.isDuplicate);
    return barcodeDetails;
  }, [barcodeDetails, filter]);

  if (!record) return null;

  const formatDateTime = (isoString) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  // Print single patient slip
  const handlePrintPatientSlip = () => {
    const rowsHtml = barcodeDetails
      .map(
        (b, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0; ${b.isDuplicate ? 'background-color:#fffbeb;' : ''}">
          <td style="padding: 8px 12px; text-align: center; font-weight:bold;">${idx + 1}</td>
          <td style="padding: 8px 12px; font-family: monospace; font-size: 14px; font-weight: bold;">${b.code}</td>
          <td style="padding: 8px 12px; text-align: center;">
            <span style="display:inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: bold; background:${
              b.isDuplicate ? '#fef3c7; color:#b45309;' : '#dcfce7; color:#15803d;'
            }">${b.isDuplicate ? `Duplicate (${b.totalOccurrences}x)` : 'Unique'}</span>
          </td>
        </tr>
      `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Patient Scan Report - ${record.name}</title>
        <style>
          * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
          body { padding: 24px; color: #1e293b; background: #fff; margin: 0; }
          .header { border-bottom: 2px solid #16325c; padding-bottom: 12px; margin-bottom: 16px; }
          .title { font-size: 20px; font-weight: 800; color: #16325c; margin: 0 0 6px 0; }
          .meta-row { display: flex; justify-content: space-between; font-size: 13px; color: #475569; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 14px; }
          th { background: #f1f5f9; color: #334155; text-align: left; padding: 9px 12px; font-size: 12px; border-bottom: 2px solid #cbd5e1; }
          .footer { margin-top: 24px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">Patient Scans Summary</h1>
          <div class="meta-row">
            <div>Patient Name: <b>${record.name}</b> ${record.crNumber ? `| CR Number: <b>${record.crNumber}</b>` : ''}</div>
            <div>Date & Time: <b>${formatDateTime(record.timestamp)}</b></div>
          </div>
          <div class="meta-row" style="margin-top: 6px;">
            <div>Total Scans: <b>${totalScans}</b> &bull; <span style="color:#15803d;">Unique: <b>${uniqueScans}</b></span> &bull; <span style="color:#b45309;">Duplicates: <b>${duplicateScans}</b></span></div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">#</th>
              <th>Scanned Barcode / Serial</th>
              <th style="width: 140px; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          Generated from Name–Serial Number Register &bull; ${new Date().toLocaleString()}
        </div>
      </body>
      </html>
    `;

    let iframe = document.getElementById('print_frame');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print_frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
      iframe.contentWindow.print();
    }, 150);
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target.className === 'modal-overlay' && onClose()}
    >
      <div className="modal-dialog scans-review-dialog" style={{ maxWidth: '640px' }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0 }}>{record.name}</h3>
              {record.crNumber && (
                <span className="cr-number-badge" title="CR Number">
                  <i className="fa-solid fa-hashtag"></i> {record.crNumber}
                </span>
              )}
            </div>
            <div className="scans-review-meta" style={{ marginTop: '4px' }}>
              <i className="fa-regular fa-clock"></i> {formatDateTime(record.timestamp)}
            </div>
          </div>
          <button className="btn-close-modal" onClick={onClose} title="Close">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '16px 20px', maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Quick Stats Grid */}
          <div className="scans-metrics-grid">
            <div
              className={`metric-chip metric-total ${filter === 'all' ? 'selected' : ''}`}
              onClick={() => setFilter('all')}
            >
              <span className="metric-chip-label">Total Scans</span>
              <span className="metric-chip-val">{totalScans}</span>
            </div>
            <div
              className={`metric-chip metric-correct ${filter === 'unique' ? 'selected' : ''}`}
              onClick={() => setFilter('unique')}
            >
              <span className="metric-chip-label">
                <i className="fa-solid fa-check"></i> Unique
              </span>
              <span className="metric-chip-val">{uniqueScans}</span>
            </div>
            <div
              className={`metric-chip metric-dup ${filter === 'duplicate' ? 'selected' : ''}`}
              onClick={() => setFilter('duplicate')}
            >
              <span className="metric-chip-label">
                <i className="fa-solid fa-triangle-exclamation"></i> Duplicates
              </span>
              <span className="metric-chip-val">{duplicateScans}</span>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="review-tabs-bar">
            <button
              type="button"
              className={`review-tab-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Scans ({totalScans})
            </button>
            <button
              type="button"
              className={`review-tab-btn tab-correct ${filter === 'unique' ? 'active' : ''}`}
              onClick={() => setFilter('unique')}
            >
              ✓ Unique ({uniqueScans})
            </button>
            <button
              type="button"
              className={`review-tab-btn tab-dup ${filter === 'duplicate' ? 'active' : ''}`}
              onClick={() => setFilter('duplicate')}
            >
              ⚠️ Duplicates ({duplicateScans})
            </button>
          </div>

          {/* Scanned Barcodes List */}
          <div className="review-scans-list" style={{ maxHeight: '340px' }}>
            {filteredDetails.length === 0 ? (
              <div className="empty-review-box">
                <i className="fa-solid fa-inbox"></i>
                <p>No barcodes matching this filter.</p>
              </div>
            ) : (
              filteredDetails.map((item, idx) => (
                <div
                  key={idx}
                  className={`review-scan-card ${item.isDuplicate ? 'is-dup-card' : 'is-correct-card'}`}
                >
                  <div className="review-card-left">
                    <div className="review-card-header">
                      <span className="scan-number-pill">#{item.index + 1}</span>
                      <code className="scan-barcode-code">{item.code}</code>
                      {item.isDuplicate ? (
                        <span className="review-badge badge-duplicate">
                          <i className="fa-solid fa-triangle-exclamation"></i> Duplicate ({item.totalOccurrences}x in system)
                        </span>
                      ) : (
                        <span className="review-badge badge-correct">
                          <i className="fa-solid fa-check"></i> Unique
                        </span>
                      )}
                    </div>

                    {/* Matching occurrences details */}
                    {item.isDuplicate && item.matchingRecords.length > 0 && (
                      <div className="dup-history-box">
                        <span className="dup-history-title">
                          <i className="fa-solid fa-clock-rotate-left"></i> Found in Records:
                        </span>
                        {item.matchingRecords.slice(0, 3).map((match, mIdx) => (
                          <span key={match.id || mIdx} className="dup-past-tag">
                            <b>{match.name}</b> {match.crNumber ? `(CR: ${match.crNumber})` : ''} &bull;{' '}
                            {new Date(match.timestamp).toLocaleDateString(undefined, {
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
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="btn-action-tool"
            onClick={handlePrintPatientSlip}
            title="Print Patient Slip"
          >
            <i className="fa-solid fa-print"></i> Print Slip
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn-secondary-gray"
              onClick={() => {
                onClose();
                onEdit(record);
              }}
            >
              <i className="fa-solid fa-pen"></i> Edit Entry
            </button>
            <button type="button" className="btn-primary-blue" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
