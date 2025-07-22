import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout';
import { HRDashboard } from './pages/HRDashboard';
import { ManagerDashboard } from './pages/ManagerDashboard';
import { EmployeeDashboard } from './pages/EmployeeDashboard';
import { EmployeeCreate } from './pages/EmployeeCreate';
import { EmployeeCreationWorkflow } from './components/hr/EmployeeCreationWorkflow';
import TabletOnboarding from './pages/TabletOnboarding';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { MFASetup } from './pages/auth/MFASetup';
import { RegistrationSuccess } from './pages/auth/RegistrationSuccess';
import { useAuthStore } from './stores/authStore';
import { useLayoutStore } from './stores/layoutStore';
import { setupTokenRefresh } from './services/authService';
import { PublicJobPortal } from './pages/PublicJobPortal';
import './styles/globals.css';
import './i18n'; // Initialize i18n

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth/login" replace />;
};

// Role-based redirect component
const RoleBasedRedirect: React.FC = () => {
  const { user } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }
  
  // Redirect based on user role
  switch (user.role) {
    case 'hr_admin':
      return <Navigate to="/hr-dashboard" replace />;
    case 'manager':
      return <Navigate to="/manager-dashboard" replace />;
    case 'employee':
      return <Navigate to="/employee-dashboard" replace />;
    default:
      return <Navigate to="/hr-dashboard" replace />;
  }
};

function App() {
  const { addNotification } = useLayoutStore();
  const { user, isAuthenticated } = useAuthStore();
  
  // Set up automatic token refresh
  useEffect(() => {
    if (isAuthenticated) {
      const refreshToken = setupTokenRefresh();
      
      // Set up periodic token refresh (every 14 minutes for 15-minute tokens)
      const interval = setInterval(async () => {
        try {
          await refreshToken();
        } catch (error) {
          console.error('Token refresh failed:', error);
          // Token refresh failure is handled in the service
        }
      }, 14 * 60 * 1000); // 14 minutes
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);
  
  // Add welcome notification for authenticated users
  useEffect(() => {
    if (isAuthenticated && user) {
      const timer = setTimeout(() => {
        addNotification({
          title: `Welcome back, ${user.firstName}!`,
          message: 'Your employee management system is ready to use.',
          type: 'info',
          read: false,
        });
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [addNotification, isAuthenticated, user]);

  return (
    <Router>
      <Routes>
        {/* Authentication Routes */}
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="/auth/mfa-setup" element={<MFASetup />} />
        <Route path="/auth/registration-success" element={<RegistrationSuccess />} />
        
        {/* Modern Onboarding Route - Public */}
        <Route path="/onboarding" element={<OnboardingFlow />} />
        
        {/* Tablet Onboarding Route - Public (for walk-in onboarding) */}
        <Route path="/onboarding/tablet" element={<TabletOnboarding />} />
        <Route path="/tablet-onboarding" element={<TabletOnboarding />} />
        
        {/* Public Job Portal - No authentication required */}
        <Route path="/jobs" element={<PublicJobPortal />} />
        
        {/* Root redirect */}
        <Route path="/" element={<RoleBasedRedirect />} />
        <Route path="/dashboard" element={<RoleBasedRedirect />} />
        
        {/* Protected Application Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/hr-dashboard" element={<HRDashboard />} />
                  <Route path="/manager-dashboard" element={<ManagerDashboard />} />
                  <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
                  <Route path="/employees/create" element={<EmployeeCreationWorkflow />} />
                  <Route path="/manager/onboarding/walkin" element={React.lazy(() => import('./pages/manager/WalkInOnboardingPage'))} />
                  {/* Placeholder routes - will be implemented in future tasks */}
                  <Route path="/employees" element={<div>Employees Page (Coming Soon)</div>} />
                  <Route path="/scheduling" element={<div>Scheduling Page (Coming Soon)</div>} />
                  <Route path="/documents" element={<div>Documents Page (Coming Soon)</div>} />
                  <Route path="/messages" element={<div>Messages Page (Coming Soon)</div>} />
                  <Route path="/announcements" element={<div>Announcements Page (Coming Soon)</div>} />
                  <Route path="/reports" element={<div>Reports Page (Coming Soon)</div>} />
                  <Route path="/profile" element={<div>Profile Page (Coming Soon)</div>} />
                  <Route path="/settings" element={<div>Settings Page (Coming Soon)</div>} />
                  <Route path="*" element={<div>Page Not Found</div>} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;