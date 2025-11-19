import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sessionsAPI, gunsAPI, ammoAPI, settingsAPI } from '../services/api';

const AddShootingSessionPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const [guns, setGuns] = useState([]);
  const [ammo, setAmmo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [distanceUnit, setDistanceUnit] = useState('m');
  const [formData, setFormData] = useState({
    gun_id: '',
    ammo_id: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    include_cost: false,
    cost: '',
    quantity: '',
    price_per_unit: '',
    include_accuracy: false,
    distance_m: '',
    shots: '',
    hits: ''
  });

  useEffect(() => {
    fetchData();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.get();
      setDistanceUnit(response.data.distance_unit || 'm');
    } catch (err) {
      console.error('Błąd pobierania ustawień:', err);
    }
  };

  useEffect(() => {
    if (isEditMode && id && distanceUnit) {
      loadSessionData();
    }
  }, [id, isEditMode, distanceUnit]);

  const loadSessionData = async () => {
    try {
      setLoading(true);
      const [sessionRes, ammoRes] = await Promise.all([
        sessionsAPI.getById(id),
        ammoAPI.getAll()
      ]);
      const session = sessionRes.data;
      const ammoData = ammoRes.data;
      const ammoItems = Array.isArray(ammoData) ? ammoData : ammoData?.items ?? [];
      
      const selectedAmmo = session.ammo_id ? ammoItems.find(a => a.id === session.ammo_id) : null;
      const pricePerUnit = selectedAmmo ? selectedAmmo.price_per_unit.toFixed(2).replace('.', ',') + ' zł' : '';
      
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
      
      // Konwersja dystansu z metrów na jednostki użytkownika
      let distanceDisplay = '';
      if (session.distance_m) {
        const distanceInMeters = session.distance_m;
        // Użyj aktualnej wartości distanceUnit (może być jeszcze 'm' jeśli ustawienia nie zostały załadowane)
        const currentUnit = distanceUnit || 'm';
        if (currentUnit === 'yd') {
          // Konwersja metrów na jardy: 1 m = 1.09361 yd
          const distanceInYards = Math.round(distanceInMeters * 1.09361);
          distanceDisplay = `${distanceInYards} yd`;
        } else {
          distanceDisplay = `${distanceInMeters} m`;
        }
      }
      
      setFormData({
        gun_id: session.gun_id || '',
        ammo_id: session.ammo_id || '',
        date: session.date || new Date().toISOString().split('T')[0],
        notes: session.notes || '',
        include_cost: !!session.cost,
        cost: fixedCost,
        quantity: session.shots ? session.shots.toString() : '',
        price_per_unit: pricePerUnit,
        include_accuracy: !!(session.distance_m || session.hits !== null),
        distance_m: distanceDisplay,
        shots: session.shots ? session.shots.toString() : '',
        hits: session.hits !== null && session.hits !== undefined ? session.hits.toString() : ''
      });
    } catch (err) {
      setError('Błąd podczas ładowania sesji');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    // Ustaw cenę amunicji tylko jeśli nie jest w trybie edycji lub jeśli price_per_unit jest puste
    if (formData.include_cost && formData.ammo_id && (!isEditMode || !formData.price_per_unit)) {
      const selectedAmmo = ammo.find(a => a.id === formData.ammo_id);
      if (selectedAmmo) {
        setFormData(prev => ({ 
          ...prev, 
          price_per_unit: selectedAmmo.price_per_unit.toFixed(2).replace('.', ',') + ' zł' 
        }));
      }
    }
  }, [formData.ammo_id, formData.include_cost, ammo, isEditMode]);

  useEffect(() => {
    if (formData.include_cost && formData.price_per_unit) {
      let shotsValue = 0;
      if (formData.shots) {
        shotsValue = parseFloat(formData.shots);
      } else if (formData.quantity) {
        shotsValue = parseFloat(formData.quantity);
      }
      
      const price = parseFloat(formData.price_per_unit.replace(',', '.').replace(' zł', '').trim()) || 0;
      const costValue = parseFloat(formData.cost.replace(',', '.').replace(' zł', '').trim()) || 0;
      const totalCost = (costValue + (shotsValue * price)).toFixed(2).replace('.', ',');
      setFormData(prev => ({ ...prev, totalCost: totalCost }));
    } else if (!formData.include_cost) {
      setFormData(prev => ({ ...prev, totalCost: '0,00' }));
    }
  }, [formData.quantity, formData.shots, formData.price_per_unit, formData.cost, formData.include_cost]);

  useEffect(() => {
    if (formData.include_accuracy && formData.shots && formData.include_cost) {
      if (!formData.quantity || formData.quantity === '') {
        setFormData(prev => ({ ...prev, quantity: prev.shots }));
      }
    }
  }, [formData.include_cost, formData.shots, formData.include_accuracy]);

  useEffect(() => {
    // Jeśli zaznaczono koszty i wpisano ilość, a potem zaznaczono celność, ustaw liczbę strzałów
    if (formData.include_cost && formData.quantity && formData.include_accuracy) {
      if (!formData.shots || formData.shots === '') {
        setFormData(prev => ({ ...prev, shots: prev.quantity }));
      }
    }
  }, [formData.include_accuracy, formData.quantity, formData.include_cost]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [gunsRes, ammoRes] = await Promise.all([
        gunsAPI.getAll(),
        ammoAPI.getAll()
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
    if (formData.include_cost && formData.price_per_unit) {
      const costValue = parseFloat(formData.cost.replace(',', '.').replace(' zł', '').trim()) || 0;
      // Zawsze używaj shots (wartość z pola "Liczba strzałów") × cena za sztukę
      // shots ma priorytet, quantity tylko jako fallback gdy shots nie jest wypełnione
      let shotsValue = 0;
      if (formData.shots) {
        shotsValue = parseFloat(formData.shots);
      } else if (formData.quantity) {
        shotsValue = parseFloat(formData.quantity);
      }
      const price = parseFloat(formData.price_per_unit.replace(',', '.').replace(' zł', '').trim()) || 0;
      return (costValue + (shotsValue * price)).toFixed(2).replace('.', ',');
    }
    return '0,00';
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

    let shots = 0;

    // Najważniejsze: zawsze używaj formData.shots, jeśli istnieje
    if (formData.shots) {
      shots = parseInt(formData.shots, 10);
    } 
    // fallback – tylko jeśli ktoś nie wpisał shots a używa costs
    else if (formData.quantity) {
      shots = parseInt(formData.quantity, 10);
    }
    
    if (!shots || shots <= 0) {
      setError("Liczba strzałów musi być większa od 0");
      return;
    }

    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (selectedDate > today) {
      setError('Data nie może być w przyszłości');
      return;
    }

    if (formData.include_accuracy) {
      const hits = parseInt(formData.hits, 10);
      if (isNaN(hits) || hits < 0 || hits > shots) {
        setError('Liczba trafień musi być między 0 a liczbą strzałów');
        return;
      }
      
      // Parsowanie dystansu z jednostkami użytkownika i konwersja na metry
      let distanceInMeters = 0;
      const distanceStr = formData.distance_m.trim();
      if (distanceUnit === 'yd') {
        const distanceInYards = parseFloat(distanceStr.replace(' yd', '').trim());
        if (isNaN(distanceInYards) || distanceInYards <= 0) {
          setError('Dystans musi być większy od 0');
          return;
        }
        // Konwersja jardów na metry: 1 yd = 0.9144 m
        distanceInMeters = Math.round(distanceInYards * 0.9144);
      } else {
        distanceInMeters = parseInt(distanceStr.replace(' m', '').trim(), 10);
        if (isNaN(distanceInMeters) || distanceInMeters <= 0) {
        setError('Dystans musi być większy od 0');
        return;
        }
      }
    }
    
    try {
      const sessionData = {
        gun_id: formData.gun_id,
        ammo_id: formData.ammo_id,
        date: formData.date,
        shots: shots,
        notes: formData.notes || null
      };

      // Koszt jest liczony tylko raz:
      // 1. Jeśli zaznaczono "Dodaj koszty" - użyj pól kosztowych (ale zawsze używaj shots, nie quantity)
      // 2. Jeśli NIE zaznaczono "Dodaj koszty" - nie wysyłaj cost (backend obliczy automatycznie na podstawie shots i price_per_unit)
      if (formData.include_cost) {
        // baseCost to koszt stały (np. opłata za tor) - tylko wartość z pola cost
        const baseCost = parseFloat(formData.cost.replace(',', '.').replace(' zł', '').trim()) || 0;
        // price to cena za sztukę amunicji
        const price = parseFloat(formData.price_per_unit.replace(',', '.').replace(' zł', '').trim()) || 0;
        
        // sessionData.cost = baseCost (koszt stały) + (shots * price) (koszt amunicji)
        if (baseCost > 0 || price > 0) {
          sessionData.cost = baseCost + (shots * price);
        }
      }

      if (formData.include_accuracy) {
        // Parsowanie dystansu z jednostkami użytkownika i konwersja na metry
        const distanceStr = formData.distance_m.trim();
        let distanceInMeters = 0;
        if (distanceUnit === 'yd') {
          const distanceInYards = parseFloat(distanceStr.replace(' yd', '').trim());
          // Konwersja jardów na metry: 1 yd = 0.9144 m
          distanceInMeters = Math.round(distanceInYards * 0.9144);
        } else {
          distanceInMeters = parseInt(distanceStr.replace(' m', '').trim(), 10);
        }
        sessionData.distance_m = distanceInMeters;
        sessionData.hits = parseInt(formData.hits, 10);
      }
      
      if (isEditMode) {
        await sessionsAPI.update(id, sessionData);
        navigate('/shooting-sessions');
      } else {
        const response = await sessionsAPI.createSession(sessionData);
        
        if (response.data.remaining_ammo !== undefined) {
          alert(`Pozostało ${response.data.remaining_ammo} sztuk amunicji`);
        }
        
        navigate('/shooting-sessions');
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
                {/* Sekcja Sesja */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>Sesja</h4>
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.include_accuracy}
                        onChange={(e) => setFormData({ ...formData, include_accuracy: e.target.checked })}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span>Dodaj dane celności</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.include_cost}
                        onChange={(e) => setFormData({ ...formData, include_cost: e.target.checked })}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span>Dodaj koszty</span>
                    </label>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Broń *</label>
                  <select
                    className="form-input"
                    value={formData.gun_id}
                    onChange={(e) => setFormData({ ...formData, gun_id: e.target.value })}
                    required
                    style={{ appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23fff\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', paddingRight: '2.5rem' }}
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
                    style={{ appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23fff\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', paddingRight: '2.5rem' }}
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
                    style={{ 
                      position: 'relative'
                    }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Notatki</label>
                  <textarea
                    className="form-input"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {/* Sekcja Koszty - na dole lewej kolumny - pojawia się gdy checkbox w prawej kolumnie jest zaznaczony */}
                {formData.include_cost && (
                  <>
                    <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Koszty</h4>
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
                    <div className="form-group">
                      <label className="form-label">Użyta amunicja *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.ammo_id ? (() => {
                          const selectedAmmo = ammo.find(a => a.id === formData.ammo_id);
                          return selectedAmmo ? `${selectedAmmo.name} ${selectedAmmo.caliber ? `(${selectedAmmo.caliber})` : ''}` : '';
                        })() : ''}
                        readOnly
                        style={{ backgroundColor: '#2c2c2c', cursor: 'not-allowed' }}
                        placeholder={formData.ammo_id ? '' : 'Wybierz amunicję w sekcji Sesja'}
                      />
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
                          setFormData(prev => {
                            const updated = { ...prev, quantity: qty };
                            // Synchronizuj z sekcją celności, jeśli jest aktywna
                            if (prev.include_accuracy) {
                              updated.shots = qty;
                            }
                            return updated;
                          });
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
                  </>
                )}
              </div>

              {/* Prawa kolumna */}
              <div>
                {/* Sekcja Celność - na górze prawej kolumny */}
                {formData.include_accuracy && (
                  <>
                    <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Celność</h4>
                    <div className="form-group">
                      <label className="form-label">Dystans</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.distance_m}
                        onChange={(e) => setFormData({ ...formData, distance_m: e.target.value })}
                        placeholder={distanceUnit === 'yd' ? '20 yd' : '20 m'}
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
                          setFormData(prev => {
                            const updated = { ...prev, shots: shots };
                            // Synchronizuj z sekcją kosztów, jeśli jest aktywna
                            if (prev.include_cost) {
                              updated.quantity = shots;
                            }
                            return updated;
                          });
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
                        value={`${calculateAccuracy()}%`}
                        readOnly
                        style={{ 
                          backgroundColor: '#2c2c2c',
                          color: parseFloat(calculateAccuracy()) >= 80 ? '#4caf50' : parseFloat(calculateAccuracy()) >= 60 ? '#ffc107' : parseFloat(calculateAccuracy()) > 0 ? '#dc3545' : '#4caf50',
                          fontWeight: 'bold'
                        }}
                      />
                    </div>
                  </>
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
                  color: 'white',
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
                  color: 'white',
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
