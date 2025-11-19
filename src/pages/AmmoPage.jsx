import React, { useState, useEffect } from 'react';
import { ammoAPI } from '../services/api';

const COMMON_CALIBERS = [
  '9×19',
  '.45 ACP',
  '.40 S&W',
  '.380 ACP',
  '.22 LR',
  '10 mm Auto',
  '.357 SIG',
  '5.56×45 / .223 Rem',
  '7.62×39',
  '7.62×51 / .308 Win',
  '7.62×54R (Mosin Nagant)',
  '.30-06 Springfield',
  '6.5 Creedmoor',
  '.300 WinMag',
  '.338 Lapua Magnum',
  '12/70',
  '12/76',
  '.243 Win',
  '.270 Win',
  '20/70'
];

const AMMO_TYPES = [
  { value: 'FMJ', label: 'FMJ' },
  { value: 'HP', label: 'HP' },
  { value: 'SP', label: 'SP' },
  { value: 'Match', label: 'Match' },
  { value: 'Training', label: 'Training' },
  { value: 'Subsonic', label: 'Subsonic' },
  { value: 'Magnum', label: 'Magnum' },
  { value: 'Birdshot', label: 'Birdshot' },
  { value: 'Buckshot', label: 'Buckshot' },
  { value: 'Slug', label: 'Slug' }
];

const AmmoPage = () => {
  const [ammo, setAmmo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    caliber: '',
    caliberCustom: '',
    type: '',
    price_per_unit: '',
    units_in_package: ''
  });
  const [useCustomCaliber, setUseCustomCaliber] = useState(false);

  useEffect(() => {
    fetchAmmo();
  }, []);

  const fetchAmmo = async () => {
    try {
      setLoading(true);
      const response = await ammoAPI.getAll();
      const data = response.data;
      const items = Array.isArray(data) ? data : data?.items ?? [];
      setAmmo(items);
      setError(null);
    } catch (err) {
      setError('Błąd podczas pobierania listy amunicji');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCaliberChange = (e) => {
    const value = e.target.value;
    if (value === 'custom') {
      setUseCustomCaliber(true);
      setFormData({ ...formData, caliber: '', caliberCustom: '' });
    } else {
      setUseCustomCaliber(false);
      setFormData({ ...formData, caliber: value, caliberCustom: '' });
    }
  };

  const handleCustomCaliberChange = (e) => {
    setFormData({ ...formData, caliberCustom: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const price = parseFloat(formData.price_per_unit.replace(',', '.'));
    if (isNaN(price) || price <= 0) {
      setError('Cena za sztukę musi być dodatnią liczbą');
      return;
    }
    
    try {
      const finalCaliber = useCustomCaliber ? formData.caliberCustom : formData.caliber;
      
      const ammoData = {
        name: formData.name,
        caliber: finalCaliber || null,
        type: formData.type || null,
        price_per_unit: price,
        units_in_package: formData.units_in_package ? parseInt(formData.units_in_package) : null
      };
      
      await ammoAPI.create(ammoData);
      setFormData({ 
        name: '', 
        caliber: '', 
        caliberCustom: '',
        type: '',
        price_per_unit: '', 
        units_in_package: '' 
      });
      setUseCustomCaliber(false);
      setShowForm(false);
      setError(null);
      fetchAmmo();
    } catch (err) {
      setError(err.response?.data?.detail || 'Błąd podczas dodawania amunicji');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Czy na pewno chcesz usunąć tę amunicję?')) {
      try {
        await ammoAPI.delete(id);
        fetchAmmo();
      } catch (err) {
        setError(err.response?.data?.detail || 'Błąd podczas usuwania amunicji');
        console.error(err);
      }
    }
  };

  const handleAddQuantity = async (id) => {
    const amountStr = window.prompt('Ile sztuk dodać?');
    if (amountStr === null) return;
    const amount = parseInt(amountStr, 10);
    if (Number.isNaN(amount) || amount <= 0) {
      setError('Wprowadź poprawną dodatnią liczbę');
      return;
    }
    try {
      await ammoAPI.addQuantity(id, amount);
      setError(null);
      fetchAmmo();
    } catch (err) {
      setError(err.response?.data?.detail || 'Błąd podczas dodawania ilości amunicji');
      console.error(err);
    }
  };

  const getAmmoTypeLabel = (type) => {
    const ammoType = AMMO_TYPES.find(t => t.value === type);
    return ammoType ? ammoType.label : type || '-';
  };

  if (loading) {
    return <div className="text-center">Ładowanie...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>Amunicja</h2>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setShowForm(!showForm);
              if (showForm) {
                setFormData({ 
                  name: '', 
                  caliber: '', 
                  caliberCustom: '',
                  type: '',
                  price_per_unit: '', 
                  units_in_package: '' 
                });
                setUseCustomCaliber(false);
              }
            }}
            style={{ 
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            {showForm ? 'Anuluj' : '+ Dodaj amunicję'}
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {showForm && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>Dodaj nową amunicję</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Nazwa amunicji *
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="np. Fiocchi 124gr FMJ"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#2c2c2c',
                    color: 'white',
                    border: '1px solid #555',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Kaliber *
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {!useCustomCaliber ? (
                    <>
                      <select
                        className="form-input"
                        value={formData.caliber}
                        onChange={handleCaliberChange}
                        required
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          backgroundColor: '#2c2c2c',
                          color: 'white',
                          border: '1px solid #555',
                          borderRadius: '4px',
                          fontSize: '1rem'
                        }}
                      >
                        <option value="">Wybierz kaliber</option>
                        {COMMON_CALIBERS.map(caliber => (
                          <option key={caliber} value={caliber}>{caliber}</option>
                        ))}
                        <option value="custom">Własny kaliber...</option>
                      </select>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.caliberCustom}
                        onChange={handleCustomCaliberChange}
                        placeholder="Wpisz własny kaliber"
                        required
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          backgroundColor: '#2c2c2c',
                          color: 'white',
                          border: '1px solid #555',
                          borderRadius: '4px',
                          fontSize: '1rem'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setUseCustomCaliber(false);
                          setFormData({ ...formData, caliberCustom: '' });
                        }}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#555',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        Anuluj
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Typ amunicji
                </label>
                <select
                  className="form-input"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#2c2c2c',
                    color: 'white',
                    border: '1px solid #555',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Wybierz typ (opcjonalnie)</option>
                  {AMMO_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Cena za sztukę (zł) *
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.price_per_unit}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9,.]/g, '');
                    setFormData({ ...formData, price_per_unit: value });
                  }}
                  placeholder="1,50"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#2c2c2c',
                    color: 'white',
                    border: '1px solid #555',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Ilość w opakowaniu (opcjonalnie)
                </label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={formData.units_in_package}
                  onChange={(e) => setFormData({ ...formData, units_in_package: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#2c2c2c',
                    color: 'white',
                    border: '1px solid #555',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-success"
                style={{
                  backgroundColor: '#4caf50',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 2rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
              >
                Dodaj amunicję
              </button>
            </form>
          </div>
        )}

        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Lista amunicji</h3>
          {ammo.length === 0 ? (
            <p className="text-center" style={{ color: '#888', padding: '2rem' }}>
              Brak dodanej amunicji
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Nazwa</th>
                    <th>Kaliber</th>
                    <th>Typ</th>
                    <th>Cena za sztukę</th>
                    <th>Pozostało</th>
                    <th>Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {ammo.map((item) => {
                    const price = Number(item.price_per_unit || 0);
                    return (
                      <tr key={item.id}>
                        <td style={{ fontWeight: '500' }}>{item.name}</td>
                        <td>{item.caliber || '-'}</td>
                        <td>{getAmmoTypeLabel(item.type)}</td>
                        <td>{price.toFixed(2)} zł</td>
                        <td>{item.units_in_package || 0} szt.</td>
                        <td>
                          <button
                            className="btn btn-primary"
                            onClick={() => handleAddQuantity(item.id)}
                            style={{ marginRight: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                          >
                            Dodaj ilość
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDelete(item.id)}
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

export default AmmoPage;
