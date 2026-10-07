import React, { useState, useMemo } from 'react';

export default function RecordsTable({
  records,
  stats,
  currentFilter,
  setFilter,
  onEdit,
  onDelete,
  onClearAll,
  showToast
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (currentFilter === 'unique' && r.isDuplicate) return false;
      if (currentFilter === 'duplicate' && !r.isDuplicate) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (r.name || '').toLowerCase().includes(q);
        const matchBarcode = (r.barcode || '').toLowerCase().includes(q);
        if (!matchName && !matchBarcode) return false;
      }

      return true;
    });
  }, [records, currentFilter, searchQuery]);

  const handleExportCSV = () => {
    if (records.length === 0) {
      showToast('No records to export!', 'warning');
      return;
    }

    let csv = 'S.No,Name,Barcode,Status,Total Occurrences,Date Time\n';
    records.forEach((r, idx) => {
      const status = r.isDuplicate ? 'Duplicate' : 'Unique';
      const count = r.count || 1;
      const dateFormatted = new Date(r.timestamp).toLocaleString();
      csv += `"${idx + 1}","${escapeCsv(r.name)}","${escapeCsv(r.barcode)}","${status}","${count}","${dateFormatted}"\n`;
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `barcode_records_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV export downloaded!', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const escapeCsv = (str) => {
    if (!str) return '';
    return String(str).replace(/"/g, '""');
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
            className={`filter-tab tab-unique-active ${currentFilter === 'unique' ? 'active' : ''}`}
            onClick={() => setFilter('unique')}
          >
            Unique ({stats.uniqueOnlyCount || 0})
          </button>
          <button
            className={`filter-tab tab-duplicate-active ${currentFilter === 'duplicate' ? 'active' : ''}`}
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
              placeholder="Search name or barcode..."
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

          <button className="btn-action-tool" onClick={handleExportCSV} title="Export CSV">
            <i className="fa-solid fa-file-csv"></i> CSV
          </button>
          <button className="btn-action-tool" onClick={handlePrint} title="Print Report">
            <i className="fa-solid fa-print"></i> Print
          </button>
        </div>
      </div>

      {/* Records List */}
      <div className="records-container">
        {filteredRecords.length === 0 ? (
          <div className="empty-records-box">
            <i className="fa-solid fa-inbox"></i>
            <h4>No Records</h4>
            <p>
              {searchQuery
                ? `No results for "${searchQuery}"`
                : currentFilter === 'duplicate'
                ? 'No duplicates found.'
                : 'No records to show.'}
            </p>
          </div>
        ) : (
          filteredRecords.map((r, idx) => (
            <div
              key={r.id || idx}
              className={`record-row-card ${r.isDuplicate ? 'is-duplicate-row' : ''}`}
            >
              <div className="record-meta-main">
                <div className="record-name-title">{r.name}</div>
                <div className="record-barcode-wrap">
                  <span className="barcode-badge-pill">
                    <i className="fa-solid fa-barcode"></i> {r.barcode}
                  </span>
                  {r.isDuplicate ? (
                    <span className="status-tag tag-duplicate">
                      Duplicate ({r.count || 2}x)
                    </span>
                  ) : (
                    <span className="status-tag tag-unique">Unique</span>
                  )}
                  <span className="record-time-text">
                    <i className="fa-regular fa-clock"></i> {formatDateTime(r.timestamp)}
                  </span>
                </div>
              </div>

              <div className="record-actions-group">
                <button
                  className="btn-record-action btn-edit"
                  onClick={() => onEdit(r)}
                  title="Edit"
                >
                  <i className="fa-solid fa-pen"></i>
                </button>
                <button
                  className="btn-record-action btn-del"
                  onClick={() => onDelete(r)}
                  title="Delete"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
