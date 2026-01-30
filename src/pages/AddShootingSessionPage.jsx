import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { shootingSessionsAPI, gunsAPI, ammoAPI } from '../services/api';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';

const AddShootingSessionPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { formatCurrency } = useCurrencyConverter();
  const isEditMode = !!id;
  const [guns, setGuns] = useState([]);
  const [ammo, setAmmo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    gun_id: '',
    ammo_id: '',
    date: new Date().toISOString().split('T')[0],
    shots: '',
    distance_m: '',
    hits: '',
    group_cm: '',
    cost: '',
    posture: false,
    optic: false,
    support: false,
    wind: false
  });

  const DISTANCE_PRESETS = [
    { value: '', label: 'Wybierz dystans' },
    { value: '5', label: '5 m' },
    { value: '10', label: '10 m' },
    { value: '15', label: '15 m' },
    { value: '25', label: '25 m' },
    { value: '50', label: '50 m' },
    { value: '100', label: '100 m' },
    { value: '300', label: '300 m' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (isEditMode && id) {
      loadSessionData();
    }
  }, [id, isEditMode]);

  const loadSessionData = async () => {
    try {
      setLoading(true);
      const [sessionRes, ammoRes] = await Promise.all([
        shootingSessionsAPI.getById(id),
        ammoAPI.getAll()
      ]);
      const session = sessionRes.data;
      const ammoData = ammoRes.data;
      const ammoItems = Array.isArray(ammoData) ? ammoData : ammoData?.items ?? [];
      
      const selectedAmmo = session.ammo_id ? ammoItems.find(a => a.id === session.ammo_id) : null;
      
      // Oblicz koszt stały: session.cost to suma kosztu stałego + (shots * price_per_unit)
      // Musimy odjąć koszt amunicji od całkowitego kosztu, aby uzyskać tylko koszt stały
      let fixedCost = '';
      if (session.cost && selectedAmmo && session.shots) {
        const totalCost = parseFloat(session.cost);
        const ammoCost = session.shots * selectedAmmo.price_per_unit;
        const fixedCostValue = totalCost - ammoCost;
        // Jeśli koszt stały jest <= 0, ustawiamy na pusty string (będzie wyświetlane jako 0)
        if (fixedCostValue > 0) {
          fixedCost = fixedCostValue.toFixed(2).replace('.', ',');
        }
      } else if (session.cost) {
        // Jeśli nie ma amunicji lub shots, ale jest koszt, może to być tylko koszt stały
        const totalCost = parseFloat(session.cost);
        if (totalCost > 0) {
          fixedCost = totalCost.toFixed(2).replace('.', ',');
        }
      }
      
      setFormData({
        gun_id: session.gun_id || '',
        ammo_id: session.ammo_id || '',
        date: session.date || new Date().toISOString().split('T')[0],
        shots: session.shots ? session.shots.toString() : '',
        distance_m: session.distance_m ? session.distance_m.toString() : '',
        hits: session.hits !== null && session.hits !== undefined ? session.hits.toString() : '',
        group_cm: session.group_cm !== null && session.group_cm !== undefined ? session.group_cm.toString() : '',
        cost: fixedCost,
        posture: session.posture || false,
        optic: session.optic || false,
        support: session.support || false,
        wind: session.wind || false
      });
    } catch (err) {
      setError('Błąd podczas ładowania sesji');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };



  const fetchData = async () => {
    try {
      setLoading(true);
      const [gunsRes, ammoRes] = await Promise.all([
        gunsAPI.getAll().catch((err) => {
          console.error('Błąd pobierania broni:', err);
          setError(err.response?.data?.message || t('common.error'));
          return { data: { items: [], total: 0 } };
        }),
        ammoAPI.getAll().catch((err) => {
          console.error('Błąd pobierania amunicji:', err);
          return { data: { items: [], total: 0 } };
        })
      ]);
      const gunsData = gunsRes.data;
      const ammoData = ammoRes.data;
      const gunItems = Array.isArray(gunsData) ? gunsData : gunsData?.items ?? [];
      const ammoItems = Array.isArray(ammoData) ? ammoData : ammoData?.items ?? [];
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
    if (formData.shots && formData.hits) {
      const shots = parseInt(formData.shots, 10);
      const hits = parseInt(formData.hits, 10);
      if (shots > 0 && !isNaN(hits)) {
        return ((hits / shots) * 100).toFixed(0);
      }
    }
    return '0';
  };

  const calculateFinalScore = () => {
    if (!formData.shots || !formData.hits) {
      return null;
    }
    
    const shots = parseInt(formData.shots, 10);
    const hits = parseInt(formData.hits, 10);
    
    if (shots <= 0 || isNaN(hits)) {
      return null;
    }
    
    const accuracy = hits / shots;
    
    if (formData.group_cm && formData.distance_m) {
      const groupCm = parseFloat(formData.group_cm);
      const distanceInMeters = parseFloat(formData.distance_m);
      
      if (!isNaN(groupCm) && groupCm > 0 && !isNaN(distanceInMeters) && distanceInMeters > 0) {
        const moa = (groupCm / distanceInMeters) * 34.38;
        const effective_moa = moa * distanceInMeters / 100;
        const precision = Math.max(0, 1 - (effective_moa / 10));
        const final = (accuracy * 0.4) + (precision * 0.6);
        return Math.round(final * 100);
      }
    }
    
    return Math.round(accuracy * 100);
  };

  const calculateTotalCost = () => {
    let total = 0;
    
    // Koszt stały
    if (formData.cost && formData.cost.trim()) {
      const fixedCost = parseFloat(formData.cost.replace(',', '.').trim()) || 0;
      total += fixedCost;
    }
    
    // Koszt amunicji: liczba strzałów × cena za sztukę
    if (formData.ammo_id && formData.shots) {
      const selectedAmmo = ammo.find(a => a.id === formData.ammo_id);
      if (selectedAmmo && selectedAmmo.price_per_unit) {
        const shots = parseInt(formData.shots, 10);
        if (!isNaN(shots) && shots > 0) {
          total += shots * selectedAmmo.price_per_unit;
        }
      }
    }
    
    return total.toFixed(2).replace('.', ',');
  };

  const normalize = (v) => {
    if (v === "" || v === null || v === undefined) return null;
    return v;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.gun_id) {
      setError('Musisz wybrać broń');
      return;
    }

    if (!formData.ammo_id) {
      setError('Musisz wybrać amunicję');
      return;
    }

    if (!formData.shots || parseInt(formData.shots, 10) <= 0) {
      setError("Liczba strzałów musi być większa od 0");
      return;
    }

    const shots = parseInt(formData.shots, 10);

    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (selectedDate > today) {
      setError('Data nie może być w przyszłości');
      return;
    }

    // Walidacja danych celności (w obu trybach)
    if (formData.hits) {
      const hits = parseInt(formData.hits, 10);
      if (isNaN(hits) || hits < 0 || hits > shots) {
        setError('Liczba trafień musi być między 0 a liczbą strzałów');
        return;
      }
    }
    
    try {
      const sessionData = {
        gun_id: formData.gun_id,
        ammo_id: formData.ammo_id,
        date: formData.date,
        shots: Number(shots),
        posture: formData.posture,
        optic: formData.optic,
        support: formData.support,
        wind: formData.wind,
      };

      // Dystans (teraz z dropdown, wartość już w metrach)
      if (formData.distance_m) {
        const distanceValue = parseFloat(formData.distance_m);
        if (!isNaN(distanceValue) && distanceValue > 0) {
          sessionData.distance_m = distanceValue;
        }
      }
      
      if (formData.hits) {
        const hitsValue = parseInt(formData.hits, 10);
        if (!isNaN(hitsValue)) {
          sessionData.hits = Number(hitsValue);
        }
      }
      
      if (formData.group_cm) {
        const groupCmValue = parseFloat(formData.group_cm);
        if (!isNaN(groupCmValue) && groupCmValue > 0) {
          sessionData.group_cm = Number(groupCmValue);
        }
      }

      // Koszt stały + koszt amunicji
      const selectedAmmo = ammo.find(a => a.id === formData.ammo_id);
      if (selectedAmmo) {
        const baseCost = formData.cost ? parseFloat(formData.cost.replace(',', '.').replace(' zł', '').trim()) || 0 : 0;
        const ammoPrice = selectedAmmo.price_per_unit || 0;
        const totalCost = baseCost + (shots * ammoPrice);
        if (totalCost > 0) {
          sessionData.cost = Number(totalCost.toFixed(2));
        }
      } else if (formData.cost && formData.cost.trim()) {
        const baseCost = parseFloat(formData.cost.replace(',', '.').replace(' zł', '').trim()) || 0;
        if (baseCost > 0) {
          sessionData.cost = Number(baseCost.toFixed(2));
        }
      }
      
      const selectedGun = guns.find(g => g.id === formData.gun_id);
      const gunName = selectedGun ? selectedGun.name : '';
      const gunType = selectedGun ? (selectedGun.type || '') : '';
      
      if (isEditMode) {
        // W trybie edycji zawsze wysyłaj pola, które mogą być wyczyszczone
        const normalizedData = {
          date: sessionData.date,
          shots: sessionData.shots,
          distance_m: normalize(sessionData.distance_m),
          hits: normalize(sessionData.hits),
          group_cm: normalize(sessionData.group_cm),
          cost: normalize(sessionData.cost),
          posture: formData.posture,
          optic: formData.optic,
          support: formData.support,
          wind: formData.wind,
        };
        // Tylko dodaj gun_id i ammo_id jeśli zostały zmienione
        if (sessionData.gun_id) {
          normalizedData.gun_id = sessionData.gun_id;
        }
        if (sessionData.ammo_id) {
          normalizedData.ammo_id = sessionData.ammo_id;
        }
        await shootingSessionsAPI.update(id, normalizedData);
        
        setSuccess(`Sesja dla ${gunType ? gunType + ' ' : ''}${gunName} zaktualizowana!`);
        setTimeout(() => {
          navigate('/shooting-sessions');
        }, 1500);
      } else {
        const response = await shootingSessionsAPI.create(sessionData);
        
        let successMessage = `Sesja dla ${gunType ? gunType + ' ' : ''}${gunName} dodana!`;
        if (response.data && response.data.remaining_ammo !== undefined) {
          successMessage += ` Pozostało ${response.data.remaining_ammo} sztuk amunicji.`;
        }
        setSuccess(successMessage);
        
        setTimeout(() => {
          navigate('/shooting-sessions');
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Błąd podczas dodawania sesji');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-center">Ładowanie...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, textAlign: 'center', width: '100%' }}>
            {isEditMode ? 'Edytuj sesję strzelecką' : 'Dodaj sesję strzelecką'}
          </h2>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
            {success}
          </div>
        )}

        {guns.length === 0 && (
          <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
            Najpierw dodaj broń w sekcji "Broń"
          </div>
        )}

        {ammo.length === 0 && (
          <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
            Najpierw dodaj amunicję w sekcji "Amunicja"
          </div>
        )}

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Lewa kolumna */}
              <div>
                <h4 style={{ margin: 0, marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Sesja</h4>
                <div className="form-group">
                  <label className="form-label">Broń *</label>
                  <select
                    className="form-input"
                    value={formData.gun_id}
                    onChange={(e) => setFormData({ ...formData, gun_id: e.target.value })}
                    required
                    style={{ appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23aaa\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', paddingRight: '2.5rem' }}
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
                    style={{ appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23aaa\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', paddingRight: '2.5rem' }}
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
                  <label className="form-label">Koszt stały (np. opłata za tor)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="0,00"
                    value={formData.cost}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9,]/g, '');
                      setFormData({ ...formData, cost: value });
                    }}
                  />
                </div>
              </div>

              {/* Prawa kolumna */}
              <div>
                <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Celność</h4>
                <div className="form-group">
                  <label className="form-label">Dystans</label>
                  <select
                    className="form-input"
                    value={formData.distance_m}
                    onChange={(e) => setFormData({ ...formData, distance_m: e.target.value })}
                    style={{ appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23aaa\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', paddingRight: '2.5rem' }}
                  >
                    {DISTANCE_PRESETS.map((preset) => (
                      <option key={preset.value} value={preset.value}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
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
                <div className="form-group">
                  <label className="form-label">Liczba trafień</label>
                  <input
                    type="number"
                    min="0"
                    max={formData.shots || 0}
                    className="form-input"
                    value={formData.hits}
                    onChange={(e) => setFormData({ ...formData, hits: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Grupa strzałów (cm)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    className="form-input"
                    value={formData.group_cm}
                    onChange={(e) => setFormData({ ...formData, group_cm: e.target.value })}
                    placeholder="np. 5.5"
                  />
                </div>
                {formData.shots && formData.hits && (() => {
                  const finalScore = calculateFinalScore();
                  if (finalScore !== null) {
                    return (
                      <div className="form-group">
                        <label className="form-label">Wynik końcowy</label>
                        <input
                          type="text"
                          className="form-input"
                          value={`${finalScore}/100`}
                          readOnly
                          style={{ 
                            backgroundColor: 'var(--bg-secondary)',
                            color: finalScore >= 80 ? '#4caf50' : finalScore >= 60 ? '#ffc107' : finalScore > 0 ? '#dc3545' : '#4caf50',
                            fontWeight: 'bold'
                          }}
                        />
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Opcjonalne warunki strzelania */}
                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                    Opcjonalne (warunki)
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      cursor: 'pointer',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      backgroundColor: formData.posture ? 'rgba(0, 123, 255, 0.1)' : 'transparent',
                      border: formData.posture ? '1px solid #007bff' : '1px solid var(--border-color)',
                      transition: 'all 0.2s'
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.posture}
                        onChange={(e) => setFormData({ ...formData, posture: e.target.checked })}
                        style={{ width: '18px', height: '18px', accentColor: '#007bff' }}
                      />
                      <span style={{ fontSize: '0.9rem' }}>Postawa</span>
                    </label>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      cursor: 'pointer',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      backgroundColor: formData.optic ? 'rgba(0, 123, 255, 0.1)' : 'transparent',
                      border: formData.optic ? '1px solid #007bff' : '1px solid var(--border-color)',
                      transition: 'all 0.2s'
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.optic}
                        onChange={(e) => setFormData({ ...formData, optic: e.target.checked })}
                        style={{ width: '18px', height: '18px', accentColor: '#007bff' }}
                      />
                      <span style={{ fontSize: '0.9rem' }}>Optyka</span>
                    </label>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      cursor: 'pointer',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      backgroundColor: formData.support ? 'rgba(0, 123, 255, 0.1)' : 'transparent',
                      border: formData.support ? '1px solid #007bff' : '1px solid var(--border-color)',
                      transition: 'all 0.2s'
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.support}
                        onChange={(e) => setFormData({ ...formData, support: e.target.checked })}
                        style={{ width: '18px', height: '18px', accentColor: '#007bff' }}
                      />
                      <span style={{ fontSize: '0.9rem' }}>Podpora</span>
                    </label>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      cursor: 'pointer',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      backgroundColor: formData.wind ? 'rgba(0, 123, 255, 0.1)' : 'transparent',
                      border: formData.wind ? '1px solid #007bff' : '1px solid var(--border-color)',
                      transition: 'all 0.2s'
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.wind}
                        onChange={(e) => setFormData({ ...formData, wind: e.target.checked })}
                        style={{ width: '18px', height: '18px', accentColor: '#007bff' }}
                      />
                      <span style={{ fontSize: '0.9rem' }}>Wiatr</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Koszt całkowity */}
            <div style={{ 
              marginTop: '2rem', 
              padding: '1rem', 
              backgroundColor: 'var(--bg-primary)', 
              borderRadius: '8px',
              border: `1px solid var(--border-color)`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Koszt całkowity:</label>
                <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#4caf50' }}>
                  {formatCurrency(calculateTotalCost())}
                </div>
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>
                {formData.cost && formData.cost.trim() ? (
                  <>
                    Koszt stały: {formatCurrency(parseFloat(formData.cost.replace(',', '.').trim()) || 0)}
                    {formData.ammo_id && formData.shots && (() => {
                      const selectedAmmo = ammo.find(a => a.id === formData.ammo_id);
                      if (selectedAmmo && selectedAmmo.price_per_unit) {
                        const shots = parseInt(formData.shots, 10);
                        if (!isNaN(shots) && shots > 0) {
                          return ` + (${shots} × ${formatCurrency(selectedAmmo.price_per_unit)})`;
                        }
                      }
                      return null;
                    })()}
                  </>
                ) : formData.ammo_id && formData.shots ? (
                  (() => {
                    const selectedAmmo = ammo.find(a => a.id === formData.ammo_id);
                    if (selectedAmmo && selectedAmmo.price_per_unit) {
                      const shots = parseInt(formData.shots, 10);
                      if (!isNaN(shots) && shots > 0) {
                        return `${shots} × ${formatCurrency(selectedAmmo.price_per_unit)}`;
                      }
                    }
                    return formatCurrency(0);
                  })()
                ) : (
                  formatCurrency(0)
                )}
              </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button 
                type="button" 
                className="btn" 
                style={{ 
                  padding: '0.75rem 2rem', 
                  fontSize: '1.1rem', 
                  backgroundColor: '#6c757d', 
                  color: 'var(--text-primary)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => navigate('/shooting-sessions')}
              >
                Anuluj
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ 
                  padding: '0.75rem 2rem', 
                  fontSize: '1.1rem',
                  backgroundColor: '#007bff',
                  color: 'var(--text-primary)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Zapisz
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddShootingSessionPage;
