import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Overview from './pages/Overview';
import Visitors from './pages/Visitors';
import VisitorDetail from './pages/VisitorDetail';
import Companies from './pages/Companies';
import Setup from './pages/Setup';
import Integrations from './pages/Integrations';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Onboarding Route */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          {/* Protected Dashboard Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/overview" replace />} />
            <Route path="overview" element={<Overview />} />
            <Route path="visitors" element={<Visitors />} />
            <Route path="visitors/:clientId" element={<VisitorDetail />} />
            <Route path="companies" element={<Companies />} />
            <Route path="setup" element={<Setup />} />
            <Route path="integrations" element={<Integrations />} />
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
