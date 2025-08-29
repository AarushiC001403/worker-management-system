import React, { useState, useEffect } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

const API_BASE = 'https://backend-k6ko.onrender.com';

const ALERT_TYPES = [
  { key: 'trade', label: 'Trade Register Alerts' },
  { key: 'training', label: 'Training Register Alerts' }
];

const ALERT_STATUS_OPTIONS = [
  { key: 'active', label: 'Active Alerts' },
  { key: 'completed', label: 'Completed Alerts (Marked Complete)' }
];

const STATUS_OPTIONS = ['Active', 'Inactive', 'Completed', 'Suspended'];

const Alerts = () => {
  const [selectedType, setSelectedType] = useState('trade');
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updatingAlert, setUpdatingAlert] = useState(null);
  const [chartData, setChartData] = useState({
    trade: { active: 0, inactive: 0, completed: 0 },
    training: { active: 0, inactive: 0, completed: 0 }
  });

  // Filtering state
  const [filters, setFilters] = useState({
    workerId: '',
    departmentCode: '',
    tradeOrTrainingCode: '',
    status: '',
    validityRange: ''
  });

  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: 'Validity_Date',
    direction: 'asc'
  });

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = '';
        if (selectedType === 'trade') {
          url = selectedStatus === 'active'
            ? `${API_BASE}/api/trade-registers/alerts`
            : `${API_BASE}/api/trade-registers`;
        } else {
          url = selectedStatus === 'active'
            ? `${API_BASE}/api/training-registers/alerts`
            : `${API_BASE}/api/training-registers`;
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch alerts');
        let data = await response.json();
        // For completed alerts, filter on frontend
        if (selectedStatus === 'completed') {
          data = data.filter(alert => {
            // Completed: alert is marked as completed by user
            return alert.Alert_Completed === true;
          });
        } else {
          // For active alerts, exclude completed ones
          data = data.filter(alert => {
            return alert.Alert_Completed !== true;
          });
        }
        setAlerts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, [selectedType, selectedStatus]);

  // Process chart data when alerts change
  useEffect(() => {
    const processChartData = async () => {
      try {
        // Fetch actual alerts (overdue and expiring soon)
        const tradeAlertsResponse = await fetch(`${API_BASE}/api/trade-registers/alerts`);
        const tradeAlertsData = await tradeAlertsResponse.json();
        
        const trainingAlertsResponse = await fetch(`${API_BASE}/api/training-registers/alerts`);
        const trainingAlertsData = await trainingAlertsResponse.json();

        console.log('Trade alerts:', tradeAlertsData);
        console.log('Training alerts:', trainingAlertsData);

        // Process trade alerts data
        const tradeStats = {
          active: 0,
          inactive: 0,
          completed: 0
        };

        tradeAlertsData.forEach(alert => {
          if (alert.Alert_Completed) {
            tradeStats.completed++;
          } else if (alert.Status === 'Active') {
            tradeStats.active++;
          } else {
            tradeStats.inactive++;
          }
        });

        // Process training alerts data
        const trainingStats = {
          active: 0,
          inactive: 0,
          completed: 0
        };

        trainingAlertsData.forEach(alert => {
          if (alert.Alert_Completed) {
            trainingStats.completed++;
          } else if (alert.Status === 'Active') {
            trainingStats.active++;
          } else {
            trainingStats.inactive++;
          }
        });

        console.log('Trade alert stats:', tradeStats);
        console.log('Training alert stats:', trainingStats);

        setChartData({
          trade: tradeStats,
          training: trainingStats
        });
      } catch (err) {
        console.error('Error fetching alert data:', err);
      }
    };

    processChartData();
  }, [alerts]); // Re-process when alerts change

  // Filtering logic
  const filteredAlerts = alerts.filter(alert => {
    const workerMatch = alert.Worker_ID.toString().toLowerCase().includes(filters.workerId.toLowerCase());
    const deptMatch = !filters.departmentCode || alert.Department_Code?.toString() === filters.departmentCode;
    const codeKey = selectedType === 'trade' ? 'Trade_Code' : 'Training_Code';
    const codeMatch = !filters.tradeOrTrainingCode || alert[codeKey]?.toString() === filters.tradeOrTrainingCode;
    const statusMatch = !filters.status || alert.Status === filters.status;
    let validityMatch = true;
    if (filters.validityRange) {
      const [start, end] = filters.validityRange.split(' to ');
      const validityDate = new Date(alert.Validity_Date);
      const startDate = new Date(start);
      const endDate = new Date(end);
      validityMatch = validityDate >= startDate && validityDate <= endDate;
    }
    return workerMatch && deptMatch && codeMatch && statusMatch && validityMatch;
  });

  // Sorting logic
  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    const { key, direction } = sortConfig;
    let aValue = a[key];
    let bValue = b[key];
    if (key === 'Validity_Date' || key === 'Record_Date') {
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

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      workerId: '',
      departmentCode: '',
      tradeOrTrainingCode: '',
      status: '',
      validityRange: ''
    });
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleAlertCompletion = async (alert, isCompleted) => {
    setUpdatingAlert(`${alert.Worker_ID}-${alert.Record_Date}`);
    try {
      const endpoint = isCompleted ? 'complete-alert' : 'incomplete-alert';
      const url = selectedType === 'trade' 
        ? `${API_BASE}/api/trade-registers/${alert.Worker_ID}/${endpoint}`
        : `${API_BASE}/api/training-registers/${alert.Worker_ID}/${endpoint}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ Record_Date: alert.Record_Date }),
      });

      if (!response.ok) {
        throw new Error('Failed to update alert status');
      }

      // Update the local state
      setAlerts(prevAlerts => 
        prevAlerts.map(a => 
          a.Worker_ID === alert.Worker_ID && a.Record_Date === alert.Record_Date
            ? { ...a, Alert_Completed: isCompleted }
            : a
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingAlert(null);
    }
  };

  // Chart configuration for bar chart
  const chartOptions = {
    chart: {
      type: 'bar',
      backgroundColor: 'transparent',
      style: {
        fontFamily: 'Arial, sans-serif'
      }
    },
    title: {
      text: 'Alert Distribution Overview',
      style: {
        color: '#8B4513',
        fontSize: '1.2rem',
        fontWeight: 'bold'
      }
    },
    subtitle: {
      text: 'Active, Inactive, and Completed Alerts by Register Type',
      style: {
        color: '#A0522D',
        fontSize: '0.9rem'
      }
    },
    xAxis: {
      categories: ['Trade Register', 'Training Register'],
      labels: {
        style: {
          color: '#8B4513',
          fontWeight: '500',
          fontSize: '0.9rem'
        }
      }
    },
    yAxis: {
      title: {
        text: 'Number of Alerts',
        style: {
          color: '#8B4513',
          fontWeight: '500'
        }
      },
      labels: {
        style: {
          color: '#8B4513',
          fontSize: '0.8rem'
        }
      },
      gridLineColor: '#e9ecef'
    },
    legend: {
      enabled: true,
      align: 'center',
      verticalAlign: 'bottom',
      itemStyle: {
        color: '#8B4513',
        fontWeight: '500'
      },
      itemHoverStyle: {
        color: '#A0522D'
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        borderWidth: 0,
        shadow: false,
        pointPadding: 0.1,
        groupPadding: 0.1
      },
      series: {
        dataLabels: {
          enabled: true,
          style: {
            color: '#8B4513',
            fontWeight: 'bold',
            fontSize: '0.8rem'
          }
        }
      }
    },
    tooltip: {
      backgroundColor: '#F5F5DC',
      borderColor: '#8B4513',
      borderRadius: 8,
      style: {
        color: '#8B4513'
      },
      formatter: function() {
        return `<b>${this.series.name}</b><br/>
                ${this.x}: <b>${this.y}</b> alerts`;
      }
    },
    series: [{
      name: 'Active Alerts',
      data: [chartData.trade.active, chartData.training.active],
      color: '#28a745'
    }, {
      name: 'Inactive Alerts',
      data: [chartData.trade.inactive, chartData.training.inactive],
      color: '#dc3545'
    }, {
      name: 'Completed Alerts',
      data: [chartData.trade.completed, chartData.training.completed],
      color: '#6c757d'
    }],
    credits: {
      enabled: false
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

  // Table columns for trade and training
  const columns = selectedType === 'trade'
    ? [
        { key: 'Worker_ID', label: 'Worker ID' },
        { key: 'Department_Code', label: 'Department Code' },
        { key: 'Trade_Code', label: 'Trade Code' },
        { key: 'Validity_Date', label: 'Validity Date' },
        { key: 'Status', label: 'Status' },
        { key: 'Remarks', label: 'Remarks' }
      ]
    : [
        { key: 'Worker_ID', label: 'Worker ID' },
        { key: 'Department_Code', label: 'Department Code' },
        { key: 'Training_Code', label: 'Training Code' },
        { key: 'Validity_Date', label: 'Validity Date' },
        { key: 'Status', label: 'Status' },
        { key: 'Remarks', label: 'Remarks' }
      ];

  return (
    <div className="content-area">
      <h2 style={{ color: '#8B4513', marginBottom: '2rem' }}>Alerts</h2>
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
        <div>
          <label style={{ fontWeight: '500', marginRight: '0.5rem' }}>Alert Type:</label>
          <select value={selectedType} onChange={e => setSelectedType(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ced4da' }}>
            {ALERT_TYPES.map(type => (
              <option key={type.key} value={type.key}>{type.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontWeight: '500', marginRight: '0.5rem' }}>Show:</label>
          <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ced4da' }}>
            {ALERT_STATUS_OPTIONS.map(opt => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
        </div>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
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
            <input
              type="text"
              name="departmentCode"
              value={filters.departmentCode}
              onChange={handleFilterChange}
              placeholder="Department code..."
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>{selectedType === 'trade' ? 'Trade Code' : 'Training Code'}</label>
            <input
              type="text"
              name="tradeOrTrainingCode"
              value={filters.tradeOrTrainingCode}
              onChange={handleFilterChange}
              placeholder={selectedType === 'trade' ? 'Trade code...' : 'Training code...'}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
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
              {STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Validity Date Range</label>
            <select
              name="validityRange"
              value={filters.validityRange}
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
            Showing {sortedAlerts.length} of {alerts.length} alerts
          </span>
        </div>
      </div>

      {/* Chart Section */}
      <div style={{ 
        background: 'white', 
        padding: '2rem', 
        borderRadius: '15px', 
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        {/* Summary Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem', 
          marginBottom: '2rem' 
        }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)', 
            color: 'white', 
            padding: '1rem', 
            borderRadius: '8px', 
            textAlign: 'center' 
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Active Alerts</h4>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {chartData.trade.active + chartData.training.active}
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
              Trade: {chartData.trade.active} | Training: {chartData.training.active}
            </div>
          </div>
          
          <div style={{ 
            background: 'linear-gradient(135deg, #dc3545 0%, #fd7e14 100%)', 
            color: 'white', 
            padding: '1rem', 
            borderRadius: '8px', 
            textAlign: 'center' 
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Inactive Alerts</h4>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {chartData.trade.inactive + chartData.training.inactive}
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
              Trade: {chartData.trade.inactive} | Training: {chartData.training.inactive}
            </div>
          </div>
          
          <div style={{ 
            background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)', 
            color: 'white', 
            padding: '1rem', 
            borderRadius: '8px', 
            textAlign: 'center' 
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Completed Alerts</h4>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {chartData.trade.completed + chartData.training.completed}
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
              Trade: {chartData.trade.completed} | Training: {chartData.training.completed}
            </div>
          </div>
        </div>

        <HighchartsReact
          highcharts={Highcharts}
          options={chartOptions}
        />
      </div>

      {loading ? (
        <div>Loading alerts...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>Error: {error}</div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>Complete</th>
                {columns.map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    {col.label} {sortConfig.key === col.key && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                ))}
                <th>Validity Alert</th>
              </tr>
            </thead>
            <tbody>
              {sortedAlerts.length === 0 ? (
                <tr><td colSpan={columns.length + 2} style={{ textAlign: 'center', color: '#A0522D' }}>No alerts found</td></tr>
              ) : (
                sortedAlerts.map(alert => (
                  <tr key={`${alert.Worker_ID}-${alert.Record_Date}`} style={alert.Alert_Completed ? { backgroundColor: '#f8f9fa', opacity: 0.7 } : {}}>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={alert.Alert_Completed || false}
                        onChange={(e) => handleAlertCompletion(alert, e.target.checked)}
                        disabled={updatingAlert === `${alert.Worker_ID}-${alert.Record_Date}`}
                        style={{ 
                          transform: 'scale(1.2)', 
                          cursor: 'pointer',
                          accentColor: '#8B4513'
                        }}
                      />
                      {updatingAlert === `${alert.Worker_ID}-${alert.Record_Date}` && (
                        <div style={{ fontSize: '0.7rem', color: '#6c757d', marginTop: '2px' }}>Updating...</div>
                      )}
                    </td>
                    {columns.map(col => (
                      col.key === 'Validity_Date' ? (
                        <td key={col.key}>
                          <div style={getValidityAlertStyle(alert.Validity_Date)}>
                            {alert.Validity_Date ? new Date(alert.Validity_Date).toLocaleDateString() : 'No Date'}
                          </div>
                        </td>
                      ) : (
                        <td key={col.key}>{alert[col.key]}</td>
                      )
                    ))}
                    <td>
                      <div style={{ fontSize: '0.8rem', textAlign: 'center' }}>{getValidityAlertText(alert.Validity_Date)}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Alerts; 
