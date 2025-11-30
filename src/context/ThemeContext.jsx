import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';
import { useAuth } from './AuthContext';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const applyTheme = (newTheme) => {
    const root = document.documentElement;
    if (newTheme === 'light') {
      root.style.setProperty('--bg-primary', '#f5f5f5');
      root.style.setProperty('--bg-secondary', '#ffffff');
      root.style.setProperty('--bg-tertiary', '#e0e0e0');
      root.style.setProperty('--text-primary', '#1a1a1a');
      root.style.setProperty('--text-secondary', '#4a4a4a');
      root.style.setProperty('--text-tertiary', '#888888');
      root.style.setProperty('--border-color', '#d0d0d0');
      root.style.setProperty('--card-bg', '#ffffff');
      root.style.setProperty('--navbar-bg', '#ffffff');
      root.style.setProperty('--input-bg', '#ffffff');
      root.style.setProperty('--table-header-bg', '#f0f0f0');
      root.style.setProperty('--table-hover-bg', '#f5f5f5');
      root.style.setProperty('--shadow', '0 2px 4px rgba(0, 0, 0, 0.1)');
    } else {
      root.style.setProperty('--bg-primary', '#3a3a3a');
      root.style.setProperty('--bg-secondary', '#2c2c2c');
      root.style.setProperty('--bg-tertiary', '#545454');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#ecf0f1');
      root.style.setProperty('--text-tertiary', '#aaaaaa');
      root.style.setProperty('--border-color', '#666666');
      root.style.setProperty('--card-bg', '#545454');
      root.style.setProperty('--navbar-bg', '#2c2c2c');
      root.style.setProperty('--input-bg', '#3a3a3a');
      root.style.setProperty('--table-header-bg', '#3a3a3a');
      root.style.setProperty('--table-hover-bg', '#404040');
      root.style.setProperty('--shadow', '0 2px 4px rgba(0, 0, 0, 0.3)');
    }
  };

  const fetchTheme = async (setLoadingFlag = true) => {
    try {
      const response = await settingsAPI.get();
      const savedTheme = response.data?.theme || 'dark';
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } catch (err) {
      console.error('Błąd podczas pobierania motywu:', err);
      applyTheme('dark');
    } finally {
      if (setLoadingFlag) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // Pobierz motyw z ustawień przy załadowaniu
    fetchTheme(true);
  }, []);

  useEffect(() => {
    // Odśwież motyw po zalogowaniu/wylogowaniu użytkownika
    if (!loading) {
      fetchTheme(false);
    }
  }, [user?.user_id, loading]);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    // Zapisywanie motywu odbywa się przez SettingsPage.handleSubmit lub SettingsPage.handleChange
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};

