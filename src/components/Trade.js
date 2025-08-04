import React, { useState, useEffect } from 'react';

const Trade = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [formData, setFormData] = useState({
    Trade_Code: '',
    Trade_Name: '',
    Training_Frequency: ''
  });

  // Filter and sort states
  const [filters, setFilters] = useState({
    tradeCode: '',
    tradeName: '',
    trainingFrequency: ''
  });

  const [sortConfig, setSortConfig] = useState({
    key: 'Trade_Name',
    direction: 'asc'
  });

  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);

  // Remove any sample data arrays or objects. Only use useState([]) for trades.
  const trainingFrequencies = [
    '3 months',
    '6 months', 
    '12 months',
    '18 months',
    '24 months',
    'As needed'
  ];

  // API functions
  const fetchTrades = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/trades');
      if (!response.ok) {
        throw new Error('Failed to fetch trades');
      }
      const data = await response.json();
      setTrades(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addTrade = async (tradeData) => {
    try {
      const response = await fetch('http://localhost:5001/api/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tradeData),
      });
      if (!response.ok) {
        throw new Error('Failed to add trade');
      }
      await fetchTrades();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const updateTrade = async (id, tradeData) => {
    try {
      const response = await fetch(`http://localhost:5001/api/trades/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tradeData),
      });
      if (!response.ok) {
        throw new Error('Failed to update trade');
      }
      await fetchTrades();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const deleteTrade = async (id) => {
    try {
      const response = await fetch(`http://localhost:5001/api/trades/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete trade');
      }
      await fetchTrades();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  // Load trades on component mount
  useEffect(() => {
    fetchTrades();
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
      tradeCode: '',
      tradeName: '',
      trainingFrequency: ''
    });
  };

  // Apply filters and sorting
  const filteredAndSortedTrades = trades
    .filter(trade => {
      const codeMatch = trade.Trade_Code.toString().toLowerCase().includes(filters.tradeCode.toLowerCase());
      const nameMatch = trade.Trade_Name.toLowerCase().includes(filters.tradeName.toLowerCase());
      const frequencyMatch = !filters.trainingFrequency || trade.Training_Frequency === filters.trainingFrequency;

      return codeMatch && nameMatch && frequencyMatch;
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

  // Add pagination logic after the filteredAndSortedTrades calculation
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredAndSortedTrades.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredAndSortedTrades.length / recordsPerPage);

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
    if (editingTrade) {
      success = await updateTrade(editingTrade.Trade_Code, formData);
    } else {
      success = await addTrade(formData);
    }
    
    if (success) {
      resetForm();
    }
  };

  const handleEdit = (trade) => {
    setEditingTrade(trade);
    setFormData({
      Trade_Code: trade.Trade_Code,
      Trade_Name: trade.Trade_Name,
      Training_Frequency: trade.Training_Frequency
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this trade?')) {
      await deleteTrade(id);
    }
  };

  const resetForm = () => {
    setFormData({
      Trade_Code: '',
      Trade_Name: '',
      Training_Frequency: ''
    });
    setEditingTrade(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="content-area">Loading trades...</div>;
  }

  if (error) {
    return <div className="content-area">Error: {error}</div>;
  }

  return (
    <div className="content-area">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: '#8B4513' }}>Trade Management</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowForm(true)}
        >
          Add New Trade
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
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Trade Code</label>
            <input
              type="text"
              name="tradeCode"
              value={filters.tradeCode}
              onChange={handleFilterChange}
              placeholder="Search by trade code..."
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Trade Name</label>
            <input
              type="text"
              name="tradeName"
              value={filters.tradeName}
              onChange={handleFilterChange}
              placeholder="Search by trade name..."
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Training Frequency</label>
            <select
              name="trainingFrequency"
              value={filters.trainingFrequency}
              onChange={handleFilterChange}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
            >
              <option value="">All Frequencies</option>
              {trainingFrequencies.map(frequency => (
                <option key={frequency} value={frequency}>{frequency}</option>
              ))}
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
            Showing {filteredAndSortedTrades.length} of {trades.length} trades
          </span>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingTrade ? 'Edit Trade' : 'Add New Trade'}
              </h3>
              <button className="modal-close" onClick={resetForm}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="form-container">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="Trade_Code">Trade Code *</label>
                  <input
                    type="text"
                    id="Trade_Code"
                    name="Trade_Code"
                    value={formData.Trade_Code}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="Trade_Name">Trade Name *</label>
                  <input
                    type="text"
                    id="Trade_Name"
                    name="Trade_Name"
                    value={formData.Trade_Name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="Training_Frequency">Training Frequency *</label>
                  <select
                    id="Training_Frequency"
                    name="Training_Frequency"
                    value={formData.Training_Frequency}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Training Frequency</option>
                    {trainingFrequencies.map(frequency => (
                      <option key={frequency} value={frequency}>{frequency}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="submit" className="btn btn-primary">
                  {editingTrade ? 'Update Trade' : 'Add Trade'}
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
                onClick={() => handleSort('Trade_Code')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                Trade Code {sortConfig.key === 'Trade_Code' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => handleSort('Trade_Name')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                Trade Name {sortConfig.key === 'Trade_Name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => handleSort('Training_Frequency')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                Training Frequency {sortConfig.key === 'Training_Frequency' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 && Object.values(filters).every(v => !v) ? null :
              filteredAndSortedTrades.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#A0522D' }}>Trade not found</td></tr>
              ) : (
                currentRecords.map(trade => (
                  <tr key={trade.Trade_Code}>
                    <td>{trade.Trade_Code}</td>
                    <td>{trade.Trade_Name}</td>
                    <td>{trade.Training_Frequency}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEdit(trade)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(trade.Trade_Code)}
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
      {filteredAndSortedTrades.length > 0 && (
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
            Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, filteredAndSortedTrades.length)} of {filteredAndSortedTrades.length} records
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

export default Trade; 
