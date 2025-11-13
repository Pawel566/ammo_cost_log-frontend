import React, { useState, useEffect } from 'react';
import { sessionsAPI, gunsAPI, ammoAPI } from '../services/api';

const AccuracySessionsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [guns, setGuns] = useState([]);
  const [ammo, setAmmo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [apiKey, setApiKey] = useState(localStorage.getItem('openai_api_key') || '');
  const [formData, setFormData] = useState({
    gun_id: '',
    ammo_id: '',
    date: new Date().toISOString().split('T')[0],
    shots: '',
    distance_m: '',
    hits: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filterType, filterValue, sessions]);

  const handleApiKeyChange = (e) => {
    const key = e.target.value;
    setApiKey(key);
    localStorage.setItem('openai_api_key', key);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, gunsRes, ammoRes] = await Promise.all([
        sessionsAPI.getAll(),
        gunsAPI.getAll(),
        ammoAPI.getAll()
      ]);
      const sessionsData = sessionsRes.data || {};
      const accuracyPayload = sessionsData.accuracy_sessions;
      const allSessions = Array.isArray(accuracyPayload) ? accuracyPayload : accuracyPayload?.items ?? [];
      const gunsData = gunsRes.data;
      const ammoData = ammoRes.data;
      const gunItems = Array.isArray(gunsData) ? gunsData : gunsData?.items ?? [];
      const ammoItems = Array.isArray(ammoData) ? ammoData : ammoData?.items ?? [];
      setSessions(allSessions);
      setFilteredSessions(allSessions);
      setGuns(gunItems);
      setAmmo(ammoItems);
      setError(null);
    } catch (err) {
      setError('Błąd podczas pobierania danych');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Walidacja po stronie frontendu
    const shots = parseInt(formData.shots);
    const hits = parseInt(formData.hits);
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Ustaw na koniec dnia
    
    if (shots <= 0) {
      setError('Liczba strzałów musi być większa od 0');
      return;
    }
    
    if (selectedDate > today) {
      setError('Data nie może być w przyszłości');
      return;
    }
    
    if (hits < 0 || hits > shots) {
      setError('Liczba trafień musi być między 0 a liczbą strzałów');
      return;
    }
    
    if (!formData.distance_m || parseInt(formData.distance_m) <= 0) {
      setError('Dystans musi być większy od 0');
      return;
    }
    
    try {
      const sessionData = {
        gun_id: parseInt(formData.gun_id),
        ammo_id: parseInt(formData.ammo_id),
        date: formData.date,
        shots: shots,
        distance_m: parseInt(formData.distance_m),
        hits: parseInt(formData.hits),
        openai_api_key: apiKey
      };
      
      const response = await sessionsAPI.createAccuracy(sessionData);
      
      setFormData({
        gun_id: '',
        ammo_id: '',
        date: new Date().toISOString().split('T')[0],
        shots: '',
        distance_m: '',
        hits: '',
        notes: ''
      });
      setShowForm(false);
      setError(null);
      fetchData();
      
      // Pokaż informację o pozostałej amunicji
      if (response.data.remaining_ammo !== undefined) {
        alert(`Pozostało ${response.data.remaining_ammo} sztuk amunicji`);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Błąd podczas dodawania sesji');
      console.error(err);
    }
  };

  const getGunName = (gunId) => {
    const gun = guns.find(g => g.id === gunId);
    return gun ? gun.name : 'Nieznana broń';
  };

  const getAmmoName = (ammoId) => {
    const ammoItem = ammo.find(a => a.id === ammoId);
    return ammoItem ? ammoItem.name : 'Nieznana amunicja';
  };

  const getGunType = (gunId) => {
    const gun = guns.find(g => g.id === gunId);
    return gun ? gun.type : '';
  };

  const applyFilters = () => {
    if (!filterType || !filterValue) {
      setFilteredSessions(sessions);
      return;
    }

    let filtered = [...sessions];

    switch(filterType) {
      case 'gunName':
        filtered = filtered.filter(session => 
          getGunName(session.gun_id).toLowerCase().includes(filterValue.toLowerCase())
        );
        break;
      case 'gunType':
        filtered = filtered.filter(session => 
          getGunType(session.gun_id) === filterValue
        );
        break;
      case 'dateFrom':
        filtered = filtered.filter(session => session.date >= filterValue);
        break;
      case 'dateTo':
        filtered = filtered.filter(session => session.date <= filterValue);
        break;
      case 'minAccuracy':
        filtered = filtered.filter(session => session.accuracy_percent >= parseFloat(filterValue));
        break;
      case 'maxAccuracy':
        filtered = filtered.filter(session => session.accuracy_percent <= parseFloat(filterValue));
        break;
      default:
        break;
    }

    setFilteredSessions(filtered);
  };

  const clearFilters = () => {
    setFilterType('');
    setFilterValue('');
  };

  const gunTypes = [...new Set(guns.map(g => g.type).filter(Boolean))];

  if (loading) {
    return <div className="text-center">Ładowanie...</div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Sesje celnościowe</h2>
          <button 
            className="btn btn-success" 
            onClick={() => setShowForm(!showForm)}
            disabled={guns.length === 0 || ammo.length === 0}
          >
            {showForm ? 'Anuluj' : 'Dodaj sesję'}
          </button>
        </div>

        {guns.length === 0 && (
          <div className="alert alert-info">
            Najpierw dodaj broń w sekcji "Broń"
          </div>
        )}

        {ammo.length === 0 && (
          <div className="alert alert-info">
            Najpierw dodaj amunicję w sekcji "Amunicja"
          </div>
        )}

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        {showForm && guns.length > 0 && ammo.length > 0 && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">
                Klucz API OpenAI 
                <span 
                  title="Komentarz wygenerowany automatycznie przez gpt-4o-mini (OpenAI). Klucz API jest przechowywany lokalnie i używany wyłącznie do tworzenia podsumowań celności."
                  style={{ 
                    cursor: 'help', 
                    color: '#007bff', 
                    marginLeft: '5px',
                    fontSize: '14px'
                  }}
                >
                  ⓘ
                </span>
              </label>
              <input
                type="password"
                className="form-input"
                value={apiKey}
                onChange={handleApiKeyChange}
                placeholder="sk-..."
                style={{ fontFamily: 'monospace' }}
              />
              <small className="form-text text-muted">
                Klucz jest przechowywany lokalnie w przeglądarce i używany tylko do generowania komentarzy AI
              </small>
            </div>
            <div className="form-group">
              <label className="form-label">Broń *</label>
              <select
                className="form-input"
                value={formData.gun_id}
                onChange={(e) => setFormData({ ...formData, gun_id: e.target.value })}
                required
              >
                <option value="">Wybierz broń</option>
                {guns.map((gun) => (
                  <option key={gun.id} value={gun.id}>
                    {gun.name} {gun.caliber ? `(${gun.caliber})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Amunicja *</label>
              <select
                className="form-input"
                value={formData.ammo_id}
                onChange={(e) => setFormData({ ...formData, ammo_id: e.target.value })}
                required
              >
                <option value="">Wybierz amunicję</option>
                {ammo.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} {item.caliber ? `(${item.caliber})` : ''} - {item.units_in_package || 0} szt.
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Data *</label>
              <input
                type="date"
                className="form-input"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Liczba strzałów *</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={formData.shots}
                onChange={(e) => setFormData({ ...formData, shots: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Dystans (metry) *</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={formData.distance_m}
                onChange={(e) => setFormData({ ...formData, distance_m: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Liczba trafień *</label>
              <input
                type="number"
                min="0"
                max={formData.shots || 0}
                className="form-input"
                value={formData.hits}
                onChange={(e) => setFormData({ ...formData, hits: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Notatki</label>
              <textarea
                className="form-input"
                rows="3"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-success">
              Dodaj sesję
            </button>
          </form>
        )}
      </div>

      <div className="card">
        <h3 className="card-title">Historia sesji celnościowych</h3>
        
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#404040', borderRadius: '5px' }}>
          <h4 style={{ marginBottom: '15px' }}>Filtry wyszukiwania</h4>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: '1', minWidth: '200px' }}>
              <label className="form-label">Typ filtra</label>
              <select
                className="form-input"
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setFilterValue('');
                }}
              >
                <option value="">Wybierz typ filtra</option>
                <option value="gunName">Nazwa broni</option>
                <option value="gunType">Rodzaj broni</option>
                <option value="dateFrom">Data od</option>
                <option value="dateTo">Data do</option>
                <option value="minAccuracy">Celność od (%)</option>
                <option value="maxAccuracy">Celność do (%)</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: '1', minWidth: '200px' }}>
              <label className="form-label">Wartość</label>
              {filterType === 'gunName' && (
                <input
                  type="text"
                  className="form-input"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  placeholder="Wpisz nazwę broni"
                />
              )}
              {filterType === 'gunType' && (
                <select
                  className="form-input"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                >
                  <option value="">Wybierz rodzaj</option>
                  {gunTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              )}
              {(filterType === 'dateFrom' || filterType === 'dateTo') && (
                <input
                  type="date"
                  className="form-input"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                />
              )}
              {(filterType === 'minAccuracy' || filterType === 'maxAccuracy') && (
                <input
                  type="number"
                  className="form-input"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  min="0"
                  max="100"
                  placeholder="0-100"
                />
              )}
              {!filterType && (
                <input
                  type="text"
                  className="form-input"
                  disabled
                  placeholder="Wybierz typ filtra"
                />
              )}
            </div>
            <button className="btn btn-secondary" onClick={clearFilters} disabled={!filterType}>
              Wyczyść
            </button>
          </div>
          <div style={{ marginTop: '10px', color: '#666' }}>
            Znaleziono: {filteredSessions.length} z {sessions.length}
          </div>
        </div>

        {filteredSessions.length === 0 ? (
          <p className="text-center">Brak zarejestrowanych sesji celnościowych</p>
        ) : (
          <>
            <div className="alert alert-info" style={{ marginBottom: '20px' }}>
              💡 Komentarze AI są generowane automatycznie przez gpt-4o-mini (OpenAI). Klucz API jest przechowywany lokalnie i używany wyłącznie do tworzenia podsumowań celności.
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Broń</th>
                  <th>Amunicja</th>
                  <th>Dystans</th>
                  <th>Strzały</th>
                  <th>Trafienia</th>
                  <th>Celność</th>
                  <th>Komentarz AI</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((session) => (
                  <tr key={session.id}>
                    <td>{new Date(session.date).toLocaleDateString('pl-PL')}</td>
                    <td>{getGunName(session.gun_id)}</td>
                    <td>{getAmmoName(session.ammo_id)}</td>
                    <td>{session.distance_m} m</td>
                    <td>{session.shots}</td>
                    <td>{session.hits}</td>
                    <td style={{ fontWeight: 'bold', color: session.accuracy_percent >= 80 ? '#28a745' : session.accuracy_percent >= 60 ? '#ffc107' : '#dc3545' }}>
                      {session.accuracy_percent}%
                    </td>
                    <td style={{ fontSize: '12px', maxWidth: '200px' }}>
                      {session.ai_comment || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
};

export default AccuracySessionsPage;

