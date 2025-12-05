import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { settingsAPI } from '../services/api';

const CurrencyContext = createContext(null);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentCurrency, setCurrentCurrency] = useState('pln');

  useEffect(() => {
    const loadCurrency = async () => {
      try {
        const savedCurrency = localStorage.getItem('currency') || 'pln';
        
        if (user) {
          try {
            const settingsResponse = await settingsAPI.get();
            const userCurrency = settingsResponse.data.currency || savedCurrency;
            setCurrentCurrency(userCurrency);
            localStorage.setItem('currency', userCurrency);
          } catch (error) {
            console.error('Error loading user currency:', error);
            setCurrentCurrency(savedCurrency);
          }
        } else {
          setCurrentCurrency(savedCurrency);
        }
      } catch (error) {
        console.error('Error loading currency:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCurrency();
  }, [user]);

  const changeCurrency = async (currency) => {
    try {
      setCurrentCurrency(currency);
      localStorage.setItem('currency', currency);
      
      if (user) {
        try {
          await settingsAPI.update({ currency });
        } catch (error) {
          console.error('Error saving currency to backend:', error);
        }
      }
    } catch (error) {
      console.error('Error changing currency:', error);
    }
  };

  const value = {
    currentCurrency,
    changeCurrency,
    loading
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

