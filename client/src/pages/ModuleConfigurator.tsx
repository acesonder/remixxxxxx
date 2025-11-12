import React, { useState, useEffect } from 'react';
import { useModules } from '../context/ModuleContext';
import { moduleAPI } from '../services/api';

const ModuleConfigurator: React.FC = () => {
  const { config, updateConfig } = useModules();
  const [localConfig, setLocalConfig] = useState(config);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('modules');

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleModuleToggle = (moduleName: string) => {
    if (!localConfig) return;

    setLocalConfig({
      ...localConfig,
      modules: {
        ...localConfig.modules,
        [moduleName]: {
          ...localConfig.modules[moduleName],
          enabled: !localConfig.modules[moduleName].enabled
        }
      }
    });
  };

  const handleFeatureToggle = (moduleName: string, featureName: string) => {
    if (!localConfig) return;

    setLocalConfig({
      ...localConfig,
      modules: {
        ...localConfig.modules,
        [moduleName]: {
          ...localConfig.modules[moduleName],
          features: {
            ...localConfig.modules[moduleName].features,
            [featureName]: !localConfig.modules[moduleName].features[featureName]
          }
        }
      }
    });
  };

  const handleBrandingChange = (field: string, value: string) => {
    if (!localConfig) return;

    setLocalConfig({
      ...localConfig,
      branding: {
        ...localConfig.branding,
        [field]: value
      }
    });
  };

  const handleLayoutChange = (field: string, value: any) => {
    if (!localConfig) return;

    setLocalConfig({
      ...localConfig,
      layoutConfig: {
        ...localConfig.layoutConfig,
        [field]: value
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      await updateConfig(localConfig);
      setMessage('Configuration saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (!localConfig) {
    return <div style={{ padding: '2rem' }}>Loading...</div>;
  }

  const moduleList = Object.entries(localConfig.modules);
  const primaryColor = localConfig.branding.primaryColor;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#1a202c' }}>
        Module Configuration
      </h1>
      <p style={{ color: '#718096', marginBottom: '2rem' }}>
        Configure modules and features for your organization
      </p>

      {message && (
        <div style={{
          padding: '1rem',
          background: message.includes('success') ? '#d4edda' : '#f8d7da',
          color: message.includes('success') ? '#155724' : '#721c24',
          borderRadius: '6px',
          marginBottom: '1rem'
        }}>
          {message}
        </div>
      )}

      <div style={{ marginBottom: '2rem', borderBottom: '2px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {['modules', 'branding', 'layout'].map((tab) => (
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

      {activeTab === 'modules' && (
        <div>
          {moduleList.map(([moduleName, moduleData]) => (
            <div
              key={moduleName}
              style={{
                background: 'white',
                borderRadius: '8px',
                padding: '1.5rem',
                marginBottom: '1rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  margin: 0,
                  textTransform: 'capitalize',
                  color: '#1a202c'
                }}>
                  {moduleName.replace(/([A-Z])/g, ' $1').trim()}
                </h3>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={moduleData.enabled}
                    onChange={() => handleModuleToggle(moduleName)}
                    style={{ 
                      width: '20px', 
                      height: '20px', 
                      cursor: 'pointer',
                      marginRight: '0.5rem'
                    }}
                  />
                  <span style={{ fontWeight: '600', color: moduleData.enabled ? primaryColor : '#718096' }}>
                    {moduleData.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>

              {moduleData.enabled && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #e2e8f0'
                }}>
                  {Object.entries(moduleData.features).map(([featureName, featureEnabled]) => (
                    <label
                      key={featureName}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        padding: '0.5rem',
                        borderRadius: '4px',
                        background: featureEnabled ? '#f0f9ff' : '#f7fafc'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={featureEnabled as boolean}
                        onChange={() => handleFeatureToggle(moduleName, featureName)}
                        style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                      />
                      <span style={{ 
                        fontSize: '0.9rem',
                        textTransform: 'capitalize',
                        color: '#2d3748'
                      }}>
                        {featureName.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'branding' && (
        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '2rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Brand Settings</h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Company Name
            </label>
            <input
              type="text"
              value={localConfig.branding.companyName}
              onChange={(e) => handleBrandingChange('companyName', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Logo URL
            </label>
            <input
              type="text"
              value={localConfig.branding.logoUrl || ''}
              onChange={(e) => handleBrandingChange('logoUrl', e.target.value)}
              placeholder="https://example.com/logo.png"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Primary Color
              </label>
              <input
                type="color"
                value={localConfig.branding.primaryColor}
                onChange={(e) => handleBrandingChange('primaryColor', e.target.value)}
                style={{
                  width: '100%',
                  height: '50px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Secondary Color
              </label>
              <input
                type="color"
                value={localConfig.branding.secondaryColor}
                onChange={(e) => handleBrandingChange('secondaryColor', e.target.value)}
                style={{
                  width: '100%',
                  height: '50px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Accent Color
              </label>
              <input
                type="color"
                value={localConfig.branding.accentColor}
                onChange={(e) => handleBrandingChange('accentColor', e.target.value)}
                style={{
                  width: '100%',
                  height: '50px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'layout' && (
        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '2rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Layout Configuration</h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Sidebar Position
            </label>
            <select
              value={localConfig.layoutConfig.sidebarPosition}
              onChange={(e) => handleLayoutChange('sidebarPosition', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Header Style
            </label>
            <select
              value={localConfig.layoutConfig.headerStyle}
              onChange={(e) => handleLayoutChange('headerStyle', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            >
              <option value="fixed">Fixed</option>
              <option value="static">Static</option>
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={localConfig.layoutConfig.footerEnabled}
              onChange={(e) => handleLayoutChange('footerEnabled', e.target.checked)}
              style={{ marginRight: '0.5rem', cursor: 'pointer' }}
            />
            <span style={{ fontWeight: '600' }}>Show Footer</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={localConfig.layoutConfig.compactMode}
              onChange={(e) => handleLayoutChange('compactMode', e.target.checked)}
              style={{ marginRight: '0.5rem', cursor: 'pointer' }}
            />
            <span style={{ fontWeight: '600' }}>Compact Mode</span>
          </label>
        </div>
      )}

      <div style={{ 
        position: 'sticky', 
        bottom: '2rem', 
        marginTop: '2rem',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '1rem'
      }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '1rem 2rem',
            background: primaryColor,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
};

export default ModuleConfigurator;
