import React, { useState, useEffect } from 'react';

const API_BASE = 'https://worker-management-system-backend-9aum.onrender.com';

const Training = () => {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingTraining, setEditingTraining] = useState(null);
  const [formData, setFormData] = useState({
    Training_Code: '',
    Training_Name: '',
    Frequency: '',
    Training_Incharge: ''
  });

  // Filter and sort states
  const [filters, setFilters] = useState({
    trainingCode: '',
    trainingName: '',
    frequency: '',
    trainingIncharge: ''
  });

  const [sortConfig, setSortConfig] = useState({
    key: 'Training_Name',
    direction: 'asc'
  });

  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);

  const frequencies = [
    '3 months',
    '6 months', 
    '12 months',
    '18 months',
    '24 months',
    'As needed'
  ];

  // API functions
  const fetchTrainings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/trainings`);
      if (!response.ok) {
        throw new Error('Failed to fetch trainings');
      }
      const data = await response.json();
      setTrainings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addTraining = async (trainingData) => {
    try {
      const response = await fetch(`${API_BASE}/api/trainings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trainingData),
      });
      if (!response.ok) {
        throw new Error('Failed to add training');
      }
      await fetchTrainings();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const updateTraining = async (id, trainingData) => {
    try {
      const response = await fetch(`${API_BASE}/api/trainings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trainingData),
      });
      if (!response.ok) {
        throw new Error('Failed to update training');
      }
      await fetchTrainings();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const deleteTraining = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/trainings/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete training');
      }
      await fetchTrainings();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  // Load trainings on component mount
  useEffect(() => {
    fetchTrainings();
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
      trainingCode: '',
      trainingName: '',
      frequency: '',
      trainingIncharge: ''
    });
  };

  // Apply filters and sorting
  const filteredAndSortedTrainings = trainings
    .filter(training => {
      const codeMatch = training.Training_Code.toString().toLowerCase().includes(filters.trainingCode.toLowerCase());
      const nameMatch = training.Training_Name.toLowerCase().includes(filters.trainingName.toLowerCase());
      const frequencyMatch = !filters.frequency || training.Frequency.toString() === filters.frequency;
      const inchargeMatch = training.Training_Incharge.toLowerCase().includes(filters.trainingIncharge.toLowerCase());

      return codeMatch && nameMatch && frequencyMatch && inchargeMatch;
    })
    .sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (typeof aValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

  // Add pagination logic after the filteredAndSortedTrainings calculation
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredAndSortedTrainings.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredAndSortedTrainings.length / recordsPerPage);

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
    if (editingTraining) {
      success = await updateTraining(editingTraining.Training_Code, formData);
    } else {
      success = await addTraining(formData);
    }
    
    if (success) {
      resetForm();
    }
  };

  const handleEdit = (training) => {
    setEditingTraining(training);
    setFormData({
      Training_Code: training.Training_Code,
      Training_Name: training.Training_Name,
      Frequency: training.Frequency.toString(),
      Training_Incharge: training.Training_Incharge
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this training program?')) {
      await deleteTraining(id);
    }
  };

  const resetForm = () => {
    setFormData({
      Training_Code: '',
      Training_Name: '',
      Frequency: '',
      Training_Incharge: ''
    });
    setEditingTraining(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="content-area">Loading trainings...</div>;
  }

  if (error) {
    return <div className="content-area">Error: {error}</div>;
  }

  return (
    <div className="content-area">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: '#8B4513' }}>Training Management</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowForm(true)}
        >
          Add New Training
        </button>
      </div>

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
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Training Code</label>
            <input
              type="text"
              name="trainingCode"
              value={filters.trainingCode}
              onChange={handleFilterChange}
              placeholder="Search by training code..."
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Training Name</label>
            <input
              type="text"
              name="trainingName"
              value={filters.trainingName}
              onChange={handleFilterChange}
              placeholder="Search by training name..."
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Frequency</label>
            <select
              name="frequency"
              value={filters.frequency}
              onChange={handleFilterChange}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
            >
              <option value="">All Frequencies</option>
              {frequencies.map(frequency => (
                <option key={frequency} value={frequency}>{frequency}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Training Incharge</label>
            <input
              type="text"
              name="trainingIncharge"
              value={filters.trainingIncharge}
              onChange={handleFilterChange}
              placeholder="Search by incharge..."
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
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
            Showing {filteredAndSortedTrainings.length} of {trainings.length} trainings
          </span>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingTraining ? 'Edit Training' : 'Add New Training'}
              </h3>
              <button className="modal-close" onClick={resetForm}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="form-container">
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
                  <label htmlFor="Training_Name">Training Name *</label>
                  <input
                    type="text"
                    id="Training_Name"
                    name="Training_Name"
                    value={formData.Training_Name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="Frequency">Frequency *</label>
                  <select
                    id="Frequency"
                    name="Frequency"
                    value={formData.Frequency}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Frequency</option>
                    {frequencies.map(frequency => (
                      <option key={frequency} value={frequency}>{frequency}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="Training_Incharge">Training Incharge *</label>
                  <input
                    type="text"
                    id="Training_Incharge"
                    name="Training_Incharge"
                    value={formData.Training_Incharge}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="submit" className="btn btn-primary">
                  {editingTraining ? 'Update Training' : 'Add Training'}
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
                onClick={() => handleSort('Training_Code')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                Training Code {sortConfig.key === 'Training_Code' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => handleSort('Training_Name')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                Training Name {sortConfig.key === 'Training_Name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => handleSort('Frequency')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                Frequency {sortConfig.key === 'Frequency' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => handleSort('Training_Incharge')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                Training Incharge {sortConfig.key === 'Training_Incharge' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {trainings.length === 0 && Object.values(filters).every(v => !v) ? null :
              filteredAndSortedTrainings.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: '#A0522D' }}>Training not found</td></tr>
              ) : (
                currentRecords.map(training => (
                  <tr key={training.Training_Code}>
                    <td>{training.Training_Code}</td>
                    <td>{training.Training_Name}</td>
                    <td>{training.Frequency}</td>
                    <td>{training.Training_Incharge}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEdit(training)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(training.Training_Code)}
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
      {filteredAndSortedTrainings.length > 0 && (
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
            Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, filteredAndSortedTrainings.length)} of {filteredAndSortedTrainings.length} records
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

export default Training; 
