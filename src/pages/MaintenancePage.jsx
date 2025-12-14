import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { maintenanceAPI, gunsAPI } from '../services/api';

const MaintenancePage = () => {
  const { t } = useTranslation();
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

  const getMaintenanceActivities = () => [
    t('maintenance.activities.cleaning'),
    t('maintenance.activities.barrelCleaning'),
    t('maintenance.activities.chamberCleaning'),
    t('maintenance.activities.slideCleaning'),
    t('maintenance.activities.boltCleaning'),
    t('maintenance.activities.firingPinCleaning'),
    t('maintenance.activities.firingPinChannelCleaning'),
    t('maintenance.activities.magazineCleaning'),
    t('maintenance.activities.lubrication'),
    t('maintenance.activities.railLubrication'),
    t('maintenance.activities.boltLubrication'),
    t('maintenance.activities.inspection'),
    t('maintenance.activities.springWearCheck'),
    t('maintenance.activities.boltLatchCheck'),
    t('maintenance.activities.gasSystemCheck'),
    t('maintenance.activities.pinsCheck'),
    t('maintenance.activities.magazineInspection'),
    t('maintenance.activities.railAndOpticMountCheck'),
    t('maintenance.activities.barrelVisualCheck'),
    t('maintenance.activities.triggerCheck'),
    t('maintenance.activities.safetyCheck'),
    t('maintenance.activities.service'),
    t('maintenance.activities.opticZeroing'),
    t('maintenance.activities.partsReplacement'),
    t('maintenance.activities.opticCheck')
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
      const response = await maintenanceAPI.getAll(params).catch((err) => {
        console.error('Błąd pobierania konserwacji:', err);
        setError(err.response?.data?.message || t('maintenance.errorLoadingMaintenance'));
        return { data: [] };
      });
      setMaintenance(response.data || []);
      setError('');
    } catch (err) {
      console.error('Błąd w fetchMaintenance:', err);
      setError(err.response?.data?.message || t('maintenance.errorLoadingMaintenance'));
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
      setError(err.response?.data?.detail || t('maintenance.errorUpdating'));
    }
  };

  const handleDeleteMaintenance = async (maintenanceId) => {
    if (window.confirm(`${t('common.confirmDeleteItem')} ${t('common.maintenance')}?`)) {
      try {
        await maintenanceAPI.delete(maintenanceId);
        await fetchMaintenance();
        await fetchData();
      } catch (err) {
        setError(err.response?.data?.detail || t('common.errorDeleting', { item: 'maintenance' }));
      }
    }
  };

  if (loading) {
    return <div className="text-center">{t('common.loading')}</div>;
  }

  const maintenanceActivities = getMaintenanceActivities();

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>{t('maintenance.title')}</h2>
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {statistics && (
          <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: 'var(--bg-secondary)' }}>
            <h3 style={{ marginBottom: '1rem' }}>{t('maintenance.statistics')}</h3>
            {statistics.longest_without_maintenance && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
                  {t('maintenance.longestWithoutMaintenance')}
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                  {statistics.longest_without_maintenance.gun_name}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                  {statistics.longest_without_maintenance.days_since} {t('maintenance.daysSince')}
                </div>
              </div>
            )}
            <div style={{ borderTop: `1px solid var(--border-color)`, paddingTop: '1rem' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', marginBottom: '0.75rem' }}>
                {t('maintenance.daysSinceLast')}
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
                      backgroundColor: 'var(--bg-primary)',
                      borderRadius: '4px'
                    }}
                  >
                    <span>{stat.gun_name}</span>
                    <span style={{ color: stat.days_since_last !== null ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                      {stat.days_since_last !== null ? `${stat.days_since_last} ${t('maintenance.daysSince')}` : t('maintenance.noMaintenance')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0 }}>{t('maintenance.history')}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label className="form-label" style={{ margin: 0, fontSize: '0.9rem' }}>
                {t('maintenance.filter')}
              </label>
              <select
                className="form-input"
                value={selectedGunId}
                onChange={(e) => setSelectedGunId(e.target.value)}
                style={{ width: 'auto', minWidth: '200px', padding: '0.5rem' }}
              >
                <option value="">{t('maintenance.all')}</option>
                {guns.map(gun => (
                  <option key={gun.id} value={gun.id}>
                    {gun.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {maintenance.length === 0 ? (
            <p className="text-center" style={{ color: 'var(--text-tertiary)', padding: '2rem' }}>
              {t('maintenance.noMaintenance')}
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('maintenance.weapon')}</th>
                    <th>{t('maintenance.date')}</th>
                    <th>{t('maintenance.activitiesList')}</th>
                    <th>{t('maintenance.shotsSincePrevious')}</th>
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
                            <ul style={{ margin: 0, paddingLeft: '1.25rem', listStyle: 'disc', color: 'var(--text-tertiary)' }}>
                              {maint.activities.map((activity, idx) => (
                                <li key={idx} style={{ marginBottom: '0.15rem' }}>{activity}</li>
                              ))}
                            </ul>
                          ) : (
                            <span style={{ color: 'var(--text-tertiary)' }}>-</span>
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
                                color: 'var(--text-tertiary)',
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
                                  backgroundColor: 'var(--bg-secondary)',
                                  border: `1px solid var(--border-color)`,
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
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontSize: '0.9rem',
                                    display: 'block'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-hover-bg)'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  {t('common.details')}
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
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontSize: '0.9rem',
                                    display: 'block',
                                    borderTop: `1px solid var(--border-color)`
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-hover-bg)'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  {t('common.edit')}
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
                                    borderTop: `1px solid var(--border-color)`
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-hover-bg)'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  {t('common.delete')}
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
            <h3>{t('maintenance.editMaintenance')}</h3>
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
                <label className="form-label">{t('maintenance.activitiesList')}</label>
                <div style={{ border: `1px solid var(--border-color)`, borderRadius: '4px', backgroundColor: 'var(--bg-secondary)' }}>
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
                      color: 'var(--text-primary)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>
                      {maintenanceForm.activities.length > 0 
                        ? `${t('maintenance.selected')} ${maintenanceForm.activities.length}` 
                        : t('maintenance.selectActivities')}
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
                      {maintenanceActivities.map((activity) => {
                        const isSectionTitle = activity === t('maintenance.activities.cleaning') ||
                                               activity === t('maintenance.activities.lubrication') ||
                                               activity === t('maintenance.activities.inspection') ||
                                               activity === t('maintenance.activities.service');
                        
                        if (isSectionTitle) {
                          return (
                            <div
                              key={activity}
                              style={{
                                padding: '0.75rem 0.5rem 0.5rem 1rem',
                                fontWeight: '600',
                                fontSize: '1rem',
                                color: 'var(--text-primary)',
                                marginTop: '0.5rem',
                                borderTop: '1px solid var(--border-color)',
                                margin: '0.5rem 0 0.25rem 0',
                                paddingTop: '0.75rem'
                              }}
                            >
                              {activity}
                            </div>
                          );
                        }
                        
                        return (
                          <label
                            key={activity}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '0.5rem 0.5rem 0.5rem 1rem',
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
                              style={{ cursor: 'pointer', margin: 0, marginRight: '1rem', flexShrink: 0, width: '16px', height: '16px', minWidth: '16px' }}
                            />
                            <span style={{ textAlign: 'left' }}>{activity}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t('maintenance.description')}</label>
                <textarea
                  className="form-input"
                  value={maintenanceForm.notes}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, notes: e.target.value })}
                  rows={3}
                  placeholder={t('maintenance.descriptionPlaceholder')}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {t('maintenance.saveMaintenance')}
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
                  {t('maintenance.cancel')}
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
              <h3 style={{ margin: 0 }}>{t('maintenance.maintenanceDetails')}</h3>
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
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-tertiary)' }}>
                  {t('maintenance.weapon')}
                </label>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', color: 'var(--text-primary)' }}>
                  {selectedMaintenance.gun_name || getGunName(selectedMaintenance.gun_id)}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-tertiary)' }}>
                  {t('maintenance.executionDate')}
                </label>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', color: 'var(--text-primary)' }}>
                  {new Date(selectedMaintenance.date).toLocaleDateString('pl-PL')}
                </div>
              </div>

              {selectedMaintenance.activities && selectedMaintenance.activities.length > 0 && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-tertiary)' }}>
                    {t('maintenance.activitiesList')}
                  </label>
                  <div style={{ padding: '0.75rem', backgroundColor: '#2c2c2c', borderRadius: '4px' }}>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', listStyle: 'disc', color: 'var(--text-primary)' }}>
                      {selectedMaintenance.activities.map((activity, idx) => (
                        <li key={idx} style={{ marginBottom: '0.5rem' }}>{activity}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {selectedMaintenance.notes && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-tertiary)' }}>
                    {t('maintenance.description')}
                  </label>
                  <div style={{ padding: '0.75rem', backgroundColor: '#2c2c2c', borderRadius: '4px', color: '#fff', whiteSpace: 'pre-wrap' }}>
                    {selectedMaintenance.notes}
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-tertiary)' }}>
                  {t('maintenance.shotsSincePrevious')}
                </label>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', color: 'var(--text-primary)' }}>
                  {selectedMaintenance.rounds_since_last || 0}
                </div>
              </div>

              {!selectedMaintenance.notes && (!selectedMaintenance.activities || selectedMaintenance.activities.length === 0) && (
                <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '1rem' }}>
                  {t('maintenance.noAdditionalInfo')}
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
                {t('maintenance.edit')}
              </button>
              <button
                onClick={() => {
                  setShowMaintenanceDetailsModal(false);
                  setSelectedMaintenance(null);
                }}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                {t('maintenance.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenancePage;
