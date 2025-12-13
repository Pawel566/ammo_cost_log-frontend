import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_EMAIL_KEY = 'user_email';
const USER_USERNAME_KEY = 'user_username';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const setAuthHeader = (token) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  };

  const loadUserFromLocalStorage = async () => {
    try {
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (!accessToken) {
        const guestId = localStorage.getItem('guest_id');
        const expiresAt = localStorage.getItem('guest_id_expires_at');
        const isExpired = !expiresAt || new Date(expiresAt) < new Date();
        if (!guestId || isExpired) {
          api.get('/guns?limit=1').catch(() => {});
        }
        setLoading(false);
        return;
      }
      setAuthHeader(accessToken);
      const response = await api.get('/auth/me');
      // Backend zwraca tylko user_id i role, email i username są w localStorage z logowania
      const email = localStorage.getItem(USER_EMAIL_KEY);
      const username = localStorage.getItem(USER_USERNAME_KEY);
      setUser({
        user_id: response.data.user_id,
        email: email || '',
        username: username || '',
        role: response.data.role
      });
    } catch (error) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_EMAIL_KEY);
      localStorage.removeItem(USER_USERNAME_KEY);
      setAuthHeader(null);
      setUser(null);
      const guestId = localStorage.getItem('guest_id');
      const expiresAt = localStorage.getItem('guest_id_expires_at');
      const isExpired = !expiresAt || new Date(expiresAt) < new Date();
      if (!guestId || isExpired) {
        api.get('/guns?limit=1').catch(() => {});
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserFromLocalStorage();
  }, []);

  const signUp = async (email, password, username) => {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        username
      });
      return { data: response.data, error: null, status: null };
    } catch (error) {
      return {
        data: null,
        error: error.response?.data?.detail || error.message || 'Błąd rejestracji',
        status: error.response?.status
      };
    }
  };

  const signIn = async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });
      const { access_token, refresh_token, user_id, email: userEmail, username, role } = response.data;
      localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
      // Zapisz email i username w localStorage, bo /auth/me ich nie zwraca
      if (userEmail) localStorage.setItem(USER_EMAIL_KEY, userEmail);
      if (username) localStorage.setItem(USER_USERNAME_KEY, username);
      setAuthHeader(access_token);
      setUser({
        user_id,
        email: userEmail,
        username,
        role
      });
      return { data: response.data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error.response?.data?.detail || error.message || 'Błąd logowania'
      };
    }
  };

  const signOut = async () => {
    try {
      if (user) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Błąd wylogowania:', error);
    } finally {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_EMAIL_KEY);
      localStorage.removeItem(USER_USERNAME_KEY);
      setAuthHeader(null);
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

