import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in (e.g., JWT in localStorage)
    const token = localStorage.getItem('token');
    if (token) {
      // Fetch user data or decode JWT
      // This is just a placeholder
      setUser({ firstName: 'Demo', lastName: 'User' });
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    // Implement login logic
    // Set user state and save token
  };

  const register = async (userData) => {
    // Implement register logic
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);