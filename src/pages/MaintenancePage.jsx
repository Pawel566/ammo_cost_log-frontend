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
  const [showMaintenanceDetailsModal, setShowMaintenanceDetailsModal] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);
  const [editingMaintenance, setEditingMaintenance] = useState(null);
  const [openMaintenanceMenu, setOpenMaintenanceMenu] = useState(null);
  const [maintenanceForm, setMaintenanceForm] = useState({ 
    date: '', 
    notes: '',
    activities: []
  });
  const [showActivitiesList, setShowActivitiesList] = useState(false);

  const maintenanceActivities = [
    'Czyszczenie lufy',
    'Czyszczenie suwadła',
    'Czyszczenie zamka',
    'Czyszczenie iglicy',
    'Smarowanie prowadnic',
    'Smarowanie zamka',
    'Kontrola zużycia sprężyn',
    'Kontrola zamka / rygli',
    'Wymiana części',
    'Sprawdzenie optyki',
    'Czyszczenie magazynków'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMaintenanceMenu && !event.target.closest('[data-maintenance-menu]')) {
        setOpenMaintenanceMenu(null);
      }
    };

    if (openMaintenanceMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMaintenanceMenu]);

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
      notes: maint.notes || '',
      activities: maint.activities || []
    });
    setShowActivitiesList(maint.activities && maint.activities.length > 0);
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
      if (maintenanceForm.activities !== undefined) {
        formData.activities = maintenanceForm.activities.length > 0 ? maintenanceForm.activities : null;
      }
      await maintenanceAPI.update(editingMaintenance.id, formData);
      setShowEditModal(false);
      setEditingMaintenance(null);
      setShowActivitiesList(false);
      setMaintenanceForm({ date: '', notes: '', activities: [] });
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
                    <th>Lista czynności</th>
                    <th>Strzałów od poprzedniej</th>
                    <th style={{ width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {maintenance
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((maint) => (
                      <tr key={maint.id}>
                        <td style={{ fontWeight: '500' }}>{maint.gun_name || getGunName(maint.gun_id)}</td>
                        <td>{new Date(maint.date).toLocaleDateString('pl-PL')}</td>
                        <td>
                          {maint.activities && maint.activities.length > 0 ? (
                            <ul style={{ margin: 0, paddingLeft: '1.25rem', listStyle: 'disc', color: '#aaa' }}>
                              {maint.activities.map((activity, idx) => (
                                <li key={idx} style={{ marginBottom: '0.15rem' }}>{activity}</li>
                              ))}
                            </ul>
                          ) : (
                            <span style={{ color: '#888' }}>-</span>
                          )}
                        </td>
                        <td>{maint.rounds_since_last}</td>
                        <td>
                          <div style={{ position: 'relative' }} data-maintenance-menu>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMaintenanceMenu(openMaintenanceMenu === maint.id ? null : maint.id);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#aaa',
                                cursor: 'pointer',
                                fontSize: '1.2rem',
                                padding: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                borderRadius: '4px'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              ⋯
                            </button>
                            {openMaintenanceMenu === maint.id && (
                              <div
                                style={{
                                  position: 'absolute',
                                  right: 0,
                                  top: '100%',
                                  marginTop: '0.25rem',
                                  backgroundColor: '#2c2c2c',
                                  border: '1px solid #555',
                                  borderRadius: '8px',
                                  minWidth: '150px',
                                  zIndex: 1000,
                                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                                  overflow: 'hidden'
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMaintenanceMenu(null);
                                    setSelectedMaintenance(maint);
                                    setShowMaintenanceDetailsModal(true);
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    background: 'none',
                                    border: 'none',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontSize: '0.9rem',
                                    display: 'block'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  Szczegóły
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMaintenanceMenu(null);
                                    handleEditMaintenance(maint);
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    background: 'none',
                                    border: 'none',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontSize: '0.9rem',
                                    display: 'block',
                                    borderTop: '1px solid #555'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  Edytuj
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMaintenanceMenu(null);
                                    handleDeleteMaintenance(maint.id);
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    background: 'none',
                                    border: 'none',
                                    color: '#f44336',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontSize: '0.9rem',
                                    display: 'block',
                                    borderTop: '1px solid #555'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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
            setShowActivitiesList(false);
            setMaintenanceForm({ date: '', notes: '', activities: [] });
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
                <label className="form-label">Lista czynności</label>
                <div style={{ border: '1px solid #555', borderRadius: '4px', backgroundColor: '#2c2c2c' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowActivitiesList(!showActivitiesList);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'none',
                      border: 'none',
                      color: '#fff',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>
                      {maintenanceForm.activities.length > 0 
                        ? `Wybrano: ${maintenanceForm.activities.length}` 
                        : 'Wybierz czynności'}
                    </span>
                    <span style={{ fontSize: '0.8rem' }}>
                      {showActivitiesList ? '▼' : '▶'}
                    </span>
                  </button>
                  {showActivitiesList && (
                    <div style={{ 
                      padding: '0.5rem 0.5rem 0.5rem 0', 
                      borderTop: '1px solid #555',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      textAlign: 'left'
                    }}>
                      {maintenanceActivities.map((activity) => (
                        <label
                          key={activity}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0.5rem 0.5rem 0.5rem 0',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            margin: 0
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <input
                            type="checkbox"
                            checked={maintenanceForm.activities.includes(activity)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setMaintenanceForm({
                                  ...maintenanceForm,
                                  activities: [...maintenanceForm.activities, activity]
                                });
                              } else {
                                setMaintenanceForm({
                                  ...maintenanceForm,
                                  activities: maintenanceForm.activities.filter(a => a !== activity)
                                });
                              }
                            }}
                            style={{ cursor: 'pointer', margin: 0, marginRight: '1rem', flexShrink: 0 }}
                          />
                          <span style={{ textAlign: 'left' }}>{activity}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Opis:</label>
                <textarea
                  className="form-input"
                  value={maintenanceForm.notes}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, notes: e.target.value })}
                  rows={3}
                  placeholder="Opcjonalny opis konserwacji..."
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Zapisz konserwację
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingMaintenance(null);
                    setShowActivitiesList(false);
                    setMaintenanceForm({ date: '', notes: '', activities: [] });
                  }}
                >
                  Anuluj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMaintenanceDetailsModal && selectedMaintenance && (
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
            setShowMaintenanceDetailsModal(false);
            setSelectedMaintenance(null);
          }}
        >
          <div
            className="card"
            style={{ maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Szczegóły konserwacji</h3>
              <button
                onClick={() => {
                  setShowMaintenanceDetailsModal(false);
                  setSelectedMaintenance(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#aaa',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  padding: '0.25rem 0.5rem'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#aaa' }}>
                  Broń
                </label>
                <div style={{ padding: '0.75rem', backgroundColor: '#2c2c2c', borderRadius: '4px', color: '#fff' }}>
                  {selectedMaintenance.gun_name || getGunName(selectedMaintenance.gun_id)}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#aaa' }}>
                  Data wykonania
                </label>
                <div style={{ padding: '0.75rem', backgroundColor: '#2c2c2c', borderRadius: '4px', color: '#fff' }}>
                  {new Date(selectedMaintenance.date).toLocaleDateString('pl-PL')}
                </div>
              </div>

              {selectedMaintenance.activities && selectedMaintenance.activities.length > 0 && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#aaa' }}>
                    Lista czynności
                  </label>
                  <div style={{ padding: '0.75rem', backgroundColor: '#2c2c2c', borderRadius: '4px' }}>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', listStyle: 'disc', color: '#fff' }}>
                      {selectedMaintenance.activities.map((activity, idx) => (
                        <li key={idx} style={{ marginBottom: '0.5rem' }}>{activity}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {selectedMaintenance.notes && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#aaa' }}>
                    Opis
                  </label>
                  <div style={{ padding: '0.75rem', backgroundColor: '#2c2c2c', borderRadius: '4px', color: '#fff', whiteSpace: 'pre-wrap' }}>
                    {selectedMaintenance.notes}
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#aaa' }}>
                  Strzałów od poprzedniej konserwacji
                </label>
                <div style={{ padding: '0.75rem', backgroundColor: '#2c2c2c', borderRadius: '4px', color: '#fff' }}>
                  {selectedMaintenance.rounds_since_last || 0}
                </div>
              </div>

              {!selectedMaintenance.notes && (!selectedMaintenance.activities || selectedMaintenance.activities.length === 0) && (
                <div style={{ color: '#888', textAlign: 'center', padding: '1rem' }}>
                  Brak dodatkowych informacji
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                onClick={() => {
                  setShowMaintenanceDetailsModal(false);
                  const maintToEdit = selectedMaintenance;
                  setSelectedMaintenance(null);
                  handleEditMaintenance(maintToEdit);
                }}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Edytuj
              </button>
              <button
                onClick={() => {
                  setShowMaintenanceDetailsModal(false);
                  setSelectedMaintenance(null);
                }}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenancePage;
