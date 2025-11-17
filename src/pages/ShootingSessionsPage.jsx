import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionsAPI, gunsAPI, ammoAPI } from '../services/api';

const ShootingSessionsPage = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [guns, setGuns] = useState([]);
  const [ammo, setAmmo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [filterValue, setFilterValue] = useState('');

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
      const sessionsData = sessionsRes.data?.sessions || {};
      const allSessions = Array.isArray(sessionsData) ? sessionsData : sessionsData?.items ?? [];
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

  const applyFilters = () => {
    if (!filterType || !filterValue) {
      setFilteredSessions(sessions);
      return;
    }

    const filtered = sessions.filter(session => {
      const value = filterValue.toLowerCase();
      switch (filterType) {
        case 'gun':
          const gun = guns.find(g => g.id === session.gun_id);
          return gun && gun.name.toLowerCase().includes(value);
        case 'ammo':
          const ammoItem = ammo.find(a => a.id === session.ammo_id);
          return ammoItem && ammoItem.name.toLowerCase().includes(value);
        case 'date':
          return new Date(session.date).toLocaleDateString('pl-PL').includes(value);
        case 'cost':
          return session.cost && session.cost.toString().includes(value);
        case 'distance':
          return session.distance_m && session.distance_m.toString().includes(value);
        case 'accuracy':
          return session.accuracy_percent && session.accuracy_percent.toString().includes(value);
        default:
          return true;
      }
    });

    setFilteredSessions(filtered);
  };

  const getGunName = (gunId) => {
    const gun = guns.find(g => g.id === gunId);
    return gun ? gun.name : 'Nieznana broń';
  };

  const getAmmoName = (ammoId) => {
    const ammoItem = ammo.find(a => a.id === ammoId);
    return ammoItem ? ammoItem.name : 'Nieznana amunicja';
  };

  if (loading) {
    return <div className="text-center">Ładowanie...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>Sesje strzeleckie</h2>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/shooting-sessions/add')}
            style={{ padding: '0.75rem 1.5rem' }}
          >
            + Dodaj sesję
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Historia sesji strzeleckich</h3>
          
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <select
              className="form-input"
              style={{ width: 'auto', minWidth: '150px' }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">Filtruj po...</option>
              <option value="gun">Broń</option>
              <option value="ammo">Amunicja</option>
              <option value="date">Data</option>
              <option value="cost">Koszt</option>
              <option value="distance">Dystans</option>
              <option value="accuracy">Celność</option>
            </select>
            {filterType && (
              <input
                type="text"
                className="form-input"
                style={{ flex: 1, minWidth: '200px' }}
                placeholder="Wpisz wartość..."
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
              />
            )}
          </div>

          {filteredSessions.length === 0 ? (
            <p className="text-center" style={{ color: '#888', padding: '2rem' }}>
              Brak zarejestrowanych sesji strzeleckich
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
                    <th>Dystans</th>
                    <th>Trafienia</th>
                    <th>Celność %</th>
                    <th>Notatki</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((session) => (
                    <tr key={session.id}>
                      <td>{new Date(session.date).toLocaleDateString('pl-PL')}</td>
                      <td>{getGunName(session.gun_id)}</td>
                      <td>{getAmmoName(session.ammo_id)}</td>
                      <td>{session.shots || '-'}</td>
                      <td>{session.cost ? `${parseFloat(session.cost).toFixed(2).replace('.', ',')} zł` : '-'}</td>
                      <td>{session.distance_m ? `${session.distance_m} m` : '-'}</td>
                      <td>{session.hits !== null && session.hits !== undefined ? session.hits : '-'}</td>
                      <td>
                        {session.accuracy_percent !== null && session.accuracy_percent !== undefined ? (
                          <span style={{ 
                            color: parseFloat(session.accuracy_percent) >= 80 ? '#4caf50' : parseFloat(session.accuracy_percent) >= 60 ? '#ffc107' : '#dc3545',
                            fontWeight: 'bold'
                          }}>
                            {parseFloat(session.accuracy_percent).toFixed(0)}%
                          </span>
                        ) : '-'}
                      </td>
                      <td>{session.notes || '-'}</td>
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

export default ShootingSessionsPage;
