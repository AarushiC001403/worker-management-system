import React, { useState, useEffect } from 'react';

const TrainingRegister = () => {
  const [trainingRegisters, setTrainingRegisters] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState(null);
  const [formData, setFormData] = useState({
    Worker_ID: '',
    Department_Code: '',
    Training_Code: '',
    Validity_Date: '',
    Status: 'Active',
    Remarks: ''
  });

  // Filter and sort states
  const [filters, setFilters] = useState({
    workerId: '',
    departmentCode: '',
    trainingCode: '',
    status: '',
    dateRange: '',
    validityAlert: ''
  });

  const [sortConfig, setSortConfig] = useState({
    key: 'Record_Date',
    direction: 'desc'
  });

  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);

  const statuses = ['Active', 'Inactive', 'Completed', 'Suspended'];

  // API functions
  const fetchTrainingRegisters = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/training-registers');
      if (!response.ok) {
        throw new Error('Failed to fetch training registrations');
      }
      const data = await response.json();
      setTrainingRegisters(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchWorkers = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/workers');
      if (!response.ok) {
        throw new Error('Failed to fetch workers');
      }
      const data = await response.json();
      setWorkers(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/departments');
      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }
      const data = await response.json();
      setDepartments(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchTrainings = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/trainings');
      if (!response.ok) {
        throw new Error('Failed to fetch trainings');
      }
      const data = await response.json();
      setTrainings(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const addTrainingRegistration = async (registrationData) => {
    try {
      const response = await fetch('http://localhost:5001/api/training-registers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });
      if (!response.ok) {
        throw new Error('Failed to add training registration');
      }
      await fetchTrainingRegisters();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const updateTrainingRegistration = async (id, registrationData) => {
    try {
      const response = await fetch(`http://localhost:5001/api/training-registers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });
      if (!response.ok) {
        throw new Error('Failed to update training registration');
      }
      await fetchTrainingRegisters();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const deleteTrainingRegistration = async (id, recordDate) => {
    try {
      const response = await fetch(`http://localhost:5001/api/training-registers/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ Record_Date: recordDate }),
      });
      if (!response.ok) {
        throw new Error('Failed to delete training registration');
      }
      await fetchTrainingRegisters();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchTrainingRegisters(),
          fetchWorkers(),
          fetchDepartments(),
          fetchTrainings()
        ]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, []);

  // Filter and sort functions
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const clearFilters = () => {
    setFilters({
      workerId: '',
      departmentCode: '',
      trainingCode: '',
      status: '',
      dateRange: '',
      validityAlert: ''
    });
  };

  // Apply filters and sorting with special status handling
  const filteredAndSortedRegistrations = trainingRegisters
    .filter(registration => {
      const workerMatch = registration.Worker_ID.toString().toLowerCase().includes(filters.workerId.toLowerCase());
      const deptMatch = !filters.departmentCode || registration.Department_Code === filters.departmentCode;
      const trainingMatch = !filters.trainingCode || registration.Training_Code.toString() === filters.trainingCode;
      const statusMatch = !filters.status || registration.Status === filters.status;
      
      let dateMatch = true;
      if (filters.dateRange) {
        const [start, end] = filters.dateRange.split(' to ');
        const recordDate = new Date(registration.Record_Date);
        const startDate = new Date(start);
        const endDate = new Date(end);
        dateMatch = recordDate >= startDate && recordDate <= endDate;
      }

      let validityAlertMatch = true;
      if (filters.validityAlert && registration.Validity_Date) {
        const today = new Date();
        const validity = new Date(registration.Validity_Date);
        const diffTime = validity - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        switch (filters.validityAlert) {
          case 'overdue':
            validityAlertMatch = diffDays < 0;
            break;
          case 'expiring':
            validityAlertMatch = diffDays >= 0 && diffDays <= 7;
            break;
          case 'valid':
            validityAlertMatch = diffDays > 7;
            break;
          default:
            validityAlertMatch = true;
        }
      }

      return workerMatch && deptMatch && trainingMatch && statusMatch && dateMatch && validityAlertMatch;
    })
    .sort((a, b) => {
      // Special sorting for status - Active records first, then others
      if (sortConfig.key === 'Status') {
        const aActive = a.Status === 'Active';
        const bActive = b.Status === 'Active';
        
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
        
        // If both have same active status, sort by status name
        return sortConfig.direction === 'asc' 
          ? a.Status.localeCompare(b.Status)
          : b.Status.localeCompare(a.Status);
      }
      
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (sortConfig.key === 'Record_Date') {
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
      }
      
      if (typeof aValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

  // Add pagination logic after the filteredAndSortedRegistrations calculation
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredAndSortedRegistrations.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredAndSortedRegistrations.length / recordsPerPage);

  // Pagination functions
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let success = false;
    if (editingRegistration) {
      const updateData = {
      ...formData,
      Record_Date: editingRegistration.Record_Date.split('T')[0]
      };
      success = await updateTrainingRegistration(editingRegistration.Worker_ID, updateData);
    } else {
      success = await addTrainingRegistration(formData);
    }
    
    if (success) {
      resetForm();
    }
  };

  const handleEdit = (registration) => {
    setEditingRegistration(registration);
    setFormData({
      Worker_ID: registration.Worker_ID.toString(),
      Department_Code: registration.Department_Code,
      Training_Code: registration.Training_Code.toString(),
      Validity_Date: registration.Validity_Date ? new Date(registration.Validity_Date).toISOString().split('T')[0] : '',
      Status: registration.Status,
      Remarks: registration.Remarks || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id, recordDate) => {
    if (window.confirm('Are you sure you want to delete this training registration?')) {
      await deleteTrainingRegistration(id, recordDate);
    }
  };

  const resetForm = () => {
    setFormData({
      Worker_ID: '',
      Department_Code: '',
      Training_Code: '',
      Validity_Date: '',
      Status: 'Active',
      Remarks: ''
    });
    setEditingRegistration(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="content-area">Loading training registrations...</div>;
  }

  if (error) {
    return <div className="content-area">Error: {error}</div>;
  }

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

  const getValidityAlertStyle = (validityDate) => {
    if (!validityDate) return null;
    
    const today = new Date();
    const validity = new Date(validityDate);
    const diffTime = validity - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
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
    } else if (diffDays <= 7) {
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
    } else {
      return {
        backgroundColor: '#d4edda',
        color: '#155724',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '0.8rem',
        fontWeight: '600',
        textAlign: 'center'
      };
    }
  };

  const getValidityAlertText = (validityDate) => {
    if (!validityDate) return 'No Date';
    
    const today = new Date();
    const validity = new Date(validityDate);
    const diffTime = validity - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `OVERDUE (${Math.abs(diffDays)} days)`;
    } else if (diffDays <= 7) {
      return `EXPIRING (${diffDays} days)`;
    } else {
      return 'VALID';
    }
  };

  return (
    <div className="content-area">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: '#8B4513' }}>Training Register Management</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowForm(true)}
        >
          Add New Registration
        </button>
      </div>

      {/* Validity Alerts Summary */}
      {(() => {
        const today = new Date();
        const overdueCount = trainingRegisters.filter(reg => {
          if (!reg.Validity_Date) return false;
          const validity = new Date(reg.Validity_Date);
          return validity < today;
        }).length;
        
        const expiringCount = trainingRegisters.filter(reg => {
          if (!reg.Validity_Date) return false;
          const validity = new Date(reg.Validity_Date);
          const diffTime = validity - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 7;
        }).length;

        if (overdueCount > 0 || expiringCount > 0) {
          return (
            <div style={{ 
              backgroundColor: '#fff3cd', 
              border: '1px solid #ffeaa7', 
              borderRadius: '8px', 
              padding: '1rem', 
              marginBottom: '2rem' 
            }}>
              <h4 style={{ color: '#856404', marginBottom: '0.5rem' }}>⚠️ Training Validity Alerts</h4>
              <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem' }}>
                {overdueCount > 0 && (
                  <span style={{ color: '#721c24', fontWeight: '600' }}>
                    🔴 {overdueCount} training registration(s) overdue
                  </span>
                )}
                {expiringCount > 0 && (
                  <span style={{ color: '#856404', fontWeight: '600' }}>
                    🟡 {expiringCount} training registration(s) expiring within 7 days
                  </span>
                )}
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Filter Section */}
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
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Department Code</label>
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
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Training Code</label>
            <select
              name="trainingCode"
              value={filters.trainingCode}
              onChange={handleFilterChange}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
            >
              <option value="">All Trainings</option>
              {trainings.map(training => (
                <option key={training.Training_Code} value={training.Training_Code}>
                  {training.Training_Code} - {training.Training_Name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
            >
              <option value="">All Statuses</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
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
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Validity Alert</label>
            <select
              name="validityAlert"
              value={filters.validityAlert}
              onChange={handleFilterChange}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
            >
              <option value="">All Validity Status</option>
              <option value="overdue">Overdue</option>
              <option value="expiring">Expiring Soon (&le;7 days)</option>
              <option value="valid">Valid (&gt;7 days)</option>
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
            Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, filteredAndSortedRegistrations.length)} of {filteredAndSortedRegistrations.length} registrations
          </span>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingRegistration ? 'Edit Training Registration' : 'Add New Training Registration'}
              </h3>
              <button className="modal-close" onClick={resetForm}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="form-container">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="Worker_ID">Worker ID *</label>
                  <input
                    type="text"
                    id="Worker_ID"
                    name="Worker_ID"
                    value={formData.Worker_ID}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="Department_Code">Department Code *</label>
                  <input
                    type="text"
                    id="Department_Code"
                    name="Department_Code"
                    value={formData.Department_Code}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="Training_Code">Training Code *</label>
                  <input
                    type="text"
                    id="Training_Code"
                    name="Training_Code"
                    value={formData.Training_Code}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="Validity_Date">Validity Date *</label>
                  <input
                    type="date"
                    id="Validity_Date"
                    name="Validity_Date"
                    value={formData.Validity_Date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="Status">Status *</label>
                  <select
                    id="Status"
                    name="Status"
                    value={formData.Status}
                    onChange={handleInputChange}
                    required
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row full-width">
                <div className="form-group">
                  <label htmlFor="Remarks">Remarks</label>
                  <textarea
                    id="Remarks"
                    name="Remarks"
                    value={formData.Remarks}
                    onChange={handleInputChange}
                    placeholder="Additional notes about the training registration"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="submit" className="btn btn-primary">
                  {editingRegistration ? 'Update Registration' : 'Add Registration'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th 
                onClick={() => handleSort('Worker_ID')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                Worker ID {sortConfig.key === 'Worker_ID' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => handleSort('Record_Date')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                Record Date {sortConfig.key === 'Record_Date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => handleSort('Department_Code')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                Department Code {sortConfig.key === 'Department_Code' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => handleSort('Training_Code')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                Training Code {sortConfig.key === 'Training_Code' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => handleSort('Validity_Date')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                Validity Date {sortConfig.key === 'Validity_Date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => handleSort('Status')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                Status {sortConfig.key === 'Status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th>Remarks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {trainingRegisters.length === 0 && Object.values(filters).every(v => !v) ? null :
              filteredAndSortedRegistrations.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', color: '#A0522D' }}>Training registration not found</td></tr>
              ) : (
                currentRecords.map(registration => (
                  <tr key={`${registration.Worker_ID}-${registration.Record_Date}`}>
                    <td>{registration.Worker_ID}</td>
                    <td>{new Date(registration.Record_Date).toLocaleDateString()}</td>
                    <td>{registration.Department_Code}</td>
                    <td>{registration.Training_Code}</td>
                    <td>
                      <div style={getValidityAlertStyle(registration.Validity_Date)}>
                        {registration.Validity_Date ? new Date(registration.Validity_Date).toLocaleDateString() : 'No Date'}
                      </div>
                      <div style={{ fontSize: '0.7rem', marginTop: '2px', textAlign: 'center' }}>
                        {getValidityAlertText(registration.Validity_Date)}
                      </div>
                    </td>
                    <td style={getStatusStyle(registration.Status)}>
                      {registration.Status}
                    </td>
                    <td>{registration.Remarks}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEdit(registration)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(registration.Worker_ID, registration.Record_Date)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )
            }
          </tbody>
        </table>
      </div>
      {filteredAndSortedRegistrations.length > 0 && (
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
            Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, filteredAndSortedRegistrations.length)} of {filteredAndSortedRegistrations.length} records
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem' 
          }}>
            <button 
              onClick={handlePreviousPage}
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
                  width : '38px',
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
              onClick={handleNextPage}
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

export default TrainingRegister; 
