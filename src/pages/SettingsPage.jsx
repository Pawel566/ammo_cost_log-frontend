import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState({
    ai_mode: 'off',
    theme: 'dark',
    distance_unit: 'm'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.get();
      setSettings({
        ai_mode: response.data.ai_mode || 'off',
        theme: response.data.theme || 'dark',
        distance_unit: response.data.distance_unit || 'm'
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

        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Wygląd</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Motyw</label>
              <select
                className="form-input"
                value={settings.theme}
                onChange={(e) => handleChange('theme', e.target.value)}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              Zapisz ustawienia
            </button>
          </form>
        </div>

        <div className="card" style={{ marginTop: '1rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Jednostki</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Jednostki odległości</label>
              <select
                className="form-input"
                value={settings.distance_unit}
                onChange={(e) => handleChange('distance_unit', e.target.value)}
              >
                <option value="m">Metry</option>
                <option value="yd">Jardy</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              Zapisz ustawienia
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
