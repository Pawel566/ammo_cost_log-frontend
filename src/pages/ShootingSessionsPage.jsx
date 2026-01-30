import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { shootingSessionsAPI, gunsAPI, ammoAPI, accountAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';

// Parsuje ai_comment JSON i zwraca obiekt analizy
const parseAIAnalysis = (aiComment) => {
  if (!aiComment) return null;
  try {
    const parsed = JSON.parse(aiComment);
    return parsed;
  } catch {
    // Stary format - zwykły tekst
    return { summary: aiComment };
  }
};

const ShootingSessionsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { formatCurrency } = useCurrencyConverter();
  const [sessions, setSessions] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit] = useState(25);
  const [offset, setOffset] = useState(0);
  const [guns, setGuns] = useState([]);
  const [ammo, setAmmo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [filterGunId, setFilterGunId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [userSkillLevel, setUserSkillLevel] = useState(null);
  const [targetImageUrls, setTargetImageUrls] = useState({});

 
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); 

  useEffect(() => {
    fetchSkillLevel();
  }, []);

  useEffect(() => {
    fetchData();
  }, [offset, filterType, filterValue, filterGunId]);

  // Obsługa parametru gun_id z URL
  useEffect(() => {
    const gunId = searchParams.get('gun_id');
    if (gunId && guns.length > 0) {
      const gunIdNum = parseInt(gunId);
      const gun = guns.find(g => {
        const gId = typeof g.id === 'string' ? parseInt(g.id) : g.id;
        return gId === gunIdNum || g.id === gunId;
      });
      if (gun) {
        setFilterType('gun');
        setFilterValue(gun.name);
        setFilterGunId(gunIdNum);
      }
    } else if (!gunId) {
      setFilterGunId(null);
    }
  }, [searchParams, guns]);

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
    if (levelLower === 'beginner' || levelLower === 'początkujący') return 'Początkujący';
    if (levelLower === 'intermediate' || levelLower === 'średniozaawansowany') return 'Średniozaawansowany';
    if (levelLower === 'advanced' || levelLower === 'zaawansowany') return 'Zaawansowany';
    if (levelLower === 'expert' || levelLower === 'ekspert') return 'Ekspert';
    return level;
  };

  const getQualityMessage = (score, skillLevel) => {
    if (score === null || score === undefined) return null;
    
    const roundedScore = Math.round(score);
    const levelLower = (skillLevel || 'beginner').toLowerCase();
    
    // Określ poziom użytkownika
    let level;
    if (levelLower === 'beginner' || levelLower === 'początkujący') {
      level = 'beginner';
    } else if (levelLower === 'intermediate' || levelLower === 'średniozaawansowany') {
      level = 'intermediate';
    } else if (levelLower === 'advanced' || levelLower === 'zaawansowany' || levelLower === 'expert' || levelLower === 'ekspert') {
      level = 'advanced';
    } else {
      level = 'beginner'; // domyślnie
    }
    
    // Komunikaty dla początkujących
    if (level === 'beginner') {
      if (roundedScore >= 90) return 'Świetny wynik! Jak na poziom początkujący — naprawdę imponujące.';
      if (roundedScore >= 80) return 'Bardzo dobra sesja! Zaczynasz łapać powtarzalność.';
      if (roundedScore >= 60) return 'Dobre strzelanie. Widać szybki progres.';
      if (roundedScore >= 40) return 'Stabilnie. Widać podstawy i kontrolę nad bronią.';
      return 'Początek drogi — takie wyniki są normalne na starcie.';
    }
    
    // Komunikaty dla średniozaawansowanych
    if (level === 'intermediate') {
      if (roundedScore >= 90) return 'Świetny poziom — równa, kontrolowana praca.';
      if (roundedScore >= 80) return 'Bardzo dobra sesja. Widać powtarzalność.';
      if (roundedScore >= 60) return 'Dobre, solidne strzelanie.';
      if (roundedScore >= 40) return 'Przeciętnie. Warto wrócić do spokojnych serii.';
      return 'Słaba sesja — coś poszło nie tak. Przeanalizuj chwyt i tempo.';
    }
    
    // Komunikaty dla zaawansowanych
    if (level === 'advanced') {
      if (roundedScore >= 90) return 'Top forma. Precyzyjna, kontrolowana robota.';
      if (roundedScore >= 80) return 'Bardzo dobra sesja — technika trzymana.';
      if (roundedScore >= 60) return 'OK, ale stać Cię na więcej.';
      if (roundedScore >= 40) return 'Słabo jak na Twój poziom — spróbuj spokojnych serii.';
      return 'Poniżej Twoich standardów — sprawdź technikę, zmęczenie lub sprzęt.';
    }
    
    return null;
  };


  const fetchData = async () => {
    try {
      setLoading(true);
      const params = { limit, offset };
      if (filterValue && filterType) {
        params.search = filterValue;
      }
      if (filterGunId) {
        params.gun_id = filterGunId;
      }
      const [sessionsRes, gunsRes, ammoRes] = await Promise.all([
        shootingSessionsAPI.getAll(params).catch((err) => {
          console.error('Błąd pobierania sesji:', err);
          return { data: { items: [], total: 0 } };
        }),
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
      const sessionsData = sessionsRes.data;
      const allSessions = Array.isArray(sessionsData) ? sessionsData : sessionsData?.items ?? [];
      const sessionsTotal = sessionsData?.total ?? 0;
      const gunsData = gunsRes.data;
      const ammoData = ammoRes.data;
      const gunItems = Array.isArray(gunsData) ? gunsData : gunsData?.items ?? [];
      const ammoItems = Array.isArray(ammoData) ? ammoData : ammoData?.items ?? [];
      setSessions(allSessions);
      setTotal(sessionsTotal);
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

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setOffset(0);
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
      setSuccess(t('common.itemDeleted', { item: `${t('common.session')} ${gunType ? gunType + ' ' : ''}${gunName}` }));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Błąd podczas usuwania sesji');
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
    if (session.target_image_path && user && session.user_id === user.user_id) {
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
    return <div className="text-center">Ładowanie...</div>;
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
              <select
                className="form-input"
                style={{ width: 'auto', minWidth: '150px' }}
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setFilterGunId(null);
                  setFilterValue('');
                  setOffset(0);
                }}
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
                  style={{ minWidth: '200px' }}
                  placeholder={t('sessions.enterValue')}
                  value={filterValue}
                  onChange={(e) => {
                    setFilterValue(e.target.value);
                    if (filterType !== 'gun') {
                      setFilterGunId(null);
                    }
                    setOffset(0);
                  }}
                />
              )}
            </div>
            
          </div>

          {sessions.length === 0 ? (
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
                      Strzały
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
                      Trafienia
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
                      Celność
                    </th>
                    <th style={{ padding: '0.75rem' }}>
                      MOA
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
                      Punktacja końcowa
                    </th>
                    {sessions.some(s => s.session_type === 'advanced') && (
                      <th style={{ padding: '0.75rem' }}>{t('sessions.comment')}</th>
                    )}
                    <th style={{ width: '50px', padding: '0.75rem' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
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
                          alt={session.session_type === 'advanced' ? "Sesja zaawansowana" : "Sesja standardowa"}
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
                      <td>
                        {(() => {
                          if (session.group_cm && session.distance_m) {
                            const groupCm = parseFloat(session.group_cm);
                            const distanceM = parseFloat(session.distance_m);
                            if (!isNaN(groupCm) && !isNaN(distanceM) && distanceM > 0) {
                              const moa = (groupCm / distanceM) * 34.38;
                              const effective_moa = moa * distanceM / 100;
                              return effective_moa.toFixed(2);
                            }
                          }
                          return '-';
                        })()}
                      </td>
                      <td>
                        {(() => {
                          const score = session.final_score !== null && session.final_score !== undefined 
                            ? session.final_score 
                            : null;
                          if (score !== null) {
                            const roundedScore = Math.round(score);
                            let color;
                            if (roundedScore >= 80) {
                              color = '#4caf50'; // Zielony
                            } else if (roundedScore >= 50) {
                              color = '#ff9800'; // Pomarańczowy
                            } else {
                              color = '#dc3545'; // Czerwony
                            }
                            // Sztywny komentarz tylko dla sesji standardowej
                            const message = session.session_type !== 'advanced' 
                              ? getQualityMessage(score, userSkillLevel) 
                              : null;
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <span style={{ 
                                  color: color,
                                  fontWeight: 'bold'
                                }}>
                                  {roundedScore}/100
                                </span>
                                {message && (
                                  <span style={{ 
                                    fontSize: '0.75rem',
                                    color: 'var(--text-tertiary)',
                                    lineHeight: '1.2'
                                  }}>
                                    {message}
                                  </span>
                                )}
                              </div>
                            );
                          }
                          return '-';
                        })()}
                      </td>
                      {sessions.some(s => s.session_type === 'advanced') && (
                        <td 
                          style={{ 
                            maxWidth: '300px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {session.session_type === 'advanced' ? (parseAIAnalysis(session.ai_comment)?.summary || '-') : '-'}
                        </td>
                      )}
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
                            title="Opcje"
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
                                {t('sessions.edit')}
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
                                {t('sessions.delete')}
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
          {total > limit && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              alignItems: 'center', 
              gap: '0.5rem',
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: `1px solid var(--border-color)`
            }}>
              <button
                onClick={() => setOffset(prev => Math.max(0, prev - limit))}
                disabled={offset === 0}
                style={{
                  background: 'none',
                  border: 'none',
                  color: offset === 0 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                  cursor: offset === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '1.2rem',
                  padding: '0.25rem 0.5rem'
                }}
              >
                ←
              </button>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '0 1rem' }}>
                {t('sessions.page')} {Math.floor(offset / limit) + 1} {t('sessions.of')} {Math.ceil(total / limit)}
              </span>
              <button
                onClick={() => setOffset(prev => prev + limit)}
                disabled={offset + limit >= total}
                style={{
                  background: 'none',
                  border: 'none',
                  color: offset + limit >= total ? 'var(--text-tertiary)' : 'var(--text-primary)',
                  cursor: offset + limit >= total ? 'not-allowed' : 'pointer',
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
              {/* 1️⃣ Typ sesji */}
              <div>
                <strong>{t('sessions.sessionType')}</strong>{' '}
                <img 
                  src={selectedSession.session_type === 'advanced' ? "/assets/session_icon_AI_dark.png" : "/assets/session_icon_dark.png"}
                  alt={selectedSession.session_type === 'advanced' ? "Sesja zaawansowana" : "Sesja standardowa"}
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

              {/* 2️⃣ Data */}
              <div>
                <strong>{t('sessions.date')}</strong> {new Date(selectedSession.date).toLocaleDateString('pl-PL')}
              </div>

              {/* 3️⃣ Poziom użytkownika */}
              {userSkillLevel && (
                <div>
                  <strong>{t('sessions.experienceLevel')}</strong> {getSkillLevelLabel(userSkillLevel)}
                </div>
              )}

              {/* 4️⃣ Punktacja końcowa */}
              {(() => {
                const score = selectedSession.final_score !== null && selectedSession.final_score !== undefined 
                  ? selectedSession.final_score 
                  : null;
                if (score !== null) {
                  const roundedScore = Math.round(score);
                  return (
                    <div>
                      <strong>Punktacja końcowa:</strong>{' '}
                      <span style={{ 
                        color: roundedScore >= 80 ? '#4caf50' : roundedScore >= 60 ? '#ffc107' : '#dc3545',
                        fontWeight: 'bold'
                      }}>
                        {roundedScore}/100
                      </span>
                    </div>
                  );
                }
                return null;
              })()}

              {/* 5️⃣ MOA */}
              {(() => {
                if (selectedSession.group_cm && selectedSession.distance_m) {
                  const groupCm = parseFloat(selectedSession.group_cm);
                  const distanceM = parseFloat(selectedSession.distance_m);
                  if (!isNaN(groupCm) && !isNaN(distanceM) && distanceM > 0) {
                    const moa = (groupCm / distanceM) * 34.38;
                    const effective_moa = moa * distanceM / 100;
                    return (
                      <div>
                        <strong>MOA:</strong> {effective_moa.toFixed(2)}
                      </div>
                    );
                  }
                }
                return null;
              })()}

              {/* 6️⃣ Celność */}
              {selectedSession.accuracy_percent !== null && selectedSession.accuracy_percent !== undefined && (
                <div>
                  <strong>Celność:</strong>{' '}
                  <span style={{ 
                    color: parseFloat(selectedSession.accuracy_percent) >= 80 ? '#4caf50' : parseFloat(selectedSession.accuracy_percent) >= 60 ? '#ffc107' : '#dc3545',
                    fontWeight: 'bold'
                  }}>
                    {parseFloat(selectedSession.accuracy_percent).toFixed(0)}%
                  </span>
                </div>
              )}

              {/* 7️⃣ Broń */}
              <div>
                <strong>{t('sessions.weapon')}</strong> {getGunName(selectedSession.gun_id)}
              </div>

              {/* 8️⃣ Amunicja */}
              <div>
                <strong>{t('sessions.ammunition')}</strong> {getAmmoName(selectedSession.ammo_id)}
              </div>

              {/* 9️⃣ Liczba strzałów */}
              <div>
                <strong>{t('sessions.shotsCount')}</strong> {selectedSession.shots || '-'}
              </div>

              {/* 🔟 Liczba trafień */}
              {selectedSession.hits !== null && selectedSession.hits !== undefined && (
                <div>
                  <strong>{t('sessions.hitsCount')}</strong> {selectedSession.hits}
                </div>
              )}

              {/* 1️⃣1️⃣ Dystans */}
              {selectedSession.distance && (
                <div>
                  <strong>{t('sessions.distance')}</strong> {selectedSession.distance} {selectedSession.distance_unit || 'm'}
                </div>
              )}

              <div>
                <strong>{t('sessions.cost')}</strong> {selectedSession.cost ? formatCurrency(parseFloat(selectedSession.cost)) : '-'}
              </div>

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

              {selectedSession.session_type === 'advanced' && (() => {
                const analysis = parseAIAnalysis(selectedSession.ai_comment);
                if (!analysis) return (
                  <div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>{t('sessions.aiComment')}</strong>
                    </div>
                    <div style={{ 
                      padding: '0.75rem', 
                      backgroundColor: 'var(--bg-secondary)', 
                      borderRadius: '4px',
                      color: 'var(--text-tertiary)'
                    }}>
                      -
                    </div>
                  </div>
                );
                
                return (
                  <div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>{t('sessions.aiComment')}</strong>
                    </div>
                    <div style={{ 
                      marginTop: '0.5rem', 
                      padding: '1rem', 
                      backgroundColor: 'var(--bg-secondary)', 
                      borderRadius: '8px',
                      color: 'var(--text-primary)'
                    }}>
                      {/* Podsumowanie */}
                      {analysis.summary && (
                        <div style={{ marginBottom: '1rem', fontSize: '1.05rem', fontWeight: '500' }}>
                          {analysis.summary}
                        </div>
                      )}
                      
                      {/* Sekcje szczegółowe */}
                      <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {analysis.accuracy_comment && (
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                              {t('sessions.accuracy', 'Celność')}
                            </div>
                            <div>{analysis.accuracy_comment}</div>
                          </div>
                        )}
                        
                        {analysis.precision_comment && (
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                              {t('sessions.precision', 'Precyzja')}
                            </div>
                            <div>{analysis.precision_comment}</div>
                          </div>
                        )}
                        
                        {analysis.score_comment && (
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                              {t('sessions.score', 'Ocena')}
                            </div>
                            <div>{analysis.score_comment}</div>
                          </div>
                        )}
                        
                        {analysis.weapon_context && (
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                              {t('sessions.weaponContext', 'Kontekst broni')}
                            </div>
                            <div>{analysis.weapon_context}</div>
                          </div>
                        )}
                      </div>
                      
                      {/* Mocne strony */}
                      {analysis.strengths && analysis.strengths.length > 0 && (
                        <div style={{ marginTop: '1rem' }}>
                          <div style={{ fontWeight: '600', color: '#4caf50', marginBottom: '0.5rem' }}>
                            {t('sessions.strengths', 'Mocne strony')}
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                            {analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>
                      )}
                      
                      {/* Słabe strony */}
                      {analysis.weaknesses && analysis.weaknesses.length > 0 && (
                        <div style={{ marginTop: '0.75rem' }}>
                          <div style={{ fontWeight: '600', color: '#ff9800', marginBottom: '0.5rem' }}>
                            {t('sessions.weaknesses', 'Do poprawy')}
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                            {analysis.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                          </ul>
                        </div>
                      )}
                      
                      {/* Wskazówki */}
                      {analysis.tips && analysis.tips.length > 0 && (
                        <div style={{ marginTop: '0.75rem' }}>
                          <div style={{ fontWeight: '600', color: '#2196f3', marginBottom: '0.5rem' }}>
                            {t('sessions.tips', 'Wskazówki')}
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                            {analysis.tips.map((tip, i) => <li key={i}>{tip}</li>)}
                          </ul>
                        </div>
                      )}
                      
                      {/* Szacowany poziom */}
                      {analysis.skill_level_estimate && (
                        <div style={{ marginTop: '1rem', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', display: 'inline-block' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{t('sessions.skillLevelEstimate', 'Szacowany poziom')}: </span>
                          <strong>{analysis.skill_level_estimate}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Zdjęcie tarczy - tylko dla właściciela sesji */}
              {selectedSession.target_image_path && user && selectedSession.user_id === user.user_id && (
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
                return `${t('sessions.confirmDeleteText')} ${gunDisplayName}? ${t('common.irreversible')}`;
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
