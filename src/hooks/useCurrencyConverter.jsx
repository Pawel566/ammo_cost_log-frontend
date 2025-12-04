import { useState, useEffect, useCallback } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { currencyRatesAPI } from '../services/api';

const CURRENCY_SYMBOLS = {
  pln: 'zł',
  usd: '$',
  eur: '€',
  gbp: '£'
};

export const useCurrencyConverter = () => {
  const { currentCurrency } = useCurrency();
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoading(true);
        const response = await currencyRatesAPI.getLatest();
        const ratesMap = {};
        response.data.forEach(rate => {
          ratesMap[rate.code.toLowerCase()] = rate.rate;
        });
        ratesMap['pln'] = 1.0;
        setRates(ratesMap);
      } catch (error) {
        console.error('Error fetching currency rates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, []);

  const convert = useCallback((amount, fromCurrency = 'pln', toCurrency = null) => {
    if (!amount || amount === 0 || isNaN(amount)) return 0;
    if (!toCurrency) toCurrency = currentCurrency;
    if (fromCurrency.toLowerCase() === toCurrency.toLowerCase()) return amount;

    const fromRate = rates[fromCurrency.toLowerCase()] || 1;
    const toRate = rates[toCurrency.toLowerCase()] || 1;

    if (fromCurrency.toLowerCase() === 'pln') {
      if (toRate === 1) return amount;
      return amount / toRate;
    }

    if (toCurrency.toLowerCase() === 'pln') {
      if (fromRate === 1) return amount;
      return amount * fromRate;
    }

    const amountInPln = amount * fromRate;
    return amountInPln / toRate;
  }, [rates, currentCurrency]);

  const formatCurrency = useCallback((amount, currency = null) => {
    if (amount === null || amount === undefined) return '-';
    const currencyToUse = currency || currentCurrency;
    const converted = convert(amount, 'pln', currencyToUse);
    const symbol = CURRENCY_SYMBOLS[currencyToUse.toLowerCase()] || currencyToUse.toUpperCase();
    return `${converted.toFixed(2).replace('.', ',')} ${symbol}`;
  }, [convert, currentCurrency]);

  const getCurrencySymbol = useCallback((currency = null) => {
    const currencyToUse = currency || currentCurrency;
    return CURRENCY_SYMBOLS[currencyToUse.toLowerCase()] || currencyToUse.toUpperCase();
  }, [currentCurrency]);

  return {
    convert,
    formatCurrency,
    getCurrencySymbol,
    currentCurrency,
    rates,
    loading
  };
};

