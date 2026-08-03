import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Download, RotateCcw, Mail, Database, FileJson, FileText, RefreshCw, Upload } from 'lucide-react';
import API_BASE_URL from '../config';

const Backups = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [previewJson, setPreviewJson] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const loadBackups = async () => {
    try {
      setError('');
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/backups`);
      setBackups(response.data);
      setSelectedBackup((current) => current || response.data[0] || null);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Unable to load backups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  useEffect(() => {
    const loadPreview = async () => {
      if (!selectedBackup) {
        setPreviewJson(null);
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/api/backups/${encodeURIComponent(selectedBackup.fileName)}/json`);
        setPreviewJson(response.data);
      } catch {
        setPreviewJson(null);
      }
    };

    loadPreview();
  }, [selectedBackup]);

  const createBackup = async () => {
    try {
      setActionLoading(true);
      await axios.post(`${API_BASE_URL}/api/backups/create`);
      await loadBackups();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Unable to create backup');
    } finally {
      setActionLoading(false);
    }
  };

  const restoreBackup = async (backup) => {
    if (!window.confirm(`Restore ${backup.fileName}? This will replace the current employee table.`)) return;
    try {
      setActionLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/backups/${encodeURIComponent(backup.fileName)}/json`);
      await axios.post(`${API_BASE_URL}/api/backups/restore-from-json`, {
        backup: response.data
      });
      await loadBackups();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Unable to restore backup');
    } finally {
      setActionLoading(false);
    }
  };

  const restoreUploadedJson = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;
    if (!window.confirm(`Restore from ${file.name}? This will replace the current employee table.`)) return;

    try {
      setActionLoading(true);
      const text = await file.text();
      const backup = JSON.parse(text);
      await axios.post(`${API_BASE_URL}/api/backups/restore-from-json`, { backup });
      setPreviewJson(backup);
      await loadBackups();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Unable to restore uploaded JSON');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '2rem' }}>Backups</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-dim)' }}>JSON database snapshots, environment exports, restore actions, and nightly email delivery.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={restoreUploadedJson} style={{ display: 'none' }} />
          <button onClick={() => fileInputRef.current?.click()} disabled={actionLoading} className="nav-link" style={{ border: '1px solid var(--glass-border)', background: 'transparent' }}>
            <Upload size={16} /> <span>Restore JSON</span>
          </button>
          <button onClick={createBackup} disabled={actionLoading} className="nav-link" style={{ border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.06)' }}>
            <RefreshCw size={16} /> <span>{actionLoading ? 'Working...' : 'Create Backup Now'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '1rem', padding: '0.9rem 1rem', borderRadius: '14px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#fecaca' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div>Loading backups...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem', alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {backups.map((backup) => (
              <div key={backup.fileName} style={{ border: '1px solid var(--glass-border)', borderRadius: '18px', padding: '1rem', background: 'rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{backup.fileName}</h3>
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--text-dim)' }}>
                      {new Date(backup.createdAt).toLocaleString()} · {(backup.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button onClick={() => setSelectedBackup(backup)} className="nav-link" style={{ border: '1px solid var(--glass-border)', background: 'transparent' }}>
                    <FileJson size={16} /> <span>Preview JSON</span>
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                  <a href={`${API_BASE_URL}${backup.downloadJsonUrl}`} className="nav-link" style={{ border: '1px solid var(--glass-border)' }}>
                    <Download size={16} /> <span>Download JSON</span>
                  </a>
                  <a href={`${API_BASE_URL}${backup.downloadEnvUrl}`} className="nav-link" style={{ border: '1px solid var(--glass-border)' }}>
                    <FileText size={16} /> <span>Download ENV</span>
                  </a>
                  {backup.downloadSqliteUrl && (
                    <a href={`${API_BASE_URL}${backup.downloadSqliteUrl}`} className="nav-link" style={{ border: '1px solid var(--glass-border)' }}>
                      <Database size={16} /> <span>Download DB</span>
                    </a>
                  )}
                  <button onClick={() => restoreBackup(backup)} disabled={actionLoading} className="nav-link" style={{ border: '1px solid var(--glass-border)', background: 'transparent' }}>
                    <RotateCcw size={16} /> <span>Restore</span>
                  </button>
                </div>
              </div>
            ))}

            {backups.length === 0 && (
              <div style={{ border: '1px dashed var(--glass-border)', borderRadius: '18px', padding: '2rem', color: 'var(--text-dim)' }}>
                No backups found yet. Create one manually or wait for the nightly 2:00 AM job.
              </div>
            )}
          </div>

          <div style={{ position: 'sticky', top: '1rem' }}>
            <div style={{ border: '1px solid var(--glass-border)', borderRadius: '18px', padding: '1rem', background: 'rgba(255,255,255,0.04)' }}>
              <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Database size={18} /> Live JSON Preview</h3>
              {selectedBackup ? (
                <pre style={{ margin: 0, maxHeight: '70vh', overflow: 'auto', whiteSpace: 'pre-wrap', fontSize: '0.8rem', lineHeight: 1.5 }}>
                  {previewJson ? JSON.stringify(previewJson, null, 2) : 'Preview unavailable.'}
                </pre>
              ) : (
                <p style={{ color: 'var(--text-dim)' }}>Select a backup to preview its JSON data.</p>
              )}
              <p style={{ marginTop: '1rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={16} /> Nightly email backup runs automatically every day at 2:00 AM server time.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Backups;
