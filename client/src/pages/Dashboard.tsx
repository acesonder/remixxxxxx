import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useModules } from '../context/ModuleContext';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { config, isModuleEnabled } = useModules();

  const modules = [
    { 
      name: 'communication', 
      title: 'Communication', 
      icon: '💬',
      description: 'Messages, Chat, Notifications',
      link: '/messages'
    },
    { 
      name: 'userManagement', 
      title: 'User Management', 
      icon: '👥',
      description: 'Manage users and roles',
      link: '/users'
    },
    { 
      name: 'caseManagement', 
      title: 'Case Management', 
      icon: '📋',
      description: 'Track and manage cases',
      link: '/cases'
    },
    { 
      name: 'assessmentIntake', 
      title: 'Assessments', 
      icon: '📝',
      description: 'Client assessments and forms',
      link: '/assessments'
    },
    { 
      name: 'vispdat', 
      title: 'VI-SPDAT', 
      icon: '📊',
      description: 'Vulnerability assessments',
      link: '/vispdat'
    },
    { 
      name: 'homelessnessOutreach', 
      title: 'Homelessness Outreach', 
      icon: '🏠',
      description: 'Outreach and housing tools',
      link: '/outreach'
    },
    { 
      name: 'addictionTools', 
      title: 'Addiction Tools', 
      icon: '🎯',
      description: 'Substance use support',
      link: '/addiction'
    },
    { 
      name: 'mentalHealth', 
      title: 'Mental Health', 
      icon: '🧠',
      description: 'Mental health assessments',
      link: '/mental-health'
    },
    { 
      name: 'shelterTools', 
      title: 'Shelter Management', 
      icon: '🛏️',
      description: 'Bed and occupancy tracking',
      link: '/shelter'
    },
    { 
      name: 'incidentReporting', 
      title: 'Incident Reporting', 
      icon: '⚠️',
      description: 'Report and track incidents',
      link: '/incidents'
    },
    { 
      name: 'resourceSharing', 
      title: 'Resources', 
      icon: '📚',
      description: 'Share documents and resources',
      link: '/resources'
    },
    { 
      name: 'uiCustomization', 
      title: 'Customization', 
      icon: '🎨',
      description: 'Themes and branding',
      link: '/customization',
      adminOnly: true
    },
  ];

  const enabledModules = modules.filter(m => 
    isModuleEnabled(m.name) && (!m.adminOnly || user?.role === 'admin')
  );

  const primaryColor = config?.branding?.primaryColor || '#2563eb';

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: '#1a202c' }}>
          Welcome back, {user?.firstName}!
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#718096' }}>
          {user?.role === 'admin' ? 'System Administrator' : 
           user?.role === 'staff' ? 'Staff Member' :
           user?.role === 'worker' ? 'Service Worker' :
           user?.role === 'service_provider' ? 'Service Provider' : 'Client'}
        </p>
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {enabledModules.map((module) => (
            <Link
              key={module.name}
              to={module.link}
              style={{
                textDecoration: 'none',
                background: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: `2px solid transparent`,
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = primaryColor;
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{module.icon}</div>
              <h3 style={{ 
                fontSize: '1.25rem', 
                marginBottom: '0.5rem',
                color: '#1a202c'
              }}>
                {module.title}
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#718096', margin: 0 }}>
                {module.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {user?.role === 'admin' && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderLeft: `4px solid ${primaryColor}`
        }}>
          <h2 style={{ marginTop: 0, color: '#1a202c' }}>Admin Tools</h2>
          <p style={{ color: '#718096', marginBottom: '1rem' }}>
            Configure modules, manage users, and customize the platform
          </p>
          <Link
            to="/admin/modules"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: primaryColor,
              color: 'white',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            Configure Modules
          </Link>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
