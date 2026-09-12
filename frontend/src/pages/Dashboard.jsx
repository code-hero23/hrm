import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  Search,
  UserCircle,
  Filter,
  Share2,
  Check,
  Download,
  X,
  CheckSquare,
  Square,
  SlidersHorizontal,
  Layers
} from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
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

const ALL_EXPORT_FIELDS = [
  {
    category: 'Personal Information',
    fields: [
      { key: 'full_name', label: 'Full Name' },
      { key: 'employee_id', label: 'Employee ID' },
      { key: 'file_no', label: 'File No' },
      { key: 'dob', label: 'Date of Birth (DOB)', isDate: true },
      { key: 'gender', label: 'Gender' },
      { key: 'blood_group', label: 'Blood Group' },
      { key: 'marital_status', label: 'Marital Status' },
      { key: 'father_mother_name', label: 'Father / Mother Name' },
    ]
  },
  {
    category: 'Contact & Location',
    fields: [
      { key: 'contact_number', label: 'Contact Number' },
      { key: 'personal_email', label: 'Personal Email' },
      { key: 'present_address', label: 'Present Address' },
      { key: 'permanent_address', label: 'Permanent Address' },
      { key: 'work_location', label: 'Work Location' },
      { key: 'emergency_contact_name', label: 'Emergency Contact Name' },
      { key: 'emergency_contact_relationship', label: 'Emergency Relationship' },
      { key: 'emergency_contact_number', label: 'Emergency Contact Number' },
    ]
  },
  {
    category: 'Employment Details',
    fields: [
      { key: 'designation', label: 'Designation' },
      { key: 'department', label: 'Department' },
      { key: 'reporting_manager', label: 'Reporting Manager' },
      { key: 'date_of_joining', label: 'Date of Joining', isDate: true },
      { key: 'official_joining_date', label: 'Official Joining Date', isDate: true },
      { key: 'status', label: 'Status' },
    ]
  },
  {
    category: 'Identification & Banking',
    fields: [
      { key: 'pan_number', label: 'PAN Number' },
      { key: 'aadhaar_number', label: 'Aadhaar Number' },
      { key: 'other_id', label: 'Other ID' },
      { key: 'account_holder_name', label: 'Account Holder Name' },
      { key: 'account_number', label: 'Account Number' },
      { key: 'bank_name', label: 'Bank Name' },
      { key: 'ifsc_code', label: 'IFSC Code' },
      { key: 'branch', label: 'Bank Branch' },
    ]
  },
  {
    category: 'Office Assets & System',
    fields: [
      { key: 'office_sim', label: 'Office SIM' },
      { key: 'office_sim_date', label: 'SIM Date', isDate: true },
      { key: 'laptop_system', label: 'Laptop / System' },
      { key: 'laptop_system_date', label: 'Laptop Date', isDate: true },
      { key: 'official_email_crm', label: 'Official Email CRM' },
      { key: 'official_email_crm_date', label: 'Email CRM Date', isDate: true },
    ]
  },
  {
    category: 'Access & Edit Links',
    fields: [
      { key: 'editable_link', label: 'Data Editable Link (One-Time Link)' },
      { key: 'link_status', label: 'One-Time Link Status' }
    ]
  }
];

const DEFAULT_SELECTED_KEYS = [
  'employee_id',
  'full_name',
  'dob',
  'gender',
  'contact_number',
  'designation',
  'department',
  'date_of_joining',
  'official_joining_date',
  'status'
];

const ALL_FIELD_MAP = {};
ALL_EXPORT_FIELDS.forEach(cat => {
  cat.fields.forEach(f => {
    ALL_FIELD_MAP[f.key] = f;
  });
});

const Dashboard = ({ user }) => {
  const [employees, setEmployees] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [shareName, setShareName] = useState('');
  
  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedExportFields, setSelectedExportFields] = useState(DEFAULT_SELECTED_KEYS);
  const [exportingCustom, setExportingCustom] = useState(false);

  // Helper actions for modal
  const toggleExportField = (key) => {
    if (selectedExportFields.includes(key)) {
      setSelectedExportFields(selectedExportFields.filter(k => k !== key));
    } else {
      setSelectedExportFields([...selectedExportFields, key]);
    }
  };

  const selectAllExportFields = () => {
    setSelectedExportFields(Object.keys(ALL_FIELD_MAP));
  };

  const deselectAllExportFields = () => {
    setSelectedExportFields([]);
  };

  const resetDefaultExportFields = () => {
    setSelectedExportFields(DEFAULT_SELECTED_KEYS);
  };

  const handleCustomExport = async () => {
    if (selectedExportFields.length === 0) {
      alert('Please select at least one field to export.');
      return;
    }

    if (!filteredEmployees || filteredEmployees.length === 0) {
      alert('No employees found for export.');
      return;
    }

    setExportingCustom(true);

    try {
      let tokenMap = {};
      let statusMap = {};

      const needsTokens =
        selectedExportFields.includes('editable_link') ||
        selectedExportFields.includes('link_status');

      if (needsTokens) {
        const empIds = filteredEmployees.map((emp) => emp.id).filter(Boolean);
        try {
          const res = await axios.post(
            `${API_BASE_URL}/api/employees/batch-edit-tokens`,
            { employee_ids: empIds }
          );
          tokenMap = res.data?.tokens || {};
          statusMap = res.data?.statuses || {};
        } catch (err) {
          console.error('Failed to fetch batch edit tokens:', err);
          alert('Note: Could not generate some one-time edit links.');
        }
      }

      const linkColumnHeader =
        ALL_FIELD_MAP['editable_link']?.label ||
        'Data Editable Link (One-Time Link)';

      const dataToExport = filteredEmployees.map((emp) => {
        const row = {};
        selectedExportFields.forEach((key) => {
          const fieldMeta = ALL_FIELD_MAP[key];
          const headerLabel = fieldMeta ? fieldMeta.label : key;

          if (key === 'editable_link') {
            const token = tokenMap[emp.id];
            row[headerLabel] = token
              ? `${window.location.origin}/edit-form?token=${token}`
              : 'N/A';
          } else if (key === 'link_status') {
            row[headerLabel] = statusMap[emp.id] || 'pending';
          } else if (fieldMeta?.isDate) {
            row[headerLabel] = formatDate(emp[key]);
          } else {
            const val = emp[key];
            row[headerLabel] =
              val !== null && val !== undefined && val !== '' ? val : 'N/A';
          }
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);

      // Resigned row styling: Soft light-red fill (#FFC7CE) with bold dark-red text (#9C0006)
      const resignedRowStyle = {
        fill: {
          patternType: 'solid',
          fgColor: { rgb: 'FFFFC7CE' }
        },
        font: {
          name: 'Calibri',
          sz: 11,
          color: { rgb: 'FF9C0006' },
          bold: true
        },
        border: {
          top: { style: 'thin', color: { rgb: 'FFE0B4B4' } },
          bottom: { style: 'thin', color: { rgb: 'FFE0B4B4' } },
          left: { style: 'thin', color: { rgb: 'FFE0B4B4' } },
          right: { style: 'thin', color: { rgb: 'FFE0B4B4' } }
        }
      };

      const resignedLinkStyle = {
        fill: {
          patternType: 'solid',
          fgColor: { rgb: 'FFFFC7CE' }
        },
        font: {
          name: 'Calibri',
          sz: 11,
          color: { rgb: 'FF0563C1' },
          underline: true,
          bold: true
        },
        border: {
          top: { style: 'thin', color: { rgb: 'FFE0B4B4' } },
          bottom: { style: 'thin', color: { rgb: 'FFE0B4B4' } },
          left: { style: 'thin', color: { rgb: 'FFE0B4B4' } },
          right: { style: 'thin', color: { rgb: 'FFE0B4B4' } }
        }
      };

      const standardLinkStyle = {
        font: {
          name: 'Calibri',
          sz: 11,
          color: { rgb: 'FF0563C1' },
          underline: true
        }
      };

      const headerStyle = {
        fill: {
          patternType: 'solid',
          fgColor: { rgb: 'FF1E293B' }
        },
        font: {
          name: 'Calibri',
          sz: 11,
          color: { rgb: 'FFFFFFFF' },
          bold: true
        },
        alignment: {
          vertical: 'center',
          horizontal: 'center'
        }
      };

      const headers = Object.keys(dataToExport[0] || {});
      const linkColumnIndex = headers.indexOf(linkColumnHeader);

      // Style Header Row
      headers.forEach((_, colIndex) => {
        const headerRef = XLSX.utils.encode_cell({ r: 0, c: colIndex });
        if (worksheet[headerRef]) {
          worksheet[headerRef].s = headerStyle;
        }
      });

      // Style Data Rows & Hyperlinks
      dataToExport.forEach((row, rowIndex) => {
        const emp = filteredEmployees[rowIndex];
        const isResigned =
          emp && String(emp.status || '').trim().toLowerCase() === 'resigned';

        headers.forEach((header, colIndex) => {
          const cellRef = XLSX.utils.encode_cell({
            r: rowIndex + 1,
            c: colIndex
          });
          if (!worksheet[cellRef]) return;

          if (colIndex === linkColumnIndex) {
            const linkUrl = row[header];
            if (linkUrl && linkUrl !== 'N/A') {
              worksheet[cellRef].l = {
                Target: linkUrl,
                Tooltip: `Click to edit ${emp?.full_name || 'Employee'}'s data`
              };
            }
            worksheet[cellRef].s = isResigned
              ? resignedLinkStyle
              : standardLinkStyle;
          } else if (isResigned) {
            worksheet[cellRef].s = resignedRowStyle;
          }
        });
      });

      // Auto-fit column widths
      const colWidths = headers.map((header) => {
        let maxLen = header.length;
        dataToExport.forEach((row) => {
          const val = String(row[header] || '');
          if (val.length > maxLen) {
            maxLen = Math.min(val.length, 50);
          }
        });
        return { wch: Math.max(maxLen + 4, 12) };
      });
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

      const date = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `Employee_List_${date}.xlsx`);
      setShowExportModal(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to generate export file. Please try again.');
    } finally {
      setExportingCustom(false);
    }
  };

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
      'Date of Birth (DOB)': formatDate(employee.dob),
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

    // Resigned row highlighting and header styling
    const resignedRowStyle = {
      fill: { patternType: 'solid', fgColor: { rgb: 'FFFFC7CE' } },
      font: { name: 'Calibri', sz: 11, color: { rgb: 'FF9C0006' }, bold: true },
      border: {
        top: { style: 'thin', color: { rgb: 'FFE0B4B4' } },
        bottom: { style: 'thin', color: { rgb: 'FFE0B4B4' } },
        left: { style: 'thin', color: { rgb: 'FFE0B4B4' } },
        right: { style: 'thin', color: { rgb: 'FFE0B4B4' } }
      }
    };

    const resignedFileLinkStyle = {
      fill: { patternType: 'solid', fgColor: { rgb: 'FFFFC7CE' } },
      font: { name: 'Calibri', sz: 11, color: { rgb: 'FF0563C1' }, underline: true, bold: true },
      border: {
        top: { style: 'thin', color: { rgb: 'FFE0B4B4' } },
        bottom: { style: 'thin', color: { rgb: 'FFE0B4B4' } },
        left: { style: 'thin', color: { rgb: 'FFE0B4B4' } },
        right: { style: 'thin', color: { rgb: 'FFE0B4B4' } }
      }
    };

    const quickHeaders = Object.keys(dataToExport[0] || {});
    const headerStyle = {
      fill: { patternType: 'solid', fgColor: { rgb: 'FF1E293B' } },
      font: { name: 'Calibri', sz: 11, color: { rgb: 'FFFFFFFF' }, bold: true },
      alignment: { vertical: 'center', horizontal: 'center' }
    };

    quickHeaders.forEach((_, colIndex) => {
      const headerRef = XLSX.utils.encode_cell({ r: 0, c: colIndex });
      if (worksheet[headerRef]) {
        worksheet[headerRef].s = headerStyle;
      }
    });

    dataToExport.forEach((row, rowIndex) => {
      const employee = employeesToExport[rowIndex];
      const isResigned =
        employee && String(employee.status || '').trim().toLowerCase() === 'resigned';

      if (!isResigned) return;

      quickHeaders.forEach((_, columnIndex) => {
        const cellRef = XLSX.utils.encode_cell({ r: rowIndex + 1, c: columnIndex });
        if (!worksheet[cellRef]) return;

        if (worksheet[cellRef].l) {
          worksheet[cellRef].s = resignedFileLinkStyle;
        } else {
          worksheet[cellRef].s = resignedRowStyle;
        }
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

            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className="btn btn-secondary"
              style={{
                height: '48px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <Download size={20} className="text-accent" />
              Export Data
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

      {/* Export Field Selection Modal */}
      {showExportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(5, 9, 20, 0.82)',
          backdropFilter: 'blur(12px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            maxWidth: '780px',
            width: '100%',
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 30px rgba(59, 130, 246, 0.15)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.75rem 2rem 1.25rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(59, 130, 246, 0.3)'
                  }}>
                    <SlidersHorizontal size={20} color="#60a5fa" />
                  </div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
                    Customize Export Fields
                  </h3>
                </div>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', margin: '0.35rem 0 0' }}>
                  Select the employee data columns you want to include in the exported Excel spreadsheet.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setShowExportModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: 'var(--text-dim)',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Action Toolbar */}
            <div style={{
              padding: '0.85rem 2rem',
              background: 'rgba(0, 0, 0, 0.2)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={selectAllExportFields}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '8px' }}
                >
                  <CheckSquare size={14} style={{ marginRight: '4px' }} /> Select All
                </button>
                <button
                  type="button"
                  onClick={deselectAllExportFields}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '8px' }}
                >
                  <Square size={14} style={{ marginRight: '4px' }} /> Deselect All
                </button>
                <button
                  type="button"
                  onClick={resetDefaultExportFields}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '8px' }}
                >
                  <Layers size={14} style={{ marginRight: '4px' }} /> Default Set
                </button>
              </div>

              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: selectedExportFields.length > 0 ? '#60a5fa' : '#ef4444' }}>
                {selectedExportFields.length} of {Object.keys(ALL_FIELD_MAP).length} Fields Selected
              </span>
            </div>

            {/* Category Grid Section */}
            <div style={{
              padding: '1.5rem 2rem',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem'
            }}>
              {ALL_EXPORT_FIELDS.map((cat, idx) => (
                <div key={idx} style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '16px',
                  padding: '1.25rem'
                }}>
                  <h4 style={{
                    fontSize: '0.8125rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#94a3b8',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8' }}></span>
                    {cat.category}
                  </h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                    gap: '0.75rem'
                  }}>
                    {cat.fields.map(f => {
                      const isSelected = selectedExportFields.includes(f.key);
                      return (
                        <label
                          key={f.key}
                          onClick={() => toggleExportField(f.key)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.65rem 0.85rem',
                            borderRadius: '10px',
                            background: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                            border: `1px solid ${isSelected ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.06)'}`,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            userSelect: 'none'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            style={{
                              accentColor: '#3b82f6',
                              width: '16px',
                              height: '16px',
                              cursor: 'pointer'
                            }}
                          />
                          <span style={{
                            fontSize: '0.84rem',
                            fontWeight: isSelected ? 700 : 500,
                            color: isSelected ? '#fff' : '#cbd5e1'
                          }}>
                            {f.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1.25rem 2rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(0, 0, 0, 0.3)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
              alignItems: 'center'
            }}>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="btn btn-secondary"
                style={{ padding: '0.65rem 1.5rem', borderRadius: '12px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCustomExport}
                disabled={selectedExportFields.length === 0 || exportingCustom}
                className="btn btn-primary"
                style={{
                  padding: '0.65rem 1.75rem',
                  borderRadius: '12px',
                  opacity: (selectedExportFields.length === 0 || exportingCustom) ? 0.5 : 1,
                  cursor: (selectedExportFields.length === 0 || exportingCustom) ? 'not-allowed' : 'pointer'
                }}
              >
                <Download size={18} style={{ marginRight: '6px' }} />
                {exportingCustom ? 'Generating Excel...' : `Export Excel (${selectedExportFields.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;