import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Upload, FileUp, CheckCircle, AlertCircle, Trash2, Save } from 'lucide-react';
import API_BASE_URL from '../config';

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
                    if (normalizedKey === 'full_name' || normalizedKey === 'name' || normalizedKey === 'fullname') newRow.full_name = row[key];
                    else if (normalizedKey === 'personal_email' || normalizedKey === 'email') newRow.personal_email = row[key];
                    else if (normalizedKey === 'dept' || normalizedKey === 'department') newRow.department = row[key];
                    else if (normalizedKey === 'status') {
                        let val = row[key]?.toString().trim();
                        if (val?.toLowerCase() === 'working') newRow.status = 'Current Employee';
                        else newRow.status = val;
                    }
                    else newRow[normalizedKey] = row[key];
                });

                // Default status if missing
                if (!newRow.status) newRow.status = 'Current Employee';
                
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
            <div className="card slide-in" style={{ textAlign: 'center', padding: '4rem' }}>
                <div style={{ background: importResult.errors > 0 ? '#eab308' : '#22c55e', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <CheckCircle color="white" size={32} />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Import Processed!</h2>
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '2rem' }}>
                    <div className="card" style={{padding:'1rem', minWidth:'100px', background:'rgba(34, 197, 94, 0.1)', borderColor:'rgba(34, 197, 94, 0.2)'}}>
                        <p style={{fontSize:'0.7rem', color:'var(--text-dim)'}}>SUCCESS</p>
                        <h4 style={{fontSize:'1.5rem', color:'#4ade80'}}>{importResult.success}</h4>
                    </div>
                    <div className="card" style={{padding:'1rem', minWidth:'100px', background:'rgba(239, 68, 68, 0.1)', borderColor:'rgba(239, 68, 68, 0.2)'}}>
                        <p style={{fontSize:'0.7rem', color:'var(--text-dim)'}}>ERRORS</p>
                        <h4 style={{fontSize:'1.5rem', color:'#f87171'}}>{importResult.errors}</h4>
                    </div>
                </div>

                {importResult.errorDetails && importResult.errorDetails.length > 0 && (
                    <div style={{marginTop: '2rem', textAlign: 'left', background: 'rgba(239, 68, 68, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.1)'}}>
                        <p style={{fontSize: '0.75rem', color: '#f87171', fontWeight: 700, marginBottom: '0.5rem'}}>ERROR LOG (First 5):</p>
                        {importResult.errorDetails.map((err, i) => (
                            <p key={i} style={{fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '0.2rem'}}>• {err}</p>
                        ))}
                    </div>
                )}

                <p style={{ color: 'var(--text-dim)', marginTop: '2rem' }}>Redirecting to dashboard in a few seconds...</p>
                <Link to="/" className="btn btn-secondary" style={{marginTop: '1rem'}}>Back to Dashboard Now</Link>
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
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>EMAIL</th>
                                        <th style={{ padding: '1rem', textAlign: 'center' }}>ACTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((row, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                            <td style={{ padding: '1rem' }}>{row.fullName || row.full_name || row.Name}</td>
                                            <td style={{ padding: '1rem' }}>{row.department || row.Dept}</td>
                                            <td style={{ padding: '1rem' }}>{row.designation}</td>
                                            <td style={{ padding: '1rem' }}>{row.personalEmail || row.email}</td>
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
