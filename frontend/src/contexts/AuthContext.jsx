import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const AuthContext = createContext();

// Configura l'interceptor di axios per aggiungere il token a tutte le richieste
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carica i dati dell'utente all'avvio
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/users/me`);
        if (res.data.success) {
          setUser(res.data.data);
        } else {
          // Token scaduto o non valido
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.error('Errore caricamento utente:', err);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (credentials) => {
    try {
      const res = await axios.post(`${API_URL}/users/login`, credentials);
      
      if (res.data.success && res.data.token) {
        localStorage.setItem('token', res.data.token);
        setUser(res.data.data);
        return { success: true };
      }
      return { success: false, error: 'Something went wrong' };
    } catch (err) {
      console.error('Errore login:', err);
      return { 
        success: false, 
        error: err.response?.data?.message || 'Invalid credentials' 
      };
    }
  };

  const register = async (userData) => {
    try {
      // Se userData include un file avatar, usare FormData
      if (userData.avatar instanceof File) {
        const formData = new FormData();
        
        Object.keys(userData).forEach(key => {
          if (key !== 'confirmPassword') {
            formData.append(key, userData[key]);
          }
        });
        
        const res = await axios.post(`${API_URL}/users/register`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        if (res.data.success) {
          // Se il backend ritorna un token, autentichiamo subito l'utente
          if (res.data.token) {
            localStorage.setItem('token', res.data.token);
            setUser(res.data.data);
          }
          return { success: true, data: res.data };
        }
        
        return { success: false, error: 'Registration failed' };
      } else {
        // Rimuoviamo confirmPassword prima dell'invio
        const { confirmPassword, ...dataToSend } = userData;
        
        const res = await axios.post(`${API_URL}/users/register`, dataToSend);
        
        if (res.data.success) {
          if (res.data.token) {
            localStorage.setItem('token', res.data.token);
            setUser(res.data.data);
          }
          return { success: true, data: res.data };
        }
        
        return { success: false, error: 'Registration failed' };
      }
    } catch (err) {
      console.error('Errore registrazione:', err);
      return { 
        success: false, 
        error: err.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const updateProfile = async (userId, userData) => {
    try {
      // Se l'aggiornamento include un file avatar o cambia password, usiamo FormData
      const formData = new FormData();
      
      Object.keys(userData).forEach(key => {
        if ((key === 'avatar' && userData[key] instanceof File) || key !== 'avatar') {
          formData.append(key, userData[key]);
        }
      });
      
      const res = await axios.put(`${API_URL}/users/${userId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (res.data.success) {
        setUser(res.data.data);
        return { success: true };
      }
      return { success: false, error: 'Failed to update profile' };
    } catch (err) {
      console.error('Errore aggiornamento profilo:', err);
      return { 
        success: false, 
        error: err.response?.data?.message || 'Failed to update profile' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Per le rotte protette
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      register,
      updateProfile,
      isAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;