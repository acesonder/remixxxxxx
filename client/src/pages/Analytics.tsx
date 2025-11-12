import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useModules } from '../context/ModuleContext';

interface Report {
  _id: string;
  title: string;
  description: string;
  reportType: string;
  category: string;
  createdAt: string;
  generatedData?: {
    lastGenerated: string;
    recordCount: number;
  };
}

interface Dashboard {
  _id: string;
  name: string;
  description: string;
  isDefault: boolean;
  createdAt: string;
}

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const { config, isModuleEnabled } = useModules();
  const [activeTab, setActiveTab] = useState('reports');
  const [reports, setReports] = useState<Report[]>([]);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newReport, setNewReport] = useState({
    title: '',
    description: '',
    reportType: 'custom',
    category: 'custom',
    configuration: {
      dataSource: 'assessments',
      filters: {}
    }
  });

  const primaryColor = config?.branding?.primaryColor || '#2563eb';

  useEffect(() => {
    if (isModuleEnabled('analytics')) {
      loadData();
    }
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'reports') {
        const response = await analyticsAPI.getReports();
        setReports(response.data.reports || []);
      } else {
        const response = await analyticsAPI.getDashboards();
        setDashboards(response.data.dashboards || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async () => {
    try {
      await analyticsAPI.createReport(newReport);
      setShowCreateModal(false);
      setNewReport({
        title: '',
        description: '',
        reportType: 'custom',
        category: 'custom',
        configuration: {
          dataSource: 'assessments',
          filters: {}
        }
      });
      loadData();
    } catch (error) {
      console.error('Error creating report:', error);
    }
  };

  const handleGenerateReport = async (reportId: string) => {
    try {
      const response = await analyticsAPI.generateReport(reportId);
      alert(`Report generated successfully! Record count: ${response.data.recordCount}`);
      loadData();
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report');
    }
  };

  if (!isModuleEnabled('analytics')) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Analytics Module Disabled</h2>
        <p>The Analytics module is currently disabled. Please enable it in the module configurator.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Analytics & Reporting</h1>
        <p style={{ color: '#718096' }}>Generate insights and create custom reports</p>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '2rem', borderBottom: '2px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {['reports', 'dashboards'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '1rem 1.5rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? `3px solid ${primaryColor}` : 'none',
                color: activeTab === tab ? primaryColor : '#718096',
                fontWeight: activeTab === tab ? '600' : '400',
                cursor: 'pointer',
                textTransform: 'capitalize',
                fontSize: '1rem'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '0.75rem 1.5rem',
            background: primaryColor,
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          {activeTab === 'reports' ? '+ New Report' : '+ New Dashboard'}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>Loading...</div>
      ) : (
        <div>
          {activeTab === 'reports' ? (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {reports.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '4rem',
                  background: 'white',
                  borderRadius: '8px'
                }}>
                  <p style={{ color: '#718096', marginBottom: '1rem' }}>No reports yet</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: primaryColor,
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Create Your First Report
                  </button>
                </div>
              ) : (
                reports.map((report) => (
                  <div
                    key={report._id}
                    style={{
                      background: 'white',
                      padding: '1.5rem',
                      borderRadius: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>{report.title}</h3>
                        <p style={{ color: '#718096', margin: '0 0 1rem 0' }}>{report.description}</p>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
                          <span style={{ 
                            padding: '0.25rem 0.75rem', 
                            background: '#e2e8f0', 
                            borderRadius: '12px' 
                          }}>
                            {report.reportType}
                          </span>
                          <span style={{ 
                            padding: '0.25rem 0.75rem', 
                            background: '#e2e8f0', 
                            borderRadius: '12px' 
                          }}>
                            {report.category}
                          </span>
                        </div>
                        {report.generatedData && (
                          <p style={{ fontSize: '0.875rem', color: '#718096', marginTop: '0.5rem' }}>
                            Last generated: {new Date(report.generatedData.lastGenerated).toLocaleString()}
                            {' '}({report.generatedData.recordCount} records)
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleGenerateReport(report._id)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: primaryColor,
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          Generate
                        </button>
                        <button
                          style={{
                            padding: '0.5rem 1rem',
                            background: 'white',
                            color: primaryColor,
                            border: `1px solid ${primaryColor}`,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {dashboards.length === 0 ? (
                <div style={{ 
                  gridColumn: '1 / -1',
                  textAlign: 'center', 
                  padding: '4rem',
                  background: 'white',
                  borderRadius: '8px'
                }}>
                  <p style={{ color: '#718096', marginBottom: '1rem' }}>No dashboards yet</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: primaryColor,
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Create Your First Dashboard
                  </button>
                </div>
              ) : (
                dashboards.map((dashboard) => (
                  <div
                    key={dashboard._id}
                    style={{
                      background: 'white',
                      padding: '1.5rem',
                      borderRadius: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      cursor: 'pointer'
                    }}
                  >
                    <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>{dashboard.name}</h3>
                    <p style={{ color: '#718096', fontSize: '0.875rem', margin: 0 }}>
                      {dashboard.description || 'No description'}
                    </p>
                    {dashboard.isDefault && (
                      <span style={{ 
                        display: 'inline-block',
                        marginTop: '0.5rem',
                        padding: '0.25rem 0.75rem', 
                        background: primaryColor, 
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '0.75rem'
                      }}>
                        Default
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px'
          }}>
            <h2 style={{ marginTop: 0 }}>Create New {activeTab === 'reports' ? 'Report' : 'Dashboard'}</h2>
            
            {activeTab === 'reports' && (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Title
                  </label>
                  <input
                    type="text"
                    value={newReport.title}
                    onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Description
                  </label>
                  <textarea
                    value={newReport.description}
                    onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      minHeight: '80px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Data Source
                  </label>
                  <select
                    value={newReport.configuration.dataSource}
                    onChange={(e) => setNewReport({ 
                      ...newReport, 
                      configuration: { ...newReport.configuration, dataSource: e.target.value }
                    })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px'
                    }}
                  >
                    <option value="assessments">Assessments</option>
                    <option value="cases">Cases</option>
                    <option value="users">Users</option>
                    <option value="incidents">Incidents</option>
                    <option value="resources">Resources</option>
                  </select>
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={handleCreateReport}
                disabled={!newReport.title}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: newReport.title ? primaryColor : '#e2e8f0',
                  color: newReport.title ? 'white' : '#718096',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: newReport.title ? 'pointer' : 'not-allowed',
                  fontWeight: '600'
                }}
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'white',
                  color: '#718096',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
