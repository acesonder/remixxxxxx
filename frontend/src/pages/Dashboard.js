import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { API_URL } = useAuth();
  const [modules, setModules] = useState([]);
  const [stats, setStats] = useState({
    totalModules: 0,
    enabledModules: 0,
    recentActivity: []
  });

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const response = await axios.get(`${API_URL.replace('/api', '')}/api/modules`);
      setModules(response.data);
      setStats({
        totalModules: response.data.length,
        enabledModules: response.data.filter(m => m.enabled).length,
        recentActivity: []
      });
    } catch (error) {
      console.error('Failed to fetch modules:', error);
    }
  };

  return (
    <div className="dashboard">
      <h1 className="page-title">Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalModules}</div>
            <div className="stat-label">Total Modules</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.enabledModules}</div>
            <div className="stat-label">Enabled Modules</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🚀</div>
          <div className="stat-content">
            <div className="stat-value">{modules.length > 0 ? 'Active' : 'Setup'}</div>
            <div className="stat-label">System Status</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <div className="stat-value">100%</div>
            <div className="stat-label">Performance</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h2 className="card-header">Available Modules</h2>
          <div className="module-list">
            {modules.slice(0, 6).map(module => (
              <div key={module.id} className="module-item">
                <div className="module-info">
                  <div className="module-name">{module.name}</div>
                  <div className="module-description">{module.description}</div>
                </div>
                <span className={`badge ${module.enabled ? 'badge-success' : 'badge-warning'}`}>
                  {module.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="card-header">Quick Actions</h2>
          <div className="quick-actions">
            <button className="action-btn">
              <span className="action-icon">⚙️</span>
              <span className="action-label">Manage Modules</span>
            </button>
            <button className="action-btn">
              <span className="action-icon">💬</span>
              <span className="action-label">Send Message</span>
            </button>
            <button className="action-btn">
              <span className="action-icon">📋</span>
              <span className="action-label">New Assessment</span>
            </button>
            <button className="action-btn">
              <span className="action-icon">🎨</span>
              <span className="action-label">Customize Theme</span>
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-header">System Information</h2>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Platform Version:</span>
            <span className="info-value">1.0.0</span>
          </div>
          <div className="info-item">
            <span className="info-label">Environment:</span>
            <span className="info-value">Development</span>
          </div>
          <div className="info-item">
            <span className="info-label">API Status:</span>
            <span className="info-value badge badge-success">Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
