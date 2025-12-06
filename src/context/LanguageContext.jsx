import { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { settingsAPI } from '../services/api';

const LanguageContext = createContext(null);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = localStorage.getItem('i18nextLng') || 'pl';
        
        if (user) {
          try {
            const settingsResponse = await settingsAPI.get();
            const userLanguage = settingsResponse.data.language || savedLanguage;
            if (userLanguage !== i18n.language) {
              await i18n.changeLanguage(userLanguage);
              localStorage.setItem('i18nextLng', userLanguage);
            }
          } catch (error) {
            console.error('Error loading user language:', error);
            if (savedLanguage && savedLanguage !== i18n.language) {
              await i18n.changeLanguage(savedLanguage);
            }
          }
        } else {
          if (savedLanguage && savedLanguage !== i18n.language) {
            await i18n.changeLanguage(savedLanguage);
          }
        }
      } catch (error) {
        console.error('Error loading language:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLanguage();
  }, [user, i18n]);

  const changeLanguage = async (language) => {
    try {
      await i18n.changeLanguage(language);
      localStorage.setItem('i18nextLng', language);
      
      if (user) {
        try {
          await settingsAPI.update({ language });
        } catch (error) {
          console.error('Error saving language to backend:', error);
        }
      }
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const value = {
    currentLanguage: i18n.language,
    changeLanguage,
    loading
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};









