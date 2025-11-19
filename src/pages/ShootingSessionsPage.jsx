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
  const [openMenuId, setOpenMenuId] = useState(null);
  
  // Sortowanie
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' lub 'desc'

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filterType, filterValue, sessions, sortColumn, sortDirection]);

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
    let filtered = [...sessions];
    
    // Filtrowanie
    if (filterType && filterValue) {
      filtered = filtered.filter(session => {
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
    }

    // Sortowanie
    if (sortColumn) {
      filtered.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortColumn) {
          case 'date':
            aValue = new Date(a.date);
            bValue = new Date(b.date);
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
          case 'gun':
            const gunA = guns.find(g => g.id === a.gun_id);
            const gunB = guns.find(g => g.id === b.gun_id);
            aValue = gunA ? gunA.name.toLowerCase() : '';
            bValue = gunB ? gunB.name.toLowerCase() : '';
            break;
          case 'ammo':
            const ammoA = ammo.find(am => am.id === a.ammo_id);
            const ammoB = ammo.find(am => am.id === b.ammo_id);
            aValue = ammoA ? ammoA.name.toLowerCase() : '';
            bValue = ammoB ? ammoB.name.toLowerCase() : '';
            break;
          case 'shots':
            aValue = a.shots || 0;
            bValue = b.shots || 0;
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
          case 'cost':
            aValue = a.cost || 0;
            bValue = b.cost || 0;
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
          case 'distance':
            aValue = a.distance_m || 0;
            bValue = b.distance_m || 0;
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
          case 'hits':
            aValue = a.hits !== null && a.hits !== undefined ? a.hits : 0;
            bValue = b.hits !== null && b.hits !== undefined ? b.hits : 0;
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
          case 'accuracy':
            aValue = a.accuracy_percent !== null && a.accuracy_percent !== undefined ? a.accuracy_percent : 0;
            bValue = b.accuracy_percent !== null && b.accuracy_percent !== undefined ? b.accuracy_percent : 0;
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
          default:
            aValue = String(a[sortColumn] || '').toLowerCase();
            bValue = String(b[sortColumn] || '').toLowerCase();
        }
        
        // Sortowanie tekstowe
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        }
        
        return 0;
      });
    }

    setFilteredSessions(filtered);
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      // Zmień kierunek sortowania
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Ustaw nową kolumnę i domyślny kierunek
      setSortColumn(column);
      setSortDirection('asc');
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

  const handleDelete = async (sessionId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tę sesję?')) {
      return;
    }

    try {
      await sessionsAPI.delete(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
      setOpenMenuId(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Błąd podczas usuwania sesji');
      console.error(err);
    }
  };

  const handleEdit = (sessionId) => {
    navigate(`/shooting-sessions/edit/${sessionId}`);
    setOpenMenuId(null);
  };

  const handleMenuToggle = (sessionId) => {
    setOpenMenuId(openMenuId === sessionId ? null : sessionId);
  };

  // Zamknij menu po kliknięciu poza nim
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.session-menu-container')) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

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
                    <th 
                      style={{ 
                        cursor: 'pointer',
                        userSelect: 'none',
                        padding: '0.75rem'
                      }}
                      onClick={() => handleSort('date')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Data
                    </th>
                    <th 
                      style={{ 
                        cursor: 'pointer',
                        userSelect: 'none',
                        padding: '0.75rem'
                      }}
                      onClick={() => handleSort('gun')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Broń
                    </th>
                    <th 
                      style={{ 
                        cursor: 'pointer',
                        userSelect: 'none',
                        padding: '0.75rem'
                      }}
                      onClick={() => handleSort('ammo')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Amunicja
                    </th>
                    <th 
                      style={{ 
                        cursor: 'pointer',
                        userSelect: 'none',
                        padding: '0.75rem'
                      }}
                      onClick={() => handleSort('shots')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Strzały
                    </th>
                    <th 
                      style={{ 
                        cursor: 'pointer',
                        userSelect: 'none',
                        padding: '0.75rem'
                      }}
                      onClick={() => handleSort('cost')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Koszt
                    </th>
                    <th 
                      style={{ 
                        cursor: 'pointer',
                        userSelect: 'none',
                        padding: '0.75rem'
                      }}
                      onClick={() => handleSort('distance')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Dystans
                    </th>
                    <th 
                      style={{ 
                        cursor: 'pointer',
                        userSelect: 'none',
                        padding: '0.75rem'
                      }}
                      onClick={() => handleSort('hits')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Trafienia
                    </th>
                    <th 
                      style={{ 
                        cursor: 'pointer',
                        userSelect: 'none',
                        padding: '0.75rem'
                      }}
                      onClick={() => handleSort('accuracy')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Celność %
                    </th>
                    <th style={{ padding: '0.75rem' }}>Notatki</th>
                    <th style={{ width: '50px', padding: '0.75rem' }}></th>
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
                      <td>
                        <div className="session-menu-container" style={{ position: 'relative' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMenuToggle(session.id);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '1.2rem',
                              color: '#fff',
                              padding: '0.25rem 0.5rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Opcje"
                          >
                            ⋮
                          </button>
                          {openMenuId === session.id && (
                            <div
                              style={{
                                position: 'absolute',
                                right: 0,
                                top: '100%',
                                backgroundColor: '#2c2c2c',
                                border: '1px solid #444',
                                borderRadius: '4px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                zIndex: 1000,
                                minWidth: '120px',
                                marginTop: '4px'
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => handleEdit(session.id)}
                                style={{
                                  width: '100%',
                                  padding: '0.75rem 1rem',
                                  background: 'none',
                                  border: 'none',
                                  color: '#fff',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  fontSize: '0.9rem'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#3c3c3c'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                              >
                                Edytuj
                              </button>
                              <button
                                onClick={() => handleDelete(session.id)}
                                style={{
                                  width: '100%',
                                  padding: '0.75rem 1rem',
                                  background: 'none',
                                  border: 'none',
                                  color: '#dc3545',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  fontSize: '0.9rem',
                                  borderTop: '1px solid #444'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#3c3c3c'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                              >
                                Usuń
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
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
