import React, { useState, useEffect } from 'react';
import { sessionsAPI, gunsAPI, ammoAPI } from '../services/api';

const SessionsPage = () => {
  const [sessions, setSessions] = useState({ cost_sessions: [], accuracy_sessions: [] });
  const [guns, setGuns] = useState([]);
  const [ammo, setAmmo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('cost'); // 'cost' or 'accuracy'
  const [formData, setFormData] = useState({
    gun_id: '',
    ammo_id: '',
    date: new Date().toISOString().split('T')[0],
    shots: '',
    notes: '',
    distance_m: '',
    hits: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, gunsRes, ammoRes] = await Promise.all([
        sessionsAPI.getAll(),
        gunsAPI.getAll(),
        ammoAPI.getAll()
      ]);
      
      setSessions(sessionsRes.data);
      setGuns(gunsRes.data);
      setAmmo(ammoRes.data);
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
    
    // Walidacja po stronie frontendu
    const shots = parseInt(formData.shots);
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Ustaw na koniec dnia
    
    if (shots <= 0) {
      setError('Liczba strzałów musi być większa od 0');
      return;
    }
    
    if (selectedDate > today) {
      setError('Data nie może być w przyszłości');
      return;
    }
    
    if (formType === 'accuracy') {
      const hits = parseInt(formData.hits);
      if (hits < 0 || hits > shots) {
        setError('Liczba trafień musi być między 0 a liczbą strzałów');
        return;
      }
      if (!formData.distance_m || parseInt(formData.distance_m) <= 0) {
        setError('Dystans musi być większy od 0');
        return;
      }
    }
    
    try {
      const sessionData = {
        gun_id: parseInt(formData.gun_id),
        ammo_id: parseInt(formData.ammo_id),
        date: formData.date,
        shots: shots
      };
      
      let response;
      if (formType === 'cost') {
        response = await sessionsAPI.createCost(sessionData);
      } else {
        sessionData.distance_m = parseInt(formData.distance_m);
        sessionData.hits = parseInt(formData.hits);
        response = await sessionsAPI.createAccuracy(sessionData);
      }
      
      setFormData({
        gun_id: '',
        ammo_id: '',
        date: new Date().toISOString().split('T')[0],
        shots: '',
        notes: '',
        distance_m: '',
        hits: ''
      });
      setShowForm(false);
      setError(null);
      fetchData();
      
      // Pokaż informację o pozostałej amunicji
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

  if (loading) {
    return <div className="text-center">Ładowanie...</div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Zarządzanie sesjami strzeleckimi</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className={`btn ${formType === 'cost' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFormType('cost')}
              disabled={showForm}
            >
              Sesja kosztowa
            </button>
            <button 
              className={`btn ${formType === 'accuracy' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFormType('accuracy')}
              disabled={showForm}
            >
              Sesja celnościowa
            </button>
            <button 
              className="btn btn-success" 
              onClick={() => setShowForm(!showForm)}
              disabled={guns.length === 0 || ammo.length === 0}
            >
              {showForm ? 'Anuluj' : 'Dodaj sesję'}
            </button>
          </div>
        </div>

        {guns.length === 0 && (
          <div className="alert alert-info">
            Najpierw dodaj broń w sekcji "Broń"
          </div>
        )}

        {ammo.length === 0 && (
          <div className="alert alert-info">
            Najpierw dodaj amunicję w sekcji "Amunicja"
          </div>
        )}

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        {showForm && guns.length > 0 && ammo.length > 0 && (
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
            
            {formType === 'accuracy' && (
              <>
                <div className="form-group">
                  <label className="form-label">Dystans (metry) *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={formData.distance_m}
                    onChange={(e) => setFormData({ ...formData, distance_m: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Liczba trafień *</label>
                  <input
                    type="number"
                    min="0"
                    max={formData.shots || 0}
                    className="form-input"
                    value={formData.hits}
                    onChange={(e) => setFormData({ ...formData, hits: e.target.value })}
                    required
                  />
                </div>
              </>
            )}
            
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
              Dodaj sesję
            </button>
          </form>
        )}
      </div>

      <div className="card">
        <h3 className="card-title">Historia sesji kosztowych</h3>
        {sessions.cost_sessions.length === 0 ? (
          <p className="text-center">Brak zarejestrowanych sesji kosztowych</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Broń</th>
                <th>Amunicja</th>
                <th>Strzały</th>
                <th>Koszt</th>
                <th>Notatki</th>
              </tr>
            </thead>
            <tbody>
              {sessions.cost_sessions.map((session) => (
                <tr key={session.id}>
                  <td>{new Date(session.date).toLocaleDateString('pl-PL')}</td>
                  <td>{getGunName(session.gun_id)}</td>
                  <td>{getAmmoName(session.ammo_id)}</td>
                  <td>{session.shots}</td>
                  <td>{session.cost.toFixed(2)} zł</td>
                  <td>{session.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3 className="card-title">Historia sesji celnościowych</h3>
        {sessions.accuracy_sessions.length === 0 ? (
          <p className="text-center">Brak zarejestrowanych sesji celnościowych</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Broń</th>
                <th>Amunicja</th>
                <th>Dystans</th>
                <th>Strzały</th>
                <th>Trafienia</th>
                <th>Celność</th>
                <th>Komentarz AI</th>
              </tr>
            </thead>
            <tbody>
              {sessions.accuracy_sessions.map((session) => (
                <tr key={session.id}>
                  <td>{new Date(session.date).toLocaleDateString('pl-PL')}</td>
                  <td>{getGunName(session.gun_id)}</td>
                  <td>{getAmmoName(session.ammo_id)}</td>
                  <td>{session.distance_m} m</td>
                  <td>{session.shots}</td>
                  <td>{session.hits}</td>
                  <td style={{ fontWeight: 'bold', color: session.accuracy_percent >= 80 ? '#28a745' : session.accuracy_percent >= 60 ? '#ffc107' : '#dc3545' }}>
                    {session.accuracy_percent}%
                  </td>
                  <td style={{ fontSize: '12px', maxWidth: '200px' }}>
                    {session.ai_comment || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SessionsPage;
