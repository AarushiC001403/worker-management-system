import React, { useState, useEffect } from 'react';

const Worker = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  // Remove Worker_ID from formData
  const [formData, setFormData] = useState({
    Worker_ID: '',
    Age: '',
    Gender: '',
    Address: '',
    State: '',
    Qualification: '',
    Skill: '',
    Aadhar_Number: '',
    PF_Number: '',
    Blood_Group: '',
    Remarks: ''
  });

  // Filter and sort states
  const [filters, setFilters] = useState({
    name: '',
    gender: '',
    state: '',
    bloodGroup: '',
    ageRange: ''
  });

  const [sortConfig, setSortConfig] = useState({
    key: 'Worker_ID',
    direction: 'desc'
  });

  // Remove any sample data arrays or objects. Only use useState([]) for workers.
  const [states, setStates] = useState([]);
  const [bloodGroups, setBloodGroups] = useState([]);

  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);

  // Add static arrays for Indian states and blood groups
  const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir',
    'Ladakh', 'Puducherry', 'Chandigarh', 'Andaman and Nicobar Islands',
    'Dadra and Nagar Haveli and Daman and Diu', 'Lakshadweep'
  ];
  const BLOOD_GROUPS = [
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
  ];

  // API functions
  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/workers');
      if (!response.ok) {
        throw new Error('Failed to fetch workers');
      }
      const data = await response.json();
      setWorkers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addWorker = async (workerData) => {
    try {
      const response = await fetch('http://localhost:5001/api/workers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workerData),
      });
      if (!response.ok) {
        throw new Error('Failed to add worker');
      }
      await fetchWorkers();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const updateWorker = async (id, workerData) => {
    try {
      const response = await fetch(`http://localhost:5001/api/workers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workerData),
      });
      if (!response.ok) {
        throw new Error('Failed to update worker');
      }
      await fetchWorkers();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const deleteWorker = async (id) => {
    try {
      const response = await fetch(`http://localhost:5001/api/workers/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete worker');
      }
      await fetchWorkers();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  // Load workers on component mount
  useEffect(() => {
    fetchWorkers();
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
      name: '',
      gender: '',
      state: '',
      bloodGroup: '',
      ageRange: ''
    });
  };

  // Apply filters and sorting
  const filteredAndSortedWorkers = workers
    .filter(worker => {
      const nameMatch = worker.Worker_ID.toString().toLowerCase().includes(filters.name.toLowerCase());
      const genderMatch = !filters.gender || worker.Gender === filters.gender;
      const stateMatch = !filters.state || worker.State === filters.state;
      const bloodGroupMatch = !filters.bloodGroup || worker.Blood_Group === filters.bloodGroup;
      
      let ageMatch = true;
      if (filters.ageRange) {
        const [min, max] = filters.ageRange.split('-').map(Number);
        ageMatch = worker.Age >= min && worker.Age <= max;
      }

      return nameMatch && genderMatch && stateMatch && bloodGroupMatch && ageMatch;
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

  // Add pagination logic after the filteredAndSortedWorkers calculation
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredAndSortedWorkers.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredAndSortedWorkers.length / recordsPerPage);

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
    if (editingWorker) {
      success = await updateWorker(editingWorker.Worker_ID, formData);
    } else {
      success = await addWorker(formData);
    }
    
    if (success) {
      resetForm();
    }
  };

  const handleEdit = (worker) => {
    setEditingWorker(worker);
    setFormData({
      Worker_ID: worker.Worker_ID,
      Age: worker.Age,
      Gender: worker.Gender,
      Address: worker.Address,
      State: worker.State,
      Qualification: worker.Qualification,
      Skill: worker.Skill,
      Aadhar_Number: worker.Aadhar_Number,
      PF_Number: worker.PF_Number,
      Blood_Group: worker.Blood_Group,
      Remarks: worker.Remarks || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this worker?')) {
      await deleteWorker(id);
    }
  };

  const resetForm = () => {
    setFormData({
      Worker_ID: '',
      Age: '',
      Gender: '',
      Address: '',
      State: '',
      Qualification: '',
      Skill: '',
      Aadhar_Number: '',
      PF_Number: '',
      Blood_Group: '',
      Remarks: ''
    });
    setEditingWorker(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="content-area">Loading workers...</div>;
  }

  if (error) {
    return <div className="content-area">Error: {error}</div>;
  }

  return (
    <div className="content-area">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: '#8B4513' }}>Worker Management</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowForm(true)}
        >
          Add New Worker
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
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Worker ID</label>
            <input
              type="text"
              name="name"
              value={filters.name}
              onChange={handleFilterChange}
              placeholder="Search by worker ID..."
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Gender</label>
            <select
              name="gender"
              value={filters.gender}
              onChange={handleFilterChange}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>State</label>
            <select
              name="state"
              value={filters.state}
              onChange={handleFilterChange}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
            >
              <option value="">All States</option>
              {INDIAN_STATES.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Blood Group</label>
            <select
              name="bloodGroup"
              value={filters.bloodGroup}
              onChange={handleFilterChange}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
            >
              <option value="">All Blood Groups</option>
              {BLOOD_GROUPS.map(bg => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Age Range</label>
            <select
              name="ageRange"
              value={filters.ageRange}
              onChange={handleFilterChange}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
            >
              <option value="">All Ages</option>
              <option value="18-25">18-25</option>
              <option value="26-35">26-35</option>
              <option value="36-45">36-45</option>
              <option value="46-55">46-55</option>
              <option value="56-65">56-65</option>
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
            Showing {filteredAndSortedWorkers.length} of {workers.length} workers
          </span>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingWorker ? 'Edit Worker' : 'Add New Worker'}
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
                  <label htmlFor="Age">Age *</label>
                  <input
                    type="number"
                    id="Age"
                    name="Age"
                    value={formData.Age}
                    onChange={handleInputChange}
                    min="18"
                    max="65"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="Gender">Gender *</label>
                  <select
                    id="Gender"
                    name="Gender"
                    value={formData.Gender}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="State">State *</label>
                  <select
                    id="State"
                    name="State"
                    value={formData.State}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="Blood_Group">Blood Group *</label>
                  <select
                    id="Blood_Group"
                    name="Blood_Group"
                    value={formData.Blood_Group}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Blood Group</option>
                    {BLOOD_GROUPS.map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="Aadhar_Number">AADHAR Number *</label>
                  <input
                    type="text"
                    id="Aadhar_Number"
                    name="Aadhar_Number"
                    value={formData.Aadhar_Number}
                    onChange={handleInputChange}
                    pattern="[0-9]{12}"
                    maxLength="12"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="PF_Number">PF Number *</label>
                  <input
                    type="text"
                    id="PF_Number"
                    name="PF_Number"
                    value={formData.PF_Number}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row full-width">
                <div className="form-group">
                  <label htmlFor="Address">Address *</label>
                  <textarea
                    id="Address"
                    name="Address"
                    value={formData.Address}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row full-width">
                <div className="form-group">
                  <label htmlFor="Qualification">Qualification *</label>
                  <input
                    type="text"
                    id="Qualification"
                    name="Qualification"
                    value={formData.Qualification}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row full-width">
                <div className="form-group">
                  <label htmlFor="Skill">Skills *</label>
                  <textarea
                    id="Skill"
                    name="Skill"
                    value={formData.Skill}
                    onChange={handleInputChange}
                    placeholder="Enter skills separated by commas"
                    required
                  />
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
                    placeholder="Additional notes about the worker"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="submit" className="btn btn-primary">
                  {editingWorker ? 'Update Worker' : 'Add Worker'}
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
                onClick={() => handleSort('Age')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                Age {sortConfig.key === 'Age' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => handleSort('Gender')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                Gender {sortConfig.key === 'Gender' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => handleSort('State')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                State {sortConfig.key === 'State' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => handleSort('Blood_Group')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                Blood Group {sortConfig.key === 'Blood_Group' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => handleSort('Aadhar_Number')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                AADHAR {sortConfig.key === 'Aadhar_Number' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => handleSort('PF_Number')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                PF Number {sortConfig.key === 'PF_Number' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {workers.length === 0 && Object.values(filters).every(v => !v) ? null :
              filteredAndSortedWorkers.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', color: '#A0522D' }}>Worker not found</td></tr>
              ) : (
                currentRecords.map(worker => (
                  <tr key={worker.Worker_ID}>
                    <td>{worker.Worker_ID}</td>
                    <td>{worker.Age}</td>
                    <td>{worker.Gender}</td>
                    <td>{worker.State}</td>
                    <td>{worker.Blood_Group}</td>
                    <td>{worker.Aadhar_Number}</td>
                    <td>{worker.PF_Number}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEdit(worker)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(worker.Worker_ID)}
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
      {filteredAndSortedWorkers.length > 0 && (
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
            Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, filteredAndSortedWorkers.length)} of {filteredAndSortedWorkers.length} records
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

export default Worker; 
