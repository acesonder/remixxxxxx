const mongoose = require('mongoose');

const moduleConfigSchema = new mongoose.Schema({
  organizationId: {
    type: String,
    required: true,
    default: 'default'
  },
  modules: {
    // Authentication & Account Management
    authentication: {
      enabled: { type: Boolean, default: true },
      features: {
        signup: { type: Boolean, default: true },
        signin: { type: Boolean, default: true },
        forgotPassword: { type: Boolean, default: true },
        socialLogin: { type: Boolean, default: false },
        twoFactorAuth: { type: Boolean, default: false },
        accountVerification: { type: Boolean, default: true }
      }
    },

    // Communication Modules
    communication: {
      enabled: { type: Boolean, default: true },
      features: {
        inbox: { type: Boolean, default: true },
        messenger: { type: Boolean, default: true },
        instantMessaging: { type: Boolean, default: true },
        pushNotifications: { type: Boolean, default: true },
        inAppNotifications: { type: Boolean, default: true },
        emailNotifications: { type: Boolean, default: true },
        realtimeChat: { type: Boolean, default: true },
        realtimeVideoChat: { type: Boolean, default: false },
        groupChat: { type: Boolean, default: true },
        fileSharing: { type: Boolean, default: true }
      }
    },

    // User Management
    userManagement: {
      enabled: { type: Boolean, default: true },
      features: {
        profileSetup: { type: Boolean, default: true },
        profileCustomization: { type: Boolean, default: true },
        friends: { type: Boolean, default: true },
        clients: { type: Boolean, default: true },
        staff: { type: Boolean, default: true },
        workers: { type: Boolean, default: true },
        serviceProviders: { type: Boolean, default: true },
        admins: { type: Boolean, default: true },
        roleManagement: { type: Boolean, default: true },
        permissionManagement: { type: Boolean, default: true }
      }
    },

    // Dashboard & UI
    dashboard: {
      enabled: { type: Boolean, default: true },
      features: {
        widgets: { type: Boolean, default: true },
        customizableLayout: { type: Boolean, default: true },
        dragDropWidgets: { type: Boolean, default: true },
        dataVisualization: { type: Boolean, default: true },
        quickActions: { type: Boolean, default: true },
        activityFeed: { type: Boolean, default: true }
      }
    },

    // UI/UX Customization
    uiCustomization: {
      enabled: { type: Boolean, default: true },
      features: {
        themeConfigurator: { type: Boolean, default: true },
        layoutConfigurator: { type: Boolean, default: true },
        colorScheme: { type: Boolean, default: true },
        effects: { type: Boolean, default: true },
        animations: { type: Boolean, default: true },
        darkMode: { type: Boolean, default: true },
        companyLogo: { type: Boolean, default: true },
        iconCustomization: { type: Boolean, default: true },
        labelCustomization: { type: Boolean, default: true },
        fontCustomization: { type: Boolean, default: true }
      }
    },

    // Assessment & Intake
    assessmentIntake: {
      enabled: { type: Boolean, default: true },
      features: {
        generalIntake: { type: Boolean, default: true },
        customForms: { type: Boolean, default: true },
        formBuilder: { type: Boolean, default: true },
        dataCollection: { type: Boolean, default: true },
        assessmentHistory: { type: Boolean, default: true },
        assessmentReports: { type: Boolean, default: true }
      }
    },

    // VI-SPDAT
    vispdat: {
      enabled: { type: Boolean, default: false },
      features: {
        individualAssessment: { type: Boolean, default: true },
        familyAssessment: { type: Boolean, default: true },
        youthAssessment: { type: Boolean, default: true },
        scoringAutomation: { type: Boolean, default: true },
        recommendations: { type: Boolean, default: true },
        followUpTracking: { type: Boolean, default: true }
      }
    },

    // Homelessness Outreach
    homelessnessOutreach: {
      enabled: { type: Boolean, default: false },
      features: {
        clientTracking: { type: Boolean, default: true },
        locationMapping: { type: Boolean, default: true },
        outreachScheduling: { type: Boolean, default: true },
        resourceDirectory: { type: Boolean, default: true },
        serviceHistory: { type: Boolean, default: true },
        outcomeMeasurement: { type: Boolean, default: true }
      }
    },

    // Addiction Tools
    addictionTools: {
      enabled: { type: Boolean, default: false },
      features: {
        substanceUseAssessment: { type: Boolean, default: true },
        recoveryPlanning: { type: Boolean, default: true },
        progressTracking: { type: Boolean, default: true },
        relapsePrevention: { type: Boolean, default: true },
        supportGroupManagement: { type: Boolean, default: true },
        crisisIntervention: { type: Boolean, default: true }
      }
    },

    // Mental Health
    mentalHealth: {
      enabled: { type: Boolean, default: false },
      features: {
        diagnosticTools: { type: Boolean, default: true },
        treatmentPlanning: { type: Boolean, default: true },
        symptomTracking: { type: Boolean, default: true },
        medicationManagement: { type: Boolean, default: true },
        therapyNotes: { type: Boolean, default: true },
        crisisAssessment: { type: Boolean, default: true }
      }
    },

    // Shelter Management
    shelterTools: {
      enabled: { type: Boolean, default: false },
      features: {
        bedManagement: { type: Boolean, default: true },
        checkInOut: { type: Boolean, default: true },
        occupancyTracking: { type: Boolean, default: true },
        waitlistManagement: { type: Boolean, default: true },
        facilityRules: { type: Boolean, default: true },
        incidentLogging: { type: Boolean, default: true }
      }
    },

    // Case Management
    caseManagement: {
      enabled: { type: Boolean, default: true },
      features: {
        caseNotes: { type: Boolean, default: true },
        goalSetting: { type: Boolean, default: true },
        actionPlans: { type: Boolean, default: true },
        progressMonitoring: { type: Boolean, default: true },
        documentManagement: { type: Boolean, default: true },
        caseAssignment: { type: Boolean, default: true },
        locationSharing: { type: Boolean, default: false },
        teamCollaboration: { type: Boolean, default: true }
      }
    },

    // Incident Reporting
    incidentReporting: {
      enabled: { type: Boolean, default: true },
      features: {
        incidentLogging: { type: Boolean, default: true },
        incidentTracking: { type: Boolean, default: true },
        severityClassification: { type: Boolean, default: true },
        photoAttachment: { type: Boolean, default: true },
        followUpActions: { type: Boolean, default: true },
        incidentReports: { type: Boolean, default: true }
      }
    },

    // Resource Sharing
    resourceSharing: {
      enabled: { type: Boolean, default: true },
      features: {
        resourceLibrary: { type: Boolean, default: true },
        documentSharing: { type: Boolean, default: true },
        resourceCategories: { type: Boolean, default: true },
        accessControl: { type: Boolean, default: true },
        versionControl: { type: Boolean, default: true },
        searchFiltering: { type: Boolean, default: true }
      }
    },

    // Settings & Configuration
    settings: {
      enabled: { type: Boolean, default: true },
      features: {
        userSettings: { type: Boolean, default: true },
        advancedSettings: { type: Boolean, default: true },
        notificationPreferences: { type: Boolean, default: true },
        privacySettings: { type: Boolean, default: true },
        securitySettings: { type: Boolean, default: true },
        integrationSettings: { type: Boolean, default: true },
        dataExport: { type: Boolean, default: true },
        apiAccess: { type: Boolean, default: false }
      }
    },

    // Consent & Agreements
    consentManagement: {
      enabled: { type: Boolean, default: true },
      features: {
        consentForms: { type: Boolean, default: true },
        digitalSignature: { type: Boolean, default: true },
        versionControl: { type: Boolean, default: true },
        consentTracking: { type: Boolean, default: true },
        revokeConsent: { type: Boolean, default: true },
        auditLog: { type: Boolean, default: true }
      }
    },

    // Badges & Gamification
    badges: {
      enabled: { type: Boolean, default: true },
      features: {
        achievementBadges: { type: Boolean, default: true },
        progressBadges: { type: Boolean, default: true },
        customBadges: { type: Boolean, default: true },
        badgeDisplay: { type: Boolean, default: true },
        leaderboards: { type: Boolean, default: false }
      }
    },

    // Analytics & Reporting
    analytics: {
      enabled: { type: Boolean, default: false },
      features: {
        customReports: { type: Boolean, default: true },
        scheduledReports: { type: Boolean, default: true },
        dataExport: { type: Boolean, default: true },
        interactiveDashboards: { type: Boolean, default: true },
        comparativeAnalytics: { type: Boolean, default: true },
        heatMaps: { type: Boolean, default: false },
        predictiveAnalytics: { type: Boolean, default: false },
        performanceMetrics: { type: Boolean, default: true },
        customDashboards: { type: Boolean, default: true },
        reportTemplates: { type: Boolean, default: true },
        reportSharing: { type: Boolean, default: true },
        dataVisualization: { type: Boolean, default: true }
      }
    },

    // Appointment & Calendar
    appointments: {
      enabled: { type: Boolean, default: false },
      features: {
        appointmentBooking: { type: Boolean, default: true },
        calendarIntegration: { type: Boolean, default: false },
        recurringAppointments: { type: Boolean, default: true },
        reminderNotifications: { type: Boolean, default: true },
        availabilityManagement: { type: Boolean, default: true },
        waitlistManagement: { type: Boolean, default: true },
        groupSessions: { type: Boolean, default: true },
        videoCallIntegration: { type: Boolean, default: false },
        appointmentHistory: { type: Boolean, default: true },
        resourceBooking: { type: Boolean, default: false },
        timezoneSupport: { type: Boolean, default: true },
        appointmentTypes: { type: Boolean, default: true }
      }
    },

    // Document Management
    documentManagement: {
      enabled: { type: Boolean, default: false },
      features: {
        documentTemplates: { type: Boolean, default: true },
        eSignatures: { type: Boolean, default: true },
        versionControl: { type: Boolean, default: true },
        documentWorkflow: { type: Boolean, default: true },
        ocrProcessing: { type: Boolean, default: false },
        documentExpiration: { type: Boolean, default: true },
        accessControl: { type: Boolean, default: true },
        documentTags: { type: Boolean, default: true },
        fullTextSearch: { type: Boolean, default: true },
        bulkOperations: { type: Boolean, default: false },
        documentSharing: { type: Boolean, default: true },
        auditTrail: { type: Boolean, default: true }
      }
    }
  },

  // Branding Configuration
  branding: {
    companyName: { type: String, default: 'My Organization' },
    logoUrl: String,
    faviconUrl: String,
    primaryColor: { type: String, default: '#2563eb' },
    secondaryColor: { type: String, default: '#7c3aed' },
    accentColor: { type: String, default: '#10b981' },
    customCSS: String
  },

  // Layout Configuration
  layoutConfig: {
    sidebarPosition: { type: String, enum: ['left', 'right'], default: 'left' },
    headerStyle: { type: String, enum: ['fixed', 'static'], default: 'fixed' },
    footerEnabled: { type: Boolean, default: true },
    compactMode: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ModuleConfig', moduleConfigSchema);
