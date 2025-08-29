import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

const API_BASE = 'https://backend-k6ko.onrender.com1';

const REPORT_TYPES = [
  { key: 'department-wise', label: 'Department-wise Reports' },
  { key: 'trade-wise', label: 'Trade-wise Reports' },
  { key: 'alert-wise', label: 'Alert-wise Reports' }
];

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('department-wise');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [trades, setTrades] = useState([]);
  const [tradeRegisters, setTradeRegisters] = useState([]);
  const [trainingRegisters, setTrainingRegisters] = useState([]);

  // Filter states
  const [filters, setFilters] = useState({
    departmentCode: '',
    tradeCode: '',
    status: '',
    validityAlert: '',
    dateRange: ''
  });

  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: 'Department_Code',
    direction: 'asc'
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);

  // Fetch all required data
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [workersRes, deptsRes, tradesRes, tradeRegsRes, trainingRegsRes] = await Promise.all([
          fetch(`${API_BASE}/api/workers`),
          fetch(`${API_BASE}/api/departments`),
          fetch(`${API_BASE}/api/trades`),
          fetch(`${API_BASE}/api/trade-registers`),
          fetch(`${API_BASE}/api/training-registers`)
        ]);

        const [workersData, deptsData, tradesData, tradeRegsData, trainingRegsData] = await Promise.all([
          workersRes.json(),
          deptsRes.json(),
          tradesRes.json(),
          tradeRegsRes.json(),
          trainingRegsRes.json()
        ]);

        setWorkers(workersData);
        setDepartments(deptsData);
        setTrades(tradesData);
        setTradeRegisters(tradeRegsData);
        setTrainingRegisters(trainingRegsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Generate report data based on selected report
  useEffect(() => {
    if (!workers.length || !departments.length || !trades.length) return;

    let data = [];
    
    switch (selectedReport) {
      case 'department-wise':
        data = generateDepartmentWiseReport();
        break;
      case 'trade-wise':
        data = generateTradeWiseReport();
        break;
      case 'alert-wise':
        data = generateAlertWiseReport();
        break;
      default:
        data = [];
    }

    setReportData(data);
    setCurrentPage(1); // Reset to first page when report changes
  }, [selectedReport, workers, departments, trades, tradeRegisters, trainingRegisters]);

  const generateDepartmentWiseReport = () => {
    const report = [];
    
    departments.forEach(dept => {
      const deptTradeRegs = tradeRegisters.filter(tr => tr.Department_Code === dept.Department_code);
      const deptTrainingRegs = trainingRegisters.filter(tr => tr.Department_Code === dept.Department_code);
      
      // Group by trade
      const tradeGroups = {};
      deptTradeRegs.forEach(reg => {
        const trade = trades.find(t => t.Trade_Code === reg.Trade_Code);
        if (!tradeGroups[reg.Trade_Code]) {
          tradeGroups[reg.Trade_Code] = {
            Trade_Code: reg.Trade_Code,
            Trade_Name: trade?.Trade_Name || 'Unknown',
            Active_Count: 0,
            Inactive_Count: 0,
            Completed_Count: 0,
            Suspended_Count: 0,
            Expiring_Count: 0,
            Valid_Count: 0
          };
        }
        
        switch (reg.Status) {
          case 'Active':
            tradeGroups[reg.Trade_Code].Active_Count++;
            break;
          case 'Inactive':
            tradeGroups[reg.Trade_Code].Inactive_Count++;
            break;
          case 'Completed':
            tradeGroups[reg.Trade_Code].Completed_Count++;
            break;
          case 'Suspended':
            tradeGroups[reg.Trade_Code].Suspended_Count++;
            break;
        }
        
        // Check validity
        if (reg.Validity_Date) {
          const today = new Date();
          const validity = new Date(reg.Validity_Date);
          const diffTime = validity - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 7) {
            tradeGroups[reg.Trade_Code].Expiring_Count++;
          } else {
            tradeGroups[reg.Trade_Code].Valid_Count++;
          }
        }
      });
      
      Object.values(tradeGroups).forEach(tradeGroup => {
        report.push({
          Department_Code: dept.Department_code,
          Department_Name: dept.Department_Name,
          ...tradeGroup
        });
      });
    });
    
    return report;
  };

  const generateTradeWiseReport = () => {
    const report = [];
    
    trades.forEach(trade => {
      const tradeRegs = tradeRegisters.filter(tr => tr.Trade_Code === trade.Trade_Code);
      
      // Group by department
      const deptGroups = {};
      tradeRegs.forEach(reg => {
        const dept = departments.find(d => d.Department_code === reg.Department_Code);
        if (!deptGroups[reg.Department_Code]) {
          deptGroups[reg.Department_Code] = {
            Department_Code: reg.Department_Code,
            Department_Name: dept?.Department_Name || 'Unknown',
            Active_Count: 0,
            Inactive_Count: 0,
            Completed_Count: 0,
            Suspended_Count: 0,
            Expiring_Count: 0,
            Valid_Count: 0
          };
        }
        
        switch (reg.Status) {
          case 'Active':
            deptGroups[reg.Department_Code].Active_Count++;
            break;
          case 'Inactive':
            deptGroups[reg.Department_Code].Inactive_Count++;
            break;
          case 'Completed':
            deptGroups[reg.Department_Code].Completed_Count++;
            break;
          case 'Suspended':
            deptGroups[reg.Department_Code].Suspended_Count++;
            break;
        }
        
        // Check validity
        if (reg.Validity_Date) {
          const today = new Date();
          const validity = new Date(reg.Validity_Date);
          const diffTime = validity - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 7) {
            deptGroups[reg.Department_Code].Expiring_Count++;
          } else {
            deptGroups[reg.Department_Code].Valid_Count++;
          }
        }
      });
      
      Object.values(deptGroups).forEach(deptGroup => {
        report.push({
          Trade_Code: trade.Trade_Code,
          Trade_Name: trade.Trade_Name,
          ...deptGroup
        });
      });
    });
    
    return report;
  };

  const generateAlertWiseReport = () => {
    const report = [];
    const today = new Date();
    
    // Process trade registrations
    tradeRegisters.forEach(reg => {
      if (reg.Status === 'Active' && reg.Validity_Date) {
        const validity = new Date(reg.Validity_Date);
        const diffTime = validity - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0 || diffDays <= 7) {
          const dept = departments.find(d => d.Department_code === reg.Department_Code);
          const trade = trades.find(t => t.Trade_Code === reg.Trade_Code);
          
          report.push({
            Alert_Type: diffDays < 0 ? 'OVERDUE' : 'EXPIRING',
            Alert_Description: diffDays < 0 
              ? `Trade registration overdue by ${Math.abs(diffDays)} days`
              : `Trade registration expiring in ${diffDays} days`,
            Registration_Type: 'Trade',
            Worker_ID: reg.Worker_ID,
            Department_Code: reg.Department_Code,
            Department_Name: dept?.Department_Name || 'Unknown',
            Trade_Code: reg.Trade_Code,
            Trade_Name: trade?.Trade_Name || 'Unknown',
            Enrollment_Date: reg.Enrollment_Date,
            Validity_Date: reg.Validity_Date,
            Days_Remaining: diffDays,
            Status: reg.Status,
            Remarks: reg.Remarks || '',
            Record_Date: reg.Record_Date
          });
        }
      }
    });
    
    // Process training registrations
    trainingRegisters.forEach(reg => {
      if (reg.Status === 'Active' && reg.Validity_Date) {
        const validity = new Date(reg.Validity_Date);
        const diffTime = validity - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0 || diffDays <= 7) {
          const dept = departments.find(d => d.Department_code === reg.Department_Code);
          
          report.push({
            Alert_Type: diffDays < 0 ? 'OVERDUE' : 'EXPIRING',
            Alert_Description: diffDays < 0 
              ? `Training registration overdue by ${Math.abs(diffDays)} days`
              : `Training registration expiring in ${diffDays} days`,
            Registration_Type: 'Training',
            Worker_ID: reg.Worker_ID,
            Department_Code: reg.Department_Code,
            Department_Name: dept?.Department_Name || 'Unknown',
            Trade_Code: reg.Trade_Code,
            Trade_Name: 'Training Program',
            Enrollment_Date: reg.Enrollment_Date,
            Validity_Date: reg.Validity_Date,
            Days_Remaining: diffDays,
            Status: reg.Status,
            Remarks: reg.Remarks || '',
            Record_Date: reg.Record_Date
          });
        }
      }
    });
    
    return report.sort((a, b) => {
      // Sort by alert type (overdue first), then by days remaining
      if (a.Alert_Type !== b.Alert_Type) {
        return a.Alert_Type === 'OVERDUE' ? -1 : 1;
      }
      return a.Days_Remaining - b.Days_Remaining;
    });
  };

  // Apply filters
  const filteredData = reportData.filter(item => {
    const deptMatch = !filters.departmentCode || item.Department_Code === filters.departmentCode;
    const tradeMatch = !filters.tradeCode || item.Trade_Code === filters.tradeCode;
    const statusMatch = !filters.status || item.Status === filters.status;
    
    let validityAlertMatch = true;
    if (filters.validityAlert && selectedReport === 'alert-wise') {
      switch (filters.validityAlert) {
        case 'overdue':
          validityAlertMatch = item.Alert_Type === 'OVERDUE';
          break;
        case 'expiring':
          validityAlertMatch = item.Alert_Type === 'EXPIRING';
          break;
        default:
          validityAlertMatch = true;
      }
    }
    
    let dateMatch = true;
    if (filters.dateRange && item.Record_Date) {
      const [start, end] = filters.dateRange.split(' to ');
      const recordDate = new Date(item.Record_Date);
      const startDate = new Date(start);
      const endDate = new Date(end);
      dateMatch = recordDate >= startDate && recordDate <= endDate;
    }

    return deptMatch && tradeMatch && statusMatch && validityAlertMatch && dateMatch;
  });

  // Apply sorting
  const sortedData = [...filteredData].sort((a, b) => {
    const { key, direction } = sortConfig;
    let aValue = a[key];
    let bValue = b[key];

    if (key === 'Record_Date' || key === 'Enrollment_Date' || key === 'Validity_Date') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
      return direction === 'asc' ? aValue - bValue : bValue - aValue;
    }

    if (typeof aValue === 'string') {
      return direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    } else {
      return direction === 'asc' ? aValue - bValue : bValue - aValue;
    }
  });

  // Pagination
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = sortedData.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(sortedData.length / recordsPerPage);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      departmentCode: '',
      tradeCode: '',
      status: '',
      validityAlert: '',
      dateRange: ''
    });
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Excel export functionality
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(sortedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, getReportTitle());
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${getReportTitle()}_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return {
          backgroundColor: '#d4edda',
          color: '#155724',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '0.8rem',
          fontWeight: '600',
          textAlign: 'center'
        };
      case 'inactive':
        return {
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '0.8rem',
          fontWeight: '600',
          textAlign: 'center'
        };
      case 'completed':
        return {
          backgroundColor: '#d1ecf1',
          color: '#0c5460',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '0.8rem',
          fontWeight: '600',
          textAlign: 'center'
        };
      case 'suspended':
        return {
          backgroundColor: '#fff3cd',
          color: '#856404',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '0.8rem',
          fontWeight: '600',
          textAlign: 'center'
        };
      default:
        return {
          backgroundColor: '#e2e3e5',
          color: '#383d41',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '0.8rem',
          fontWeight: '600',
          textAlign: 'center'
        };
    }
  };

  const getAlertStyle = (alertType) => {
    switch (alertType) {
      case 'OVERDUE':
        return {
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '0.8rem',
          fontWeight: '600',
          textAlign: 'center',
          border: '2px solid #dc3545'
        };
      case 'EXPIRING':
        return {
          backgroundColor: '#fff3cd',
          color: '#856404',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '0.8rem',
          fontWeight: '600',
          textAlign: 'center',
          border: '2px solid #ffc107'
        };
      default:
        return {
          backgroundColor: '#e2e3e5',
          color: '#383d41',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '0.8rem',
          fontWeight: '600',
          textAlign: 'center'
        };
    }
  };

  const getReportColumns = () => {
    switch (selectedReport) {
      case 'department-wise':
        return [
          { key: 'Department_Code', label: 'Department Code' },
          { key: 'Department_Name', label: 'Department Name' },
          { key: 'Trade_Code', label: 'Trade Code' },
          { key: 'Trade_Name', label: 'Trade Name' },
          { key: 'Active_Count', label: 'Active' },
          { key: 'Inactive_Count', label: 'Inactive' },
          { key: 'Completed_Count', label: 'Completed' },
          { key: 'Suspended_Count', label: 'Suspended' },
          { key: 'Expiring_Count', label: 'Expiring Soon' },
          { key: 'Valid_Count', label: 'Valid' }
        ];
      case 'trade-wise':
        return [
          { key: 'Trade_Code', label: 'Trade Code' },
          { key: 'Trade_Name', label: 'Trade Name' },
          { key: 'Department_Code', label: 'Department Code' },
          { key: 'Department_Name', label: 'Department Name' },
          { key: 'Active_Count', label: 'Active' },
          { key: 'Inactive_Count', label: 'Inactive' },
          { key: 'Completed_Count', label: 'Completed' },
          { key: 'Suspended_Count', label: 'Suspended' },
          { key: 'Expiring_Count', label: 'Expiring Soon' },
          { key: 'Valid_Count', label: 'Valid' }
        ];
      case 'alert-wise':
        return [
          { key: 'Alert_Type', label: 'Alert Type' },
          { key: 'Alert_Description', label: 'Alert Description' },
          { key: 'Registration_Type', label: 'Registration Type' },
          { key: 'Worker_ID', label: 'Worker ID' },
          { key: 'Department_Code', label: 'Department Code' },
          { key: 'Department_Name', label: 'Department Name' },
          { key: 'Trade_Code', label: 'Trade Code' },
          { key: 'Trade_Name', label: 'Trade Name' },
          { key: 'Enrollment_Date', label: 'Enrollment Date' },
          { key: 'Validity_Date', label: 'Validity Date' },
          { key: 'Days_Remaining', label: 'Days Remaining' },
          { key: 'Status', label: 'Status' },
          { key: 'Remarks', label: 'Remarks' }
        ];
      default:
        return [];
    }
  };

  const getReportTitle = () => {
    switch (selectedReport) {
      case 'department-wise':
        return 'Department-wise Reports';
      case 'trade-wise':
        return 'Trade-wise Reports';
      case 'alert-wise':
        return 'Alert-wise Reports';
      default:
        return 'Reports';
    }
  };

  if (loading) {
    return <div className="content-area">Loading reports...</div>;
  }

  if (error) {
    return <div className="content-area">Error: {error}</div>;
  }

  return (
    <div className="content-area">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: '#8B4513' }}>Reports & Analytics</h2>
        <button 
          className="btn btn-success" 
          onClick={exportToExcel}
          disabled={sortedData.length === 0}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          📊 Export to Excel
        </button>
      </div>

      {/* Report Type Selection */}
      <div style={{ marginBottom: '2rem' }}>
        <label style={{ fontWeight: '500', marginRight: '1rem' }}>Report Type:</label>
        <select 
          value={selectedReport} 
          onChange={(e) => setSelectedReport(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ced4da', minWidth: '250px' }}
        >
          {REPORT_TYPES.map(type => (
            <option key={type.key} value={type.key}>{type.label}</option>
          ))}
        </select>
      </div>

      {/* Filters Section */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '1rem', 
        borderRadius: '8px', 
        marginBottom: '2rem',
        border: '1px solid #dee2e6'
      }}>
        <h4 style={{ marginBottom: '1rem', color: '#495057' }}>Filters</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Department</label>
            <select
              name="departmentCode"
              value={filters.departmentCode}
              onChange={handleFilterChange}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.Department_code} value={dept.Department_code}>
                  {dept.Department_code} - {dept.Department_Name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Trade</label>
            <select
              name="tradeCode"
              value={filters.tradeCode}
              onChange={handleFilterChange}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
            >
              <option value="">All Trades</option>
              {trades.map(trade => (
                <option key={trade.Trade_Code} value={trade.Trade_Code}>
                  {trade.Trade_Code} - {trade.Trade_Name}
                </option>
              ))}
            </select>
          </div>

          {selectedReport === 'alert-wise' && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Alert Type</label>
              <select
                name="validityAlert"
                value={filters.validityAlert}
                onChange={handleFilterChange}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
              >
                <option value="">All Alerts</option>
                <option value="overdue">Overdue</option>
                <option value="expiring">Expiring Soon</option>
              </select>
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Date Range</label>
            <select
              name="dateRange"
              value={filters.dateRange}
              onChange={handleFilterChange}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
            >
              <option value="">All Dates</option>
              <option value="2024-01-01 to 2024-03-31">Q1 2024</option>
              <option value="2024-04-01 to 2024-06-30">Q2 2024</option>
              <option value="2024-07-01 to 2024-09-30">Q3 2024</option>
              <option value="2024-10-01 to 2024-12-31">Q4 2024</option>
            </select>
          </div>
        </div>
        
        <div style={{ marginTop: '1rem' }}>
          <button 
            onClick={clearFilters}
            className="btn btn-secondary"
            style={{ marginRight: '1rem' }}
          >
            Clear Filters
          </button>
          <span style={{ color: '#6c757d', fontSize: '0.9rem' }}>
            Showing {sortedData.length} records
          </span>
        </div>
      </div>

      {/* Report Title */}
      <h3 style={{ color: '#495057', marginBottom: '1rem' }}>{getReportTitle()}</h3>

      {/* Report Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {getReportColumns().map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  {col.label} {sortConfig.key === col.key && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentRecords.length === 0 ? (
              <tr>
                <td colSpan={getReportColumns().length} style={{ textAlign: 'center', color: '#A0522D' }}>
                  No records found
                </td>
              </tr>
            ) : (
              currentRecords.map((record, index) => (
                <tr key={`${record.Department_Code || record.Trade_Code || index}-${record.Trade_Code || record.Department_Code || index}`}>
                  {getReportColumns().map(col => (
                    <td key={col.key}>
                      {col.key === 'Alert_Type' ? (
                        <div style={getAlertStyle(record[col.key])}>
                          {record[col.key]}
                        </div>
                      ) : col.key === 'Status' ? (
                        <div style={getStatusStyle(record[col.key])}>
                          {record[col.key]}
                        </div>
                      ) : col.key === 'Enrollment_Date' || col.key === 'Validity_Date' || col.key === 'Record_Date' ? (
                        record[col.key] ? new Date(record[col.key]).toLocaleDateString() : 'N/A'
                      ) : col.key === 'Days_Remaining' ? (
                        <span style={{ 
                          color: record[col.key] < 0 ? '#dc3545' : record[col.key] <= 7 ? '#ffc107' : '#28a745',
                          fontWeight: '600'
                        }}>
                          {record[col.key]}
                        </span>
                      ) : (
                        record[col.key] || 'N/A'
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {sortedData.length > 0 && (
        <div className="pagination-container" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <div style={{ color: '#6c757d' }}>
            Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, sortedData.length)} of {sortedData.length} records
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem' 
          }}>
            <button 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{ 
                padding: '0.5rem 1rem',
                border: '1px solid #6c757d',
                borderRadius: '6px',
                backgroundColor: currentPage === 1 ? '#e9ecef' : 'white',
                color: currentPage === 1 ? '#6c757d' : '#6c757d',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '400',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 'auto'
              }}
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(pageNumber => (
              <button
                key={pageNumber}
                onClick={() => handlePageChange(pageNumber)}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #6c757d',
                  borderRadius: '6px',
                  backgroundColor: currentPage === pageNumber ? '#8B4513' : 'white',
                  color: currentPage === pageNumber ? 'white' : '#6c757d',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '400',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 0.125rem'
                }}
              >
                {pageNumber}
              </button>
            ))}
            
            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{ 
                padding: '0.5rem 1rem',
                border: '1px solid #6c757d',
                borderRadius: '6px',
                backgroundColor: currentPage === totalPages ? '#e9ecef' : 'white',
                color: currentPage === totalPages ? '#6c757d' : '#6c757d',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '400',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 'auto'
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports; 
