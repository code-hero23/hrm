import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  Search,
  UserCircle,
  Filter,
  Share2,
  Check,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import API_BASE_URL from '../config';

const formatDate = (dateString) => {
  if (!dateString || dateString === 'N/A') {
    return 'N/A';
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

const Dashboard = ({ user }) => {
  const [employees, setEmployees] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [shareName, setShareName] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_BASE_URL}/api/employees`
      );

      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: employees.length,
    new: employees.filter(
      (employee) => employee.status === 'New'
    ).length,
    trainee: employees.filter(
      (employee) => employee.status === 'Trainee'
    ).length,
    onboard: employees.filter(
      (employee) => employee.status === 'Onboard'
    ).length,
    current: employees.filter(
      (employee) => employee.status === 'Current Employee'
    ).length,
    bix: employees.filter(
      (employee) => employee.status === 'Bix Employee'
    ).length,
    bench: employees.filter(
      (employee) => employee.status === 'Bench'
    ).length,
    resigned: employees.filter(
      (employee) => employee.status === 'Resigned'
    ).length
  };

  const statusMap = {
    New: '#22d3ee',
    Trainee: '#3b82f6',
    Onboard: '#eab308',
    'Current Employee': '#22c55e',
    'Bix Employee': '#8b5cf6',
    Bench: '#f97316',
    Resigned: '#ef4444'
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesStatus = status
      ? employee.status === status
      : true;

    const normalizedSearch = searchTerm.toLowerCase();

    const matchesSearch =
      employee.full_name
        ?.toLowerCase()
        .includes(normalizedSearch) ||
      employee.employee_id
        ?.toLowerCase()
        .includes(normalizedSearch) ||
      employee.designation
        ?.toLowerCase()
        .includes(normalizedSearch) ||
      employee.department
        ?.toLowerCase()
        .includes(normalizedSearch);

    return matchesStatus && matchesSearch;
  });

  const buildFileUrl = (path) => {
    if (!path) {
      return '';
    }

    if (
      path.startsWith('http://') ||
      path.startsWith('https://')
    ) {
      return path;
    }

    return `${API_BASE_URL}${path}`;
  };

  const buildEmployeeExportRows = (employeesToExport) => {
    return employeesToExport.map((employee) => ({
      'Employee Name': employee.full_name || 'N/A',
      'File No': employee.file_no || 'N/A',
      'Employee ID': employee.employee_id || 'N/A',
      Department: employee.department || 'N/A',
      Designation: employee.designation || 'N/A',
      Status: employee.status || 'N/A',
      'Date of Joining': formatDate(employee.date_of_joining),
      'Official Joining Date': formatDate(
        employee.official_joining_date
      ),
      'Contact Number': employee.contact_number || 'N/A',
      'Personal Email': employee.personal_email || 'N/A',
      'Blood Group': employee.blood_group || 'N/A',
      'Present Address': employee.present_address || 'N/A',
      'Permanent Address': employee.permanent_address || 'N/A',
      'Bank Name': employee.bank_name || 'N/A',
      'Account Holder':
        employee.account_holder_name || 'N/A',
      'Account Number': employee.account_number || 'N/A',
      'IFSC Code': employee.ifsc_code || 'N/A',
      Branch: employee.branch || 'N/A',
      'PAN Number': employee.pan_number || 'N/A',
      'Aadhaar Number': employee.aadhaar_number || 'N/A',

      'Passbook Front': employee.bank_passbook_path
        ? `${employee.full_name || 'Employee'} - Passbook Front`
        : 'N/A',

      'Passbook Back': employee.bank_passbook_back_path
        ? `${employee.full_name || 'Employee'} - Passbook Back`
        : 'N/A',

      'PAN Front': employee.pan_card_path
        ? `${employee.full_name || 'Employee'} - PAN Front`
        : 'N/A',

      'PAN Back': employee.pan_card_back_path
        ? `${employee.full_name || 'Employee'} - PAN Back`
        : 'N/A',

      'Aadhaar Front': employee.aadhaar_card_path
        ? `${employee.full_name || 'Employee'} - Aadhaar Front`
        : 'N/A',

      'Aadhaar Back': employee.aadhaar_card_back_path
        ? `${employee.full_name || 'Employee'} - Aadhaar Back`
        : 'N/A',

      'Education Certificate Front':
        employee.educational_certificate_path
          ? `${employee.full_name || 'Employee'} - Education Front`
          : 'N/A',

      'Education Certificate Back':
        employee.educational_certificate_back_path
          ? `${employee.full_name || 'Employee'} - Education Back`
          : 'N/A',

      Resume: employee.resume_path
        ? `${employee.full_name || 'Employee'} - Resume`
        : 'N/A',

      Photo: employee.photo_path
        ? `${employee.full_name || 'Employee'} - Photo`
        : 'N/A'
    }));
  };

  const exportFileColumns = [
    'Passbook Front',
    'Passbook Back',
    'PAN Front',
    'PAN Back',
    'Aadhaar Front',
    'Aadhaar Back',
    'Education Certificate Front',
    'Education Certificate Back',
    'Resume',
    'Photo'
  ];

  const generateOneTimeLink = async () => {
    try {
      setLoading(true);

      const response = await axios.post(
        `${API_BASE_URL}/api/invitations`,
        {
          shared_name: shareName
        }
      );

      const { token } = response.data;

      const invitationLink =
        `${window.location.origin}/fill-form?token=${token}`;

      if (
        navigator.clipboard &&
        navigator.clipboard.writeText
      ) {
        await navigator.clipboard.writeText(invitationLink);
      } else {
        const textarea = document.createElement('textarea');

        textarea.value = invitationLink;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';

        document.body.appendChild(textarea);

        textarea.focus();
        textarea.select();

        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error(
        'Failed to generate invitation link:',
        error
      );

      alert(
        'Error generating invitation link. Please check your connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadEmployeeData = (
    employeesToExport,
    fileLabel
  ) => {
    if (!employeesToExport.length) {
      alert('No employees found for export.');
      return;
    }

    const dataToExport =
      buildEmployeeExportRows(employeesToExport);

    const worksheet =
      XLSX.utils.json_to_sheet(dataToExport);

    dataToExport.forEach((row, rowIndex) => {
      exportFileColumns.forEach((columnName) => {
        const employee = employeesToExport[rowIndex];

        const pathMap = {
          'Passbook Front': employee.bank_passbook_path,
          'Passbook Back': employee.bank_passbook_back_path,
          'PAN Front': employee.pan_card_path,
          'PAN Back': employee.pan_card_back_path,
          'Aadhaar Front': employee.aadhaar_card_path,
          'Aadhaar Back': employee.aadhaar_card_back_path,
          'Education Certificate Front':
            employee.educational_certificate_path,
          'Education Certificate Back':
            employee.educational_certificate_back_path,
          Resume: employee.resume_path,
          Photo: employee.photo_path
        };

        const fileUrl =
          buildFileUrl(pathMap[columnName]);

        if (!fileUrl) {
          return;
        }

        const columnIndex =
          Object.keys(dataToExport[0]).indexOf(columnName);

        const cellReference = XLSX.utils.encode_cell({
          r: rowIndex + 1,
          c: columnIndex
        });

        if (!worksheet[cellReference]) {
          return;
        }

        worksheet[cellReference].v = row[columnName];

        worksheet[cellReference].l = {
          Target: fileUrl,
          Tooltip: `Download ${columnName}`
        };

        worksheet[cellReference].s = {
          font: {
            color: {
              rgb: '0563C1'
            },
            underline: true
          }
        };
      });
    });

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'Employees'
    );

    const date = new Date()
      .toISOString()
      .split('T')[0];

    XLSX.writeFile(
      workbook,
      `${fileLabel}_${date}.xlsx`
    );
  };

  const getExportFileLabel = () => {
    if (!status) {
      return 'All_Employee_List';
    }

    return `${status.replace(/\s+/g, '_')}_Employee_List`;
  };

  const filterStatuses = [
    'New',
    'Trainee',
    'Onboard',
    'Current Employee',
    'Bix Employee',
    'Bench',
    'Resigned',
    ''
  ];

  const statCards = [
    {
      label: 'Total Workforce',
      value: stats.total,
      color: 'var(--text)',
      border: 'rgba(255,255,255,0.1)'
    },
    {
      label: 'New Joining',
      value: stats.new,
      color: '#22d3ee',
      border: '#22d3ee'
    },
    {
      label: 'Trainees',
      value: stats.trainee,
      color: '#60a5fa',
      border: '#3b82f6'
    },
    {
      label: 'Onboarding',
      value: stats.onboard,
      color: '#fbbf24',
      border: '#eab308'
    },
    {
      label: 'Current Staff',
      value: stats.current,
      color: '#4ade80',
      border: '#22c55e'
    },
    {
      label: 'Bix Employees',
      value: stats.bix,
      color: '#a78bfa',
      border: '#8b5cf6'
    },
    {
      label: 'Bench / NP',
      value: stats.bench,
      color: '#fb923c',
      border: '#f97316'
    },
    {
      label: 'Resigned',
      value: stats.resigned,
      color: '#f87171',
      border: '#ef4444'
    }
  ];

  return (
    <div className="slide-in">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '4rem'
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '2.75rem',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              marginBottom: '0.5rem',
              background:
                'linear-gradient(to right, #fff, #94a3b8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Workforce Overview
          </h2>

          <p
            style={{
              color: 'var(--text-dim)',
              fontSize: '1.125rem',
              fontWeight: 500
            }}
          >
            Monitor and manage the Orbix Designs ecosystem.
          </p>
        </div>

        {user?.role !== 'viewer' && (
          <div
            style={{
              display: 'flex',
              gap: '1.25rem',
              alignItems: 'center'
            }}
          >
            <div
              className="card"
              style={{
                padding: '0.6rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                minWidth: '280px',
                background: 'rgba(255,255,255,0.03)'
              }}
            >
              <UserCircle
                size={20}
                color="var(--accent)"
              />

              <input
                type="text"
                placeholder="Share invitation name..."
                value={shareName}
                onChange={(event) =>
                  setShareName(event.target.value)
                }
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '0.9375rem',
                  width: '100%',
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="button"
              onClick={generateOneTimeLink}
              className="btn btn-secondary"
              title="Generates a secure ONE-TIME use link"
              disabled={loading}
              style={{
                height: '48px'
              }}
            >
              {copied ? (
                <Check
                  size={20}
                  color="#4ade80"
                />
              ) : (
                <Share2
                  size={20}
                  className="text-accent"
                />
              )}

              {copied
                ? 'Link Copied!'
                : 'One-Time Link'}
            </button>

            <Link
              to="/onboard"
              className="btn btn-primary"
              style={{
                height: '48px'
              }}
            >
              <UserCircle size={20} />
              Add Employee
            </Link>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginBottom: '4rem'
        }}
      >
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="card stat-card"
            style={{
              padding: '1.75rem',
              borderLeft: `4px solid ${stat.border}`,
              background: 'rgba(255,255,255,0.02)'
            }}
          >
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-dim)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.75rem'
              }}
            >
              {stat.label}
            </p>

            <h4
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: stat.color,
                margin: 0
              }}
            >
              {stat.value}
            </h4>
          </div>
        ))}
      </div>

      {/* Search, filter and export */}
    <div className="employee-toolbar">
  {/* Search */}
  <div className="card employee-search-box">
    <Search size={20} color="var(--text-dim)" />

    <input
      type="text"
      placeholder="Search by name, ID, designation..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </div>

  {/* Filter */}
  <div className="card employee-filter-box">
    <div className="employee-filter-title">
      <Filter size={17} />
      <span>Filter</span>
    </div>

    <div className="employee-filter-buttons">
      {[
        'New',
        'Trainee',
        'Onboard',
        'Current Employee',
        'Bix Employee',
        'Bench',
        'Resigned',
        ''
      ].map((s) => (
        <button
          type="button"
          key={s || 'all'}
          onClick={() => setStatus(s)}
          className={`btn ${
            status === s ? 'btn-primary' : 'btn-secondary'
          }`}
        >
          {s || 'ALL'}
        </button>
      ))}
    </div>
  </div>

  {/* Export */}
  <button
    type="button"
    onClick={() =>
      downloadEmployeeData(
        filteredEmployees,
        getExportFileLabel()
      )
    }
    className="btn btn-secondary export-btn"
  >
    <Download size={20} />
    <span>Export</span>
  </button>
</div>

      {/* Employee list */}
      {loading ? (
        <div
          style={{
            textAlign: 'center',
            padding: '5rem'
          }}
        >
          <div className="loader">
            Loading workforce...
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '2rem'
          }}
        >
          {filteredEmployees.map((employee) => (
            <Link
              to={`/employee/${employee.id}`}
              key={employee.id}
              style={{
                textDecoration: 'none',
                color: 'inherit'
              }}
            >
              <div
                className="card employee-card"
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  padding: '1.5rem'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '4px',
                    height: '100%',
                    background:
                      statusMap[employee.status] || '#ccc'
                  }}
                />

                <div
                  style={{
                    display: 'flex',
                    gap: '1.5rem',
                    alignItems: 'flex-start'
                  }}
                >
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '16px',
                      background: 'rgba(255,255,255,0.05)',
                      overflow: 'hidden',
                      border:
                        '1px solid var(--glass-border)',
                      flexShrink: 0
                    }}
                  >
                    {employee.photo_path ? (
                      <img
                        src={`${API_BASE_URL}${employee.photo_path}`}
                        alt={employee.full_name || 'Employee'}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <UserCircle
                          size={40}
                          color="#475569"
                        />
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      flex: 1,
                      minWidth: 0
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}
                    >
                      <h3
                        style={{
                          fontSize: '1.125rem',
                          fontWeight: 800,
                          color: 'white',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {employee.full_name}
                      </h3>

                      <span
                        className={`badge badge-${employee.status
                          .toLowerCase()
                          .replace(/ /g, '-')}`}
                        style={{
                          scale: '0.7',
                          transformOrigin: 'right'
                        }}
                      >
                        {employee.status}
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: '0.8125rem',
                        color: 'var(--text-dim)',
                        fontWeight: 600,
                        marginTop: '0.25rem'
                      }}
                    >
                      {employee.designation}
                    </p>

                    <div
                      style={{
                        marginTop: '1rem',
                        borderTop:
                          '1px solid var(--glass-border)',
                        paddingTop: '0.75rem',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '0.75rem'
                      }}
                    >
                      <div>
                        <p
                          style={{
                            fontSize: '0.625rem',
                            color: 'var(--text-dim)',
                            fontWeight: 800,
                            textTransform: 'uppercase'
                          }}
                        >
                          Dept
                        </p>

                        <p
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {employee.department || 'N/A'}
                        </p>
                      </div>

                      <div>
                        <p
                          style={{
                            fontSize: '0.625rem',
                            color: 'var(--text-dim)',
                            fontWeight: 800,
                            textTransform: 'uppercase'
                          }}
                        >
                          ID
                        </p>

                        <p
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}
                        >
                          {employee.employee_id || 'PENDING'}
                        </p>
                      </div>

                      <div>
                        <p
                          style={{
                            fontSize: '0.625rem',
                            color: 'var(--text-dim)',
                            fontWeight: 800,
                            textTransform: 'uppercase'
                          }}
                        >
                          D.O.J
                        </p>

                        <p
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}
                        >
                          {formatDate(
                            employee.date_of_joining
                          )}
                        </p>
                      </div>

                      <div>
                        <p
                          style={{
                            fontSize: '0.625rem',
                            color: '#60a5fa',
                            fontWeight: 800,
                            textTransform: 'uppercase'
                          }}
                        >
                          Official
                        </p>

                        <p
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#60a5fa'
                          }}
                        >
                          {formatDate(
                            employee.official_joining_date
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {(() => {
                  let lifecycleSteps = [];

                  try {
                    lifecycleSteps =
                      employee.lifecycle_steps
                        ? typeof employee.lifecycle_steps ===
                          'string'
                          ? JSON.parse(
                              employee.lifecycle_steps
                            )
                          : employee.lifecycle_steps
                        : [];
                  } catch (error) {
                    console.error(
                      'Invalid lifecycle steps:',
                      error
                    );

                    lifecycleSteps = [];
                  }

                  const total =
                    lifecycleSteps.length || 20;

                  const completed =
                    lifecycleSteps.filter(
                      (step) => step.done
                    ).length;

                  const progress = Math.round(
                    (completed / total) * 100
                  );

                  const isCompleted = progress === 100;

                  return (
                    <div
                      style={{
                        marginTop: '1.5rem'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.4rem'
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.6rem',
                            fontWeight: 800,
                            color: 'var(--text-dim)',
                            textTransform: 'uppercase'
                          }}
                        >
                          Completion
                        </span>

                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 900,
                            color: isCompleted
                              ? '#4ade80'
                              : 'white'
                          }}
                        >
                          {progress}%
                        </span>
                      </div>

                      <div
                        style={{
                          height: '4px',
                          background:
                            'rgba(255,255,255,0.05)',
                          borderRadius: '2px',
                          overflow: 'hidden'
                        }}
                      >
                        <div
                          style={{
                            width: `${progress}%`,
                            height: '100%',
                            background: isCompleted
                              ? '#22c55e'
                              : progress < 40
                                ? '#ef4444'
                                : '#3b82f6',
                            transition: 'width 0.5s ease'
                          }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            </Link>
          ))}

          {filteredEmployees.length === 0 && (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '6rem',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '24px',
                border:
                  '2px dashed var(--glass-border)'
              }}
            >
              <p
                style={{
                  color: 'var(--text-dim)',
                  fontSize: '1rem'
                }}
              >
                No employee records found matching your
                filters.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;