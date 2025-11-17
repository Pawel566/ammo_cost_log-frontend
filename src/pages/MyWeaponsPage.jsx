import React, { useState, useEffect } from 'react'; // test123
import { useNavigate } from 'react-router-dom';
import { gunsAPI, attachmentsAPI, sessionsAPI, ammoAPI, maintenanceAPI } from '../services/api';

const MyWeaponsPage = () => {
  const navigate = useNavigate();
  const [guns, setGuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedGun, setExpandedGun] = useState(null);
  const [attachments, setAttachments] = useState({});
  const [maintenance, setMaintenance] = useState({});
  const [sessions, setSessions] = useState({});
  const [ammo, setAmmo] = useState([]);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState(null);
  const [attachmentForm, setAttachmentForm] = useState({ type: 'optic', name: '', notes: '' });
  const [maintenanceForm, setMaintenanceForm] = useState({ 
    date: new Date().toISOString().split('T')[0], 
    notes: ''
  });

  useEffect(() => {
    fetchGuns();
    fetchAmmo();
    fetchAllMaintenance();
    fetchAllSessions();
  }, []);

  useEffect(() => {
    if (expandedGun) {
      fetchGunDetails(expandedGun);
    }
  }, [expandedGun]);

  const fetchGuns = async () => {
    try {
      setLoading(true);
      const response = await gunsAPI.getAll();
      const data = response.data;
      const items = Array.isArray(data) ? data : data?.items ?? [];
      setGuns(items);
      setError('');
    } catch (err) {
      setError('Błąd podczas pobierania listy broni');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAmmo = async () => {
    try {
      const response = await ammoAPI.getAll();
      const data = response.data;
      const items = Array.isArray(data) ? data : data?.items ?? [];
      setAmmo(items);
    } catch (err) {
      console.error('Błąd pobierania amunicji:', err);
    }
  };

  const fetchAllMaintenance = async () => {
    try {
      const response = await maintenanceAPI.getAll();
      const allMaintenance = response.data || [];
      
      // Grupuj konserwacje według gun_id
      const maintenanceByGun = {};
      allMaintenance.forEach(maint => {
        if (!maintenanceByGun[maint.gun_id]) {
          maintenanceByGun[maint.gun_id] = [];
        }
        maintenanceByGun[maint.gun_id].push(maint);
      });
      
      // Sortuj każdą grupę według daty (najnowsza pierwsza)
      Object.keys(maintenanceByGun).forEach(gunId => {
        maintenanceByGun[gunId].sort((a, b) => new Date(b.date) - new Date(a.date));
      });
      
      setMaintenance(maintenanceByGun);
    } catch (err) {
      console.error('Błąd pobierania konserwacji:', err);
    }
  };

  const fetchAllSessions = async () => {
    try {
      const response = await sessionsAPI.getAll({ limit: 1000 });
      const sessionsData = response.data || {};
      const costSessions = sessionsData.cost_sessions?.items || [];
      const accuracySessions = sessionsData.accuracy_sessions?.items || [];
      
      // Grupuj sesje według gun_id
      const sessionsByGun = {};
      [...costSessions, ...accuracySessions].forEach(session => {
        if (!sessionsByGun[session.gun_id]) {
          sessionsByGun[session.gun_id] = { cost: [], accuracy: [] };
        }
        if (session.shots !== undefined) {
          // To jest cost session
          sessionsByGun[session.gun_id].cost.push(session);
        } else {
          // To jest accuracy session
          sessionsByGun[session.gun_id].accuracy.push(session);
        }
      });
      
      setSessions(sessionsByGun);
    } catch (err) {
      console.error('Błąd pobierania sesji:', err);
    }
  };

  const fetchGunDetails = async (gunId) => {
    try {
      const [attachmentsRes, maintenanceRes, sessionsRes] = await Promise.all([
        attachmentsAPI.getForGun(gunId).catch(() => ({ data: [] })),
        maintenanceAPI.getForGun(gunId).catch(() => ({ data: [] })),
        sessionsAPI.getAll({ gun_id: gunId, limit: 100 }).catch(() => ({ data: { cost_sessions: { items: [] }, accuracy_sessions: { items: [] } } }))
      ]);
      
      setAttachments({ ...attachments, [gunId]: attachmentsRes.data || [] });
      setMaintenance({ ...maintenance, [gunId]: maintenanceRes.data || [] });
      
      const costSessions = sessionsRes.data.cost_sessions?.items || [];
      const accuracySessions = sessionsRes.data.accuracy_sessions?.items || [];
      setSessions({ ...sessions, [gunId]: { cost: costSessions, accuracy: accuracySessions } });
    } catch (err) {
      console.error('Błąd pobierania szczegółów broni:', err);
    }
  };

  const handleAddAttachment = async (e) => {
    e.preventDefault();
    try {
      await attachmentsAPI.create(expandedGun, attachmentForm);
      setShowAttachmentModal(false);
      setAttachmentForm({ type: 'optic', name: '', notes: '' });
      fetchGunDetails(expandedGun);
      fetchGuns();
    } catch (err) {
      setError(err.response?.data?.detail || 'Błąd podczas dodawania wyposażenia');
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (window.confirm('Czy na pewno chcesz usunąć to wyposażenie?')) {
      try {
        await attachmentsAPI.delete(attachmentId);
        fetchGunDetails(expandedGun);
        fetchGuns();
      } catch (err) {
        setError(err.response?.data?.detail || 'Błąd podczas usuwania wyposażenia');
      }
    }
  };

  const handleAddMaintenance = async (e) => {
    e.preventDefault();
    try {
      let formData;
      if (editingMaintenance) {
        formData = {};
        if (maintenanceForm.date) {
          formData.date = maintenanceForm.date;
        }
        if (maintenanceForm.notes !== undefined) {
          formData.notes = maintenanceForm.notes || null;
        }
        await maintenanceAPI.update(editingMaintenance.id, formData);
      } else {
        formData = {
          date: maintenanceForm.date,
          notes: maintenanceForm.notes || null
        };
        await maintenanceAPI.create(expandedGun, formData);
      }
      setShowMaintenanceModal(false);
      setEditingMaintenance(null);
      setMaintenanceForm({ 
        date: new Date().toISOString().split('T')[0], 
        notes: ''
      });
      await fetchGunDetails(expandedGun);
      await fetchAllMaintenance();
      fetchGuns();
    } catch (err) {
      setError(err.response?.data?.detail || 'Błąd podczas zapisywania konserwacji');
      console.error(err);
    }
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
    setShowMaintenanceModal(true);
  };

  const handleDeleteMaintenance = async (maintenanceId) => {
    if (window.confirm('Czy na pewno chcesz usunąć tę konserwację?')) {
      try {
        await maintenanceAPI.delete(maintenanceId);
        await fetchGunDetails(expandedGun);
        await fetchAllMaintenance();
        fetchGuns();
      } catch (err) {
        setError(err.response?.data?.detail || 'Błąd podczas usuwania konserwacji');
      }
    }
  };

  const getAttachmentTypeLabel = (type) => {
    const labels = {
      optic: 'Celownik',
      light: 'Latarka',
      laser: 'Laser',
      suppressor: 'Tłumik',
      bipod: 'Dwójnóg',
      compensator: 'Kompensator',
      grip: 'Chwyt',
      trigger: 'Spust',
      other: 'Inne'
    };
    return labels[type] || type;
  };

  const getAttachmentsCount = (gunId) => {
    return attachments[gunId]?.length || 0;
  };

  const getGunTypeLabel = (type) => {
    const labels = {
      pistol: 'Pistolet',
      rifle: 'Karabin',
      shotgun: 'Strzelba',
      other: 'Inne'
    };
    return labels[type?.toLowerCase()] || type || 'Inne';
  };

  const getLastMaintenance = (gunId) => {
    const gunMaintenance = maintenance[gunId];
    if (!gunMaintenance || gunMaintenance.length === 0) {
      return null;
    }
    // Konserwacje są już posortowane od najnowszej
    return gunMaintenance[0];
  };

  const calculateRoundsSinceLastMaintenance = (gunId) => {
    const lastMaint = getLastMaintenance(gunId);
    if (!lastMaint) return 0;

    const gunSessions = sessions[gunId];
    if (!gunSessions) return 0;

    // Używamy tylko cost sessions, bo accuracy sessions również tworzą cost sessions
    const costSessions = gunSessions.cost || [];
    const maintenanceDate = new Date(lastMaint.date);
    
    // Sumuj strzały tylko z sesji po dacie konserwacji
    let totalRounds = 0;
    costSessions.forEach(session => {
      const sessionDate = new Date(session.date);
      if (sessionDate >= maintenanceDate) {
        totalRounds += session.shots || 0;
      }
    });

    return totalRounds;
  };

  const calculateDaysSinceLastMaintenance = (gunId) => {
    const lastMaint = getLastMaintenance(gunId);
    if (!lastMaint) return null;

    const maintenanceDate = new Date(lastMaint.date);
    const today = new Date();
    const diffTime = today - maintenanceDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const getMaintenanceStatus = (gunId) => {
    const lastMaint = getLastMaintenance(gunId);
    if (!lastMaint) {
      return { status: 'none', color: '#888', icon: '', message: 'Brak konserwacji' };
    }

    const rounds = calculateRoundsSinceLastMaintenance(gunId);
    const days = calculateDaysSinceLastMaintenance(gunId);

    // Status według strzałów
    let roundsStatus = 'green';
    if (rounds >= 500) roundsStatus = 'red';
    else if (rounds >= 300) roundsStatus = 'yellow';

    // Status według dni
    let daysStatus = 'green';
    if (days >= 60) daysStatus = 'red';
    else if (days >= 30) daysStatus = 'yellow';

    // Najgorszy status
    let finalStatus = roundsStatus;
    if (daysStatus === 'red' || roundsStatus === 'red') {
      finalStatus = 'red';
    } else if (daysStatus === 'yellow' || roundsStatus === 'yellow') {
      finalStatus = 'yellow';
    }

    let color, icon, message;
    if (finalStatus === 'red') {
      color = '#f44336';
      icon = '🔴';
      message = 'Wymagana konserwacja';
    } else if (finalStatus === 'yellow') {
      color = '#ff9800';
      icon = '🟡';
      message = 'Zbliża się konserwacja';
    } else {
      color = '#4caf50';
      icon = '🟢';
      message = 'OK';
    }

    return { status: finalStatus, color, icon, message, rounds, days };
  };

  if (loading) {
    return <div className="text-center">Ładowanie...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Moja broń</h2>
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}
        {guns.length === 0 ? (
          <p className="text-center">Brak dodanej broni</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {guns.map((gun) => {
              const isExpanded = expandedGun === gun.id;
              const attCount = getAttachmentsCount(gun.id);
              const lastMaintenance = getLastMaintenance(gun.id);
              const maintenanceStatus = getMaintenanceStatus(gun.id);
              return (
                <div key={gun.id}>
                  <div 
                    className="card" 
                    style={{ 
                      marginBottom: '1rem',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                    }}
                    onClick={() => {
                      if (isExpanded) {
                        setExpandedGun(null);
                      } else {
                        setExpandedGun(gun.id);
                      }
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        backgroundColor: '#2c2c2c',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <span style={{ fontSize: '2rem' }}>🔫</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0, marginBottom: '0.25rem' }}>{gun.name}</h3>
                        <p style={{ margin: '0.25rem 0', color: '#aaa', fontSize: '0.9rem' }}>
                          {gun.caliber && gun.caliber}
                        </p>
                        <p style={{ margin: '0.25rem 0', color: '#888', fontSize: '0.85rem' }}>
                          {getGunTypeLabel(gun.type)}
                        </p>
                        <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          {attCount > 0 && (
                            <span>{attCount} {attCount === 1 ? 'dodatek' : attCount < 5 ? 'dodatki' : 'dodatków'}</span>
                          )}
                          {lastMaintenance && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ color: '#007bff' }}>
                                Ostatnia konserwacja: {new Date(lastMaintenance.date).toLocaleDateString('pl-PL')}
                              </span>
                              <span style={{ color: maintenanceStatus.color, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                {maintenanceStatus.icon} {maintenanceStatus.message}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="card" style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0 }}>{gun.name}</h3>
                        <button
                          className="btn btn-secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedGun(null);
                          }}
                          style={{ padding: '0.5rem 1rem' }}
                        >
                          Zwiń
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h4 style={{ margin: 0 }}>Dodatki</h4>
                          </div>
                          {attachments[gun.id]?.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                              {attachments[gun.id].map((att) => (
                                <div
                                  key={att.id}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#2c2c2c',
                                    borderRadius: '20px',
                                    fontSize: '0.9rem',
                                    position: 'relative'
                                  }}
                                >
                                  <span>{getAttachmentTypeLabel(att.type)} - {att.name}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteAttachment(att.id);
                                    }}
                                    style={{
                                      marginLeft: '0.5rem',
                                      background: 'none',
                                      border: 'none',
                                      color: '#f44336',
                                      cursor: 'pointer',
                                      fontSize: '1rem',
                                      padding: 0,
                                      width: '20px',
                                      height: '20px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p style={{ color: '#888', marginBottom: '1rem' }}>Brak dodatków</p>
                          )}
                          <button
                            className="btn btn-link"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowAttachmentModal(true);
                            }}
                            style={{ 
                              color: '#007bff', 
                              textDecoration: 'none',
                              padding: 0,
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.9rem'
                            }}
                          >
                            + Dodaj dodatek
                          </button>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h4 style={{ margin: 0 }}>Konserwacja</h4>
                          </div>
                          {maintenance[gun.id]?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                              {maintenance[gun.id]
                                .sort((a, b) => new Date(b.date) - new Date(a.date))
                                .map((maint) => (
                                  <div
                                    key={maint.id}
                                    style={{
                                      padding: '0.75rem',
                                      backgroundColor: '#2c2c2c',
                                      borderRadius: '8px',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center'
                                    }}
                                  >
                                    <div>
                                      <div style={{ fontWeight: '500' }}>
                                        {new Date(maint.date).toLocaleDateString('pl-PL')}
                                      </div>
                                      {maint.notes && (
                                        <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.25rem' }}>
                                          {maint.notes}
                                        </div>
                                      )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(`/maintenance?gun_id=${gun.id}`);
                                        }}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          color: '#007bff',
                                          cursor: 'pointer',
                                          fontSize: '0.9rem',
                                          padding: '0.25rem 0.5rem'
                                        }}
                                      >
                                        Szczegóły
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditMaintenance(maint);
                                        }}
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
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteMaintenance(maint.id);
                                        }}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          color: '#f44336',
                                          cursor: 'pointer',
                                          fontSize: '1.2rem',
                                          padding: '0.25rem 0.5rem'
                                        }}
                                      >
                                        ×
                                      </button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <p style={{ color: '#888', marginBottom: '1rem' }}>Brak konserwacji</p>
                          )}
                          <button
                            className="btn btn-link"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingMaintenance(null);
                              setMaintenanceForm({ 
                                date: new Date().toISOString().split('T')[0], 
                                notes: ''
                              });
                              setShowMaintenanceModal(true);
                            }}
                            style={{ 
                              color: '#007bff', 
                              textDecoration: 'none',
                              padding: 0,
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.9rem'
                            }}
                          >
                            + Dodaj konserwację
                          </button>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h4 style={{ margin: 0 }}>Historia użytkowania</h4>
                          </div>
                          {sessions[gun.id] && (sessions[gun.id].cost.length > 0 || sessions[gun.id].accuracy.length > 0) ? (
                            <div style={{ overflowX: 'auto' }}>
                              <table className="table" style={{ width: '100%' }}>
                                <thead>
                                  <tr>
                                    <th>Data</th>
                                    <th>Amunicja</th>
                                    <th>Strzały</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {[...sessions[gun.id].cost, ...sessions[gun.id].accuracy]
                                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                                    .map((session) => {
                                      const sessionAmmo = ammo.find(a => a.id === session.ammo_id);
                                      return (
                                        <tr key={session.id}>
                                          <td>{new Date(session.date).toLocaleDateString('pl-PL')}</td>
                                          <td>{sessionAmmo ? sessionAmmo.name : '-'}</td>
                                          <td>{session.shots}</td>
                                        </tr>
                                      );
                                    })}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p style={{ color: '#888', marginBottom: '1rem' }}>Brak sesji</p>
                          )}
                          <button
                            className="btn btn-link"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/cost-sessions');
                            }}
                            style={{ 
                              color: '#007bff', 
                              textDecoration: 'none',
                              padding: 0,
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.9rem'
                            }}
                          >
                            + Dodaj sesję
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div 
              className="card" 
              style={{ 
                marginTop: '1rem', 
                cursor: 'pointer',
                textAlign: 'center',
                padding: '2rem',
                border: '2px dashed #555',
                backgroundColor: '#1a1a1a'
              }}
              onClick={() => navigate('/guns')}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2c2c2c';
                e.currentTarget.style.borderColor = '#007bff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1a1a1a';
                e.currentTarget.style.borderColor = '#555';
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>+</div>
              <h3 style={{ margin: 0, color: '#007bff' }}>Dodaj nową broń</h3>
            </div>
          </div>
        )}
      </div>

      {showAttachmentModal && (
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
          onClick={() => setShowAttachmentModal(false)}
        >
          <div
            className="card"
            style={{ maxWidth: '500px', width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Dodaj wyposażenie</h3>
            <form onSubmit={handleAddAttachment}>
              <div className="form-group">
                <label className="form-label">Typ</label>
                <select
                  className="form-input"
                  value={attachmentForm.type}
                  onChange={(e) => setAttachmentForm({ ...attachmentForm, type: e.target.value })}
                  required
                >
                  <option value="optic">Celownik</option>
                  <option value="light">Latarka</option>
                  <option value="laser">Laser</option>
                  <option value="suppressor">Tłumik</option>
                  <option value="bipod">Dwójnóg</option>
                  <option value="compensator">Kompensator</option>
                  <option value="grip">Chwyt</option>
                  <option value="trigger">Spust</option>
                  <option value="other">Inne</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Nazwa</label>
                <input
                  type="text"
                  className="form-input"
                  value={attachmentForm.name}
                  onChange={(e) => setAttachmentForm({ ...attachmentForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Notatki</label>
                <textarea
                  className="form-input"
                  value={attachmentForm.notes}
                  onChange={(e) => setAttachmentForm({ ...attachmentForm, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary">
                  Dodaj
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAttachmentModal(false)}
                >
                  Anuluj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMaintenanceModal && (
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
            setShowMaintenanceModal(false);
            setEditingMaintenance(null);
            setMaintenanceForm({ 
              date: new Date().toISOString().split('T')[0], 
              notes: ''
            });
          }}
        >
          <div
            className="card"
            style={{ maxWidth: '500px', width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{editingMaintenance ? 'Edytuj konserwację' : 'Dodaj konserwację'}</h3>
            <form onSubmit={handleAddMaintenance}>
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
                  {editingMaintenance ? 'Zapisz' : 'Dodaj'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowMaintenanceModal(false);
                    setEditingMaintenance(null);
                    setMaintenanceForm({ 
                      date: new Date().toISOString().split('T')[0], 
                      notes: ''
                    });
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

export default MyWeaponsPage;
