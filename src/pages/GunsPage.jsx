import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gunsAPI, maintenanceAPI, shootingSessionsAPI } from '../services/api';

// Mapowanie rodzajów broni do kalibrów
const CALIBERS_BY_GUN_TYPE = {
  'Pistolet': [
    '9×19',
    '.45 ACP',
    '.40 S&W',
    '.380 ACP',
    '10 mm Auto',
    '.357 SIG',
    '.32 ACP',
    '.22 LR'
  ],
  'Pistolet maszynowy': [
    '9×19',
    '.40 S&W',
    '.45 ACP',
    '10 mm Auto'
  ],
  'Karabinek': [
    '5.56×45 / .223 Rem',
    '7.62×39',
    '7.62×51 / .308 Win',
    '6.5 Grendel',
    '6 mm ARC',
    '9×19 (PCC)'
  ],
  'Karabin': [
    '7.62×54R',
    '8×57 IS',
    '.30-06',
    '7.5×55 Swiss',
    '6.5 Creedmoor',
    '.300 WinMag',
    '.338 Lapua Magnum',
    '.243 Win',
    '.270 Win'
  ],
  'Strzelba': [
    '12/70',
    '12/76',
    '20/70',
    '20/76'
  ],
  'Rewolwer': [
    '.357 Magnum',
    '.38 Special',
    '.44 Magnum',
    '.22 LR'
  ]
};

// Wszystkie kalibry (dla opcji "Inna" i własny kaliber)
const ALL_CALIBERS = [
  ...new Set([
    ...CALIBERS_BY_GUN_TYPE['Pistolet'],
    ...CALIBERS_BY_GUN_TYPE['Pistolet maszynowy'],
    ...CALIBERS_BY_GUN_TYPE['Karabinek'],
    ...CALIBERS_BY_GUN_TYPE['Karabin'],
    ...CALIBERS_BY_GUN_TYPE['Strzelba'],
    ...CALIBERS_BY_GUN_TYPE['Rewolwer']
  ])
];

const GunsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [guns, setGuns] = useState([]);
  const [filteredGuns, setFilteredGuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [maintenance, setMaintenance] = useState({});
  const [sessions, setSessions] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    caliber: '',
    caliberCustom: '',
    type: '',
    notes: ''
  });
  const [useCustomCaliber, setUseCustomCaliber] = useState(false);
  
  // Filtry
  const [typeFilter, setTypeFilter] = useState('');
  const [caliberFilter, setCaliberFilter] = useState('');
  
  // Paginacja
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Sortowanie
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' lub 'desc'
  
  // Menu akcji
  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    fetchGuns();
    fetchAllMaintenance();
    fetchAllSessions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [guns, typeFilter, caliberFilter, sortColumn, sortDirection]);

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
      const response = await shootingSessionsAPI.getAll({ limit: 1000 });
      const allSessions = Array.isArray(response.data) ? response.data : [];
      
      const sessionsByGun = {};
      allSessions.forEach(session => {
        if (!sessionsByGun[session.gun_id]) {
          sessionsByGun[session.gun_id] = [];
        }
        sessionsByGun[session.gun_id].push(session);
      });
      
      setSessions(sessionsByGun);
    } catch (err) {
      console.error('Błąd pobierania sesji:', err);
    }
  };

  const applyFilters = () => {
    let filtered = [...guns];
    
    if (typeFilter) {
      filtered = filtered.filter(gun => gun.type === typeFilter);
    }
    
    if (caliberFilter) {
      filtered = filtered.filter(gun => gun.caliber === caliberFilter);
    }
    
    // Sortowanie
    if (sortColumn) {
      filtered.sort((a, b) => {
        let aValue = a[sortColumn] || '';
        let bValue = b[sortColumn] || '';
        
        // Konwersja na stringi dla porównania
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    setFilteredGuns(filtered);
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


  const getUniqueTypes = () => {
    const types = guns.map(gun => gun.type).filter(Boolean);
    return [...new Set(types)].sort();
  };

  const getUniqueCalibers = () => {
    const calibers = guns.map(gun => gun.caliber).filter(Boolean);
    return [...new Set(calibers)].sort();
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
    if (!gunSessions || !Array.isArray(gunSessions)) return 0;

    const maintenanceDate = new Date(lastMaint.date);
    
    let totalRounds = 0;
    gunSessions.forEach(session => {
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
      return { status: 'green', color: '#4caf50' };
    }

    const rounds = calculateRoundsSinceLastMaintenance(gunId);
    const days = calculateDaysSinceLastMaintenance(gunId);

    let roundsStatus = 'green';
    if (rounds >= 500) roundsStatus = 'red';
    else if (rounds >= 300) roundsStatus = 'yellow';

    let daysStatus = 'green';
    if (days >= 60) daysStatus = 'red';
    else if (days >= 30) daysStatus = 'yellow';

    let finalStatus = roundsStatus;
    if (daysStatus === 'red' || roundsStatus === 'red') {
      finalStatus = 'red';
    } else if (daysStatus === 'yellow' || roundsStatus === 'yellow') {
      finalStatus = 'yellow';
    }

    const colors = {
      green: '#4caf50',
      yellow: '#ff9800',
      red: '#f44336'
    };

    return { status: finalStatus, color: colors[finalStatus] };
  };

  const getAvailableCalibers = () => {
    if (!formData.type || formData.type === 'Inna') {
      return ALL_CALIBERS;
    }
    return CALIBERS_BY_GUN_TYPE[formData.type] || ALL_CALIBERS;
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setFormData({ 
      ...formData, 
      type: newType,
      caliber: '', 
      caliberCustom: ''
    });
    setUseCustomCaliber(false);
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
    
    try {
      const finalCaliber = useCustomCaliber ? formData.caliberCustom : formData.caliber;
      
      const gunData = {
        name: formData.name,
        caliber: finalCaliber || null,
        type: formData.type || null,
        notes: formData.notes || null
      };
      
      if (editingId) {
        await gunsAPI.update(editingId, gunData);
        setEditingId(null);
      } else {
        await gunsAPI.create(gunData);
      }
      
      setFormData({ name: '', caliber: '', caliberCustom: '', type: '', notes: '' });
      setUseCustomCaliber(false);
      setShowForm(false);
      setError(null);
      fetchGuns();
    } catch (err) {
      setError(err.response?.data?.detail || 'Błąd podczas zapisywania broni');
      console.error(err);
    }
  };

  const handleEdit = (gun) => {
    const gunCaliber = gun.caliber || '';
    const gunType = gun.type || '';
    
    // Sprawdź czy kaliber jest w dostępnych dla danego typu broni
    const availableCalibers = gunType && CALIBERS_BY_GUN_TYPE[gunType] 
      ? CALIBERS_BY_GUN_TYPE[gunType] 
      : ALL_CALIBERS;
    const isInList = availableCalibers.includes(gunCaliber) || ALL_CALIBERS.includes(gunCaliber);
    
    setFormData({
      name: gun.name,
      caliber: isInList ? gunCaliber : '',
      caliberCustom: isInList ? '' : gunCaliber,
      type: gunType,
      notes: gun.notes || ''
    });
    setUseCustomCaliber(!isInList && gunCaliber !== '');
    setEditingId(gun.id);
    setShowForm(true);
    setActiveMenuId(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', caliber: '', caliberCustom: '', type: '', notes: '' });
    setUseCustomCaliber(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Czy na pewno chcesz usunąć tę broń?')) {
      try {
        await gunsAPI.delete(id);
        fetchGuns();
        setActiveMenuId(null);
      } catch (err) {
        setError(err.response?.data?.detail || 'Błąd podczas usuwania broni');
        console.error(err);
      }
    }
  };

  const handleDetails = (gunId) => {
    navigate(`/my-weapons?gun_id=${gunId}`);
    setActiveMenuId(null);
  };

  // Paginacja
  const totalPages = Math.ceil(filteredGuns.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedGuns = filteredGuns.slice(startIndex, endIndex);

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
            + Dodaj broń
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
                <label className="form-label">Rodzaj broni</label>
                <select
                  className="form-input"
                  value={formData.type}
                  onChange={handleTypeChange}
                >
                  <option value="">Wybierz rodzaj</option>
                  <option value="Pistolet">Pistolet</option>
                  <option value="Pistolet maszynowy">Pistolet maszynowy</option>
                  <option value="Rewolwer">Rewolwer</option>
                  <option value="Karabinek">Karabinek</option>
                  <option value="Karabin">Karabin</option>
                  <option value="Strzelba">Strzelba</option>
                  <option value="Inna">Inna</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Kaliber</label>
                {!useCustomCaliber ? (
                  <select
                    className="form-input"
                    value={formData.caliber}
                    onChange={handleCaliberChange}
                    disabled={!formData.type}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: '#2c2c2c',
                      color: 'white',
                      border: '1px solid #555',
                      borderRadius: '4px',
                      fontSize: '1rem',
                      opacity: formData.type ? 1 : 0.6,
                      cursor: formData.type ? 'pointer' : 'not-allowed'
                    }}
                  >
                    <option value="">
                      {formData.type ? 'Wybierz kaliber' : 'Najpierw wybierz rodzaj broni'}
                    </option>
                    {formData.type && getAvailableCalibers().map(caliber => (
                      <option key={caliber} value={caliber}>{caliber}</option>
                    ))}
                    {formData.type && <option value="custom">Własny kaliber...</option>}
                  </select>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.caliberCustom}
                      onChange={handleCustomCaliberChange}
                      placeholder="Wpisz własny kaliber"
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
                  </div>
                )}
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
                <label style={{ marginRight: '0.5rem', color: '#aaa', fontSize: '0.9rem' }}>Rodzaj:</label>
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
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
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
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  background: 'none',
                  border: 'none',
                  color: currentPage === 1 ? '#555' : '#fff',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '1.2rem',
                  padding: '0.25rem 0.5rem'
                }}
              >
                ←
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  background: 'none',
                  border: 'none',
                  color: currentPage === totalPages ? '#555' : '#fff',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '1.2rem',
                  padding: '0.25rem 0.5rem'
                }}
              >
                →
              </button>
            </div>
          </div>

          {/* Tabela */}
          {paginatedGuns.length === 0 ? (
            <p className="text-center" style={{ color: '#888', padding: '2rem' }}>
              Brak broni spełniającej kryteria
            </p>
          ) : (
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
                      onClick={() => handleSort('type')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Rodzaj
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
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: '#aaa', fontWeight: 'normal' }}>Konserwacja</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: '#aaa', fontWeight: 'normal' }}>Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedGuns.map((gun) => {
                    const maintenanceStatus = getMaintenanceStatus(gun.id);
                    return (
                      <tr key={gun.id} style={{ borderBottom: '1px solid #333' }}>
                        <td style={{ padding: '0.75rem', fontWeight: '500' }}>{gun.name}</td>
                        <td style={{ padding: '0.75rem' }}>{gun.type || '-'}</td>
                        <td style={{ padding: '0.75rem' }}>{gun.caliber || '-'}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <div
                            style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              backgroundColor: maintenanceStatus.color,
                              display: 'inline-block'
                            }}
                          />
                        </td>
                        <td style={{ padding: '0.75rem', position: 'relative' }}>
                          <div className="action-menu-container" style={{ position: 'relative' }}>
                            <button
                              onClick={() => setActiveMenuId(activeMenuId === gun.id ? null : gun.id)}
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
                            {activeMenuId === gun.id && (
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
                                {user && (
                                  <div
                                    onClick={() => handleDetails(gun.id)}
                                    style={{
                                      padding: '0.75rem 1rem',
                                      cursor: 'pointer',
                                      color: '#fff',
                                      borderBottom: '1px solid #555'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                  >
                                    Szczegóły
                                  </div>
                                )}
                                <div
                                  onClick={() => handleEdit(gun)}
                                  style={{
                                    padding: '0.75rem 1rem',
                                    cursor: 'pointer',
                                    color: '#fff',
                                    borderBottom: user ? '1px solid #555' : 'none'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  Edytuj
                                </div>
                                <div
                                  onClick={() => handleDelete(gun.id)}
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
          )}
        </div>
      </div>
    </div>
  );
};

export default GunsPage;
