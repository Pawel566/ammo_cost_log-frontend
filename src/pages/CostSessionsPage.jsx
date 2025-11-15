import React, { useState, useEffect } from 'react';
import { sessionsAPI, gunsAPI, ammoAPI } from '../services/api';

const CostSessionsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [guns, setGuns] = useState([]);
  const [ammo, setAmmo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [formData, setFormData] = useState({
    gun_id: '',
    ammo_id: '',
    date: new Date().toISOString().split('T')[0],
    shots: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filterType, filterValue, sessions]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, gunsRes, ammoRes] = await Promise.all([
        sessionsAPI.getAll(),
        gunsAPI.getAll(),
        ammoAPI.getAll()
      ]);
      const sessionsData = sessionsRes.data || {};
      const costPayload = sessionsData.cost_sessions;
      const allSessions = Array.isArray(costPayload) ? costPayload : costPayload?.items ?? [];
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
    
    const shots = parseInt(formData.shots, 10);
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (shots <= 0) {
      setError('Liczba strzałów musi być większa od 0');
      return;
    }
    
    if (selectedDate > today) {
      setError('Data nie może być w przyszłości');
      return;
    }
    
    try {
      const sessionData = {
        gun_id: formData.gun_id,
        ammo_id: formData.ammo_id,
        date: formData.date,
        shots
      };
      
      const response = await sessionsAPI.createCost(sessionData);
      
      setFormData({
        gun_id: '',
        ammo_id: '',
        date: new Date().toISOString().split('T')[0],
        shots: '',
        notes: ''
      });
      setShowForm(false);
      setError(null);
      fetchData();
      
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
      case 'minCost':
        filtered = filtered.filter(session => session.cost >= parseFloat(filterValue));
        break;
      case 'maxCost':
        filtered = filtered.filter(session => session.cost <= parseFloat(filterValue));
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
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>Sesje kosztowe</h2>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowForm(!showForm)}
            disabled={guns.length === 0 || ammo.length === 0}
          >
            {showForm ? 'Anuluj' : '+ Dodaj sesję'}
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {guns.length === 0 && (
          <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
            Najpierw dodaj broń w sekcji "Broń"
          </div>
        )}

        {ammo.length === 0 && (
          <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
            Najpierw dodaj amunicję w sekcji "Amunicja"
          </div>
        )}

        {showForm && guns.length > 0 && ammo.length > 0 && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Dodaj sesję kosztową</h3>
            <form onSubmit={handleSubmit}>
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
              <button type="submit" className="btn btn-success">
                Dodaj sesję
              </button>
            </form>
          </div>
        )}

        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Historia sesji kosztowych</h3>
          
          <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: '#2c2c2c' }}>
            <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Filtry wyszukiwania</h4>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: '1', minWidth: '200px', marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.9rem' }}>Typ filtra</label>
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
                  <option value="minCost">Koszt od (zł)</option>
                  <option value="maxCost">Koszt do (zł)</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: '1', minWidth: '200px', marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.9rem' }}>Wartość</label>
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
                {(filterType === 'minCost' || filterType === 'maxCost') && (
                  <input
                    type="number"
                    className="form-input"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
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
            <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#aaa' }}>
              Znaleziono: {filteredSessions.length} z {sessions.length}
            </div>
          </div>

          {filteredSessions.length === 0 ? (
            <p className="text-center" style={{ color: '#888', padding: '2rem' }}>
              Brak zarejestrowanych sesji kosztowych
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Broń</th>
                    <th>Amunicja</th>
                    <th>Strzały</th>
                    <th>Koszt</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((session) => (
                    <tr key={session.id}>
                      <td>{new Date(session.date).toLocaleDateString('pl-PL')}</td>
                      <td style={{ fontWeight: '500' }}>{getGunName(session.gun_id)}</td>
                      <td>{getAmmoName(session.ammo_id)}</td>
                      <td>{session.shots}</td>
                      <td style={{ fontWeight: '500', color: '#dc3545' }}>{session.cost.toFixed(2)} zł</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CostSessionsPage;
