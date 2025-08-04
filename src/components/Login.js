import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    userId: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!credentials.userId || !credentials.password) {
      setError('Please enter both User ID and Password');
      return;
    }

    const success = onLogin(credentials);
    if (!success) {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Worker Management System</h1>
          <p>Please login to continue</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="userId">User ID</label>
            <input
              type="text"
              id="userId"
              name="userId"
              value={credentials.userId}
              onChange={handleChange}
              placeholder="Enter your User ID"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button type="submit" className="login-btn">
            Login
          </button>
        </form>
        
        {error && <div className="error-message">{error}</div>}
        
        <div style={{ marginTop: '2rem', textAlign: 'center', color: '#A0522D', fontSize: '0.9rem' }}>
          <p>Demo Credentials:</p>
          <p>User ID: user</p>
          <p>Password: user123</p>
        </div>
      </div>
    </div>
  );
};

export default Login; 
