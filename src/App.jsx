import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Login from './components/Login';
import EntryForm from './components/EntryForm';
import StatsCard from './components/StatsCard';
import RecordsTable from './components/RecordsTable';
import EditModal from './components/EditModal';
import DeleteModal from './components/DeleteModal';
import ToastContainer from './components/Toast';
import { playAudioFeedback } from './utils/audio';

const STORAGE_KEYS = {
  USER: 'numreg_react_user',
  LOCAL_RECORDS: 'numreg_local_records'
};

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    return saved ? JSON.parse(saved) : null;
  });

  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRecords: 0,
    uniqueSerials: 0,
    duplicateEntries: 0,
    uniqueOnlyCount: 0
  });
  const [frequencyMap, setFrequencyMap] = useState({});
  const [currentFilter, setCurrentFilter] = useState('all');
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Modals
  const [editingRecord, setEditingRecord] = useState(null);
  const [deletingRecord, setDeletingRecord] = useState(null);

  // Toast Helper
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  // Fetch records from backend
  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/records`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
        setStats(data.stats || {});
        setFrequencyMap(data.frequencyMap || {});
        localStorage.setItem(STORAGE_KEYS.LOCAL_RECORDS, JSON.stringify(data.records));
      }
    } catch (err) {
      console.warn('Backend unavailable, using cached records:', err);
      const cached = localStorage.getItem(STORAGE_KEYS.LOCAL_RECORDS);
      if (cached) {
        try {
          const recs = JSON.parse(cached);
          computeAndSetLocal(recs);
        } catch (e) {}
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const computeAndSetLocal = (recs) => {
    const map = {};
    recs.forEach((r) => {
      const list = Array.isArray(r.barcodes) && r.barcodes.length > 0 
        ? r.barcodes 
        : (r.barcode ? [r.barcode] : []);
      list.forEach((code) => {
        const c = (code || '').trim();
        if (c) map[c] = (map[c] || 0) + 1;
      });
    });

    let duplicateEntries = 0;
    let uniqueOnlyCount = 0;

    const enriched = recs.map((r) => {
      const list = Array.isArray(r.barcodes) && r.barcodes.length > 0 
        ? r.barcodes 
        : (r.barcode ? [r.barcode] : []);

      let dupCount = 0;
      let uniqCount = 0;
      const details = list.map((code) => {
        const c = (code || '').trim();
        const cnt = map[c] || 1;
        if (cnt > 1) dupCount++;
        else uniqCount++;
        return { code: c, count: cnt, isDuplicate: cnt > 1 };
      });

      const isDup = dupCount > 0;
      if (isDup) duplicateEntries++;
      else uniqueOnlyCount++;

      return {
        ...r,
        barcodes: list,
        barcode: list[0] || '',
        barcodeDetails: details,
        totalScans: list.length,
        uniqueCount: uniqCount,
        duplicateCount: dupCount,
        isDuplicate: isDup
      };
    });

    setRecords(enriched);
    setFrequencyMap(map);
    setStats({
      totalRecords: recs.length,
      uniqueSerials: Object.keys(map).length,
      duplicateEntries,
      uniqueOnlyCount
    });
  };

  useEffect(() => {
    if (user) {
      fetchRecords();
    }
  }, [user, fetchRecords]);

  // Auth Handlers
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
    showToast('Logged out successfully.', 'info');
  };

  // Add Entry (supports single barcode or multiple scans array in one record)
  const handleAddEntry = async (name, barcodes, crNumber = '') => {
    const barcodeList = Array.isArray(barcodes)
      ? barcodes.map((b) => String(b).trim()).filter(Boolean)
      : [String(barcodes).trim()].filter(Boolean);

    if (!name || barcodeList.length === 0) return;

    try {
      const res = await fetch(`${API_BASE}/api/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, barcodes: barcodeList, crNumber })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.isDuplicate) {
          playAudioFeedback('duplicate', isSoundEnabled);
          showToast(
            `⚠️ Scans saved for ${name} (${data.record?.duplicateCount || 1} duplicates found)!`,
            'warning'
          );
        } else {
          playAudioFeedback('success', isSoundEnabled);
          showToast(
            `✓ Added ${barcodeList.length} scan(s) for ${name}`,
            'success'
          );
        }
        fetchRecords();
      } else {
        showToast('Error adding record.', 'danger');
      }
    } catch (err) {
      // Offline local fallback: 1 record with all barcodes
      const newRec = {
        id: 'rec_' + Date.now(),
        name,
        crNumber,
        barcodes: barcodeList,
        barcode: barcodeList[0] || '',
        timestamp: new Date().toISOString()
      };

      const updated = [newRec, ...records];
      computeAndSetLocal(updated);
      localStorage.setItem(STORAGE_KEYS.LOCAL_RECORDS, JSON.stringify(updated));
      showToast(`✓ Added ${barcodeList.length} scan(s) (offline)`, 'success');
    }
  };

  // Save Edit
  const handleSaveEdit = async (id, name, barcodes, crNumber = '') => {
    const barcodeList = Array.isArray(barcodes)
      ? barcodes.map((b) => String(b).trim()).filter(Boolean)
      : [String(barcodes).trim()].filter(Boolean);

    try {
      const res = await fetch(`${API_BASE}/api/records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, barcodes: barcodeList, crNumber })
      });

      if (res.ok) {
        showToast('Record updated successfully.', 'success');
        setEditingRecord(null);
        fetchRecords();
      } else {
        showToast('Failed to update record.', 'danger');
      }
    } catch (err) {
      const updated = records.map((r) =>
        r.id === id
          ? {
              ...r,
              name,
              barcodes: barcodeList,
              barcode: barcodeList[0] || '',
              crNumber
            }
          : r
      );
      computeAndSetLocal(updated);
      localStorage.setItem(STORAGE_KEYS.LOCAL_RECORDS, JSON.stringify(updated));
      setEditingRecord(null);
      showToast('Record updated (offline).', 'success');
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/records/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        showToast('Record deleted.', 'info');
        setDeletingRecord(null);
        fetchRecords();
      } else {
        showToast('Failed to delete record.', 'danger');
      }
    } catch (err) {
      const updated = records.filter((r) => r.id !== id);
      computeAndSetLocal(updated);
      localStorage.setItem(STORAGE_KEYS.LOCAL_RECORDS, JSON.stringify(updated));
      setDeletingRecord(null);
      showToast('Record deleted (offline).', 'info');
    }
  };

  // Clear All
  const handleClearAll = async () => {
    if (records.length === 0) {
      showToast('No records to clear!', 'info');
      return;
    }

    if (!window.confirm('Are you sure you want to delete ALL records? This cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/records`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast('All records cleared.', 'info');
        fetchRecords();
      }
    } catch (err) {
      computeAndSetLocal([]);
      localStorage.setItem(STORAGE_KEYS.LOCAL_RECORDS, JSON.stringify([]));
      showToast('All records cleared (offline).', 'info');
    }
  };

  if (!user) {
    return (
      <>
        <Login onLogin={handleLogin} showToast={showToast} />
        <ToastContainer toasts={toasts} />
      </>
    );
  }

  return (
    <div className="app-container">
      {/* 1. Header Hero Card */}
      <Header user={user} onLogout={handleLogout} />

      {/* 2. Entry Form Card */}
      <EntryForm
        onAddEntry={handleAddEntry}
        isSoundEnabled={isSoundEnabled}
        setIsSoundEnabled={setIsSoundEnabled}
        frequencyMap={frequencyMap}
        records={records}
      />

      {/* 3. 3-Column Stats Card */}
      <StatsCard
        stats={stats}
        onSelectFilter={(filter) => setCurrentFilter(filter)}
      />

      {/* 4. Filter Tabs & Records Card */}
      <RecordsTable
        records={records}
        stats={stats}
        isLoading={isLoading}
        currentFilter={currentFilter}
        setFilter={setCurrentFilter}
        onEdit={(rec) => setEditingRecord(rec)}
        onDelete={(rec) => setDeletingRecord(rec)}
        onClearAll={handleClearAll}
        showToast={showToast}
      />

      {/* Modals */}
      <EditModal
        record={editingRecord}
        onClose={() => setEditingRecord(null)}
        onSave={handleSaveEdit}
      />

      <DeleteModal
        record={deletingRecord}
        onClose={() => setDeletingRecord(null)}
        onConfirm={handleConfirmDelete}
      />

      <ToastContainer toasts={toasts} />
    </div>
  );
}
