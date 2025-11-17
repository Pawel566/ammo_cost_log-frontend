import React, { useState, useEffect } from 'react';
import { gunsAPI, maintenanceAPI, sessionsAPI } from '../services/api';

const GunsPage = () => {
  const [guns, setGuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [maintenance, setMaintenance] = useState({});
  const [sessions, setSessions] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    caliber: '',
    type: '',
    notes: ''
  });

  useEffect(() => {
    fetchGuns();
    fetchAllMaintenance();
    fetchAllSessions();
  }, []);

  const fetchGuns = async () => {
    try {
      setLoading(true);
      const response = await gunsAPI.getAll();
      const data = response.data;
      const items = Array.isArray(data) ? data : data?.items ?? [];
      setGuns(items);
      setError(null);
    } catch (err) {
      setError('Błąd podczas pobierania listy broni');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllMaintenance = async () => {
    try {
      const response = await maintenanceAPI.getAll();
      const allMaintenance = response.data || [];
      
      const maintenanceByGun = {};
      allMaintenance.forEach(maint => {
        if (!maintenanceByGun[maint.gun_id]) {
          maintenanceByGun[maint.gun_id] = [];
        }
        maintenanceByGun[maint.gun_id].push(maint);
      });
      
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
      
      const sessionsByGun = {};
      [...costSessions, ...accuracySessions].forEach(session => {
        if (!sessionsByGun[session.gun_id]) {
          sessionsByGun[session.gun_id] = { cost: [], accuracy: [] };
        }
        if (session.shots !== undefined) {
          sessionsByGun[session.gun_id].cost.push(session);
        } else {
          sessionsByGun[session.gun_id].accuracy.push(session);
        }
      });
      
      setSessions(sessionsByGun);
    } catch (err) {
      console.error('Błąd pobierania sesji:', err);
    }
  };

  const getLastMaintenance = (gunId) => {
    const gunMaintenance = maintenance[gunId];
    if (!gunMaintenance || gunMaintenance.length === 0) {
      return null;
    }
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
      return null; // Brak konserwacji - nie pokazujemy statusu
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

    // Zwracamy tylko żółty lub czerwony (nie zielony)
    if (finalStatus === 'red') {
      return { status: 'red', color: '#f44336', icon: '🔴' };
    } else if (finalStatus === 'yellow') {
      return { status: 'yellow', color: '#ff9800', icon: '🟡' };
    }

    return null; // Zielony - nie pokazujemy
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const gunData = {
        name: formData.name,
        caliber: formData.caliber || null,
        type: formData.type || null,
        notes: formData.notes || null
      };
      
      if (editingId) {
        await gunsAPI.update(editingId, gunData);
        setEditingId(null);
      } else {
        await gunsAPI.create(gunData);
      }
      
      setFormData({ name: '', caliber: '', type: '', notes: '' });
      setShowForm(false);
      setError(null);
      fetchGuns();
    } catch (err) {
      setError(err.response?.data?.detail || 'Błąd podczas zapisywania broni');
      console.error(err);
    }
  };

  const handleEdit = (gun) => {
    setFormData({
      name: gun.name,
      caliber: gun.caliber || '',
      type: gun.type || '',
      notes: gun.notes || ''
    });
    setEditingId(gun.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', caliber: '', type: '', notes: '' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Czy na pewno chcesz usunąć tę broń?')) {
      try {
        await gunsAPI.delete(id);
        fetchGuns();
      } catch (err) {
        setError(err.response?.data?.detail || 'Błąd podczas usuwania broni');
        console.error(err);
      }
    }
  };

  if (loading) {
    return <div className="text-center">Ładowanie...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>Broń</h2>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              if (showForm) {
                handleCancel();
              } else {
                setShowForm(true);
              }
            }}
          >
            {showForm ? 'Anuluj' : '+ Dodaj broń'}
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {showForm && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>
              {editingId ? 'Edytuj broń' : 'Dodaj nową broń'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nazwa broni *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Kaliber</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.caliber}
                  onChange={(e) => setFormData({ ...formData, caliber: e.target.value })}
                  placeholder="np. 9mm, .45 ACP"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Rodzaj broni</label>
                <select
                  className="form-input"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="">Wybierz rodzaj</option>
                  <option value="Pistolet maszynowy">Pistolet maszynowy</option>
                  <option value="Karabin">Karabin</option>
                  <option value="Karabinek">Karabinek</option>
                  <option value="Strzelba">Strzelba</option>
                  <option value="Broń krótka">Broń krótka</option>
                  <option value="Inna">Inna</option>
                </select>
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
                {editingId ? 'Zapisz zmiany' : 'Dodaj broń'}
              </button>
            </form>
          </div>
        )}

        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Lista broni</h3>
          {guns.length === 0 ? (
            <p className="text-center" style={{ color: '#888', padding: '2rem' }}>
              Brak dodanej broni
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Nazwa</th>
                    <th>Rodzaj</th>
                    <th>Kaliber</th>
                    <th>Notatki</th>
                    <th>Status konserwacji</th>
                    <th>Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {guns.map((gun) => {
                    const maintenanceStatus = getMaintenanceStatus(gun.id);
                    return (
                    <tr key={gun.id}>
                      <td style={{ fontWeight: '500' }}>
                        <span>{gun.name}</span>
                      </td>
                      <td>{gun.type || '-'}</td>
                      <td>{gun.caliber || '-'}</td>
                      <td style={{ color: '#aaa' }}>{gun.notes || '-'}</td>
                      <td>
                        {maintenanceStatus && (
                          <span style={{ color: maintenanceStatus.color, fontSize: '1.2rem' }}>
                            {maintenanceStatus.icon}
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleEdit(gun)}
                          style={{ marginRight: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                        >
                          Edytuj
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(gun.id)}
                          style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                        >
                          Usuń
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GunsPage;
