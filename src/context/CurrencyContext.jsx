import { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  const { user, authReady } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentCurrency, setCurrentCurrency] = useState('pln');
  const retryCountRef = useRef(0);

  useEffect(() => {
    if (!authReady) {
      return;
    }
    
    retryCountRef.current = 0;
    
    const loadCurrency = async (retry = false) => {
      try {
        const savedCurrency = localStorage.getItem('currency') || 'pln';
        
        if (user) {
          try {
            const settingsResponse = await settingsAPI.get();
            const userCurrency = settingsResponse.data.currency || savedCurrency;
            setCurrentCurrency(userCurrency);
            localStorage.setItem('currency', userCurrency);
            retryCountRef.current = 0;
          } catch (error) {
            const status = error.response?.status;
            const isFirstLoad = retryCountRef.current === 0;
            
            // Retry dla błędów 404/500 na pierwszym loadzie
            if (isFirstLoad && (status === 404 || status === 500) && !retry) {
              setTimeout(() => {
                retryCountRef.current = 1;
                loadCurrency(true);
              }, 500);
              return;
            }
            
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
  }, [user, authReady]);

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

