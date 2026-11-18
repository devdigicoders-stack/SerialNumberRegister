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

    if (Array.isArray(record.barcodeDetails) && record.barcodeDetails.length > 0) {
      return record.barcodeDetails.map((b, index) => {
        const code = (b.code || '').trim();
        const matchingRecords = allRecords.filter((r) => {
          const list = Array.isArray(r.barcodes) && r.barcodes.length > 0 ? r.barcodes : [r.barcode || ''];
          return list.some((item) => (item || '').trim().toLowerCase() === code.toLowerCase());
        });

        return {
          index,
          code,
          totalOccurrences: b.count || 1,
          occurrence: b.occurrence,
          isDuplicate: b.isDuplicate,
          matchingRecords
        };
      });
    }

    const barcodeList = Array.isArray(record.barcodes) && record.barcodes.length > 0
      ? record.barcodes
      : [record.barcode || ''];

    // Map each barcode with past records
    const seen = {};
    return barcodeList.map((rawCode, index) => {
      const code = (rawCode || '').trim();
      seen[code] = (seen[code] || 0) + 1;
      
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

      const isDuplicate = seen[code] > 1 || (totalOccurrences > seen[code]);

      return {
        index,
        code,
        totalOccurrences: totalOccurrences || 1,
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

  const escapeHtml = (text) => {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

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
    const scansToPrint = filter === 'all' ? barcodeDetails : filteredDetails;
    const tabNote =
      filter === 'duplicate'
        ? ' &bull; <span style="color:#b45309; font-weight:bold;">(Duplicates Only)</span>'
        : filter === 'unique'
        ? ' &bull; <span style="color:#15803d; font-weight:bold;">(Unique Only)</span>'
        : '';

    const rowsHtml = scansToPrint
      .map((b, idx) => {
        let dupDetailsHtml = '';
        if (b.isDuplicate && b.matchingRecords && b.matchingRecords.length > 0) {
          const matchesList = b.matchingRecords
            .map((match) => {
              const mName = escapeHtml(match.name || 'Unnamed');
              const mCr = match.crNumber ? `(CR: ${escapeHtml(match.crNumber)})` : '';
              const mTime = formatDateTime(match.timestamp);
              const isCurrent =
                (match.id && record.id && match.id === record.id) ||
                (match.crNumber && record.crNumber && match.crNumber === record.crNumber);

              const list = Array.isArray(match.barcodes) && match.barcodes.length > 0 ? match.barcodes : [match.barcode || ''];
              const occInMatch = list.filter((item) => (item || '').trim().toLowerCase() === b.code.toLowerCase()).length;
              const occTag = occInMatch > 1 ? ` &bull; <b>${occInMatch} scans</b>` : '';

              return `
                <div style="margin-top: 3px; font-size: 11px; color: #334155; line-height: 1.4;">
                  &bull; <b>${mName}</b> ${mCr ? `<span style="color:#0284c7;">${mCr}</span>` : ''} &bull; <span>${mTime}</span>${occTag}${
                    isCurrent ? ' <span style="background:#fee2e2; color:#991b1b; padding:1px 5px; border-radius:3px; font-size:10px; font-weight:bold;">Current Record</span>' : ''
                  }
                </div>
              `;
            })
            .join('');

          dupDetailsHtml = `
            <div style="margin-top: 6px; padding: 6px 10px; background: #fffbeb; border: 1px solid #fef08a; border-left: 3px solid #d97706; border-radius: 4px;">
              <div style="font-size: 11px; font-weight: bold; color: #92400e; margin-bottom: 2px;">
                ⚠️ Found in Records (${b.totalOccurrences}x in system):
              </div>
              ${matchesList}
            </div>
          `;
        }

        return `
        <tr style="border-bottom: 1px solid #e2e8f0; ${b.isDuplicate ? 'background-color:#fffdf5;' : ''}">
          <td style="padding: 10px 12px; text-align: center; font-weight: bold; vertical-align: top;">${b.index !== undefined ? b.index + 1 : idx + 1}</td>
          <td style="padding: 10px 12px; vertical-align: top;">
            <div style="font-family: monospace; font-size: 13.5px; font-weight: bold; color: #0f172a; word-break: break-all;">
              ${escapeHtml(b.code)}
            </div>
            ${dupDetailsHtml}
          </td>
          <td style="padding: 10px 12px; text-align: center; vertical-align: top;">
            <span style="display:inline-block; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; background:${
              b.isDuplicate ? '#fef3c7; color:#b45309; border: 1px solid #fde68a;' : '#dcfce7; color:#15803d; border: 1px solid #bbf7d0;'
            }">${b.isDuplicate ? `Duplicate (${b.totalOccurrences}x)` : 'Unique'}</span>
          </td>
        </tr>
      `;
      })
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Patient Scan Report - ${escapeHtml(record.name)}</title>
        <style>
          * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
          body { padding: 24px; color: #1e293b; background: #fff; margin: 0; }
          .header { border-bottom: 2px solid #16325c; padding-bottom: 12px; margin-bottom: 16px; }
          .title { font-size: 20px; font-weight: 800; color: #16325c; margin: 0 0 6px 0; }
          .meta-row { display: flex; justify-content: space-between; font-size: 13px; color: #475569; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 14px; }
          th { background: #f1f5f9; color: #334155; text-align: left; padding: 9px 12px; font-size: 12px; border-bottom: 2px solid #cbd5e1; }
          .footer { margin-top: 24px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 10px; }
          @media print {
            body { padding: 12px; }
            tr { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">Patient Scans Summary</h1>
          <div class="meta-row">
            <div>Patient Name: <b>${escapeHtml(record.name)}</b> ${record.crNumber ? `| CR Number: <b>${escapeHtml(record.crNumber)}</b>` : ''}</div>
            <div>Date & Time: <b>${formatDateTime(record.timestamp)}</b></div>
          </div>
          <div class="meta-row" style="margin-top: 6px;">
            <div>Total Scans: <b>${totalScans}</b> &bull; <span style="color:#15803d;">Unique: <b>${uniqueScans}</b></span> &bull; <span style="color:#b45309;">Duplicates: <b>${duplicateScans}</b></span>${tabNote}</div>
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
