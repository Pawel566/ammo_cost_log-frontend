import React, { useState, useEffect } from 'react';
import { shootingSessionsAPI, gunsAPI, ammoAPI } from '../services/api';

const ShootingSessionsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [guns, setGuns] = useState([]);
  const [ammo, setAmmo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    weapon_id: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    total_shots: '',
    include_cost: true,
    ammo_id: '',
    quantity: '',
    price_per_unit: '',
    include_accuracy: false,
    distance_m: '',
    shots: '',
    hits: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.include_cost && formData.quantity && formData.price_per_unit) {
      const quantity = parseFloat(formData.quantity) || 0;
      const price = parseFloat(formData.price_per_unit.replace(',', '.').replace(' zł', '').trim()) || 0;
      const total = (quantity * price).toFixed(2);
      // Koszt będzie obliczany automatycznie
    }
  }, [formData.quantity, formData.price_per_unit, formData.include_cost]);

  useEffect(() => {
    if (formData.ammo_id && formData.include_cost) {
      const selectedAmmo = ammo.find(a => a.id === formData.ammo_id);
      if (selectedAmmo) {
        setFormData(prev => ({ 
          ...prev, 
          price_per_unit: selectedAmmo.price_per_unit.toFixed(2).replace('.', ',') + ' zł' 
        }));
      }
    }
  }, [formData.ammo_id, formData.include_cost, ammo]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, gunsRes, ammoRes] = await Promise.all([
        shootingSessionsAPI.getAll(),
        gunsAPI.getAll(),
        ammoAPI.getAll()
      ]);
      const sessionsData = sessionsRes.data || [];
      const gunsData = gunsRes.data;
      const ammoData = ammoRes.data;
      const gunItems = Array.isArray(gunsData) ? gunsData : gunsData?.items ?? [];
      const ammoItems = Array.isArray(ammoData) ? ammoData : ammoData?.items ?? [];
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
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

  const calculateAccuracy = () => {
    if (formData.include_accuracy && formData.shots && formData.hits) {
      const shots = parseInt(formData.shots, 10);
      const hits = parseInt(formData.hits, 10);
      if (shots > 0) {
        return ((hits / shots) * 100).toFixed(0);
      }
    }
    return '0';
  };

  const calculateTotalCost = () => {
    if (formData.include_cost && formData.quantity && formData.price_per_unit) {
      const quantity = parseFloat(formData.quantity) || 0;
      const price = parseFloat(formData.price_per_unit.replace(',', '.').replace(' zł', '').trim()) || 0;
      return (quantity * price).toFixed(2);
    }
    return '0,00';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.weapon_id) {
      setError('Musisz wybrać broń');
      return;
    }

    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (selectedDate > today) {
      setError('Data nie może być w przyszłości');
      return;
    }

    let totalShots = null;
    if (formData.include_accuracy && formData.shots) {
      totalShots = parseInt(formData.shots, 10);
    } else if (formData.include_cost && formData.quantity) {
      totalShots = parseInt(formData.quantity, 10);
    }
    
    if (totalShots && totalShots <= 0) {
      setError('Liczba strzałów musi być większa od 0');
      return;
    }
    
    if (formData.include_accuracy) {
      const hits = parseInt(formData.hits, 10);
      if (isNaN(hits) || hits < 0 || hits > totalShots) {
        setError('Liczba trafień musi być między 0 a liczbą strzałów');
        return;
      }
      
      const distance = parseInt(formData.distance_m.replace(' m', '').trim(), 10);
      if (isNaN(distance) || distance <= 0) {
        setError('Dystans musi być większy od 0');
        return;
      }
    }
    
    try {
      const sessionData = {
        weapon_id: formData.weapon_id,
        date: formData.date,
        notes: formData.notes || null,
        total_shots: totalShots
      };
      
      await shootingSessionsAPI.create(sessionData);
      
      setFormData({
        weapon_id: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        total_shots: '',
        include_cost: true,
        ammo_id: '',
        quantity: '',
        price_per_unit: '',
        include_accuracy: false,
        distance_m: '',
        shots: '',
        hits: ''
      });
      setShowForm(false);
      setError(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Błąd podczas dodawania sesji');
      console.error(err);
    }
  };

  const getGunName = (gunId) => {
    const gun = guns.find(g => g.id === gunId);
    return gun ? gun.name : 'Nieznana broń';
  };

  if (loading) {
    return <div className="text-center">Ładowanie...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, textAlign: 'center', width: '100%' }}>Dodaj sesję strzelecką</h2>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {guns.length === 0 && (
          <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
            Najpierw dodaj broń w sekcji "Broń"
          </div>
        )}

        {ammo.length === 0 && formData.include_cost && (
          <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
            Najpierw dodaj amunicję w sekcji "Amunicja"
          </div>
        )}

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Sesja</h4>
                <div className="form-group">
                  <label className="form-label">Broń *</label>
                  <select
                    className="form-input"
                    value={formData.weapon_id}
                    onChange={(e) => setFormData({ ...formData, weapon_id: e.target.value })}
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
                  <label className="form-label">Data</label>
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
                  <label className="form-label">Notatki</label>
                  <textarea
                    className="form-input"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                  />
                </div>
                {formData.include_cost && (
                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label className="form-label">Koszty</label>
                    <input
                      type="text"
                      className="form-input"
                      value={`${calculateTotalCost()} zł`}
                      readOnly
                      style={{ backgroundColor: '#2c2c2c' }}
                    />
                  </div>
                )}
              </div>

              <div>
                <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Koszty</h4>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.include_cost}
                      onChange={(e) => setFormData({ ...formData, include_cost: e.target.checked })}
                    />
                    <span>Dodaj koszty</span>
                  </label>
                </div>
                
                {formData.include_cost && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Koszt łączny</label>
                      <input
                        type="text"
                        className="form-input"
                        value={`${calculateTotalCost()} zł`}
                        readOnly
                        style={{ backgroundColor: '#2c2c2c' }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Użyta amunicja *</label>
                      <select
                        className="form-input"
                        value={formData.ammo_id}
                        onChange={(e) => setFormData({ ...formData, ammo_id: e.target.value })}
                        required
                      >
                        <option value="">Wybierz amunicję</option>
                        {ammo.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} {item.caliber ? `(${item.caliber})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Ilość sztuk</label>
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        value={formData.quantity}
                        onChange={(e) => {
                          const qty = e.target.value;
                          setFormData({ ...formData, quantity: qty });
                          if (!formData.include_accuracy) {
                            setFormData(prev => ({ ...prev, quantity: qty, shots: qty }));
                          }
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Cena za szt.</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.price_per_unit}
                        onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Celność</h4>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.include_accuracy}
                    onChange={(e) => setFormData({ ...formData, include_accuracy: e.target.checked })}
                  />
                  <span>Dodaj dane celności</span>
                </label>
              </div>
              
              {formData.include_accuracy && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Dystans</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.distance_m}
                      onChange={(e) => setFormData({ ...formData, distance_m: e.target.value })}
                      placeholder="20 m"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Liczba strzałów</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={formData.shots}
                      onChange={(e) => {
                        const shots = e.target.value;
                        setFormData({ ...formData, shots: shots });
                        if (formData.include_cost) {
                          setFormData(prev => ({ ...prev, shots: shots, quantity: shots }));
                        }
                      }}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Liczba trafień</label>
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
                  <div className="form-group">
                    <label className="form-label">Celność %</label>
                    <input
                      type="text"
                      className="form-input"
                      value={`${calculateAccuracy()} %`}
                      readOnly
                      style={{ 
                        backgroundColor: '#2c2c2c',
                        color: parseFloat(calculateAccuracy()) >= 80 ? '#4caf50' : parseFloat(calculateAccuracy()) >= 60 ? '#ffc107' : '#dc3545',
                        fontWeight: 'bold'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>
                Zapisz
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Historia sesji strzeleckich</h3>
          {sessions.length === 0 ? (
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
                    <th>Strzały</th>
                    <th>Notatki</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id}>
                      <td>{new Date(session.date).toLocaleDateString('pl-PL')}</td>
                      <td>{getGunName(session.weapon_id)}</td>
                      <td>{session.total_shots || '-'}</td>
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

