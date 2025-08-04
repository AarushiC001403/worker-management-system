import React, { useState, useEffect } from 'react';

const Department = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    Department_code: '',
    Department_Name: '',
    Incharge: '',
    Max_Labour_Count: ''
  });

  // Filter and sort states
  const [filters, setFilters] = useState({
    departmentCode: '',
    departmentName: '',
    incharge: '',
    maxLabourCount: ''
  });

  const [sortConfig, setSortConfig] = useState({
    key: 'Department_Name',
    direction: 'asc'
  });

  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);

  // API functions
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/departments');
      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }
      const data = await response.json();
      setDepartments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addDepartment = async (departmentData) => {
    try {
      const response = await fetch('http://localhost:5001/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(departmentData),
      });
      if (!response.ok) {
        throw new Error('Failed to add department');
      }
      await fetchDepartments();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const updateDepartment = async (id, departmentData) => {
    try {
      const response = await fetch(`http://localhost:5001/api/departments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(departmentData),
      });
      if (!response.ok) {
        throw new Error('Failed to update department');
      }
      await fetchDepartments();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const deleteDepartment = async (id) => {
    try {
      const response = await fetch(`http://localhost:5001/api/departments/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete department');
      }
      await fetchDepartments();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  // Load departments on component mount
  useEffect(() => {
    fetchDepartments();
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
      departmentCode: '',
      departmentName: '',
      incharge: '',
      maxLabourCount: ''
    });
  };

  // Apply filters and sorting
  const filteredAndSortedDepartments = departments
    .filter(department => {
      const codeMatch = department.Department_code.toString().toLowerCase().includes(filters.departmentCode.toLowerCase());
      const nameMatch = department.Department_Name.toLowerCase().includes(filters.departmentName.toLowerCase());
      const inchargeMatch = department.Incharge.toLowerCase().includes(filters.incharge.toLowerCase());
      const labourCountMatch = !filters.maxLabourCount || department.Max_Labour_Count.toString() === filters.maxLabourCount;

      return codeMatch && nameMatch && inchargeMatch && labourCountMatch;
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

  // Add pagination logic after the filteredAndSortedDepartments calculation
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredAndSortedDepartments.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredAndSortedDepartments.length / recordsPerPage);

  // Page change function
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  //Previous Page function
  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  //Next Page function
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
    if (editingDepartment) {
      success = await updateDepartment(editingDepartment.Department_code, formData);
    } else {
      success = await addDepartment(formData);
    }
    
    if (success) {
      resetForm();
    }
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setFormData({
      Department_code: department.Department_code,
      Department_Name: department.Department_Name,
      Incharge: department.Incharge,
      Max_Labour_Count: department.Max_Labour_Count.toString()
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      await deleteDepartment(id);
    }
  };

  const resetForm = () => {
    setFormData({
      Department_code: '',
      Department_Name: '',
      Incharge: '',
      Max_Labour_Count: ''
    });
    setEditingDepartment(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="content-area">Loading departments...</div>;
  }

  if (error) {
    return <div className="content-area">Error: {error}</div>;
  }

  return (
    <div className="content-area">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: '#8B4513' }}>Department Management</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowForm(true)}
        >
          Add New Department
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
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Department Code</label>
            <input
              type="text"
              name="departmentCode"
              value={filters.departmentCode}
              onChange={handleFilterChange}
              placeholder="Search by department code..."
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Department Name</label>
            <input
              type="text"
              name="departmentName"
              value={filters.departmentName}
              onChange={handleFilterChange}
              placeholder="Search by department name..."
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Incharge</label>
            <input
              type="text"
              name="incharge"
              value={filters.incharge}
              onChange={handleFilterChange}
              placeholder="Search by incharge..."
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Max Labour Count</label>
            <input
              type="number"
              name="maxLabourCount"
              value={filters.maxLabourCount}
              onChange={handleFilterChange}
              placeholder="Filter by labour count..."
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
            Showing {filteredAndSortedDepartments.length} of {departments.length} departments
          </span>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingDepartment ? 'Edit Department' : 'Add New Department'}
              </h3>
              <button className="modal-close" onClick={resetForm}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="form-container">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="Department_code">Department Code *</label>
                  <input
                    type="text"
                    id="Department_code"
                    name="Department_code"
                    value={formData.Department_code}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="Department_Name">Department Name *</label>
                  <input
                    type="text"
                    id="Department_Name"
                    name="Department_Name"
                    value={formData.Department_Name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="Incharge">Incharge *</label>
                  <input
                    type="text"
                    id="Incharge"
                    name="Incharge"
                    value={formData.Incharge}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="Max_Labour_Count">Max Labour Count *</label>
                  <input
                    type="number"
                    id="Max_Labour_Count"
                    name="Max_Labour_Count"
                    value={formData.Max_Labour_Count}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="submit" className="btn btn-primary">
                  {editingDepartment ? 'Update Department' : 'Add Department'}
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
                onClick={() => handleSort('Department_code')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                Department Code {sortConfig.key === 'Department_code' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => handleSort('Department_Name')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                Department Name {sortConfig.key === 'Department_Name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => handleSort('Incharge')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                Incharge {sortConfig.key === 'Incharge' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => handleSort('Max_Labour_Count')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                Max Labour Count {sortConfig.key === 'Max_Labour_Count' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.length === 0 && Object.values(filters).every(v => !v) ? null :
              filteredAndSortedDepartments.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: '#A0522D' }}>Department not found</td></tr>
              ) : (
                currentRecords.map(department => (
                  <tr key={department.Department_code}>
                    <td>{department.Department_code}</td>
                    <td>{department.Department_Name}</td>
                    <td>{department.Incharge}</td>
                    <td>{department.Max_Labour_Count}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEdit(department)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(department.Department_code)}
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

      {filteredAndSortedDepartments.length > 0 && (
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
      Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, filteredAndSortedDepartments.length)} of {filteredAndSortedDepartments.length} records
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
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
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

export default Department; 
