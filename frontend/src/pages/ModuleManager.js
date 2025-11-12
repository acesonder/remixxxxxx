import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './ModuleManager.css';

const ModuleManager = () => {
  const { API_URL } = useAuth();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const response = await axios.get(`${API_URL.replace('/api', '')}/api/modules`);
      setModules(response.data);
    } catch (error) {
      console.error('Failed to fetch modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = async (moduleId, currentState) => {
    try {
      const endpoint = currentState ? 'disable' : 'enable';
      await axios.post(`${API_URL.replace('/api', '')}/api/modules/${moduleId}/${endpoint}`);
      setMessage(`Module ${currentState ? 'disabled' : 'enabled'} successfully`);
      fetchModules();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Operation failed');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (loading) {
    return <div className="loading">Loading modules...</div>;
  }

  return (
    <div className="module-manager">
      <h1 className="page-title">Module Manager</h1>
      <p className="page-description">
        Enable or disable modules to customize your platform functionality
      </p>

      {message && (
        <div className={`alert ${message.includes('failed') ? 'alert-error' : 'alert-success'}`}>
          {message}
        </div>
      )}

      <div className="modules-grid">
        {modules.map(module => (
          <div key={module.id} className="module-card">
            <div className="module-header">
              <h3 className="module-title">{module.name}</h3>
              <span className={`status-badge ${module.enabled ? 'enabled' : 'disabled'}`}>
                {module.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            
            <p className="module-desc">{module.description}</p>
            
            <div className="module-meta">
              <span className="version">v{module.version}</span>
              {module.dependencies?.length > 0 && (
                <span className="dependencies">
                  Depends on: {module.dependencies.join(', ')}
                </span>
              )}
            </div>

            {module.features && (
              <div className="features">
                <strong>Features:</strong>
                <div className="feature-tags">
                  {module.features.map((feature, idx) => (
                    <span key={idx} className="feature-tag">{feature}</span>
                  ))}
                </div>
              </div>
            )}

            <button
              className={`btn ${module.enabled ? 'btn-danger' : 'btn-success'} btn-block`}
              onClick={() => toggleModule(module.id, module.enabled)}
            >
              {module.enabled ? 'Disable Module' : 'Enable Module'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModuleManager;
