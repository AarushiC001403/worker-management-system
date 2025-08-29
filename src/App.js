import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = (credentials) => {
    // Simple authentication - in real app, this would validate against backend
    if (credentials.userId === 'user' && credentials.password === 'user123') {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <Router basename="/worker-management-system">
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={
              isAuthenticated ? 
              <Navigate to="/dashboard" replace /> : 
              <Login onLogin={handleLogin} />
            } 
          />
          <Route 
            path="/login" 
            element={
              isAuthenticated ? 
              <Navigate to="/dashboard" replace /> : 
              <Login onLogin={handleLogin} />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              isAuthenticated ? 
              <Dashboard onLogout={handleLogout} /> : 
              <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/worker" 
            element={
              isAuthenticated ? 
              <Dashboard onLogout={handleLogout} activePage="worker" /> : 
              <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/trade" 
            element={
              isAuthenticated ? 
              <Dashboard onLogout={handleLogout} activePage="trade" /> : 
              <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/department" 
            element={
              isAuthenticated ? 
              <Dashboard onLogout={handleLogout} activePage="department" /> : 
              <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/training" 
            element={
              isAuthenticated ? 
              <Dashboard onLogout={handleLogout} activePage="training" /> : 
              <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/trade-register" 
            element={
              isAuthenticated ? 
              <Dashboard onLogout={handleLogout} activePage="trade-register" /> : 
              <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/training-register" 
            element={
              isAuthenticated ? 
              <Dashboard onLogout={handleLogout} activePage="training-register" /> : 
              <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/alerts" 
            element={
              isAuthenticated ? 
              <Dashboard onLogout={handleLogout} activePage="alerts" /> : 
              <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/reports" 
            element={
              isAuthenticated ? 
              <Dashboard onLogout={handleLogout} activePage="reports" /> : 
              <Navigate to="/login" replace />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 
