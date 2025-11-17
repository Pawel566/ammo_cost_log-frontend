import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { maintenanceAPI, gunsAPI } from '../services/api';

const MaintenancePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [maintenance, setMaintenance] = useState([]);
  const [guns, setGuns] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedGunId, setSelectedGunId] = useState(searchParams.get('gun_id') || '');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState(null);
  const [maintenanceForm, setMaintenanceForm] = useState({ date: '', notes: '' });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchMaintenance();
    if (selectedGunId) {
      setSearchParams({ gun_id: selectedGunId });
    } else {
      setSearchParams({});
    }
  }, [selectedGunId]);

  useEffect(() => {
    const gunIdFromUrl = searchParams.get('gun_id');
    if (gunIdFromUrl && gunIdFromUrl !== selectedGunId) {
      setSelectedGunId(gunIdFromUrl);
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [gunsRes, statsRes] = await Promise.all([
        gunsAPI.getAll().catch(() => ({ data: [] })),
        maintenanceAPI.getStatistics().catch(() => ({ data: null }))
      ]);
      
      const gunsData = gunsRes.data;
      const items = Array.isArray(gunsData) ? gunsData : gunsData?.items ?? [];
      setGuns(items);
      setStatistics(statsRes.data);
      await fetchMaintenance();
    } catch (err) {
      setError('Błąd podczas pobierania danych');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaintenance = async () => {
    try {
      const params = selectedGunId ? { gun_id: selectedGunId } : {};
      const response = await maintenanceAPI.getAll(params);
      setMaintenance(response.data || []);
      setError('');
    } catch (err) {
      setError('Błąd podczas pobierania konserwacji');
      console.error(err);
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
      const formData = {};
      if (maintenanceForm.date) {
        formData.date = maintenanceForm.date;
      }
      if (maintenanceForm.notes !== undefined) {
        formData.notes = maintenanceForm.notes || null;
      }
      await maintenanceAPI.update(editingMaintenance.id, formData);
      setShowEditModal(false);
      setEditingMaintenance(null);
      setMaintenanceForm({ date: '', notes: '' });
      await fetchMaintenance();
      await fetchData();
    } catch (err) {
      console.error('Błąd podczas aktualizacji konserwacji:', err);
      setError(err.response?.data?.detail || 'Błąd podczas aktualizacji konserwacji');
    }
  };

  const handleDeleteMaintenance = async (maintenanceId) => {
    if (window.confirm('Czy na pewno chcesz usunąć tę konserwację?')) {
      try {
        await maintenanceAPI.delete(maintenanceId);
        await fetchMaintenance();
        await fetchData();
      } catch (err) {
        setError(err.response?.data?.detail || 'Błąd podczas usuwania konserwacji');
      }
    }
  };

  if (loading) {
    return <div className="text-center">Ładowanie...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Konserwacja</h2>
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {statistics && (
          <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: '#2c2c2c' }}>
            <h3 style={{ marginBottom: '1rem' }}>Statystyki</h3>
            {statistics.longest_without_maintenance && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '0.5rem' }}>
                  Broń najdłużej bez konserwacji:
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                  {statistics.longest_without_maintenance.gun_name}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#888', marginTop: '0.25rem' }}>
                  {statistics.longest_without_maintenance.days_since} dni
                </div>
              </div>
            )}
            <div style={{ borderTop: '1px solid #404040', paddingTop: '1rem' }}>
              <div style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '0.75rem' }}>
                Dni od ostatniej konserwacji:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {statistics.guns_status && statistics.guns_status.map(stat => (
                  <div
                    key={stat.gun_id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem',
                      backgroundColor: '#1a1a1a',
                      borderRadius: '4px'
                    }}
                  >
                    <span>{stat.gun_name}</span>
                    <span style={{ color: stat.days_since_last !== null ? '#fff' : '#888' }}>
                      {stat.days_since_last !== null ? `${stat.days_since_last} dni` : 'Brak konserwacji'}
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
                        <td style={{ fontWeight: '500' }}>{maint.gun_name || getGunName(maint.gun_id)}</td>
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
