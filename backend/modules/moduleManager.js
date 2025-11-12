const fs = require('fs');
const path = require('path');

class ModuleManager {
  constructor() {
    this.modules = new Map();
    this.moduleConfigs = new Map();
    this.loadModuleDefinitions();
  }

  loadModuleDefinitions() {
    // Define available modules
    const moduleDefinitions = [
      {
        id: 'auth',
        name: 'Authentication',
        description: 'User authentication, registration, login, password recovery',
        enabled: true,
        version: '1.0.0',
        features: ['login', 'signup', 'password-reset', 'email-verification'],
        dependencies: []
      },
      {
        id: 'messaging',
        name: 'Messaging',
        description: 'Inbox, messenger, instant messaging capabilities',
        enabled: true,
        version: '1.0.0',
        features: ['inbox', 'instant-messaging', 'chat-rooms'],
        dependencies: ['auth']
      },
      {
        id: 'notifications',
        name: 'Notifications',
        description: 'Push notifications, in-app notifications, badges',
        enabled: true,
        version: '1.0.0',
        features: ['push-notifications', 'in-app-notifications', 'badges'],
        dependencies: ['auth']
      },
      {
        id: 'consent',
        name: 'Consent Agreement',
        description: 'User consent and agreement management',
        enabled: true,
        version: '1.0.0',
        features: ['consent-tracking', 'agreement-templates', 'version-control'],
        dependencies: ['auth']
      },
      {
        id: 'dashboard',
        name: 'Dashboard',
        description: 'Configurable dashboards with widgets',
        enabled: true,
        version: '1.0.0',
        features: ['widgets', 'custom-layouts', 'data-visualization'],
        dependencies: ['auth']
      },
      {
        id: 'ui-config',
        name: 'UI/UX Configuration',
        description: 'Theme configurator, layouts, effects',
        enabled: true,
        version: '1.0.0',
        features: ['themes', 'layouts', 'effects', 'custom-css'],
        dependencies: []
      },
      {
        id: 'assessment',
        name: 'Assessment Intake',
        description: 'Assessment and intake system for data collection',
        enabled: true,
        version: '1.0.0',
        features: ['form-builder', 'intake-workflows', 'data-validation'],
        dependencies: ['auth']
      },
      {
        id: 'homelessness',
        name: 'Homelessness Outreach',
        description: 'Tools for homelessness outreach and management',
        enabled: true,
        version: '1.0.0',
        features: ['case-management', 'resource-tracking', 'reporting'],
        dependencies: ['auth', 'assessment']
      },
      {
        id: 'addiction',
        name: 'Addiction Tools',
        description: 'Addiction support and recovery tools',
        enabled: true,
        version: '1.0.0',
        features: ['recovery-tracking', 'support-groups', 'crisis-resources'],
        dependencies: ['auth', 'assessment']
      }
    ];

    moduleDefinitions.forEach(module => {
      this.modules.set(module.id, module);
      this.moduleConfigs.set(module.id, {});
    });
  }

  getAllModules() {
    return Array.from(this.modules.values());
  }

  getEnabledModules() {
    return Array.from(this.modules.values()).filter(m => m.enabled);
  }

  getModule(moduleId) {
    return this.modules.get(moduleId);
  }

  enableModule(moduleId) {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    // Check dependencies
    if (module.dependencies && module.dependencies.length > 0) {
      for (const depId of module.dependencies) {
        const dep = this.modules.get(depId);
        if (!dep || !dep.enabled) {
          throw new Error(`Cannot enable ${moduleId}: dependency ${depId} is not enabled`);
        }
      }
    }

    module.enabled = true;
    return module;
  }

  disableModule(moduleId) {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    // Check if other modules depend on this one
    const dependents = Array.from(this.modules.values()).filter(m => 
      m.enabled && m.dependencies && m.dependencies.includes(moduleId)
    );

    if (dependents.length > 0) {
      throw new Error(`Cannot disable ${moduleId}: modules ${dependents.map(d => d.name).join(', ')} depend on it`);
    }

    module.enabled = false;
    return module;
  }

  configureModule(moduleId, config) {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    this.moduleConfigs.set(moduleId, { ...this.moduleConfigs.get(moduleId), ...config });
    return this.moduleConfigs.get(moduleId);
  }

  getModuleConfig(moduleId) {
    return this.moduleConfigs.get(moduleId) || {};
  }

  initializeModules(app, io) {
    const modulesDir = path.join(__dirname);
    const enabledModules = this.getEnabledModules();

    enabledModules.forEach(module => {
      const modulePath = path.join(modulesDir, module.id);
      
      // Try to load module routes if they exist
      try {
        const moduleRoutes = require(modulePath);
        if (typeof moduleRoutes === 'function') {
          app.use(`/api/${module.id}`, moduleRoutes(io, this));
          console.log(`Loaded routes for module: ${module.name}`);
        }
      } catch (err) {
        // Module routes file doesn't exist yet, that's ok
        console.log(`Module ${module.name} has no routes file yet`);
      }
    });
  }
}

module.exports = new ModuleManager();
