import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import Worker from './Worker';
import Trade from './Trade';
import Department from './Department';
import Training from './Training';
import TradeRegister from './TradeRegister';
import TrainingRegister from './TrainingRegister';
import Alerts from './Alerts';
import Reports from './Reports';

const API_BASE = 'https://backend-k6ko.onrender.com';

const Dashboard = ({ onLogout, activePage }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({
    configuration: false,
    register: false
  });
  const [workerCount, setWorkerCount] = useState(null);
  const [tradeCount, setTradeCount] = useState(null);
  const [departmentCount, setDepartmentCount] = useState(null);
  const [trainingCount, setTrainingCount] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/workers`)
      .then(res => res.json())
      .then(data => setWorkerCount(data.length));
    fetch(`${API_BASE}/api/trades`)
      .then(res => res.json())
      .then(data => setTradeCount(data.length));
    fetch(`${API_BASE}/api/departments`)
      .then(res => res.json())
      .then(data => setDepartmentCount(data.length));
    fetch(`${API_BASE}/api/trainings`)
      .then(res => res.json())
      .then(data => setTrainingCount(data.length));
  }, []);

  // Determine current page from URL or props
  const currentPage = activePage || location.pathname.substring(1) || 'dashboard';

  const toggleMenu = (menu) => {
    setOpenMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  const handleNavigation = (path) => {
    navigate(`/${path}`);
  };

  // Calculate total for center label
  const totalCount = (workerCount || 0) + (tradeCount || 0) + (departmentCount || 0) + (trainingCount || 0);

  // Highcharts configuration
  const chartOptions = {
    chart: {
      type: 'pie',
      backgroundColor: 'transparent',
      custom: {},
      events: {
        render() {
          const chart = this,
            series = chart.series[0];
          let customLabel = chart.options.chart.custom.label;

          if (!customLabel) {
            customLabel = chart.options.chart.custom.label =
              chart.renderer.label(
                'Total<br/>' +
                '<strong>' + totalCount + '</strong>'
              )
                .css({
                  color: '#8B4513',
                  textAnchor: 'middle',
                  fontWeight: 'bold'
                })
                .add();
          }

          const x = series.center[0] + chart.plotLeft,
            y = series.center[1] + chart.plotTop -
            (customLabel.attr('height') / 2);

          customLabel.attr({
            x,
            y
          });
          // Set font size based on chart diameter
          customLabel.css({
            fontSize: `${series.center[2] / 12}px`
          });
        }
      }
    },
    accessibility: {
      point: {
        valueSuffix: '%'
      }
    },
    title: {
      text: 'System Overview',
      style: {
        color: '#8B4513',
        fontSize: '1.5rem',
        fontWeight: 'bold'
      }
    },
    subtitle: {
      text: 'Distribution of Workers, Trades, Departments & Training Programs',
      style: {
        color: '#A0522D',
        fontSize: '1rem'
      }
    },
    tooltip: {
      pointFormat: '{series.name}: <b>{point.percentage:.0f}%</b>',
      backgroundColor: '#F5F5DC',
      borderColor: '#8B4513',
      borderRadius: 8,
      style: {
        color: '#8B4513'
      }
    },
    legend: {
      enabled: true,
      align: 'right',
      verticalAlign: 'middle',
      layout: 'vertical',
      itemStyle: {
        color: '#8B4513',
        fontWeight: '500'
      },
      itemHoverStyle: {
        color: '#A0522D'
      }
    },
    plotOptions: {
      series: {
        allowPointSelect: true,
        cursor: 'pointer',
        borderRadius: 8,
        dataLabels: [{
          enabled: true,
          distance: 20,
          format: '{point.name}',
          style: {
            color: '#8B4513',
            fontWeight: '600',
            fontSize: '0.9em'
          }
        }, {
          enabled: true,
          distance: -15,
          format: '{point.percentage:.0f}%',
          style: {
            fontSize: '0.9em',
            color: '#8B4513',
            fontWeight: 'bold'
          }
        }],
        showInLegend: true
      }
    },
    series: [{
      name: 'System Components',
      colorByPoint: true,
      innerSize: '75%',
      colors: ['#8B4513', '#A0522D', '#CD853F', '#DEB887'],
      data: [{
        name: 'Workers',
        y: workerCount || 0,
        color: '#8B4513'
      }, {
        name: 'Trades',
        y: tradeCount || 0,
        color: '#A0522D'
      }, {
        name: 'Departments',
        y: departmentCount || 0,
        color: '#CD853F'
      }, {
        name: 'Training Programs',
        y: trainingCount || 0,
        color: '#DEB887'
      }]
    }]
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'worker':
        return <Worker />;
      case 'trade':
        return <Trade />;
      case 'department':
        return <Department />;
      case 'training':
        return <Training />;
      case 'trade-register':
        return <TradeRegister />;
      case 'training-register':
        return <TrainingRegister />;
      case 'alerts':
        return <Alerts />;
      case 'reports':
        return <Reports />;
      default:
        return (
          <div className="content-area">
            {/* Welcome Section */}
            <div style={{ 
              background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 50%, #CD853F 100%)',
              color: 'white',
              padding: '3rem',
              borderRadius: '15px',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              <h1 style={{ fontSize: '3rem', marginBottom: '1rem', fontWeight: '700' }}>
                Welcome to Worker Management System
              </h1>
              <p style={{ fontSize: '1.2rem', opacity: 0.9, maxWidth: '800px', margin: '0 auto' }}>
                Track workers, manage trades, organize departments, and monitor training programs 
                all in one place.
              </p>
            </div>

            {/* Pie Chart Section */}
            <div style={{ 
              background: 'white', 
              padding: '2rem', 
              borderRadius: '15px', 
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              marginBottom: '2rem'
            }}>
              <HighchartsReact
                highcharts={Highcharts}
                options={chartOptions}
              />
            </div>



            {/* System Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
              <div style={{ background: 'white', padding: '2rem', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                <h3 style={{ color: '#8B4513', marginBottom: '1.5rem', fontSize: '1.5rem' }}>
                  🚀 Quick Actions
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleNavigation('worker')}
                    style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                  >
                    👥 Add New Worker
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => handleNavigation('trade')}
                    style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                  >
                    🔧 Manage Trades
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => handleNavigation('training')}
                    style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                  >
                    📚 View Training Programs
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => handleNavigation('alerts')}
                    style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                  >
                    🚨 Check Alerts
                  </button>
                </div>
              </div>

              <div style={{ background: 'white', padding: '2rem', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                <h3 style={{ color: '#8B4513', marginBottom: '1.5rem', fontSize: '1.5rem' }}>
                  📊 System Overview
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #F5F5DC' }}>
                    <span>Active Workers</span>
                    <span style={{ fontWeight: '600', color: '#8B4513' }}>{workerCount !== null ? workerCount : '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #F5F5DC' }}>
                    <span>Total Trades</span>
                    <span style={{ fontWeight: '600', color: '#8B4513' }}>{tradeCount !== null ? tradeCount : '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #F5F5DC' }}>
                    <span>Departments</span>
                    <span style={{ fontWeight: '600', color: '#8B4513' }}>{departmentCount !== null ? departmentCount : '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #F5F5DC' }}>
                    <span>Training Programs</span>
                    <span style={{ fontWeight: '600', color: '#8B4513' }}>{trainingCount !== null ? trainingCount : '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };
  
  return (
    <div className="dashboard">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2 
            style={{ cursor: 'pointer', transition: 'color 0.3s ease' }}
            onClick={() => handleNavigation('dashboard')}
            onMouseEnter={(e) => e.target.style.color = '#CD853F'}
            onMouseLeave={(e) => e.target.style.color = 'white'}
          >
            WMS
          </h2>
          <p>Worker Management System</p>
        </div>
        
        <ul className="nav-menu">
          <li className={`nav-item ${openMenus.configuration ? 'open' : ''}`}>
            <a 
              href="#configuration" 
              className={`nav-link ${openMenus.configuration ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                toggleMenu('configuration');
              }}
            >
              <i>⚙️</i> Configuration
              <span style={{ marginLeft: 'auto', fontSize: '0.8rem' }}>
                {openMenus.configuration ? '▼' : '▶'}
              </span>
            </a>
            <ul className={`submenu ${openMenus.configuration ? 'show' : ''}`}>
              <li>
                <a 
                  href="/worker" 
                  className={`nav-link ${currentPage === 'worker' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation('worker');
                  }}
                >
                  👥 Worker
                </a>
              </li>
              <li>
                <a 
                  href="/trade" 
                  className={`nav-link ${currentPage === 'trade' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation('trade');
                  }}
                >
                  🔧 Trade
                </a>
              </li>
              <li>
                <a 
                  href="/department" 
                  className={`nav-link ${currentPage === 'department' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation('department');
                  }}
                >
                  🏢 Department
                </a>
              </li>
              <li>
                <a 
                  href="/training" 
                  className={`nav-link ${currentPage === 'training' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation('training');
                  }}
                >
                  📚 Training
                </a>
              </li>
            </ul>
          </li>
          
          <li className={`nav-item ${openMenus.register ? 'open' : ''}`}>
            <a 
              href="#register" 
              className={`nav-link ${openMenus.register ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                toggleMenu('register');
              }}
            >
              <i>📋</i> Register
              <span style={{ marginLeft: 'auto', fontSize: '0.8rem' }}>
                {openMenus.register ? '▼' : '▶'}
              </span>
            </a>
            <ul className={`submenu ${openMenus.register ? 'show' : ''}`}>
              <li>
                <a 
                  href="/trade-register" 
                  className={`nav-link ${currentPage === 'trade-register' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation('trade-register');
                  }}
                >
                  🔧 Trade Register
                </a>
              </li>
              <li>
                <a 
                  href="/training-register" 
                  className={`nav-link ${currentPage === 'training-register' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation('training-register');
                  }}
                >
                  📚 Training Register
                </a>
              </li>
            </ul>
          </li>
          
          <li className="nav-item">
            <a 
              href="/alerts" 
              className={`nav-link ${currentPage === 'alerts' ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                handleNavigation('alerts');
              }}
            >
              <i>🚨</i> ALERTS
            </a>
          </li>
          
          <li className="nav-item">
            <a 
              href="/reports" 
              className={`nav-link ${currentPage === 'reports' ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                handleNavigation('reports');
              }}
            >
              <i>📊</i> Reports
            </a>
          </li>
        </ul>
      </div>
      
      <div className="main-content">
        <div className="header">
          <h1>Worker Management System</h1>
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
        
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;
