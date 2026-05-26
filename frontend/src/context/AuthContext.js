import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set auth token header helper
  const setAuthHeader = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  // Restore user session on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('studyshield_token');
      if (token) {
        setAuthHeader(token);
        try {
          const response = await axios.get(`${API}/api/auth/me`);
          if (response.data.success) {
            setUser(response.data.user);
          } else {
            localStorage.removeItem('studyshield_token');
            setAuthHeader(null);
          }
        } catch (err) {
          console.error('[AUTH] Failed to verify token session on mount:', err.message);
          localStorage.removeItem('studyshield_token');
          setAuthHeader(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  // Register action
  const register = async (name, email, password) => {
    setError(null);
    try {
      const response = await axios.post(`${API}/api/auth/register`, { name, email, password });
      if (response.data.success) {
        const { token, user: userData } = response.data;
        localStorage.setItem('studyshield_token', token);
        setAuthHeader(token);
        setUser(userData);
        return { success: true };
      } else {
        const msg = response.data.message || 'Registration failed.';
        setError(msg);
        return { success: false, message: msg };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errMsg);
      return { success: false, message: errMsg };
    }
  };

  // Login action
  const login = async (email, password) => {
    setError(null);
    try {
      const response = await axios.post(`${API}/api/auth/login`, { email, password });
      if (response.data.success) {
        const { token, user: userData } = response.data;
        localStorage.setItem('studyshield_token', token);
        setAuthHeader(token);
        setUser(userData);
        return { success: true };
      } else {
        const msg = response.data.message || 'Login failed.';
        setError(msg);
        return { success: false, message: msg };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Invalid email or password.';
      setError(errMsg);
      return { success: false, message: errMsg };
    }
  };

  // Logout action
  const logout = () => {
    localStorage.removeItem('studyshield_token');
    setAuthHeader(null);
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, register, login, logout, setError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
