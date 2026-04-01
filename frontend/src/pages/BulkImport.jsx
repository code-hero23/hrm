import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Upload, FileUp, CheckCircle, AlertCircle, Trash2, Save } from 'lucide-react';
import API_BASE_URL from '../config';
import logo from '../assets/logo.jpg';

const BulkImport = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const json = XLSX.utils.sheet_to_json(ws);
            
            // Intelligent Mapping & Status Alignment
            const mappedData = json.map(row => {
                const newRow = {};
                
                // Map common headers to database keys
                Object.keys(row).forEach(key => {
                    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '_');
                    
                    // Specific mappings
                    if (normalizedKey.includes('name') || normalizedKey === 'employee' || normalizedKey === 'empname' || normalizedKey === 'full_name') {
                        newRow.full_name = row[key];
                    }
                    else if (normalizedKey.includes('email') || normalizedKey === 'personal_email') {
                        newRow.personal_email = row[key];
                    }
                    else if (normalizedKey.includes('dept') || normalizedKey === 'department') {
                        newRow.department = row[key];
                    }
                    else if (normalizedKey === 'status') {
                        let val = row[key]?.toString().trim();
                        if (val?.toLowerCase() === 'working') newRow.status = 'Current Employee';
                        else newRow.status = val;
                    }
                    else if (normalizedKey.includes('designation') || normalizedKey === 'role' || normalizedKey === 'position') {
                        newRow.designation = row[key];
                    }
                    else if (normalizedKey.includes('id') && !normalizedKey.includes('aadhaar') && !normalizedKey.includes('pan')) {
                        newRow.employee_id = row[key];
                    }
                    else {
                        newRow[normalizedKey] = row[key];
                    }
                });

                // Default status if missing
                if (!newRow.status) newRow.status = 'New';

                // Record validation/completion score
                const requiredFields = ['full_name', 'department', 'designation', 'employee_id'];
                const filledFields = requiredFields.filter(f => newRow[f] && newRow[f] !== '');
                newRow._completionType = filledFields.length === requiredFields.length ? 'COMPLETE' : 'PARTIAL';
                newRow._score = Math.round((filledFields.length / requiredFields.length) * 100);
                
                return newRow;
            });

            setData(mappedData);
        };
        reader.readAsBinaryString(file);
    };

    const handleImport = async () => {
        if (data.length === 0) return;
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/employees/bulk`, { employees: data });
            setImportResult(res.data);
            setSuccess(true);
            setTimeout(() => navigate('/'), 5000); // Give more time to see the result
        } catch (err) {
            console.error(err);
            alert('Error during bulk import. Check console for details.');
        }
        setLoading(false);
    };

    const removeRow = (index) => {
        setData(prev => prev.filter((_, i) => i !== index));
    };

    if (success && importResult) {
        return (
            <div className="card slide-in" style={{ textAlign: 'center', padding: '5rem 2rem', maxWidth: '600px', margin: '4rem auto' }}>
                {logo && <img src={logo} alt="Orbix" style={{ height: '60px', width: 'auto', marginBottom: '3rem' }} />}
                
                <div className="success-animation" style={{ marginBottom: '2.5rem' }}>
                    <div style={{ 
                        background: '#22c55e', 
                        width: '100px', 
                        height: '100px', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        margin: '0 auto',
                        boxShadow: '0 0 30px rgba(34, 197, 94, 0.4)',
                        animation: 'scaleUp 0.5s ease-out forwards'
                    }}>
                        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'drawCheck 0.5s 0.3s ease-in-out both' }}>
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                </div>

                <h2 style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '1rem', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Import Processed!
                </h2>
                <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto' }}>
                    Successfully imported <strong>{importResult.success}</strong> employee records.
                    {importResult.errors > 0 && <span style={{ color: '#ef4444', display: 'block', marginTop: '0.5rem' }}>{importResult.errors} records failed to import.</span>}
                </p>

                {importResult.errorDetails && importResult.errorDetails.length > 0 && (
                    <div style={{ textAlign: 'left', marginTop: '2rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                        <p style={{ fontWeight: 700, fontSize: '0.8rem', color: '#ef4444', marginBottom: '0.5rem' }}>ERROR LOG:</p>
                        {importResult.errorDetails.map((err, i) => (
                            <p key={i} style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>• {err}</p>
                        ))}
                    </div>
                )}
                
                <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)' }}>
                    <Link to="/" className="btn btn-secondary">Back to Dashboard</Link>
                </div>

                <style>{`
                    @keyframes scaleUp {
                        0% { transform: scale(0); opacity: 0; }
                        100% { transform: scale(1); opacity: 1; }
                    }
                    @keyframes drawCheck {
                        0% { stroke-dasharray: 50; stroke-dashoffset: 50; }
                        100% { stroke-dasharray: 50; stroke-dashoffset: 0; }
                    }
                    .success-animation {
                        perspective: 1000px;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="slide-in">
            <div style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.05em', marginBottom: '0.5rem' }}>Bulk Import</h2>
                <p style={{ color: 'var(--text-dim)', fontSize: '1rem' }}>Upload Excel (.xlsx) files to add multiple employees at once.</p>
            </div>

            <div className="card" style={{ padding: '3rem', textAlign: 'center', border: '2px dashed var(--glass-border)', background: 'rgba(255,255,255,0.01)' }}>
                <FileUp size={48} color="var(--accent)" style={{ marginBottom: '1.5rem' }} />
                <h3 style={{ marginBottom: '1rem' }}>Select Employee Data File</h3>
                <p style={{ color: 'var(--text-dim)', marginBottom: '2rem', fontSize: '0.875rem' }}>Ensure headers match database fields (fullName, designation, department, etc.)</p>
                
                <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
                    <Upload size={18} /> Choose File
                    <input type="file" hidden accept=".xlsx, .xls" onChange={handleFileUpload} />
                </label>
            </div>

            {data.length > 0 && (
                <div className="slide-in" style={{ marginTop: '3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontWeight: 800 }}>Preview ({data.length} records)</h3>
                        <button onClick={handleImport} className="btn btn-primary" disabled={loading}>
                            {loading ? 'Importing...' : <><Save size={18} /> Confirm Import</>}
                        </button>
                    </div>

                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                                <thead style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--glass-border)' }}>
                                    <tr>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>NAME</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>DEPT</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>DESIGNATION</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>ID</th>
                                        <th style={{ padding: '1rem', textAlign: 'center' }}>QUALITY</th>
                                        <th style={{ padding: '1rem', textAlign: 'center' }}>ACTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((row, idx) => (
                                        <tr key={idx} style={{ 
                                            borderBottom: '1px solid var(--glass-border)',
                                            background: row._completionType === 'PARTIAL' ? 'rgba(234, 179, 8, 0.03)' : 'transparent'
                                        }}>
                                            <td style={{ padding: '1rem', fontWeight: 700 }}>{row.full_name || 'N/A'}</td>
                                            <td style={{ padding: '1rem' }}>{row.department || <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Missing</span>}</td>
                                            <td style={{ padding: '1rem' }}>{row.designation || <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Missing</span>}</td>
                                            <td style={{ padding: '1rem' }}>{row.employee_id || <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Pending</span>}</td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <span style={{ 
                                                    fontSize: '0.6rem', 
                                                    fontWeight: 900, 
                                                    padding: '2px 8px', 
                                                    borderRadius: '4px',
                                                    background: row._completionType === 'COMPLETE' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                                                    color: row._completionType === 'COMPLETE' ? '#4ade80' : '#fbbf24'
                                                }}>
                                                    {row._score}% {row._completionType}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <button onClick={() => removeRow(idx)} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BulkImport;
