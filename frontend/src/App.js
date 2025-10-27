import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import ReleaseManager from './pages/ReleaseManager';
import ReleaseDetail from './pages/ReleaseDetail';
import SystemManager from './pages/SystemManager';
import SystemDetail from './pages/SystemDetail';
import SystemForm from './pages/SystemForm';
import BuildManager from './pages/BuildManager';
import BuildForm from './pages/BuildForm';

// Simple auth context
const AuthContext = React.createContext();

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = React.useState(null);
  const [token, setToken] = React.useState(localStorage.getItem('token'));
  const [loading, setLoading] = React.useState(true);
  const [justLoggedIn, setJustLoggedIn] = React.useState(false);

  React.useEffect(() => {
    if (token) {
      // Verify token and get user info
      fetch('/api/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Invalid token');
      })
      .then(userData => {
        setUser(userData);
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('lastVisitedPath');
        localStorage.removeItem('welcomeShown');
        setToken(null);
      })
      .finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setToken(token);
    setUser(userData);
    setJustLoggedIn(true);
    // Clear welcome shown flag on new login
    localStorage.removeItem('welcomeShown');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('lastVisitedPath');
    localStorage.removeItem('welcomeShown');
    setToken(null);
    setUser(null);
    setJustLoggedIn(false);
  };

  const value = {
    user,
    token,
    login,
    logout,
    justLoggedIn,
    setJustLoggedIn,
    isAuthenticated: !!token && !!user
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '100px' }}>Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  React.useEffect(() => {
    if (isAuthenticated && location.pathname !== '/login' && location.pathname !== '/register') {
      localStorage.setItem('lastVisitedPath', location.pathname + location.search);
    }
  }, [isAuthenticated, location]);
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const RedirectToLastVisited = () => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    const lastPath = localStorage.getItem('lastVisitedPath');
    return <Navigate to={lastPath || '/home'} replace />;
  }
  
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/home" 
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/release-manager" 
            element={
              <ProtectedRoute>
                <Home activeContent="release-manager" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/build-manager" 
            element={
              <ProtectedRoute>
                <Home activeContent="build-manager" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/builds/new" 
            element={
              <ProtectedRoute>
                <Home activeContent="build-form" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/builds/:id/edit" 
            element={
              <ProtectedRoute>
                <Home activeContent="build-form" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/releases/:id" 
            element={
              <ProtectedRoute>
                <Home activeContent="release-detail" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/systems" 
            element={
              <ProtectedRoute>
                <Home activeContent="system-manager" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/systems/new" 
            element={
              <ProtectedRoute>
                <Home activeContent="system-form" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/systems/:id" 
            element={
              <ProtectedRoute>
                <Home activeContent="system-detail" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/systems/:id/edit" 
            element={
              <ProtectedRoute>
                <Home activeContent="system-form" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/environment-manager" 
            element={
              <ProtectedRoute>
                <Home activeContent="environment-manager" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/booking-request" 
            element={
              <ProtectedRoute>
                <Home activeContent="booking-request" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/change-request" 
            element={
              <ProtectedRoute>
                <Home activeContent="change-request" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/deployment-manager" 
            element={
              <ProtectedRoute>
                <Home activeContent="deployment-manager" />
              </ProtectedRoute>
            } 
          />
          <Route path="/dashboard" element={<Navigate to="/home" />} />
          <Route path="/" element={<RedirectToLastVisited />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;