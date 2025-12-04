import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { settingsAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';

const SettingsPage = () => {
  const { t } = useTranslation();
  const { theme, changeTheme } = useTheme();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { currentCurrency, changeCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState({
    theme: theme,
    language: currentLanguage,
    currency: currentCurrency,
    distance_unit: 'm',
    maintenance_rounds_limit: 500,
    maintenance_days_limit: 90,
    maintenance_notifications_enabled: true,
    low_ammo_notifications_enabled: true,
    ai_analysis_intensity: 'normalna',
    ai_auto_comments: false
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    // Synchronizuj motyw z kontekstem
    if (settings.theme !== theme) {
      setSettings(prev => ({ ...prev, theme: theme }));
    }
  }, [theme]);

  useEffect(() => {
    // Synchronizuj walutę z kontekstem
    if (settings.currency !== currentCurrency) {
      setSettings(prev => ({ ...prev, currency: currentCurrency }));
    }
  }, [currentCurrency]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.get();
      setSettings({
        theme: response.data.theme || 'dark',
        distance_unit: response.data.distance_unit || 'm',
        maintenance_rounds_limit: response.data.maintenance_rounds_limit || 500,
        maintenance_days_limit: response.data.maintenance_days_limit || 90,
        maintenance_notifications_enabled: response.data.maintenance_notifications_enabled !== undefined 
          ? response.data.maintenance_notifications_enabled : true,
        low_ammo_notifications_enabled: response.data.low_ammo_notifications_enabled !== undefined 
          ? response.data.low_ammo_notifications_enabled : true,
        ai_analysis_intensity: response.data.ai_analysis_intensity || 'normalna',
        ai_auto_comments: response.data.ai_auto_comments !== undefined 
          ? response.data.ai_auto_comments : false,
        language: response.data.language || 'pl',
        currency: response.data.currency || 'pln'
      });
      setError('');
    } catch (err) {
      setError(t('settings.errorLoading'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      // Zapisz wszystkie ustawienia
      await settingsAPI.update(settings);
      
      // Zaktualizuj motyw, język i walutę w kontekstach po zapisaniu
      if (settings.theme !== theme) {
        changeTheme(settings.theme);
      }
      if (settings.language !== currentLanguage) {
        await changeLanguage(settings.language);
      }
      if (settings.currency !== currentCurrency) {
        await changeCurrency(settings.currency);
      }
      
      setSuccess(t('settings.settingsSaved'));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || t('settings.errorSaving'));
    }
  };

  const handleChange = (field, value) => {
    // Tylko aktualizuj stan lokalny, bez zapisywania
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);
  };

  if (loading) {
    return <div className="text-center">{t('common.loading')}</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>{t('settings.title')}</h2>
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <button type="submit" className="btn btn-primary" style={{ marginBottom: '2rem', padding: '0.75rem 2rem', fontSize: '1rem', fontWeight: '500' }}>
            {t('settings.saveSettings')}
          </button>
          {/* Sekcja: Ogólne */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}>{t('settings.general')}</h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                {t('settings.language')}
              </label>
              <select
                value={settings.language || currentLanguage}
                onChange={(e) => handleChange('language', e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: `1px solid var(--border-color)`,
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  minWidth: '150px'
                }}
              >
                <option value="pl">Polski</option>
                <option value="en">English</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                {t('settings.currency')}
              </label>
              <select
                value={settings.currency || currentCurrency}
                onChange={(e) => handleChange('currency', e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: `1px solid var(--border-color)`,
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  minWidth: '150px'
                }}
              >
                <option value="pln">{t('settings.currencies.pln')}</option>
                <option value="usd">{t('settings.currencies.usd')}</option>
                <option value="eur">{t('settings.currencies.eur')}</option>
                <option value="gbp">{t('settings.currencies.gbp')}</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                {t('settings.theme')}
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleChange('theme', 'light')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    border: `1px solid var(--border-color)`,
                    backgroundColor: settings.theme === 'light' ? '#007bff' : 'var(--bg-secondary)',
                    color: settings.theme === 'light' ? '#fff' : 'var(--text-tertiary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {t('settings.light')}
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('theme', 'dark')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    border: `1px solid var(--border-color)`,
                    backgroundColor: settings.theme === 'dark' ? '#007bff' : 'var(--bg-secondary)',
                    color: settings.theme === 'dark' ? '#fff' : 'var(--text-tertiary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {t('settings.dark')}
                </button>
              </div>
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                {t('settings.units')}
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleChange('distance_unit', 'm')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    border: `1px solid var(--border-color)`,
                    backgroundColor: settings.distance_unit === 'm' ? '#007bff' : 'var(--bg-secondary)',
                    color: settings.distance_unit === 'm' ? '#fff' : 'var(--text-tertiary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {t('settings.meters')}
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('distance_unit', 'yd')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    border: `1px solid var(--border-color)`,
                    backgroundColor: settings.distance_unit === 'yd' ? '#007bff' : 'var(--bg-secondary)',
                    color: settings.distance_unit === 'yd' ? '#fff' : 'var(--text-tertiary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {t('settings.yards')}
                </button>
              </div>
            </div>
          </div>

          {/* Sekcja: Konserwacja */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}>{t('settings.maintenance')}</h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                {t('settings.roundsLimit')}
              </label>
              <input
                type="number"
                className="form-input"
                value={settings.maintenance_rounds_limit}
                onChange={(e) => handleChange('maintenance_rounds_limit', parseInt(e.target.value) || 0)}
                min="1"
                style={{ maxWidth: '200px' }}
              />
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                {t('settings.daysLimit')}
              </label>
              <input
                type="number"
                className="form-input"
                value={settings.maintenance_days_limit}
                onChange={(e) => handleChange('maintenance_days_limit', parseInt(e.target.value) || 0)}
                min="1"
                style={{ maxWidth: '200px' }}
              />
              <span style={{ marginLeft: '0.5rem', color: 'var(--text-tertiary)' }}>{t('settings.days')}</span>
            </div>
          </div>

          {/* Sekcja: Powiadomienia */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}>{t('settings.notifications')}</h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" style={{ margin: 0, fontWeight: '500' }}>
                  {t('settings.maintenanceNotifications')}
                </label>
                <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.maintenance_notifications_enabled}
                    onChange={(e) => handleChange('maintenance_notifications_enabled', e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: settings.maintenance_notifications_enabled ? '#007bff' : '#555',
                    borderRadius: '26px',
                    transition: '0.3s'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '20px',
                      width: '20px',
                      left: settings.maintenance_notifications_enabled ? '26px' : '3px',
                      bottom: '3px',
                      backgroundColor: '#fff',
                      borderRadius: '50%',
                      transition: '0.3s'
                    }} />
                  </span>
                </label>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" style={{ margin: 0, fontWeight: '500' }}>
                  {t('settings.lowAmmoNotifications')}
                </label>
                <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.low_ammo_notifications_enabled}
                    onChange={(e) => handleChange('low_ammo_notifications_enabled', e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: settings.low_ammo_notifications_enabled ? '#007bff' : '#555',
                    borderRadius: '26px',
                    transition: '0.3s'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '20px',
                      width: '20px',
                      left: settings.low_ammo_notifications_enabled ? '26px' : '3px',
                      bottom: '3px',
                      backgroundColor: '#fff',
                      borderRadius: '50%',
                      transition: '0.3s'
                    }} />
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Sekcja: Sztuczna inteligencja */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}>{t('settings.ai')}</h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.ai_analysis_intensity === 'normalna'}
                  onChange={(e) => handleChange('ai_analysis_intensity', e.target.checked ? 'normalna' : 'off')}
                  style={{ marginRight: '0.5rem', width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: '500' }}>{t('settings.analysisIntensity')}</span>
                {settings.ai_analysis_intensity === 'normalna' && (
                  <span style={{ marginLeft: '0.5rem', color: '#007bff', fontWeight: '500' }}>{t('settings.normal')}</span>
                )}
              </label>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.ai_auto_comments}
                  onChange={(e) => handleChange('ai_auto_comments', e.target.checked)}
                  style={{ marginRight: '0.5rem', width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: '500' }}>{t('settings.autoComments')}</span>
              </label>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
