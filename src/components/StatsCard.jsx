import React from 'react';

export default function StatsCard({ stats, onSelectFilter }) {
  const { totalRecords = 0, uniqueSerials = 0, duplicateEntries = 0 } = stats || {};

  return (
    <section className="app-card">
      <div className="stats-container">
        <div
          className="stat-item"
          onClick={() => onSelectFilter('all')}
          title="Click to view all records"
        >
          <div className="stat-item-label">Records</div>
          <div className="stat-item-value">{totalRecords}</div>
        </div>

        <div
          className="stat-item"
          onClick={() => onSelectFilter('unique')}
          title="Click to view unique serials"
        >
          <div className="stat-item-label">Unique serials</div>
          <div className="stat-item-value">{uniqueSerials}</div>
        </div>

        <div
          className={`stat-item ${duplicateEntries > 0 ? 'stat-duplicate-box' : ''}`}
          onClick={() => onSelectFilter('duplicate')}
          title="Click to view duplicate entries"
        >
          <div className="stat-item-label">Duplicate entries</div>
          <div className="stat-item-value">{duplicateEntries}</div>
        </div>
      </div>
    </section>
  );
}
