import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || null;
  });

  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, []);
  useEffect(()=>{
    const sync=event=>{
      if(event.key!==null && event.key!=='token' && event.key!=='user')return;
      const nextToken=localStorage.getItem('token');
      let nextUser=null;
      try{nextUser=JSON.parse(localStorage.getItem('user') || 'null');}catch{}
      setToken(nextToken);setUser(nextToken?nextUser:null);if(nextToken!==token)setIsLoading(Boolean(nextToken));
    };
    window.addEventListener('storage',sync);
    return()=>window.removeEventListener('storage',sync);
  },[token]);

  useEffect(() => {
    let disposed = false;
    const verifyToken = async () => {
      if (token) {
        try {
          const res = await authAPI.getMe(token);
          if (disposed) return;
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('user', JSON.stringify(res.user));
          } else if(res.status===401 || res.status===403) {
            logout();
          }
        } catch {
          // Keep offline state or clear
        }
      }
      if (!disposed) setIsLoading(false);
    };

    verifyToken();
    return () => { disposed = true; };
  }, [token, logout]);

  const login = useCallback((userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
  }, []);

  const updateUser = useCallback((updatedUserData) => {
    setUser(updatedUserData);
    localStorage.setItem('user', JSON.stringify(updatedUserData));
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
