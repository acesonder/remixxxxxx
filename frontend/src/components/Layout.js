import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="header-left">
          <button 
            className="menu-toggle" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <h1 className="logo">RemiXXXXXX</h1>
        </div>
        <div className="header-right">
          <span className="user-name">Welcome, {user?.username || 'User'}</span>
          <button className="btn btn-sm btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="layout-body">
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <nav className="nav">
            <Link to="/" className="nav-item">
              <span className="nav-icon">📊</span>
              <span className="nav-label">Dashboard</span>
            </Link>
            <Link to="/modules" className="nav-item">
              <span className="nav-icon">⚙️</span>
              <span className="nav-label">Modules</span>
            </Link>
            <Link to="/messaging" className="nav-item">
              <span className="nav-icon">💬</span>
              <span className="nav-label">Messaging</span>
            </Link>
            <Link to="/notifications" className="nav-item">
              <span className="nav-icon">🔔</span>
              <span className="nav-label">Notifications</span>
            </Link>
            <Link to="/assessment" className="nav-item">
              <span className="nav-icon">📋</span>
              <span className="nav-label">Assessment</span>
            </Link>
          </nav>
        </aside>

        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
