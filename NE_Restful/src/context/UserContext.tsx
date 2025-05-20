import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { unauthorizedAPI } from '../constants/api';
import { log } from 'console';

interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  role: 'USER' | 'ADMIN';
  token: string
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: "USER" 
}

const UserContext = createContext<UserContextType | undefined>(undefined);


export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode<User & { exp: number }>(token);
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp < currentTime) {
          localStorage.removeItem('token');
          setUser(null);
        } else {
          setUser({
            id: decoded.id,
            firstname: decoded.firstname,
            lastname: decoded.lastname,
            email: decoded.email,
            role: decoded.role,
            token
          });
          
          // Set authorization header for all future requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      } catch (error) {
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await unauthorizedAPI.post(`/auth/login`, { email, password });
      const { token } = response.data.data;      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const decoded = jwtDecode<User>(token);
       
      setUser({
        id: decoded.id,
        firstname: decoded.firstname,
        lastname: decoded.lastname,
        email: decoded.email,
        role: decoded.role,
        token
      });
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      
    await unauthorizedAPI.post(`/auth/register`, userData);      
      
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <UserContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      logout, 
      isAuthenticated, 
      isAdmin 
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};