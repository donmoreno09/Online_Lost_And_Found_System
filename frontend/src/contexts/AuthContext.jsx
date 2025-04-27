import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);

  // Carica i dati dell'utente all'avvio
  useEffect(() => {
    const loadUser = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            const res = await axios.get(`${API_URL}/users/me`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            if (res.data.success) {
                setUser(res.data.data);
            } else {
                // Token non valido
                localStorage.removeItem('token');
                setUser(null);
            }
        } catch (err) {
            console.error('Errore caricamento utente:', err);
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    loadUser();
}, []);

  // Funzione per recuperare le notifiche dell'utente
  const fetchNotifications = useCallback(async () => {
    if (user) {
      try {
        const response = await axios.get(`${API_URL}/users/notifications`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.data.success) {
          setNotifications(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    }
  }, [user]); // Dipendenza da user

  // Ora aggiorna l'useEffect
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]); // Ora è sicuro includere fetchNotifications

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
      error,
      register,
      login,
      logout,
      updateProfile,
      notifications,
      fetchNotifications,
      isAuthenticated  // Make sure this is included
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;