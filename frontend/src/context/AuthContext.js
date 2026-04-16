// frontend/src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const savedUser = localStorage.getItem('user');

      if (!token || !savedUser) {
        setLoading(false);
        return;
      }

      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);

        try {
          // 🔹 VERIFY
          const response = await authAPI.verify();

          if (response.data.success) {
            setUser(response.data.data.user);
            localStorage.setItem('user', JSON.stringify(response.data.data.user));
          }
        } catch (error) {
          console.warn("Verify gagal, coba refresh token");

          try {
            // 🔹 REFRESH
            const refreshResponse = await authAPI.refresh();

            if (refreshResponse.data.success) {
              const { accessToken, refreshToken } = refreshResponse.data.data;

              localStorage.setItem('accessToken', accessToken);
              if (refreshToken) {
                localStorage.setItem('refreshToken', refreshToken);
              }

              // 🔹 RETRY VERIFY
              const retry = await authAPI.verify();
              setUser(retry.data.data.user);
              setIsAuthenticated(true);
            }
          } catch (err) {
            console.error("Refresh token gagal:", err);
            logout();
          }
        }
      } catch (error) {
        logout();
      } finally {
        setLoading(false); // ✅ pindah ke sini
      }
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await authAPI.login({ username, password });
      
      if (response.data.success) {
        const { user, accessToken, refreshToken } = response.data.data;
        
        // Save to localStorage
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Update state
        setUser(user);
        setIsAuthenticated(true);
        
        return { success: true, user };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Login gagal. Silakan coba lagi.';
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Clear state
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
