import React, { createContext, useContext, useState, useEffect } from 'react';
import { moduleAPI } from '../services/api';
import { ModuleConfig } from '../types';

interface ModuleContextType {
  config: ModuleConfig | null;
  loading: boolean;
  updateConfig: (data: any) => Promise<void>;
  updateBranding: (data: any) => Promise<void>;
  isModuleEnabled: (moduleName: string) => boolean;
  isFeatureEnabled: (moduleName: string, featureName: string) => boolean;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

export const ModuleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<ModuleConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await moduleAPI.getConfig();
      setConfig(response.data.config);
    } catch (error) {
      console.error('Failed to load module config:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (data: any) => {
    const response = await moduleAPI.updateConfig(data);
    setConfig(response.data.config);
  };

  const updateBranding = async (data: any) => {
    const response = await moduleAPI.updateBranding(data);
    setConfig(response.data.config);
  };

  const isModuleEnabled = (moduleName: string): boolean => {
    return config?.modules?.[moduleName]?.enabled ?? false;
  };

  const isFeatureEnabled = (moduleName: string, featureName: string): boolean => {
    return config?.modules?.[moduleName]?.features?.[featureName] ?? false;
  };

  return (
    <ModuleContext.Provider
      value={{
        config,
        loading,
        updateConfig,
        updateBranding,
        isModuleEnabled,
        isFeatureEnabled,
      }}
    >
      {children}
    </ModuleContext.Provider>
  );
};

export const useModules = () => {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error('useModules must be used within a ModuleProvider');
  }
  return context;
};
