import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  forgotPassword: (data: any) => api.post('/auth/forgot-password', data),
  getCurrentUser: () => api.get('/auth/me'),
};

// Module Config API
export const moduleAPI = {
  getConfig: (organizationId?: string) => 
    api.get('/modules', { params: { organizationId } }),
  updateConfig: (data: any) => api.put('/modules', data),
  updateModule: (moduleName: string, data: any) => 
    api.patch(`/modules/${moduleName}`, data),
  updateBranding: (data: any) => api.patch('/modules/branding', data),
  updateLayout: (data: any) => api.patch('/modules/layout', data),
};

// User API
export const userAPI = {
  getUsers: (params?: any) => api.get('/users', { params }),
  getUser: (id: string) => api.get(`/users/${id}`),
  updateUser: (id: string, data: any) => api.put(`/users/${id}`, data),
  addFriend: (id: string, friendId: string) => 
    api.post(`/users/${id}/friends`, { friendId }),
  removeFriend: (id: string, friendId: string) => 
    api.delete(`/users/${id}/friends/${friendId}`),
  updateSettings: (id: string, data: any) => 
    api.patch(`/users/${id}/settings`, data),
};

// Message API
export const messageAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (conversationId: string) => 
    api.get(`/messages/${conversationId}`),
  sendMessage: (data: any) => api.post('/messages', data),
  markAsRead: (id: string) => api.patch(`/messages/${id}/read`),
  deleteMessage: (id: string) => api.delete(`/messages/${id}`),
};

// Notification API
export const notificationAPI = {
  getNotifications: (params?: any) => api.get('/notifications', { params }),
  createNotification: (data: any) => api.post('/notifications', data),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  deleteNotification: (id: string) => api.delete(`/notifications/${id}`),
};

// Assessment API
export const assessmentAPI = {
  getAssessments: (params?: any) => api.get('/assessments', { params }),
  getAssessment: (id: string) => api.get(`/assessments/${id}`),
  createAssessment: (data: any) => api.post('/assessments', data),
  updateAssessment: (id: string, data: any) => api.put(`/assessments/${id}`, data),
  deleteAssessment: (id: string) => api.delete(`/assessments/${id}`),
};

// Case Management API
export const caseAPI = {
  getCases: (params?: any) => api.get('/case-management', { params }),
  getCase: (id: string) => api.get(`/case-management/${id}`),
  createCase: (data: any) => api.post('/case-management', data),
  updateCase: (id: string, data: any) => api.put(`/case-management/${id}`, data),
  addNote: (id: string, data: any) => api.post(`/case-management/${id}/notes`, data),
  updateLocation: (id: string, data: any) => 
    api.patch(`/case-management/${id}/location`, data),
  deleteCase: (id: string) => api.delete(`/case-management/${id}`),
};

// Resource API
export const resourceAPI = {
  getResources: (params?: any) => api.get('/resources', { params }),
  getResource: (id: string) => api.get(`/resources/${id}`),
  createResource: (data: any) => api.post('/resources', data),
  updateResource: (id: string, data: any) => api.put(`/resources/${id}`, data),
  deleteResource: (id: string) => api.delete(`/resources/${id}`),
};

// Settings API
export const settingsAPI = {
  getUserSettings: () => api.get('/settings/user'),
  updateUserSettings: (data: any) => api.put('/settings/user', data),
  updateNotificationPreferences: (data: any) => 
    api.patch('/settings/notifications', data),
  updatePrivacySettings: (data: any) => api.patch('/settings/privacy', data),
  updateTheme: (theme: string) => api.patch('/settings/theme', { theme }),
  exportData: () => api.get('/settings/export'),
};

// Analytics API
export const analyticsAPI = {
  // Reports
  getReports: (params?: any) => api.get('/analytics/reports', { params }),
  getReport: (id: string) => api.get(`/analytics/reports/${id}`),
  createReport: (data: any) => api.post('/analytics/reports', data),
  updateReport: (id: string, data: any) => api.put(`/analytics/reports/${id}`, data),
  deleteReport: (id: string) => api.delete(`/analytics/reports/${id}`),
  generateReport: (id: string) => api.post(`/analytics/reports/${id}/generate`),
  exportReport: (id: string, format: string) => 
    api.get(`/analytics/reports/${id}/export`, { params: { format } }),
  
  // Dashboards
  getDashboards: () => api.get('/analytics/dashboards'),
  getDashboard: (id: string) => api.get(`/analytics/dashboards/${id}`),
  createDashboard: (data: any) => api.post('/analytics/dashboards', data),
  updateDashboard: (id: string, data: any) => api.put(`/analytics/dashboards/${id}`, data),
  deleteDashboard: (id: string) => api.delete(`/analytics/dashboards/${id}`),
};

export default api;
