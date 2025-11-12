import { createContext, useContext, useState, useEffect } from 'react';
import axios from '../lib/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await axios.get('/api/auth/me');
          setUser(response.data.data);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const register = async (email, password, name) => {
    try {
      setError(null);
      const response = await axios.post('/api/auth/register', {
        email,
        password,
        name,
      });

      const { token, user: userData } = response.data.data;
      localStorage.setItem('token', token);
      setUser(userData);

      return { success: true, user: userData };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await axios.post('/api/auth/login', {
        email,
        password,
      });

      const { token, user: userData } = response.data.data;
      localStorage.setItem('token', token);
      setUser(userData);

      return { success: true, user: userData };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const changePassword = async (currentPassword, newPassword, confirmPassword) => {
    try {
      await axios.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Password change failed';
      return { success: false, error: message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        register,
        login,
        logout,
        changePassword,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
