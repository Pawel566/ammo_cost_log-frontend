import React, { useState, useEffect } from 'react';
import { maintenanceAPI, gunsAPI } from '../services/api';

const MaintenancePage = () => {
  const [maintenance, setMaintenance] = useState([]);
  const [guns, setGuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedGunId, setSelectedGunId] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState(null);
  const [maintenanceForm, setMaintenanceForm] = useState({ date: '', notes: '' });

  useEffect(() => {
    fetchGuns();
    fetchMaintenance();
  }, []);

  useEffect(() => {
    fetchMaintenance();
  }, [selectedGunId]);

  const fetchGuns = async () => {
    try {
      const response = await gunsAPI.getAll();
      const data = response.data;
      const items = Array.isArray(data) ? data : data?.items ?? [];
      setGuns(items);
    } catch (err) {
      console.error('Błąd pobierania broni:', err);
    }
  };

  const fetchMaintenance = async () => {
    try {
      setLoading(true);
      const params = selectedGunId ? { gun_id: selectedGunId } : {};
      const response = await maintenanceAPI.getAll(params);
      setMaintenance(response.data || []);
      setError('');
    } catch (err) {
      setError('Błąd podczas pobierania konserwacji');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getGunName = (gunId) => {
    const gun = guns.find(g => g.id === gunId);
    return gun ? gun.name : gunId;
  };

  const handleEditMaintenance = (maint) => {
    setEditingMaintenance(maint);
    const dateValue = maint.date instanceof Date 
      ? maint.date.toISOString().split('T')[0]
      : maint.date.split('T')[0];
    setMaintenanceForm({
      date: dateValue,
      notes: maint.notes || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateMaintenance = async (e) => {
    e.preventDefault();
    try {
      await maintenanceAPI.update(editingMaintenance.id, maintenanceForm);
      setShowEditModal(false);
      setEditingMaintenance(null);
      setMaintenanceForm({ date: '', notes: '' });
      try {
        await fetchMaintenance();
      } catch (err) {
        console.error('Błąd podczas odświeżania konserwacji:', err);
      }
    } catch (err) {
      console.error('Błąd podczas aktualizacji konserwacji:', err);
      setError(err.response?.data?.detail || 'Błąd podczas aktualizacji konserwacji');
      setShowEditModal(false);
      setEditingMaintenance(null);
      setMaintenanceForm({ date: '', notes: '' });
    }
  };

  const handleDeleteMaintenance = async (maintenanceId) => {
    if (window.confirm('Czy na pewno chcesz usunąć tę konserwację?')) {
      try {
        await maintenanceAPI.delete(maintenanceId);
        fetchMaintenance();
      } catch (err) {
        setError(err.response?.data?.detail || 'Błąd podczas usuwania konserwacji');
      }
    }
  };

  const getMaintenanceStats = () => {
    const gunMaintenanceMap = {};
    const now = new Date();

    maintenance.forEach(maint => {
      if (!gunMaintenanceMap[maint.gun_id]) {
        gunMaintenanceMap[maint.gun_id] = [];
      }
      gunMaintenanceMap[maint.gun_id].push(new Date(maint.date));
    });

    const stats = Object.entries(gunMaintenanceMap).map(([gunId, dates]) => {
      const lastMaintenance = new Date(Math.max(...dates));
      const daysSince = Math.floor((now - lastMaintenance) / (1000 * 60 * 60 * 24));
      return {
        gunId,
        gunName: getGunName(gunId),
        daysSince,
        lastMaintenance
      };
    });

    const allGunsWithStats = guns.map(gun => {
      const stat = stats.find(s => s.gunId === gun.id);
      if (stat) {
        return stat;
      }
      return {
        gunId: gun.id,
        gunName: gun.name,
        daysSince: null,
        lastMaintenance: null
      };
    });

    const longestWithoutMaintenance = allGunsWithStats
      .filter(s => s.daysSince !== null)
      .sort((a, b) => b.daysSince - a.daysSince)[0];

    return {
      longestWithoutMaintenance,
      allGunsStats: allGunsWithStats.sort((a, b) => {
        if (a.daysSince === null) return 1;
        if (b.daysSince === null) return -1;
        return b.daysSince - a.daysSince;
      })
    };
  };

  if (loading) {
    return <div className="text-center">Ładowanie...</div>;
  }

  const stats = getMaintenanceStats();

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Konserwacja</h2>
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {stats.longestWithoutMaintenance && (
          <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: '#2c2c2c' }}>
            <h3 style={{ marginBottom: '1rem' }}>Statystyki</h3>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '0.5rem' }}>
                Broń najdłużej bez konserwacji:
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                {stats.longestWithoutMaintenance.gunName}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#888', marginTop: '0.25rem' }}>
                {stats.longestWithoutMaintenance.daysSince} dni
              </div>
            </div>
            <div style={{ borderTop: '1px solid #404040', paddingTop: '1rem' }}>
              <div style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '0.75rem' }}>
                Dni od ostatniej konserwacji:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {stats.allGunsStats.map(stat => (
                  <div
                    key={stat.gunId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem',
                      backgroundColor: '#1a1a1a',
                      borderRadius: '4px'
                    }}
                  >
                    <span>{stat.gunName}</span>
                    <span style={{ color: stat.daysSince !== null ? '#fff' : '#888' }}>
                      {stat.daysSince !== null ? `${stat.daysSince} dni` : 'Brak konserwacji'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0 }}>Historia konserwacji</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label className="form-label" style={{ margin: 0, fontSize: '0.9rem' }}>
                Filtruj:
              </label>
              <select
                className="form-input"
                value={selectedGunId}
                onChange={(e) => setSelectedGunId(e.target.value)}
                style={{ width: 'auto', minWidth: '200px', padding: '0.5rem' }}
              >
                <option value="">Wszystkie</option>
                {guns.map(gun => (
                  <option key={gun.id} value={gun.id}>
                    {gun.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {maintenance.length === 0 ? (
            <p className="text-center" style={{ color: '#888', padding: '2rem' }}>
              Brak konserwacji
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Broń</th>
                    <th>Data</th>
                    <th>Strzałów od poprzedniej</th>
                    <th>Notatki</th>
                    <th style={{ width: '120px' }}>Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenance
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((maint) => (
                      <tr key={maint.id}>
                        <td style={{ fontWeight: '500' }}>{getGunName(maint.gun_id)}</td>
                        <td>{new Date(maint.date).toLocaleDateString('pl-PL')}</td>
                        <td>{maint.rounds_since_last}</td>
                        <td style={{ color: '#aaa' }}>{maint.notes || '-'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleEditMaintenance(maint)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#007bff',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                padding: '0.25rem 0.5rem'
                              }}
                            >
                              Edytuj
                            </button>
                            <button
                              onClick={() => handleDeleteMaintenance(maint.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#f44336',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                padding: '0.25rem 0.5rem'
                              }}
                            >
                              Usuń
                            </button>
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

      {showEditModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => {
            setShowEditModal(false);
            setEditingMaintenance(null);
            setMaintenanceForm({ date: '', notes: '' });
          }}
        >
          <div
            className="card"
            style={{ maxWidth: '500px', width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Edytuj konserwację</h3>
            <form onSubmit={handleUpdateMaintenance}>
              <div className="form-group">
                <label className="form-label">Data</label>
                <input
                  type="date"
                  className="form-input"
                  value={maintenanceForm.date}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Notatki</label>
                <textarea
                  className="form-input"
                  value={maintenanceForm.notes}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary">
                  Zapisz
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingMaintenance(null);
                    setMaintenanceForm({ date: '', notes: '' });
                  }}
                >
                  Anuluj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenancePage;
