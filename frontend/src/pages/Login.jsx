import React, { useState } from 'react';
import axios from 'axios';
import { Lock, User, Eye, EyeOff } from 'lucide-react';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/api/login', { username, password });
            localStorage.setItem('adminUser', JSON.stringify(res.data));
            onLogin(res.data);
        } catch (err) {
            setError('Invalid username or password');
        }
    };

    return (
        <div style={{ 
            height: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: 'radial-gradient(circle at top left, #1e293b, #0f172a)' 
        }}>
            <div className="card slide-in" style={{ width: '400px', padding: '3rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ 
                        background: 'rgba(59, 130, 246, 0.1)', 
                        width: '64px', 
                        height: '64px', 
                        borderRadius: '16px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        margin: '0 auto 1.5rem',
                        border: '1px solid rgba(59, 130, 246, 0.2)'
                    }}>
                        <Lock color="#60a5fa" size={32} />
                    </div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Admin Login</h2>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>Master Employee Database Access</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label>USERNAME</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                            <input 
                                type="text" 
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)}
                                style={{ paddingLeft: '3rem' }}
                                required 
                            />
                        </div>
                    </div>
                    
                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                        <label>PASSWORD</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                            <input 
                                type={showPassword ? "text" : "password"} 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ paddingLeft: '3rem' }}
                                required 
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ 
                                    position: 'absolute', 
                                    right: '1rem', 
                                    top: '50%', 
                                    transform: 'translateY(-50%)', 
                                    background: 'transparent', 
                                    border: 'none', 
                                    color: 'var(--text-dim)',
                                    cursor: 'pointer'
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {error && <p style={{ color: '#f87171', fontSize: '0.8125rem', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
