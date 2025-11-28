import React, { useState, useEffect } from 'react';
import { ammoAPI, settingsAPI } from '../services/api';

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
  const [filteredAmmo, setFilteredAmmo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
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
  
  // Filtry
  const [caliberFilter, setCaliberFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Paginacja
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Sortowanie
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' lub 'desc'
  
  // Menu akcji
  const [activeMenuId, setActiveMenuId] = useState(null);
  
  // Ustawienia użytkownika
  const [userSettings, setUserSettings] = useState({
    low_ammo_notifications_enabled: true
  });

  useEffect(() => {
    fetchAmmo();
    fetchSettings();
  }, []);

  // Odśwież dane amunicji gdy strona staje się aktywna (np. po powrocie z innej strony)
  useEffect(() => {
    const handleFocus = () => {
      fetchAmmo();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.get();
      setUserSettings({
        low_ammo_notifications_enabled: response.data.low_ammo_notifications_enabled !== undefined 
          ? response.data.low_ammo_notifications_enabled : true
      });
    } catch (err) {
      console.error('Błąd podczas pobierania ustawień:', err);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [ammo, caliberFilter, typeFilter, sortColumn, sortDirection]);

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

  const applyFilters = () => {
    let filtered = [...ammo];
    
    if (caliberFilter) {
      filtered = filtered.filter(item => item.caliber === caliberFilter);
    }
    
    if (typeFilter) {
      filtered = filtered.filter(item => item.type === typeFilter);
    }
    
    // Sortowanie
    if (sortColumn) {
      filtered.sort((a, b) => {
        let aValue = a[sortColumn];
        let bValue = b[sortColumn];
        
        // Specjalna obsługa dla units_in_package (liczba)
        if (sortColumn === 'units_in_package') {
          aValue = aValue || 0;
          bValue = bValue || 0;
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        // Specjalna obsługa dla price_per_unit (liczba)
        if (sortColumn === 'price_per_unit') {
          aValue = aValue || 0;
          bValue = bValue || 0;
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        // Dla pozostałych kolumn - sortowanie tekstowe
        aValue = String(aValue || '').toLowerCase();
        bValue = String(bValue || '').toLowerCase();
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    setFilteredAmmo(filtered);
    setCurrentPage(1);
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      // Zmień kierunek sortowania
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Ustaw nową kolumnę i domyślny kierunek
      setSortColumn(column);
      setSortDirection('asc');
    }
  };


  const getUniqueCalibers = () => {
    const calibers = ammo.map(item => item.caliber).filter(Boolean);
    return [...new Set(calibers)].sort();
  };

  const getUniqueTypes = () => {
    const types = ammo.map(item => item.type).filter(Boolean);
    return [...new Set(types)].sort();
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
      setSuccess(`Amunicja ${formData.name} dodana!`);
      fetchAmmo();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Błąd podczas dodawania amunicji');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    const ammoToDelete = ammo.find(a => a.id === id);
    const ammoName = ammoToDelete ? ammoToDelete.name : '';
    
    if (window.confirm(`Czy na pewno chcesz usunąć amunicję ${ammoName}?`)) {
      try {
        await ammoAPI.delete(id);
        setSuccess(`Amunicja ${ammoName} usunięta!`);
        fetchAmmo();
        setActiveMenuId(null);
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError(err.response?.data?.detail || 'Błąd podczas usuwania amunicji');
        console.error(err);
      }
    }
  };

  const handleAddQuantity = async (id) => {
    const amountStr = window.prompt('Ile sztuk dodać?');
    if (amountStr === null) {
      setActiveMenuId(null);
      return;
    }
    const amount = parseInt(amountStr, 10);
    if (Number.isNaN(amount) || amount <= 0) {
      setError('Wprowadź poprawną dodatnią liczbę');
      setActiveMenuId(null);
      return;
    }
    try {
      await ammoAPI.addQuantity(id, amount);
      setError(null);
      setActiveMenuId(null);
      fetchAmmo();
    } catch (err) {
      setError(err.response?.data?.detail || 'Błąd podczas dodawania ilości amunicji');
      console.error(err);
      setActiveMenuId(null);
    }
  };

  const getAmmoTypeLabel = (type) => {
    const ammoType = AMMO_TYPES.find(t => t.value === type);
    return ammoType ? ammoType.label : type || '-';
  };

  const isLowStock = (units) => {
    // Sprawdź czy units jest liczbą i czy jest mniejsza niż 20
    if (units === null || units === undefined || units === '') {
      return false; // Jeśli nie ma danych o ilości, nie pokazuj ostrzeżenia
    }
    const unitsNum = typeof units === 'number' ? units : parseInt(units, 10);
    return !isNaN(unitsNum) && unitsNum > 0 && unitsNum < 20;
  };

  // Paginacja
  const totalPages = Math.ceil(filteredAmmo.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAmmo = filteredAmmo.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Zamknij menu przy kliknięciu poza nim
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeMenuId && !event.target.closest('.action-menu-container')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuId]);

  if (loading) {
    return <div className="text-center">Ładowanie...</div>;
  }

  const lowStockItems = ammo.filter(item => isLowStock(item.units_in_package));

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

        {success && (
          <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
            {success}
          </div>
        )}

        {lowStockItems.length > 0 && userSettings.low_ammo_notifications_enabled && (
          <div 
            style={{ 
              marginBottom: '1rem',
              padding: '1rem',
              backgroundColor: '#ff9800',
              color: 'white',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Ostrzeżenie: Niska ilość amunicji
              </div>
              <div style={{ fontSize: '0.9rem' }}>
                {lowStockItems.map((item, index) => (
                  <span key={item.id}>
                    {item.name} ({item.units_in_package || 0} szt.)
                    {index < lowStockItems.length - 1 && ', '}
                  </span>
                ))}
              </div>
            </div>
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
                  Cena za sztukę *
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
          {/* Filtry i paginacja */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <label style={{ marginRight: '0.5rem', color: '#aaa', fontSize: '0.9rem' }}>Kaliber:</label>
                <select
                  value={caliberFilter}
                  onChange={(e) => setCaliberFilter(e.target.value)}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: '#2c2c2c',
                    color: 'white',
                    border: '1px solid #555',
                    borderRadius: '4px',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="">Wszystkie</option>
                  {getUniqueCalibers().map(caliber => (
                    <option key={caliber} value={caliber}>{caliber}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ marginRight: '0.5rem', color: '#aaa', fontSize: '0.9rem' }}>Typ:</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: '#2c2c2c',
                    color: 'white',
                    border: '1px solid #555',
                    borderRadius: '4px',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="">Wszystkie</option>
                  {getUniqueTypes().map(type => (
                    <option key={type} value={type}>{getAmmoTypeLabel(type)}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#aaa', fontSize: '0.9rem' }}>Pokaż:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: '0.5rem',
                  backgroundColor: '#2c2c2c',
                  color: 'white',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Tabela */}
          {paginatedAmmo.length === 0 ? (
            <p className="text-center" style={{ color: '#888', padding: '2rem' }}>
              Brak amunicji spełniającej kryteria
            </p>
          ) : (
            <>
            <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #555' }}>
                      <th 
                        style={{ 
                          padding: '0.75rem', 
                          textAlign: 'left', 
                          color: '#aaa', 
                          fontWeight: 'normal',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                        onClick={() => handleSort('name')}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        Nazwa
                      </th>
                      <th 
                        style={{ 
                          padding: '0.75rem', 
                          textAlign: 'left', 
                          color: '#aaa', 
                          fontWeight: 'normal',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                        onClick={() => handleSort('caliber')}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        Kaliber
                      </th>
                      <th 
                        style={{ 
                          padding: '0.75rem', 
                          textAlign: 'left', 
                          color: '#aaa', 
                          fontWeight: 'normal',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                        onClick={() => handleSort('price_per_unit')}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        Cena / szt.
                      </th>
                      <th 
                        style={{ 
                          padding: '0.75rem', 
                          textAlign: 'left', 
                          color: '#aaa', 
                          fontWeight: 'normal',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                        onClick={() => handleSort('type')}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        Typ
                      </th>
                      <th 
                        style={{ 
                          padding: '0.75rem', 
                          textAlign: 'left', 
                          color: '#aaa', 
                          fontWeight: 'normal',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                        onClick={() => handleSort('units_in_package')}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        Dostępna ilość
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', color: '#aaa', fontWeight: 'normal' }}></th>
                  </tr>
                </thead>
                <tbody>
                    {paginatedAmmo.map((item) => {
                    const price = Number(item.price_per_unit || 0);
                      const units = item.units_in_package || 0;
                      const lowStock = isLowStock(units) && userSettings.low_ammo_notifications_enabled;
                    return (
                        <tr 
                          key={item.id} 
                          style={{ 
                            borderBottom: '1px solid #333',
                            backgroundColor: lowStock ? 'rgba(255, 152, 0, 0.1)' : 'transparent'
                          }}
                        >
                          <td style={{ padding: '0.75rem', fontWeight: '500' }}>{item.name}</td>
                          <td style={{ padding: '0.75rem' }}>{item.caliber || '-'}</td>
                          <td style={{ padding: '0.75rem' }}>{price.toFixed(2).replace('.', ',')} zł</td>
                          <td style={{ padding: '0.75rem' }}>{getAmmoTypeLabel(item.type)}</td>
                          <td style={{ 
                            padding: '0.75rem',
                            color: lowStock ? '#ff9800' : 'inherit',
                            fontWeight: lowStock ? 'bold' : 'normal'
                          }}>
                            {units} szt.
                          </td>
                          <td style={{ padding: '0.75rem', position: 'relative' }}>
                            <div className="action-menu-container" style={{ position: 'relative' }}>
                          <button
                                onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#aaa',
                                  cursor: 'pointer',
                                  fontSize: '1.2rem',
                                  padding: '0.25rem 0.5rem'
                                }}
                              >
                                ⋯
                              </button>
                              {activeMenuId === item.id && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: '100%',
                                    backgroundColor: '#2c2c2c',
                                    border: '1px solid #555',
                                    borderRadius: '4px',
                                    minWidth: '150px',
                                    zIndex: 1000,
                                    marginTop: '0.25rem',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                                  }}
                                >
                                  <div
                            onClick={() => handleAddQuantity(item.id)}
                                    style={{
                                      padding: '0.75rem 1rem',
                                      cursor: 'pointer',
                                      color: '#fff',
                                      borderBottom: '1px solid #555'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            Dodaj ilość
                                  </div>
                                  <div
                            onClick={() => handleDelete(item.id)}
                                    style={{
                                      padding: '0.75rem 1rem',
                                      cursor: 'pointer',
                                      color: '#f44336'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            Usuń
                                  </div>
                                </div>
                              )}
                            </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
              
              {/* Paginacja */}
              {totalPages > 1 && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #555'
                }}>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: currentPage === 1 ? '#555' : '#fff',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '1rem',
                      padding: '0.5rem 1rem'
                    }}
                  >
                    &lt;
                  </button>
                  <span style={{ color: '#aaa', padding: '0.5rem 1rem' }}>
                    {currentPage}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: currentPage === totalPages ? '#555' : '#fff',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      fontSize: '1rem',
                      padding: '0.5rem 1rem'
                    }}
                  >
                    &gt;
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AmmoPage;
