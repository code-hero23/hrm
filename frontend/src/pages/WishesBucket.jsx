import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Cake, 
  Heart, 
  Search, 
  ChevronRight,
  Gift,
  Calendar,
  User
} from 'lucide-react';
import API_BASE_URL from '../config';

const WishesBucket = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Birthday');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/employees`);
      setEmployees(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setLoading(false);
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getDayAndMonth = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return {
      day: date.getDate(),
      month: date.getMonth(), // 0-indexed
      monthName: months[date.getMonth()]
    };
  };

  const filteredEmployees = employees.filter(emp => {
    const dateStr = activeTab === 'Birthday' ? emp.dob : emp.wedding_date;
    if (!dateStr) return false;
    
    const searchMatch = emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        emp.department?.toLowerCase().includes(searchTerm.toLowerCase());
    return searchMatch;
  });

  // Group by month
  const groupedByMonth = months.map((monthName, monthIndex) => {
    const monthEmployees = filteredEmployees.filter(emp => {
      const dateStr = activeTab === 'Birthday' ? emp.dob : emp.wedding_date;
      const dateInfo = getDayAndMonth(dateStr);
      return dateInfo && dateInfo.month === monthIndex;
    }).sort((a, b) => {
      const dateA = getDayAndMonth(activeTab === 'Birthday' ? a.dob : a.wedding_date).day;
      const dateB = getDayAndMonth(activeTab === 'Birthday' ? b.dob : b.wedding_date).day;
      return dateA - dateB;
    });

    return { monthName, employees: monthEmployees };
  }).filter(group => group.employees.length > 0);

  if (loading) return <div style={{textAlign:'center', padding:'4rem'}}>Loading wishes...</div>;

  return (
    <div className="slide-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.04em' }}>Wishes Bucket</h2>
          <p style={{ color: 'var(--text-dim)', marginTop: '0.5rem' }}>Celebrate special moments with our team members.</p>
        </div>
        
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '0.4rem', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
          <button 
            onClick={() => setActiveTab('Birthday')}
            style={{ 
              padding: '0.6rem 1.5rem', 
              borderRadius: '10px', 
              border: 'none', 
              background: activeTab === 'Birthday' ? 'var(--accent)' : 'transparent',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: '0.3s'
            }}
          >
            <Cake size={18} /> Birthdays
          </button>
          <button 
            onClick={() => setActiveTab('Wedding')}
            style={{ 
              padding: '0.6rem 1.5rem', 
              borderRadius: '10px', 
              border: 'none', 
              background: activeTab === 'Wedding' ? '#ec4899' : 'transparent',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: '0.3s'
            }}
          >
            <Heart size={18} /> Anniversaries
          </button>
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: '3rem' }}>
        <Search size={20} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
        <input 
          type="text" 
          placeholder={`Search team members for ${activeTab.toLowerCase()} wishes...`} 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="card"
          style={{ 
            width: '100%', 
            padding: '1rem 1rem 1rem 3.5rem', 
            fontSize: '1rem',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--glass-border)'
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        {groupedByMonth.length > 0 ? groupedByMonth.map(group => (
          <div key={group.monthName}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: '10px', background: activeTab === 'Birthday' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(236, 72, 153, 0.1)', color: activeTab === 'Birthday' ? '#60a5fa' : '#f472b6' }}>
                <Calendar size={20} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{group.monthName}</h3>
              <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {group.employees.map(emp => {
                const dateInfo = getDayAndMonth(activeTab === 'Birthday' ? emp.dob : emp.wedding_date);
                return (
                  <div key={emp.id} className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.05 }}>
                      {activeTab === 'Birthday' ? <Cake size={80} /> : <Heart size={80} />}
                    </div>
                    
                    <div style={{ width: '60px', height: '60px', borderRadius: '15px', background: 'rgba(255,255,255,0.03)', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                      {emp.photo_path ? (
                        <img src={`${API_BASE_URL}${emp.photo_path}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                          <User size={24} />
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '1rem', fontWeight: 800 }}>{emp.full_name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 500 }}>{emp.designation}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <div style={{ padding: '0.25rem 0.6rem', borderRadius: '6px', background: activeTab === 'Birthday' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(236, 72, 153, 0.1)', color: activeTab === 'Birthday' ? '#60a5fa' : '#f472b6', fontSize: '0.75rem', fontWeight: 900 }}>
                          {dateInfo.day} {group.monthName.slice(0, 3)}
                        </div>
                        {activeTab === 'Birthday' && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                            Age: {new Date().getFullYear() - new Date(emp.dob).getFullYear()}
                          </span>
                        )}
                        {activeTab === 'Wedding' && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                            {new Date().getFullYear() - new Date(emp.wedding_date).getFullYear()} Years
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )) : (
          <div className="card" style={{ textAlign: 'center', padding: '5rem', background: 'rgba(255,255,255,0.02)' }}>
            <Gift size={48} style={{ color: 'var(--text-dim)', marginBottom: '1.5rem' }} />
            <p style={{ color: 'var(--text-dim)', fontSize: '1.25rem', fontWeight: 600 }}>No {activeTab.toLowerCase()} found for your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishesBucket;
