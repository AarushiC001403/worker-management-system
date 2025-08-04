import React, { useState, useEffect } from 'react';

const REPORT_TYPES = [
  { key: 'worker-history', label: 'Worker-wise Training History' },
  { key: 'department-workers', label: 'Department-wise Workers List' },
  { key: 'active-workers', label: 'Active Workers List' }
];

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('worker-history');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [tradeRegisters, setTradeRegisters] = useState([]);
  const [trainingRegisters, setTrainingRegisters] = useState([]);

  // Filter states
  const [filters, setFilters] = useState({
    workerId: '',
    departmentCode: '',
    status: '',
    dateRange: ''
  });

  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: 'Worker_ID',
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
        const [workersRes, deptsRes, tradesRes, trainingsRes] = await Promise.all([
          fetch('http://localhost:5001/api/workers'),
          fetch('http://localhost:5001/api/departments'),
          fetch('http://localhost:5001/api/trade-registers'),
          fetch('http://localhost:5001/api/training-registers')
        ]);

        const [workersData, deptsData, tradesData, trainingsData] = await Promise.all([
          workersRes.json(),
          deptsRes.json(),
          tradesRes.json(),
          trainingsRes.json()
        ]);

        setWorkers(workersData);
        setDepartments(deptsData);
        setTradeRegisters(tradesData);
        setTrainingRegisters(trainingsData);
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
    if (!workers.length) return;

    let data = [];
    
    switch (selectedReport) {
      case 'worker-history':
        data = generateWorkerHistory();
        break;
      case 'department-workers':
        data = generateDepartmentWorkers();
        break;
      case 'active-workers':
        data = generateActiveWorkers();
        break;
      default:
        data = [];
    }

    setReportData(data);
    setCurrentPage(1); // Reset to first page when report changes
  }, [selectedReport, workers, departments, tradeRegisters, trainingRegisters]);

  const generateWorkerHistory = () => {
    if (!filters.workerId) return [];
    
    const workerId = parseInt(filters.workerId);
    const worker = workers.find(w => w.Worker_ID === workerId);
    if (!worker) return [];

    const workerTrades = tradeRegisters.filter(tr => tr.Worker_ID === workerId);
    const workerTrainings = trainingRegisters.filter(tr => tr.Worker_ID === workerId);

    const history = [];

    // Add trade registrations
    workerTrades.forEach(trade => {
      const dept = departments.find(d => d.Department_code === trade.Department_Code);
      history.push({
        ...trade,
        Type: 'Trade',
        Department_Name: dept?.Department_Name || 'Unknown',
        Record_Type: 'Trade Registration'
      });
    });

    // Add training registrations
    workerTrainings.forEach(training => {
      const dept = departments.find(d => d.Department_code === training.Department_Code);
      history.push({
        ...training,
        Type: 'Training',
        Department_Name: dept?.Department_Name || 'Unknown',
        Record_Type: 'Training Registration'
      });
    });

    return history.sort((a, b) => new Date(b.Record_Date) - new Date(a.Record_Date));
  };

  const generateDepartmentWorkers = () => {
    return workers.map(worker => {
      const dept = departments.find(d => d.Department_code === worker.Department_Code);
      return {
        ...worker,
        Department_Name: dept?.Department_Name || 'Unknown'
      };
    });
  };

  const generateActiveWorkers = () => {
    return workers.filter(worker => worker.Status === 'Active');
  };

  // Apply filters
  const filteredData = reportData.filter(item => {
    if (selectedReport === 'worker-history') {
      return true; // Already filtered by worker ID
    }
    
    const workerMatch = !filters.workerId || item.Worker_ID?.toString() === filters.workerId;
    const deptMatch = !filters.departmentCode || item.Department_Code?.toString() === filters.departmentCode;
    const statusMatch = !filters.status || item.Status === filters.status;
    
    let dateMatch = true;
    if (filters.dateRange && item.Record_Date) {
      const [start, end] = filters.dateRange.split(' to ');
      const recordDate = new Date(item.Record_Date);
      const startDate = new Date(start);
      const endDate = new Date(end);
      dateMatch = recordDate >= startDate && recordDate <= endDate;
    }

    return workerMatch && deptMatch && statusMatch && dateMatch;
  });

  // Apply sorting
  const sortedData = [...filteredData].sort((a, b) => {
    const { key, direction } = sortConfig;
    let aValue = a[key];
    let bValue = b[key];

    if (key === 'Record_Date' || key === 'Validity_Date') {
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
      workerId: '',
      departmentCode: '',
      status: '',
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

  const getReportColumns = () => {
    switch (selectedReport) {
      case 'worker-history':
        return [
          { key: 'Record_Type', label: 'Record Type' },
          { key: 'Type', label: 'Type' },
          { key: 'Department_Name', label: 'Department' },
          { key: 'Record_Date', label: 'Record Date' },
          { key: 'Validity_Date', label: 'Validity Date' },
          { key: 'Status', label: 'Status' },
          { key: 'Remarks', label: 'Remarks' }
        ];
      case 'department-workers':
        return [
          { key: 'Worker_ID', label: 'Worker ID' },
          { key: 'Department_Name', label: 'Department' },
          { key: 'Age', label: 'Age' },
          { key: 'Gender', label: 'Gender' },
          { key: 'State', label: 'State' },
          { key: 'Qualification', label: 'Qualification' },
          { key: 'Status', label: 'Status' }
        ];
      case 'active-workers':
        return [
          { key: 'Worker_ID', label: 'Worker ID' },
          { key: 'Age', label: 'Age' },
          { key: 'Gender', label: 'Gender' },
          { key: 'State', label: 'State' },
          { key: 'Qualification', label: 'Qualification' },
          { key: 'Skill', label: 'Skill' },
          { key: 'Blood_Group', label: 'Blood Group' }
        ];
      default:
        return [];
    }
  };

  const getReportTitle = () => {
    switch (selectedReport) {
      case 'worker-history':
        return filters.workerId 
          ? `Training & Trade History for Worker ID: ${filters.workerId}`
          : 'Worker-wise Training History (Select Worker ID)';
      case 'department-workers':
        return 'Department-wise Workers List';
      case 'active-workers':
        return 'Active Workers List';
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
          {selectedReport === 'worker-history' && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Worker ID *</label>
              <select
                name="workerId"
                value={filters.workerId}
                onChange={handleFilterChange}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
              >
                <option value="">Select Worker ID</option>
                {workers.map(worker => (
                  <option key={worker.Worker_ID} value={worker.Worker_ID}>
                    {worker.Worker_ID} - {worker.State}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {selectedReport !== 'worker-history' && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Worker ID</label>
                <input
                  type="text"
                  name="workerId"
                  value={filters.workerId}
                  onChange={handleFilterChange}
                  placeholder="Search by worker ID..."
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
                />
              </div>
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
            </>
          )}

          {selectedReport !== 'active-workers' && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          )}

          {selectedReport === 'worker-history' && (
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
          )}
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
                  {selectedReport === 'worker-history' && !filters.workerId 
                    ? 'Please select a Worker ID to view history'
                    : 'No records found'
                  }
                </td>
              </tr>
            ) : (
              currentRecords.map((record, index) => (
                <tr key={`${record.Worker_ID || index}-${record.Record_Date || index}`}>
                  {getReportColumns().map(col => (
                    <td key={col.key}>
                      {col.key === 'Status' ? (
                        <div style={getStatusStyle(record.Status)}>
                          {record.Status}
                        </div>
                      ) : col.key === 'Record_Date' || col.key === 'Validity_Date' ? (
                        record[col.key] ? new Date(record[col.key]).toLocaleDateString() : 'N/A'
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
