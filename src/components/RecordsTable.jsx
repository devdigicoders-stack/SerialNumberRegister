import React, { useState, useMemo } from 'react';

export default function RecordsTable({
  records,
  stats,
  isLoading,
  currentFilter,
  setFilter,
  onEdit,
  onDelete,
  showToast
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState(null);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (currentFilter === 'unique' && r.isDuplicate) return false;
      if (currentFilter === 'duplicate' && !r.isDuplicate) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (r.name || '').toLowerCase().includes(q);
        const matchCrNumber = (r.crNumber || '').toLowerCase().includes(q);
        const barcodeList = Array.isArray(r.barcodes) && r.barcodes.length > 0
          ? r.barcodes
          : [r.barcode || ''];
        const matchBarcode = barcodeList.some((b) => (b || '').toLowerCase().includes(q));

        if (!matchName && !matchCrNumber && !matchBarcode) return false;
      }

      return true;
    });
  }, [records, currentFilter, searchQuery]);

  // Export ONLY the currently active tab / filtered data
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      showToast(`No ${currentFilter} records to export!`, 'warning');
      return;
    }

    const tabName =
      currentFilter === 'duplicate'
        ? 'Duplicates'
        : currentFilter === 'unique'
        ? 'Unique'
        : 'All_Records';

    let csv = 'S.No,Patient Name,CR Number,Total Scans,Unique Scans,Duplicate Scans,Status,Barcodes,Date Time\n';
    filteredRecords.forEach((r, idx) => {
      const barcodeList = Array.isArray(r.barcodes) && r.barcodes.length > 0 ? r.barcodes : [r.barcode || ''];
      const total = r.totalScans || barcodeList.length;
      const unique = r.uniqueCount !== undefined ? r.uniqueCount : (r.isDuplicate ? 0 : total);
      const duplicate = r.duplicateCount !== undefined ? r.duplicateCount : (r.isDuplicate ? total : 0);
      const status = r.isDuplicate ? 'Has Duplicates' : 'All Unique';
      const barcodesStr = barcodeList.join(' | ');
      const dateFormatted = new Date(r.timestamp).toLocaleString();

      csv += `"${idx + 1}","${escapeCsv(r.name)}","${escapeCsv(r.crNumber || '')}","${total}","${unique}","${duplicate}","${status}","${escapeCsv(barcodesStr)}","${dateFormatted}"\n`;
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `barcode_${tabName.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`✓ Exported ${filteredRecords.length} records (${tabName})!`, 'success');
  };

  // Print Report
  const handlePrint = () => {
    if (filteredRecords.length === 0) {
      showToast('No records to print in this tab!', 'warning');
      return;
    }

    const tabLabel =
      currentFilter === 'duplicate'
        ? 'Duplicates Only'
        : currentFilter === 'unique'
        ? 'Unique Only'
        : 'All Records';

    const rowsHtml = filteredRecords
      .map((r, idx) => {
        const barcodeList = Array.isArray(r.barcodes) && r.barcodes.length > 0 ? r.barcodes : [r.barcode || ''];
        const total = r.totalScans || barcodeList.length;
        const unique = r.uniqueCount !== undefined ? r.uniqueCount : (r.isDuplicate ? 0 : total);
        const duplicate = r.duplicateCount !== undefined ? r.duplicateCount : (r.isDuplicate ? total : 0);
        const barcodesDisplay = (r.barcodeDetails || barcodeList.map((b) => ({ code: b, isDuplicate: r.isDuplicate })))
          .map(
            (b) =>
              `<span style="display:inline-block; font-family:monospace; font-size:12px; padding:2px 6px; margin:2px; border-radius:4px; background:${
                b.isDuplicate ? '#fef3c7; color:#b45309;' : '#f1f5f9; color:#1e293b;'
              }">${escapeHtml(b.code || b)}</span>`
          )
          .join(' ');

        return `
        <tr class="${r.isDuplicate ? 'duplicate-row' : ''}">
          <td style="text-align: center;">${idx + 1}</td>
          <td><b>${escapeHtml(r.name)}</b></td>
          <td style="font-weight: 600; color: #0284c7;">${escapeHtml(r.crNumber || '-')}</td>
          <td style="text-align: center; font-weight: bold;">${total}</td>
          <td style="text-align: center;">
            <span style="color:#15803d; font-weight:bold;">${unique} Uniq</span>
            ${duplicate > 0 ? `<br/><span style="color:#b45309; font-weight:bold;">${duplicate} Dup</span>` : ''}
          </td>
          <td>${barcodesDisplay}</td>
          <td style="font-size: 12px;">${formatDateTime(r.timestamp)}</td>
        </tr>
      `;
      })
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Barcode Register Report - ${tabLabel}</title>
        <style>
          * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
          body { padding: 20px; color: #1e293b; background: #fff; margin: 0; }
          .header { border-bottom: 2px solid #16325c; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 20px; font-weight: 800; color: #16325c; margin: 0 0 4px 0; }
          .meta { font-size: 13px; color: #64748b; }
          .report-info { text-align: right; font-size: 12.5px; color: #475569; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #f1f5f9; color: #334155; text-align: left; padding: 10px 12px; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
          td { padding: 9px 12px; font-size: 13px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .duplicate-row { background-color: #fffbeb !important; }
          .footer { margin-top: 20px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px dashed #e2e8f0; padding-top: 10px; }
          @media print {
            @page { margin: 12mm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">Name–Serial Number Register</h1>
            <div class="meta">Report View: <b>${tabLabel}</b> | Total Entries: <b>${filteredRecords.length}</b></div>
          </div>
          <div class="report-info">
            <div><b>Date:</b> ${new Date().toLocaleDateString()}</div>
            <div><b>Time:</b> ${new Date().toLocaleTimeString()}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">#</th>
              <th>Patient Name</th>
              <th>CR Number</th>
              <th style="width: 70px; text-align: center;">Scans</th>
              <th style="width: 100px; text-align: center;">Breakdown</th>
              <th>Scanned Barcodes</th>
              <th style="width: 150px;">Date & Time</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          Printed from Serial Number Register System &bull; ${new Date().toLocaleString()}
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

  const escapeCsv = (str) => {
    if (!str) return '';
    return String(str).replace(/"/g, '""');
  };

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
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <>
      <section className="app-card">
        <div className="toolbar-section">
          {/* Filter Tabs */}
          <div className="tabs-scroll-wrapper">
            <button
              className={`filter-tab ${currentFilter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Records ({stats.totalRecords || 0})
            </button>
            <button
              className={`filter-tab tab-unique-active ${
                currentFilter === 'unique' ? 'active' : ''
              }`}
              onClick={() => setFilter('unique')}
            >
              Unique ({stats.uniqueOnlyCount || 0})
            </button>
            <button
              className={`filter-tab tab-duplicate-active ${
                currentFilter === 'duplicate' ? 'active' : ''
              }`}
              onClick={() => setFilter('duplicate')}
            >
              Duplicates ({stats.duplicateEntries || 0})
            </button>
          </div>

          {/* Search & Actions */}
          <div className="search-and-export">
            <div className="search-field-wrapper">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="text"
                className="search-input"
                placeholder="Search name, CR number, or barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="btn-icon-clear-search"
                  onClick={() => setSearchQuery('')}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>

            <button
              className="btn-action-tool"
              onClick={handleExportCSV}
              title={`Export ${currentFilter} records to CSV`}
            >
              <i className="fa-solid fa-file-csv"></i> CSV
            </button>
            <button
              className="btn-action-tool"
              onClick={handlePrint}
              title={`Print ${currentFilter} records report`}
            >
              <i className="fa-solid fa-print"></i> Print
            </button>
          </div>
        </div>

        {/* Records List */}
        <div className="records-container">
          {isLoading ? (
            <div className="loading-records-box">
              <div className="spinner-loader"></div>
              <p>Loading records...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="empty-records-box">
              <i className="fa-solid fa-inbox"></i>
              <h4>No Records</h4>
              <p>
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : currentFilter === 'duplicate'
                  ? 'No duplicate entries found.'
                  : 'No records to show.'}
              </p>
            </div>
          ) : (
            filteredRecords.map((r, idx) => {
              const barcodeList = Array.isArray(r.barcodes) && r.barcodes.length > 0
                ? r.barcodes
                : [r.barcode || ''];
              const details = r.barcodeDetails || barcodeList.map((code) => ({ code, isDuplicate: r.isDuplicate }));
              const totalScans = r.totalScans || barcodeList.length;
              const uniqueCount = r.uniqueCount !== undefined ? r.uniqueCount : (r.isDuplicate ? 0 : totalScans);
              const duplicateCount = r.duplicateCount !== undefined ? r.duplicateCount : (r.isDuplicate ? totalScans : 0);

              return (
                <div
                  key={r.id || idx}
                  className={`record-row-card ${r.isDuplicate ? 'is-duplicate-row' : ''}`}
                >
                  <div className="record-meta-main" style={{ width: '100%' }}>
                    {/* Header Row: Name, CR Badge, Stats Chips, Time */}
                    <div className="record-top-header-row">
                      <div className="record-title-row">
                        <span className="record-name-title">{r.name}</span>
                        {r.crNumber && (
                          <span className="cr-number-badge" title="CR Number">
                            <i className="fa-solid fa-hashtag"></i> {r.crNumber}
                          </span>
                        )}
                      </div>

                      {/* Scans breakdown tags */}
                      <div className="record-scans-summary-tags">
                        <span className="scans-count-pill" title="Total Scans">
                          <b>{totalScans}</b> {totalScans === 1 ? 'Scan' : 'Scans'}
                        </span>
                        <span className="status-tag tag-unique" title="Unique / Correct Scans">
                          <i className="fa-solid fa-check"></i> {uniqueCount} Unique
                        </span>
                        {duplicateCount > 0 && (
                          <span className="status-tag tag-duplicate" title="Duplicate Scans">
                            <i className="fa-solid fa-triangle-exclamation"></i> {duplicateCount} Dup
                          </span>
                        )}
                        <span className="record-time-text">
                          <i className="fa-regular fa-clock"></i> {formatDateTime(r.timestamp)}
                        </span>
                      </div>
                    </div>

                    {/* Barcodes List Pills inside the single card */}
                    <div className="record-barcodes-wrap-grid">
                      {details.map((bItem, bIdx) => (
                        <span
                          key={bIdx}
                          className={`barcode-badge-pill ${
                            bItem.isDuplicate ? 'pill-is-dup' : 'pill-is-unique'
                          }`}
                          title={
                            bItem.isDuplicate
                              ? `⚠️ Duplicate barcode (${bItem.count || 2}x in database)`
                              : '✓ Unique barcode'
                          }
                        >
                          <i className="fa-solid fa-barcode"></i> {bItem.code}
                          {bItem.isDuplicate && (
                            <span className="pill-dup-dot" title="Duplicate">
                              ⚠️
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="record-actions-group">
                    <button
                      className="btn-record-action btn-edit"
                      onClick={() => onEdit(r)}
                      title="Edit this patient record"
                    >
                      <i className="fa-solid fa-pen"></i>
                    </button>
                    <button
                      className="btn-record-action btn-del"
                      onClick={() => onDelete(r)}
                      title="Delete this patient record"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </>
  );
}

