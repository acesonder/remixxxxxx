import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ModuleProvider } from './context/ModuleContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ModuleConfigurator from './pages/ModuleConfigurator';
import Analytics from './pages/Analytics';
import './App.css';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>Loading...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>Loading...</div>;
  }

  return user?.role === 'admin' ? <>{children}</> : <Navigate to="/dashboard" />;
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7fafc' }}>
      <nav style={{
        background: 'white',
        padding: '1rem 2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563eb' }}>
          Platform
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span style={{ color: '#718096' }}>
            {user.firstName} {user.lastName}
          </span>
          <button
            onClick={logout}
            style={{
              padding: '0.5rem 1rem',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Logout
          </button>
        </div>
      </nav>
      {children}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ModuleProvider>
          <AppLayout>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin/modules" 
                element={
                  <AdminRoute>
                    <ModuleConfigurator />
                  </AdminRoute>
                } 
              />
              <Route 
                path="/analytics" 
                element={
                  <PrivateRoute>
                    <Analytics />
                  </PrivateRoute>
                } 
              />
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="*" element={
                <div style={{ 
                  padding: '4rem 2rem', 
                  textAlign: 'center',
                  maxWidth: '600px',
                  margin: '0 auto'
                }}>
                  <h1 style={{ fontSize: '4rem', margin: 0 }}>404</h1>
                  <p style={{ fontSize: '1.5rem', color: '#718096' }}>Page not found</p>
                  <a 
                    href="/dashboard" 
                    style={{ 
                      color: '#2563eb', 
                      textDecoration: 'none',
                      fontWeight: '600' 
                    }}
                  >
                    Go to Dashboard
                  </a>
                </div>
              } />
            </Routes>
          </AppLayout>
        </ModuleProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
