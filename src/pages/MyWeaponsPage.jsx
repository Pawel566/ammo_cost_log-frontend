import React, { useState, useEffect } from 'react';
import { gunsAPI, attachmentsAPI, maintenanceAPI, sessionsAPI, aiAPI } from '../services/api';

const MyWeaponsPage = () => {
  const [guns, setGuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedGun, setExpandedGun] = useState(null);
  const [activeTab, setActiveTab] = useState('equipment');
  const [attachments, setAttachments] = useState({});
  const [maintenance, setMaintenance] = useState({});
  const [sessions, setSessions] = useState({});
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [attachmentForm, setAttachmentForm] = useState({ type: 'optic', name: '', notes: '' });
  const [maintenanceForm, setMaintenanceForm] = useState({ 
    date: new Date().toISOString().split('T')[0], 
    notes: '' 
  });

  useEffect(() => {
    fetchGuns();
  }, []);

  useEffect(() => {
    if (expandedGun) {
      fetchGunDetails(expandedGun);
    }
  }, [expandedGun, activeTab]);

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

  const fetchGunDetails = async (gunId) => {
    if (activeTab === 'equipment') {
      try {
        const response = await attachmentsAPI.getForGun(gunId);
        setAttachments({ ...attachments, [gunId]: response.data });
      } catch (err) {
        console.error('Błąd pobierania wyposażenia:', err);
      }
    } else if (activeTab === 'maintenance') {
      try {
        const response = await maintenanceAPI.getForGun(gunId);
        setMaintenance({ ...maintenance, [gunId]: response.data });
      } catch (err) {
        console.error('Błąd pobierania konserwacji:', err);
      }
    } else if (activeTab === 'history') {
      try {
        const response = await sessionsAPI.getAll({ gun_id: gunId, limit: 100 });
        const costSessions = response.data.cost_sessions?.items || [];
        const accuracySessions = response.data.accuracy_sessions?.items || [];
        setSessions({ ...sessions, [gunId]: { cost: costSessions, accuracy: accuracySessions } });
      } catch (err) {
        console.error('Błąd pobierania sesji:', err);
      }
    }
  };

  const handleAddAttachment = async (e) => {
    e.preventDefault();
    try {
      await attachmentsAPI.create(expandedGun, attachmentForm);
      setShowAttachmentModal(false);
      setAttachmentForm({ type: 'optic', name: '', notes: '' });
      fetchGunDetails(expandedGun);
    } catch (err) {
      setError(err.response?.data?.detail || 'Błąd podczas dodawania wyposażenia');
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (window.confirm('Czy na pewno chcesz usunąć to wyposażenie?')) {
      try {
        await attachmentsAPI.delete(expandedGun, attachmentId);
        fetchGunDetails(expandedGun);
      } catch (err) {
        setError(err.response?.data?.detail || 'Błąd podczas usuwania wyposażenia');
      }
    }
  };

  const handleAddMaintenance = async (e) => {
    e.preventDefault();
    try {
      await maintenanceAPI.create(expandedGun, maintenanceForm);
      setShowMaintenanceModal(false);
      setMaintenanceForm({ date: new Date().toISOString().split('T')[0], notes: '' });
      fetchGunDetails(expandedGun);
      fetchGuns();
    } catch (err) {
      setError(err.response?.data?.detail || 'Błąd podczas dodawania konserwacji');
    }
  };

  const handleDeleteMaintenance = async (maintenanceId) => {
    if (window.confirm('Czy na pewno chcesz usunąć tę konserwację?')) {
      try {
        await maintenanceAPI.delete(expandedGun, maintenanceId);
        fetchGunDetails(expandedGun);
        fetchGuns();
      } catch (err) {
        setError(err.response?.data?.detail || 'Błąd podczas usuwania konserwacji');
      }
    }
  };

  const getAttachmentIcon = (type) => {
    const icons = {
      optic: '🔭',
      light: '💡',
      laser: '🔴',
      suppressor: '🔇',
      bipod: '🦵',
      compensator: '⚡',
      grip: '✋',
      trigger: '👆',
      other: '📦'
    };
    return icons[type] || '📦';
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

  const getLastMaintenance = (gunId) => {
    const maint = maintenance[gunId];
    if (!maint || maint.length === 0) return null;
    return maint.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  };

  const getAttachmentsCount = (gunId) => {
    return attachments[gunId]?.length || 0;
  };

  const handleAnalyzeAI = async () => {
    if (!expandedGun) return;
    setAiLoading(true);
    setError('');
    try {
      const response = await aiAPI.analyze(expandedGun, openaiApiKey || null);
      setAiAnalysis(response.data.analysis);
      setShowAIModal(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Błąd podczas generowania analizy AI');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center">Ładowanie...</div>;
  }

  return (
    <div>
      <div className="card">
        <h2>Moja broń i wyposażenie</h2>
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
              const lastMaint = getLastMaintenance(gun.id);
              const attCount = getAttachmentsCount(gun.id);
              return (
                <div key={gun.id} className="card" style={{ marginBottom: '1rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      if (isExpanded) {
                        setExpandedGun(null);
                      } else {
                        setExpandedGun(gun.id);
                        setActiveTab('equipment');
                      }
                    }}
                  >
                    <div>
                      <h3 style={{ margin: 0 }}>{gun.name}</h3>
                      <p style={{ margin: '0.5rem 0', color: '#aaa' }}>
                        {gun.caliber && `Kaliber: ${gun.caliber}`}
                        {gun.caliber && gun.type && ' • '}
                        {gun.type && `Typ: ${gun.type}`}
                      </p>
                      <div style={{ fontSize: '0.9rem', color: '#888' }}>
                        {lastMaint && (
                          <span>Ostatnia konserwacja: {new Date(lastMaint.date).toLocaleDateString('pl-PL')}</span>
                        )}
                        {lastMaint && attCount > 0 && ' • '}
                        {attCount > 0 && <span>Wyposażenie: {attCount}</span>}
                      </div>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isExpanded) {
                          setExpandedGun(null);
                        } else {
                          setExpandedGun(gun.id);
                          setActiveTab('equipment');
                        }
                      }}
                    >
                      {isExpanded ? 'Zwiń' : 'Szczegóły'}
                    </button>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: '1rem', borderTop: '1px solid #404040', paddingTop: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #404040', flex: 1 }}>
                          <button
                            className={`btn ${activeTab === 'equipment' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setActiveTab('equipment')}
                            style={{ border: 'none', background: activeTab === 'equipment' ? '#007bff' : '#555' }}
                          >
                            Wyposażenie
                          </button>
                          <button
                            className={`btn ${activeTab === 'maintenance' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setActiveTab('maintenance')}
                            style={{ border: 'none', background: activeTab === 'maintenance' ? '#007bff' : '#555' }}
                          >
                            Konserwacja
                          </button>
                          <button
                            className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setActiveTab('history')}
                            style={{ border: 'none', background: activeTab === 'history' ? '#007bff' : '#555' }}
                          >
                            Historia
                          </button>
                        </div>
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            setShowAIModal(true);
                            setAiAnalysis('');
                          }}
                          style={{ marginLeft: '1rem' }}
                        >
                          Przeprowadź analizę AI
                        </button>
                      </div>

                      {activeTab === 'equipment' && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h4>Wyposażenie</h4>
                            <button
                              className="btn btn-primary"
                              onClick={() => setShowAttachmentModal(true)}
                            >
                              Dodaj wyposażenie
                            </button>
                          </div>
                          {attachments[gun.id]?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {attachments[gun.id].map((att) => (
                                <div
                                  key={att.id}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.75rem',
                                    backgroundColor: '#2c2c2c',
                                    borderRadius: '4px'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1.5rem' }}>{getAttachmentIcon(att.type)}</span>
                                    <div>
                                      <div><strong>{att.name}</strong> - {getAttachmentTypeLabel(att.type)}</div>
                                      {att.notes && <div style={{ fontSize: '0.9rem', color: '#aaa' }}>{att.notes}</div>}
                                    </div>
                                  </div>
                                  <button
                                    className="btn btn-danger"
                                    onClick={() => handleDeleteAttachment(att.id)}
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.9rem' }}
                                  >
                                    Usuń
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p>Brak wyposażenia</p>
                          )}
                        </div>
                      )}

                      {activeTab === 'maintenance' && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h4>Konserwacja</h4>
                            <button
                              className="btn btn-primary"
                              onClick={() => setShowMaintenanceModal(true)}
                            >
                              Dodaj konserwację
                            </button>
                          </div>
                          {maintenance[gun.id]?.length > 0 ? (
                            <table className="table">
                              <thead>
                                <tr>
                                  <th>Data</th>
                                  <th>Strzały od ostatniej</th>
                                  <th>Notatki</th>
                                  <th>Akcje</th>
                                </tr>
                              </thead>
                              <tbody>
                                {maintenance[gun.id].map((maint) => (
                                  <tr key={maint.id}>
                                    <td>{new Date(maint.date).toLocaleDateString('pl-PL')}</td>
                                    <td>{maint.rounds_since_last}</td>
                                    <td>{maint.notes || '-'}</td>
                                    <td>
                                      <button
                                        className="btn btn-danger"
                                        onClick={() => handleDeleteMaintenance(maint.id)}
                                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.9rem' }}
                                      >
                                        Usuń
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p>Brak konserwacji</p>
                          )}
                        </div>
                      )}

                      {activeTab === 'history' && (
                        <div>
                          <h4>Historia sesji</h4>
                          {sessions[gun.id] && (
                            sessions[gun.id].cost.length === 0 && sessions[gun.id].accuracy.length === 0 ? (
                              <p>Brak sesji</p>
                            ) : (
                              <table className="table">
                                <thead>
                                  <tr>
                                    <th>Data</th>
                                    <th>Typ</th>
                                    <th>Strzały</th>
                                    <th>Koszt</th>
                                    <th>Celność</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {[...sessions[gun.id].cost, ...sessions[gun.id].accuracy]
                                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                                    .map((session) => (
                                    <tr key={session.id}>
                                      <td>{new Date(session.date).toLocaleDateString('pl-PL')}</td>
                                      <td>{session.cost !== undefined ? 'Kosztowa' : 'Celnościowa'}</td>
                                      <td>{session.shots}</td>
                                      <td>{session.cost !== undefined ? `${session.cost.toFixed(2)} zł` : '-'}</td>
                                      <td>{session.accuracy_percent ? `${session.accuracy_percent.toFixed(1)}%` : '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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
          onClick={() => setShowMaintenanceModal(false)}
        >
          <div
            className="card"
            style={{ maxWidth: '500px', width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Dodaj konserwację</h3>
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
                  Dodaj
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowMaintenanceModal(false)}
                >
                  Anuluj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAIModal && (
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
            setShowAIModal(false);
            setAiAnalysis('');
            setOpenaiApiKey('');
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '700px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              margin: '0 auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Analiza AI</h3>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowAIModal(false);
                  setAiAnalysis('');
                  setOpenaiApiKey('');
                }}
              >
                Zamknij
              </button>
            </div>
            {!aiAnalysis && (
              <div>
                <div className="form-group">
                  <label className="form-label">Klucz API OpenAI (opcjonalnie)</label>
                  <input
                    type="password"
                    className="form-input"
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    placeholder="Jeśli nie podasz, użyty zostanie klucz z ustawień serwera"
                  />
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handleAnalyzeAI}
                  disabled={aiLoading}
                >
                  {aiLoading ? 'Analizowanie...' : 'Przeprowadź analizę'}
                </button>
              </div>
            )}
            {aiAnalysis && (
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                {aiAnalysis}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyWeaponsPage;
