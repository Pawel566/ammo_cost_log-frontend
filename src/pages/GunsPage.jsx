import React, { useState, useEffect } from 'react';
import { gunsAPI } from '../services/api';

const GunsPage = () => {
  const [guns, setGuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    caliber: '',
    type: '',
    notes: ''
  });

  useEffect(() => {
    fetchGuns();
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
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Zarządzanie bronią</h2>
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
            {showForm ? 'Anuluj' : 'Dodaj broń'}
          </button>
        </div>

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        {showForm && (
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
        )}
      </div>

      <div className="card">
        <h3 className="card-title">Lista broni</h3>
        {guns.length === 0 ? (
          <p className="text-center">Brak dodanej broni</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Nazwa</th>
                <th>Rodzaj</th>
                <th>Kaliber</th>
                <th>Notatki</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {guns.map((gun) => (
                <tr key={gun.id}>
                  <td>{gun.name}</td>
                  <td>{gun.type || '-'}</td>
                  <td>{gun.caliber || '-'}</td>
                  <td>{gun.notes || '-'}</td>
                  <td>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleEdit(gun)}
                      style={{ marginRight: '10px' }}
                    >
                      Edytuj
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(gun.id)}
                    >
                      Usuń
                    </button>
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

export default GunsPage;
