export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'staff' | 'worker' | 'service_provider' | 'client';
  profile?: {
    avatar?: string;
    phone?: string;
    address?: string;
    bio?: string;
  };
  settings?: UserSettings;
}

export interface UserSettings {
  notifications?: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  privacy?: {
    profileVisible: boolean;
    locationSharing: boolean;
  };
  theme?: string;
  language?: string;
}

export interface ModuleConfig {
  _id: string;
  organizationId: string;
  modules: {
    [key: string]: {
      enabled: boolean;
      features: {
        [key: string]: boolean;
      };
    };
  };
  branding: {
    companyName: string;
    logoUrl?: string;
    faviconUrl?: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
  layoutConfig: {
    sidebarPosition: 'left' | 'right';
    headerStyle: 'fixed' | 'static';
    footerEnabled: boolean;
    compactMode: boolean;
  };
}

export interface Message {
  _id: string;
  senderId: string;
  recipientId: string;
  conversationId: string;
  content: string;
  messageType: 'text' | 'file' | 'image' | 'video' | 'audio';
  createdAt: string;
  readBy: Array<{ userId: string; readAt: string }>;
}

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'message' | 'alert' | 'system';
  category: 'message' | 'case_update' | 'assessment' | 'incident' | 'system' | 'reminder';
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface Assessment {
  _id: string;
  clientId: string;
  assessorId: string;
  assessmentType: string;
  title: string;
  responses: Record<string, any>;
  score?: number;
  status: 'draft' | 'completed' | 'reviewed' | 'archived';
  createdAt: string;
}

export interface CaseManagement {
  _id: string;
  clientId: string;
  caseManagerId: string;
  caseNumber: string;
  status: 'active' | 'inactive' | 'closed' | 'pending';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  goals: Array<{
    description: string;
    targetDate: string;
    status: string;
    progress: number;
  }>;
  notes: Array<{
    authorId: string;
    content: string;
    createdAt: string;
  }>;
}

export interface Resource {
  _id: string;
  title: string;
  description: string;
  category: string;
  resourceType: string;
  fileUrl?: string;
  externalUrl?: string;
  tags: string[];
  uploadedBy: string;
  accessLevel: 'public' | 'staff_only' | 'admin_only';
  views: number;
  createdAt: string;
}
