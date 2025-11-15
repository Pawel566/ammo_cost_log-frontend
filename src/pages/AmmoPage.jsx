import React, { useState, useEffect } from 'react';
import { ammoAPI } from '../services/api';

const AmmoPage = () => {
  const [ammo, setAmmo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    caliber: '',
    price_per_unit: '',
    units_in_package: ''
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const price = parseFloat(formData.price_per_unit);
    if (price < 0) {
      setError('Cena za sztukę nie może być ujemna');
      return;
    }
    
    try {
      const ammoData = {
        name: formData.name,
        caliber: formData.caliber || null,
        price_per_unit: price,
        units_in_package: formData.units_in_package ? parseInt(formData.units_in_package) : null
      };
      
      await ammoAPI.create(ammoData);
      setFormData({ name: '', caliber: '', price_per_unit: '', units_in_package: '' });
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
            onClick={() => setShowForm(!showForm)}
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
            <h3 style={{ marginBottom: '1rem' }}>Dodaj nową amunicję</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nazwa amunicji *</label>
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
                <label className="form-label">Cena za sztukę (zł) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  value={formData.price_per_unit}
                  onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Ilość w opakowaniu</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={formData.units_in_package}
                  onChange={(e) => setFormData({ ...formData, units_in_package: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-success">
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
