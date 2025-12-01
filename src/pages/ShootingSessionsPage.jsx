import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { shootingSessionsAPI, gunsAPI, ammoAPI, accountAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ShootingSessionsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [guns, setGuns] = useState([]);
  const [ammo, setAmmo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [userSkillLevel, setUserSkillLevel] = useState(null);
  const [targetImageUrls, setTargetImageUrls] = useState({});

 
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Paginacja
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1); 

  useEffect(() => {
    fetchData();
    fetchSkillLevel();
  }, []);

  const fetchSkillLevel = async () => {
    try {
      const response = await accountAPI.getSkillLevel();
      setUserSkillLevel(response.data.skill_level || 'beginner');
    } catch (err) {
      console.error('Błąd pobierania poziomu zaawansowania:', err);
      setUserSkillLevel('beginner');
    }
  };

  const getSkillLevelLabel = (level) => {
    if (!level) return '-';
    const levelLower = level.toLowerCase();
    if (levelLower === 'beginner' || levelLower === 'początkujący') return t('account.beginner');
    if (levelLower === 'intermediate' || levelLower === 'średniozaawansowany') return t('account.intermediate');
    if (levelLower === 'advanced' || levelLower === 'zaawansowany') return t('account.advanced');
    if (levelLower === 'expert' || levelLower === 'ekspert') return t('account.expert');
    return level;
  };

  useEffect(() => {
    applyFilters();
    setCurrentPage(1); // Resetuj do pierwszej strony przy zmianie filtrów
  }, [filterType, filterValue, sessions, sortColumn, sortDirection]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, gunsRes, ammoRes] = await Promise.all([
        shootingSessionsAPI.getAll(),
        gunsAPI.getAll(),
        ammoAPI.getAll()
      ]);
      const allSessions = Array.isArray(sessionsRes.data) ? sessionsRes.data : [];
      const gunsData = gunsRes.data;
      const ammoData = ammoRes.data;
      const gunItems = Array.isArray(gunsData) ? gunsData : gunsData?.items ?? [];
      const ammoItems = Array.isArray(ammoData) ? ammoData : ammoData?.items ?? [];
      setSessions(allSessions);
      setFilteredSessions(allSessions);
      setGuns(gunItems);
      setAmmo(ammoItems);
      setError(null);
    } catch (err) {
      setError(t('sessions.errorLoading'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...sessions];

    
    if (filterType && filterValue) {
      filtered = filtered.filter(session => {
      const value = filterValue.toLowerCase();
      switch (filterType) {
        case 'gun':
          const gun = guns.find(g => g.id === session.gun_id);
          return gun && gun.name.toLowerCase().includes(value);
        case 'ammo':
          const ammoItem = ammo.find(a => a.id === session.ammo_id);
          return ammoItem && ammoItem.name.toLowerCase().includes(value);
        case 'date':
          return new Date(session.date).toLocaleDateString('pl-PL').includes(value);
        case 'cost':
          return session.cost && session.cost.toString().includes(value);
        case 'distance':
          return session.distance_m && session.distance_m.toString().includes(value);
        case 'accuracy':
          return session.accuracy_percent && session.accuracy_percent.toString().includes(value);
        default:
          return true;
      }
    });
    }

    
    if (sortColumn) {
      filtered.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortColumn) {
          case 'date':
            aValue = new Date(a.date);
            bValue = new Date(b.date);
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
          case 'gun':
            const gunA = guns.find(g => g.id === a.gun_id);
            const gunB = guns.find(g => g.id === b.gun_id);
            aValue = gunA ? gunA.name.toLowerCase() : '';
            bValue = gunB ? gunB.name.toLowerCase() : '';
            break;
          case 'ammo':
            const ammoA = ammo.find(am => am.id === a.ammo_id);
            const ammoB = ammo.find(am => am.id === b.ammo_id);
            aValue = ammoA ? ammoA.name.toLowerCase() : '';
            bValue = ammoB ? ammoB.name.toLowerCase() : '';
            break;
          case 'shots':
            aValue = a.shots || 0;
            bValue = b.shots || 0;
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
          case 'cost':
            aValue = a.cost || 0;
            bValue = b.cost || 0;
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
          case 'distance':
            aValue = a.distance_m || 0;
            bValue = b.distance_m || 0;
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
          case 'hits':
            aValue = a.hits !== null && a.hits !== undefined ? a.hits : 0;
            bValue = b.hits !== null && b.hits !== undefined ? b.hits : 0;
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
          case 'accuracy':
            aValue = a.accuracy_percent !== null && a.accuracy_percent !== undefined ? a.accuracy_percent : 0;
            bValue = b.accuracy_percent !== null && b.accuracy_percent !== undefined ? b.accuracy_percent : 0;
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
          case 'type':
            
            aValue = (a.session_type === 'advanced') ? 1 : 0;
            bValue = (b.session_type === 'advanced') ? 1 : 0;
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
          default:
            aValue = String(a[sortColumn] || '').toLowerCase();
            bValue = String(b[sortColumn] || '').toLowerCase();
        }
        
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        }
        
        return 0;
      });
    }

    setFilteredSessions(filtered);
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

  const getGunName = (gunId) => {
    const gun = guns.find(g => g.id === gunId);
    return gun ? gun.name : t('sessions.unknownWeapon');
  };

  const getAmmoName = (ammoId) => {
    const ammoItem = ammo.find(a => a.id === ammoId);
    return ammoItem ? ammoItem.name : t('sessions.unknownAmmo');
  };

  const handleDeleteClick = (sessionId) => {
    setSessionToDelete(sessionId);
    setOpenMenuId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) return;

    const session = sessions.find(s => s.id === sessionToDelete);
    const gun = guns.find(g => g.id === session?.gun_id);
    const gunName = gun ? gun.name : '';
    const gunType = gun ? (gun.type || '') : '';

    try {
      await shootingSessionsAPI.delete(sessionToDelete);
      setSessions(sessions.filter(s => s.id !== sessionToDelete));
      setSessionToDelete(null);
      setSuccess(`${t('sessions.sessionDeleted')}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || t('sessions.errorDeleting'));
      console.error(err);
      setSessionToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setSessionToDelete(null);
  };

  const handleEdit = (sessionId) => {
    navigate(`/shooting-sessions/edit/${sessionId}`);
    setOpenMenuId(null);
  };

  const handleMenuToggle = (sessionId, e) => {
    if (e) {
      e.stopPropagation();
    }
    setOpenMenuId(openMenuId === sessionId ? null : sessionId);
  };

  const handleRowClick = async (session) => {
    setSelectedSession(session);
    setOpenMenuId(null);
    
    // Załaduj zdjęcie tarczy jeśli istnieje i użytkownik jest właścicielem
    if (session.target_image_path && user && !user.is_guest && session.user_id === user.user_id) {
      try {
        const response = await shootingSessionsAPI.getTargetImage(session.id);
        if (response.data && response.data.url) {
          setTargetImageUrls(prev => ({
            ...prev,
            [session.id]: response.data.url
          }));
        } else {
          // Jeśli nie ma URL, usuń z cache
          setTargetImageUrls(prev => {
            const newUrls = { ...prev };
            delete newUrls[session.id];
            return newUrls;
          });
        }
      } catch (err) {
        console.error('Błąd podczas pobierania zdjęcia tarczy:', err);
        // W przypadku błędu, usuń z cache
        setTargetImageUrls(prev => {
          const newUrls = { ...prev };
          delete newUrls[session.id];
          return newUrls;
        });
      }
    } else {
      // Jeśli nie ma target_image_path, usuń z cache
      setTargetImageUrls(prev => {
        const newUrls = { ...prev };
        delete newUrls[session.id];
        return newUrls;
      });
    }
  };

  const handleCloseModal = () => {
    setSelectedSession(null);
  };


  // Zamknij menu po kliknięciu poza nim
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.session-menu-container')) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  if (loading) {
    return <div className="text-center">{t('common.loading')}</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>{t('sessions.title')}</h2>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/shooting-sessions/add')}
            style={{ padding: '0.75rem 1.5rem' }}
          >
            {t('sessions.addSession')}
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

        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>{t('sessions.history')}</h3>
          
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <select
              className="form-input"
              style={{ width: 'auto', minWidth: '150px' }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">{t('sessions.filterBy')}</option>
              <option value="gun">{t('sessions.weapon')}</option>
              <option value="ammo">{t('sessions.ammunition')}</option>
              <option value="date">{t('sessions.date')}</option>
              <option value="cost">{t('sessions.cost')}</option>
              <option value="distance">{t('sessions.distance')}</option>
              <option value="accuracy">{t('sessions.accuracy')}</option>
            </select>
            {filterType && (
              <input
                type="text"
                className="form-input"
                style={{ flex: 1, minWidth: '200px' }}
                placeholder={t('sessions.enterValue')}
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
              />
            )}
          </div>

          {/* Paginacja - wybór liczby elementów */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>{t('sessions.show')}</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: '0.5rem',
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  border: `1px solid var(--border-color)`,
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
            {filteredSessions.length > 0 && (
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                {t('common.page')} {currentPage} {t('common.of')} {Math.ceil(filteredSessions.length / itemsPerPage)} ({filteredSessions.length} {t('common.sessions')})
              </div>
            )}
          </div>

          {filteredSessions.length === 0 ? (
            <p className="text-center" style={{ color: 'var(--text-tertiary)', padding: '2rem' }}>
              {t('sessions.noSessions')}
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th 
                      style={{ 
                        cursor: 'pointer',
                        userSelect: 'none',
                        padding: '0.75rem',
                        textAlign: 'center'
                      }}
                      onClick={() => handleSort('type')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-hover-bg)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {t('sessions.sessionType')}
                    </th>
                    <th 
                      style={{ 
                        cursor: 'pointer',
                        userSelect: 'none',
                        padding: '0.75rem'
                      }}
                      onClick={() => handleSort('date')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-hover-bg)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {t('sessions.date')}
                    </th>
                    <th 
                      style={{ 
                        cursor: 'pointer',
                        userSelect: 'none',
                        padding: '0.75rem'
                      }}
                      onClick={() => handleSort('gun')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-hover-bg)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {t('sessions.weapon')}
                    </th>
                    <th 
                      style={{ 
                        cursor: 'pointer',
                        userSelect: 'none',
                        padding: '0.75rem'
                      }}
                      onClick={() => handleSort('ammo')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-hover-bg)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {t('sessions.ammunition')}
                    </th>
                    <th 
                      style={{ 
                        cursor: 'pointer',
                        userSelect: 'none',
                        padding: '0.75rem'
                      }}
                      onClick={() => handleSort('shots')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-hover-bg)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {t('sessions.shots')}
                    </th>
                    <th 
                      style={{ 
                        cursor: 'pointer',
                        userSelect: 'none',
                        padding: '0.75rem'
                      }}
                      onClick={() => handleSort('cost')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-hover-bg)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {t('sessions.cost')}
                    </th>
                    <th 
                      style={{ 
                        cursor: 'pointer',
                        userSelect: 'none',
                        padding: '0.75rem'
                      }}
                      onClick={() => handleSort('distance')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-hover-bg)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {t('sessions.distance')}
                    </th>
                    <th 
                      style={{ 
                        cursor: 'pointer',
                        userSelect: 'none',
                        padding: '0.75rem'
                      }}
                      onClick={() => handleSort('hits')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-hover-bg)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {t('sessions.hits')}
                    </th>
                    <th 
                      style={{ 
                        cursor: 'pointer',
                        userSelect: 'none',
                        padding: '0.75rem'
                      }}
                      onClick={() => handleSort('accuracy')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-hover-bg)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {t('sessions.accuracyPercent')}
                    </th>
                    <th style={{ padding: '0.75rem' }}>{t('sessions.comment')}</th>
                    <th style={{ width: '50px', padding: '0.75rem' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((session) => (
                    <tr 
                      key={session.id}
                      onClick={() => handleRowClick(session)}
                      style={{
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        if (!e.target.closest('.session-menu-container')) {
                          e.currentTarget.style.backgroundColor = 'var(--table-hover-bg)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                        <img 
                          src={session.session_type === 'advanced' ? "/assets/session_icon_AI_dark.png" : "/assets/session_icon_dark.png"}
                          alt={session.session_type === 'advanced' ? t('sessions.advanced') : t('sessions.standard')}
                          style={{ 
                            width: '24px', 
                            height: '24px',
                            objectFit: 'contain'
                          }}
                        />
                      </td>
                      <td>{new Date(session.date).toLocaleDateString('pl-PL')}</td>
                      <td>{getGunName(session.gun_id)}</td>
                      <td>{getAmmoName(session.ammo_id)}</td>
                      <td>{session.shots || '-'}</td>
                      <td>{session.cost ? `${parseFloat(session.cost).toFixed(2).replace('.', ',')} zł` : '-'}</td>
                      <td>{session.distance_m ? `${session.distance_m} m` : '-'}</td>
                      <td>{session.hits !== null && session.hits !== undefined ? session.hits : '-'}</td>
                      <td>
                        {session.accuracy_percent !== null && session.accuracy_percent !== undefined ? (
                          <span style={{ 
                            color: parseFloat(session.accuracy_percent) >= 80 ? '#4caf50' : parseFloat(session.accuracy_percent) >= 60 ? '#ffc107' : '#dc3545',
                            fontWeight: 'bold'
                          }}>
                            {parseFloat(session.accuracy_percent).toFixed(0)}%
                          </span>
                        ) : '-'}
                      </td>
                      <td 
                        style={{ 
                          maxWidth: '300px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {session.ai_comment || '-'}
                      </td>
                      <td>
                        <div className="session-menu-container" style={{ position: 'relative' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMenuToggle(session.id, e);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '1.2rem',
                              color: 'var(--text-primary)',
                              padding: '0.25rem 0.5rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title={t('common.actions')}
                          >
                            ⋮
                          </button>
                          {openMenuId === session.id && (
                            <div
                              style={{
                                position: 'absolute',
                                right: 0,
                                top: '100%',
                                backgroundColor: 'var(--bg-secondary)',
                                border: `1px solid var(--border-color)`,
                                borderRadius: '4px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                zIndex: 1000,
                                minWidth: '120px',
                                marginTop: '4px'
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => handleEdit(session.id)}
                                style={{
                                  width: '100%',
                                  padding: '0.75rem 1rem',
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--text-primary)',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  fontSize: '0.9rem'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--table-hover-bg)'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                              >
                                {t('common.edit')}
                              </button>
                              <button
                                onClick={() => handleDeleteClick(session.id)}
                                style={{
                                  width: '100%',
                                  padding: '0.75rem 1rem',
                                  background: 'none',
                                  border: 'none',
                                  color: '#dc3545',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  fontSize: '0.9rem',
                                  borderTop: `1px solid var(--border-color)`
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--table-hover-bg)'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                              >
                                {t('common.delete')}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Nawigacja paginacji */}
          {filteredSessions.length > itemsPerPage && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '0.5rem',
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: `1px solid var(--border-color)`
            }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{
                  background: 'none',
                  border: 'none',
                  color: currentPage === 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '1.2rem',
                  padding: '0.25rem 0.5rem'
                }}
              >
                ←
              </button>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '0 1rem' }}>
                {t('common.page')} {currentPage} {t('common.of')} {Math.ceil(filteredSessions.length / itemsPerPage)}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredSessions.length / itemsPerPage), prev + 1))}
                disabled={currentPage === Math.ceil(filteredSessions.length / itemsPerPage)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: currentPage === Math.ceil(filteredSessions.length / itemsPerPage) ? 'var(--text-tertiary)' : 'var(--text-primary)',
                  cursor: currentPage === Math.ceil(filteredSessions.length / itemsPerPage) ? 'not-allowed' : 'pointer',
                  fontSize: '1.2rem',
                  padding: '0.25rem 0.5rem'
                }}
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal ze szczegółami sesji */}
      {selectedSession && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '1rem'
          }}
          onClick={handleCloseModal}
        >
          <div
            className="card"
            style={{
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCloseModal}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
                lineHeight: 1
              }}
              onMouseEnter={(e) => e.target.style.color = '#dc3545'}
              onMouseLeave={(e) => e.target.style.color = '#fff'}
            >
              ×
            </button>

            <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>
              {t('sessions.sessionDetails')}
            </h2>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <strong>{t('sessions.sessionType')}</strong>{' '}
                <img 
                  src={selectedSession.session_type === 'advanced' ? "/assets/session_icon_AI_dark.png" : "/assets/session_icon_dark.png"}
                  alt={selectedSession.session_type === 'advanced' ? t('sessions.advanced') : t('sessions.standard')}
                  style={{ 
                    width: '20px', 
                    height: '20px',
                    objectFit: 'contain',
                    verticalAlign: 'middle',
                    marginLeft: '0.5rem'
                  }}
                />
                <span style={{ marginLeft: '0.5rem' }}>
                  {selectedSession.session_type === 'advanced' ? t('sessions.advanced') : t('sessions.standard')}
                </span>
              </div>

              <div>
                <strong>{t('sessions.date')}</strong> {new Date(selectedSession.date).toLocaleDateString('pl-PL')}
              </div>

              <div>
                <strong>{t('sessions.weapon')}</strong> {getGunName(selectedSession.gun_id)}
              </div>

              <div>
                <strong>{t('sessions.ammunition')}</strong> {getAmmoName(selectedSession.ammo_id)}
              </div>

              <div>
                <strong>{t('sessions.shotsCount')}</strong> {selectedSession.shots || '-'}
              </div>

              <div>
                <strong>{t('sessions.cost')}</strong> {selectedSession.cost ? `${parseFloat(selectedSession.cost).toFixed(2).replace('.', ',')} zł` : '-'}
              </div>

              {selectedSession.distance_m && (
                <div>
                  <strong>{t('sessions.distance')}</strong> {selectedSession.distance_m} m
                </div>
              )}

              {selectedSession.hits !== null && selectedSession.hits !== undefined && (
                <div>
                  <strong>{t('sessions.hitsCount')}</strong> {selectedSession.hits}
                </div>
              )}

              {selectedSession.accuracy_percent !== null && selectedSession.accuracy_percent !== undefined && (
                <div>
                  <strong>{t('sessions.accuracy')}</strong>{' '}
                  <span style={{ 
                    color: parseFloat(selectedSession.accuracy_percent) >= 80 ? '#4caf50' : parseFloat(selectedSession.accuracy_percent) >= 60 ? '#ffc107' : '#dc3545',
                    fontWeight: 'bold'
                  }}>
                    {parseFloat(selectedSession.accuracy_percent).toFixed(1)}%
                  </span>
                </div>
              )}

              {userSkillLevel && (
                <div>
                  <strong>{t('sessions.experienceLevel')}</strong> {getSkillLevelLabel(userSkillLevel)}
                </div>
              )}

              {selectedSession.notes && (
                <div>
                  <strong>{t('sessions.notes')}</strong>
                  <div style={{ 
                    marginTop: '0.5rem', 
                    padding: '0.75rem', 
                    backgroundColor: '#2c2c2c', 
                    borderRadius: '4px',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word'
                  }}>
                    {selectedSession.notes}
                  </div>
                </div>
              )}

              <div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>{t('sessions.aiComment')}</strong>
                </div>
                <div style={{ 
                  marginTop: '0.5rem', 
                  padding: '0.75rem', 
                  backgroundColor: 'var(--bg-secondary)', 
                  borderRadius: '4px',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  minHeight: '100px',
                  color: 'var(--text-primary)'
                }}>
                  {selectedSession.ai_comment || '-'}
                </div>
              </div>

              {/* Zdjęcie tarczy - tylko dla właściciela sesji */}
              {selectedSession.target_image_path && user && !user.is_guest && selectedSession.user_id === user.user_id && (
                <div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>{t('sessions.targetImage')}</strong>
                  </div>
                  {targetImageUrls[selectedSession.id] ? (
                    <img 
                      src={targetImageUrls[selectedSession.id]} 
                      alt={t('sessions.targetImage')} 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '400px', 
                        borderRadius: '4px',
                        border: '1px solid #444',
                        display: 'block'
                      }} 
                    />
                  ) : (
                    <div style={{ 
                      padding: '1rem', 
                      backgroundColor: '#2c2c2c', 
                      borderRadius: '4px',
                      color: '#888',
                      textAlign: 'center'
                    }}>
                      {t('sessions.loadingImage')}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-primary"
                onClick={handleCloseModal}
              >
                {t('sessions.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal potwierdzenia usunięcia sesji */}
      {sessionToDelete && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '1rem'
          }}
          onClick={handleDeleteCancel}
        >
          <div
            className="card"
            style={{
              maxWidth: '400px',
              width: '100%',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>
              {t('sessions.confirmDelete')}
            </h2>
            
            <p style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>
              {(() => {
                const session = sessions.find(s => s.id === sessionToDelete);
                const gun = guns.find(g => g.id === session?.gun_id);
                const gunName = gun ? gun.name : '';
                const gunType = gun ? (gun.type || '') : '';
                const gunDisplayName = `${gunType ? gunType + ' ' : ''}${gunName}`;
                return `${t('sessions.confirmDeleteText')} ${gunDisplayName}? ${t('sessions.irreversible')}`;
              })()}
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={handleDeleteCancel}
              >
                {t('sessions.cancel')}
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteConfirm}
                style={{
                  backgroundColor: '#dc3545',
                  borderColor: '#dc3545'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#c82333';
                  e.target.style.borderColor = '#c82333';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#dc3545';
                  e.target.style.borderColor = '#dc3545';
                }}
              >
                {t('sessions.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShootingSessionsPage;
