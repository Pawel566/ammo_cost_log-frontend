import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const SettingsPage = () => {
  const { theme, changeTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState({
    theme: theme,
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
          ? response.data.ai_auto_comments : false
      });
      setError('');
    } catch (err) {
      setError('Błąd podczas pobierania ustawień');
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
      await settingsAPI.update(settings);
      setSuccess('Ustawienia zostały zapisane');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Błąd podczas zapisywania ustawień');
    }
  };

  const handleChange = (field, value) => {
    setSettings({ ...settings, [field]: value });
    if (field === 'theme') {
      changeTheme(value);
    }
  };

  if (loading) {
    return <div className="text-center">Ładowanie...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Ustawienia</h2>
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
          {/* Sekcja: Ogólne */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}>Ogólne</h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Motyw
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
                  Jasny
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
                  Ciemny
                </button>
              </div>
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Jednostki
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
                  Metry
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
                  Yardy
                </button>
              </div>
            </div>
          </div>

          {/* Sekcja: Konserwacja */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}>Konserwacja</h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Limit strzałów do konserwacji
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
                Limit czasu między konserwacjami
              </label>
              <input
                type="number"
                className="form-input"
                value={settings.maintenance_days_limit}
                onChange={(e) => handleChange('maintenance_days_limit', parseInt(e.target.value) || 0)}
                min="1"
                style={{ maxWidth: '200px' }}
              />
              <span style={{ marginLeft: '0.5rem', color: 'var(--text-tertiary)' }}>dni</span>
            </div>
          </div>

          {/* Sekcja: Powiadomienia */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}>Powiadomienia</h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" style={{ margin: 0, fontWeight: '500' }}>
                  Powiadomienia o konserwacji
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
                  Powiadomienia o małej amunicji
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
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}>Sztuczna inteligencja</h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.ai_analysis_intensity === 'normalna'}
                  onChange={(e) => handleChange('ai_analysis_intensity', e.target.checked ? 'normalna' : 'off')}
                  style={{ marginRight: '0.5rem', width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: '500' }}>Intensywność analizy</span>
                {settings.ai_analysis_intensity === 'normalna' && (
                  <span style={{ marginLeft: '0.5rem', color: '#007bff', fontWeight: '500' }}>Normalna</span>
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
                <span style={{ fontWeight: '500' }}>Komentarze automatyczne</span>
              </label>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Zapisz ustawienia
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
