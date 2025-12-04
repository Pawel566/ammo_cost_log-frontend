import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { gunsAPI, ammoAPI, shootingSessionsAPI, maintenanceAPI, settingsAPI, accountAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';

const MaintenanceStatusIcon = ({ status }) => {
  const iconSize = 48;
  
  if (status === 'green' || status === 'ok') {
    return (
      <svg width={iconSize} height={iconSize} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="9" fill="#4caf50" stroke="none"/>
        <path d="M6 10 L9 13 L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    );
  } else if (status === 'yellow' || status === 'warning') {
    return (
      <img 
        src="/assets/warning_weapon_orange.png" 
        alt="Warning"
        style={{ 
          width: `${iconSize}px`, 
          height: `${iconSize}px`,
          objectFit: 'contain'
        }}
      />
    );
  } else if (status === 'red' || status === 'required') {
    return (
      <img 
        src="/assets/warning_weapon_red.png" 
        alt="Required"
        style={{ 
          width: `${iconSize}px`, 
          height: `${iconSize}px`,
          objectFit: 'contain'
        }}
      />
    );
  } else {
    return (
      <svg width={iconSize} height={iconSize} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="9" fill="#888" stroke="none"/>
        <path d="M6 6 L14 14 M14 6 L6 14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    );
  }
};

const DashboardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatCurrency } = useCurrencyConverter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Dane do wyświetlenia
  const [mostUsedGun, setMostUsedGun] = useState(null);
  const [mostUsedGunImage, setMostUsedGunImage] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [lowAmmoAlerts, setLowAmmoAlerts] = useState([]);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState([]);
  const [rankInfo, setRankInfo] = useState(null);
  const [skillLevel, setSkillLevel] = useState('beginner');
  const [showRankTooltip, setShowRankTooltip] = useState(false);
  const [userSettings, setUserSettings] = useState({
    low_ammo_notifications_enabled: true,
    maintenance_notifications_enabled: true,
    maintenance_rounds_limit: 500,
    maintenance_days_limit: 90
  });
  const [guns, setGuns] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [maintenance, setMaintenance] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getLastMaintenance = (gunId) => {
    const gunMaintenance = maintenance.filter(m => m.gun_id === gunId);
    if (!gunMaintenance || gunMaintenance.length === 0) {
      return null;
    }
    return gunMaintenance.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  };

  const calculateRoundsSinceLastMaintenance = (gunId) => {
    const lastMaint = getLastMaintenance(gunId);
    if (!lastMaint) return 0;

    const gunSessions = sessions.filter(s => s.gun_id === gunId);
    if (!gunSessions || gunSessions.length === 0) return 0;

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
      // Sprawdź czy broń ma sesje bez konserwacji
      const gunSessions = sessions.filter(s => s.gun_id === gunId);
      if (gunSessions.length === 0) {
        return { status: 'none', color: '#888', message: '-', reason: '' };
      }
      const totalShots = gunSessions.reduce((sum, s) => sum + (s.shots || 0), 0);
      const roundsLimit = userSettings.maintenance_rounds_limit || 500;
      if (totalShots >= roundsLimit) {
        return { 
          status: 'red', 
          color: '#f44336', 
          message: t('common.required'),
          reason: t('common.shotsExceeded', { shots: totalShots, limit: roundsLimit })
        };
      }
      return { status: 'none', color: '#888', message: '-', reason: '' };
    }

    const rounds = calculateRoundsSinceLastMaintenance(gunId);
    const days = calculateDaysSinceLastMaintenance(gunId);

    const roundsLimit = userSettings.maintenance_rounds_limit || 500;
    const daysLimit = userSettings.maintenance_days_limit || 90;

    let useRounds = true;
    let percentage = 0;
    let finalStatus = 'green';

    if (rounds === 0) {
      useRounds = false;
      percentage = (days / daysLimit) * 100;
    } else if (days < daysLimit) {
      useRounds = true;
      percentage = (rounds / roundsLimit) * 100;
    } else {
      useRounds = false;
      percentage = (days / daysLimit) * 100;
    }

    if (percentage >= 100) {
      finalStatus = 'red';
    } else if (percentage >= 75) {
      finalStatus = 'yellow';
    } else {
      finalStatus = 'green';
    }

    let color, message, reason = '';
    const roundsPercentage = Math.round((rounds / roundsLimit) * 100);
    const daysPercentage = Math.round((days / daysLimit) * 100);

    if (finalStatus === 'red') {
      color = '#f44336';
      message = t('common.required');
      if (useRounds && rounds >= roundsLimit) {
        reason = t('common.shotsExceeded', { shots: rounds, limit: roundsLimit });
      } else if (!useRounds && days >= daysLimit) {
        reason = t('common.daysExceeded', { days: days, limit: daysLimit });
      } else if (useRounds) {
        reason = `${roundsPercentage}% ${t('common.shots')} (${rounds}/${roundsLimit})`;
      } else {
        reason = `${daysPercentage}% ${t('common.days')} (${days}/${daysLimit} ${t('common.days')})`;
      }
    } else if (finalStatus === 'yellow') {
      color = '#ff9800';
      message = t('common.soonRequired');
      if (useRounds) {
        reason = `${roundsPercentage}% ${t('common.shots')} (${rounds}/${roundsLimit})`;
      } else {
        reason = `${daysPercentage}% ${t('common.days')} (${days}/${daysLimit} ${t('common.days')})`;
      }
    } else {
      color = '#4caf50';
      message = t('common.ok');
      reason = '';
    }

    return { status: finalStatus, color, message, reason, rounds, days };
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [gunsRes, sessionsRes, ammoRes, maintenanceRes, settingsRes, rankRes, skillLevelRes] = await Promise.all([
        gunsAPI.getAll(),
        shootingSessionsAPI.getAll(),
        ammoAPI.getAll(),
        maintenanceAPI.getAll(),
        settingsAPI.get(),
        accountAPI.getRank().catch((err) => {
          console.error('Błąd pobierania rangi:', err);
          return { data: null };
        }),
        accountAPI.getSkillLevel().catch(() => ({ data: { skill_level: 'beginner' } }))
      ]);

      const gunsData = Array.isArray(gunsRes.data) ? gunsRes.data : gunsRes.data?.items ?? [];
      const sessionsData = Array.isArray(sessionsRes.data) ? sessionsRes.data : [];
      const ammo = Array.isArray(ammoRes.data) ? ammoRes.data : ammoRes.data?.items ?? [];
      const maintenanceData = maintenanceRes.data || [];
      
      // Ustawienia użytkownika
      let newSettings = {
        low_ammo_notifications_enabled: true,
        maintenance_notifications_enabled: true,
        maintenance_rounds_limit: 500,
        maintenance_days_limit: 90
      };
      if (settingsRes.data) {
        newSettings = {
          low_ammo_notifications_enabled: settingsRes.data.low_ammo_notifications_enabled !== undefined 
            ? settingsRes.data.low_ammo_notifications_enabled : true,
          maintenance_notifications_enabled: settingsRes.data.maintenance_notifications_enabled !== undefined
            ? settingsRes.data.maintenance_notifications_enabled : true,
          maintenance_rounds_limit: settingsRes.data.maintenance_rounds_limit || 500,
          maintenance_days_limit: settingsRes.data.maintenance_days_limit || 90
        };
      }
      setUserSettings(newSettings);
      
      // Ustaw dane przed obliczaniem statusu
      setGuns(gunsData);
      setSessions(sessionsData);
      setMaintenance(maintenanceData);

      // Ranga użytkownika
      if (rankRes && rankRes.data) {
        setRankInfo(rankRes.data);
      } else {
        setRankInfo({ rank: t('account.beginner'), passed_sessions: 0, progress_percent: 0 });
      }

      // Poziom zaawansowania
      if (skillLevelRes && skillLevelRes.data) {
        setSkillLevel(skillLevelRes.data.skill_level || 'beginner');
      }

      // Najczęściej używana broń
      const gunUsage = {};
      sessionsData.forEach(session => {
        if (session.gun_id) {
          gunUsage[session.gun_id] = (gunUsage[session.gun_id] || 0) + (session.shots || 0);
        }
      });
      
      let maxShots = 0;
      let mostUsedGunId = null;
      Object.entries(gunUsage).forEach(([gunId, shots]) => {
        if (shots > maxShots) {
          maxShots = shots;
          mostUsedGunId = gunId;
        }
      });
      
      if (mostUsedGunId) {
        const gun = gunsData.find(g => g.id === mostUsedGunId);
        if (gun) {
          setMostUsedGun(gun);
          // Pobierz zdjęcie broni
          try {
            const imageRes = await gunsAPI.getImage(gun.id);
            if (imageRes.data?.url) {
              setMostUsedGunImage(imageRes.data.url);
            } else {
              setMostUsedGunImage(null);
            }
          } catch (err) {
            setMostUsedGunImage(null);
          }
        }
      }

      // Statystyki miesięczne (bieżący miesiąc)
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const monthSessions = sessionsData.filter(s => {
        const sessionDate = new Date(s.date);
        const sessionMonth = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, '0')}`;
        return sessionMonth === currentMonth;
      });

      const totalShots = monthSessions.reduce((sum, s) => sum + (s.shots || 0), 0);
      const totalCost = monthSessions.reduce((sum, s) => sum + (parseFloat(s.cost) || 0), 0);
      const accuracySessions = monthSessions.filter(s => s.hits !== null && s.hits !== undefined && s.distance_m);
      const totalHits = accuracySessions.reduce((sum, s) => sum + (s.hits || 0), 0);
      const accuracyShots = accuracySessions.reduce((sum, s) => sum + (s.shots || 0), 0);
      const avgAccuracy = accuracyShots > 0 
        ? (totalHits / accuracyShots) * 100 
        : 0;

      setMonthlyStats({
        sessions: monthSessions.length,
        shots: totalShots,
        avgAccuracy: avgAccuracy,
        cost: totalCost
      });

      // Stan amunicji - wszystkie pozycje
      setLowAmmoAlerts(ammo.filter(item => (item.units_in_package || 0) > 0));

      // Alerty o konserwacji - użyj tej samej logiki co MyWeaponsPage
      // Musimy użyć nowych ustawień
      if (newSettings.maintenance_notifications_enabled) {
        const alerts = [];
        gunsData.forEach(gun => {
          // Tymczasowo ustaw ustawienia dla obliczeń
          const tempSettings = newSettings;
          const lastMaint = maintenanceData.filter(m => m.gun_id === gun.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
          
          let rounds = 0;
          let days = null;
          
          if (lastMaint) {
            const maintenanceDate = new Date(lastMaint.date);
            const gunSessions = sessionsData.filter(s => s.gun_id === gun.id);
            gunSessions.forEach(session => {
              const sessionDate = new Date(session.date);
              if (sessionDate >= maintenanceDate) {
                rounds += session.shots || 0;
              }
            });
            const today = new Date();
            const diffTime = today - maintenanceDate;
            days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          } else {
            const gunSessions = sessionsData.filter(s => s.gun_id === gun.id);
            rounds = gunSessions.reduce((sum, s) => sum + (s.shots || 0), 0);
          }
          
          const roundsLimit = tempSettings.maintenance_rounds_limit || 500;
          const daysLimit = tempSettings.maintenance_days_limit || 90;
          
          let useRounds = true;
          let percentage = 0;
          
          if (rounds === 0) {
            useRounds = false;
            percentage = days !== null ? (days / daysLimit) * 100 : 0;
          } else if (days === null || days < daysLimit) {
            useRounds = true;
            percentage = (rounds / roundsLimit) * 100;
          } else {
            useRounds = false;
            percentage = (days / daysLimit) * 100;
          }
          
          let finalStatus = 'green';
          if (percentage >= 100) {
            finalStatus = 'red';
          } else if (percentage >= 75) {
            finalStatus = 'yellow';
          }
          
          if (finalStatus === 'yellow' || finalStatus === 'red') {
            let color, message, reason = '';
            const roundsPercentage = Math.round((rounds / roundsLimit) * 100);
            const daysPercentage = days !== null ? Math.round((days / daysLimit) * 100) : 0;
            
            if (finalStatus === 'red') {
              color = '#f44336';
              message = t('common.required');
              if (useRounds && rounds >= roundsLimit) {
                reason = `${t('common.required')}: ${t('common.shots')} ${rounds}/${roundsLimit}`;
              } else if (!useRounds && days !== null && days >= daysLimit) {
                reason = `${t('common.required')}: ${days}/${daysLimit} ${t('common.days')}`;
              } else if (useRounds) {
                reason = `${roundsPercentage}% ${t('common.shots')} (${rounds}/${roundsLimit})`;
              } else {
                reason = `${daysPercentage}% ${t('common.days')} (${days}/${daysLimit} ${t('common.days')})`;
              }
            } else {
              color = '#ff9800';
              message = t('common.soonRequired');
              if (useRounds) {
                reason = `${roundsPercentage}% ${t('common.shots')} (${rounds}/${roundsLimit})`;
              } else {
                reason = `${daysPercentage}% ${t('common.days')} (${days}/${daysLimit} ${t('common.days')})`;
              }
            }
            
            alerts.push({
              gun,
              status: { status: finalStatus, color, message, reason }
            });
          }
        });
        setMaintenanceAlerts(alerts);
      }

      setError(null);
    } catch (err) {
      setError(t('common.error'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center">{t('common.loading')}</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img 
              src="/assets/session_icon_dark.png" 
              alt="Ammo Cost Log" 
              style={{ width: '32px', height: '32px' }}
            />
            {t('dashboard.title')}
          </h2>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* Górny rząd: Najczęściej używana broń, Wyniki w miesiącu, Poziom */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          {/* Najczęściej używana broń */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: 0, marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
              {t('dashboard.mostUsedWeapon')}
            </h3>
            {mostUsedGun ? (
              <div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  width: '100%',
                  height: '180px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  padding: 0
                }}>
                  {mostUsedGunImage ? (
                    <img 
                      src={mostUsedGunImage}
                      alt={mostUsedGun.name}
                      style={{ 
                        maxWidth: '100%',
                        maxHeight: '100%',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                        padding: 0,
                        margin: 0
                      }}
                    />
                  ) : (
                    <img 
                      src="/assets/Add_weapon_icon.png" 
                      alt="Brak zdjęcia"
                      style={{ 
                        maxWidth: '100%',
                        maxHeight: '100%',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                        opacity: 0.5,
                        padding: 0,
                        margin: 0
                      }}
                    />
                  )}
                </div>
                <div style={{ 
                  textAlign: 'center', 
                  marginBottom: '1rem',
                  fontSize: '1.2rem',
                  color: '#007bff',
                  fontWeight: 'bold'
                }}>
                  {mostUsedGun.name}
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate(`/shooting-sessions?gun_id=${mostUsedGun.id}`)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {t('dashboard.viewSessions')}
                  <span>→</span>
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '1rem' }}>
                {t('dashboard.noData')}
              </div>
            )}
          </div>

          {/* Wyniki w tym miesiącu */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="12" cy="12" r="3" fill="currentColor"/>
              </svg>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>
                {t('dashboard.results')}
              </h3>
              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>{t('dashboard.thisMonth')}</span>
            </div>
            {monthlyStats ? (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>{t('dashboard.sessions')}</span>
                  <span style={{ fontWeight: 'bold' }}>{monthlyStats.sessions}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>{t('dashboard.shots')}</span>
                  <span style={{ fontWeight: 'bold' }}>{monthlyStats.shots}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>{t('dashboard.avgAccuracy')}</span>
                  <span style={{ 
                    fontWeight: 'bold',
                    color: monthlyStats.avgAccuracy >= 80 ? '#4caf50' : monthlyStats.avgAccuracy >= 60 ? '#ffc107' : '#dc3545'
                  }}>
                    {monthlyStats.avgAccuracy.toFixed(0)}%
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>{t('dashboard.cost')}</span>
                  <span style={{ fontWeight: 'bold', color: '#007bff' }}>
                    {formatCurrency(monthlyStats.cost)}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '1rem' }}>
                {t('dashboard.noDataThisMonth')}
              </div>
            )}
          </div>

          {/* Poziom z odznaką */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: 0, marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
              {t('dashboard.level')}
            </h3>
            {rankInfo ? (
              <div>
                <div style={{ 
                  textAlign: 'center', 
                  marginBottom: '1rem',
                  fontSize: '1.3rem',
                  fontWeight: 'bold',
                  color: '#007bff'
                }}>
                  {rankInfo.rank || "Nowicjusz"}
                </div>
                <div style={{ 
                  textAlign: 'center', 
                  marginBottom: '1rem',
                  fontSize: '0.9rem',
                  color: 'var(--text-tertiary)'
                }}>
                  {rankInfo.passed_sessions || 0} {t('dashboard.passedSessions')}
                </div>
                {rankInfo.is_max_rank ? (
                  <div style={{ 
                    textAlign: 'center',
                    fontSize: '0.85rem',
                    color: '#4caf50',
                    marginTop: '0.5rem',
                    fontWeight: 'bold'
                  }}>
                    {t('dashboard.maxRankReached')}
                  </div>
                ) : rankInfo.next_rank && rankInfo.next_rank_min !== null && rankInfo.next_rank_min !== undefined ? (
                  <>
                    <div style={{ marginBottom: '0.5rem', position: 'relative' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        fontSize: '0.85rem',
                        color: 'var(--text-tertiary)',
                        marginBottom: '0.25rem'
                      }}>
                        <span>{t('dashboard.toNextRank')}</span>
                        <span>{Math.max(0, rankInfo.next_rank_min - rankInfo.passed_sessions)} {t('dashboard.sessionsToNext')}</span>
                      </div>
                      <div 
                        style={{
                          width: '100%',
                          height: '12px',
                          backgroundColor: 'var(--bg-secondary)',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          position: 'relative',
                          cursor: 'help'
                        }}
                        onMouseEnter={() => setShowRankTooltip(true)}
                        onMouseLeave={() => setShowRankTooltip(false)}
                      >
                        <div style={{
                          width: `${rankInfo.progress_percent || 0}%`,
                          height: '100%',
                          backgroundColor: '#007bff',
                          transition: 'width 0.3s',
                          borderRadius: '6px'
                        }} />
                      </div>
                      {showRankTooltip && (
                        <div 
                          style={{
                            position: 'absolute',
                            bottom: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            marginBottom: '8px',
                            padding: '8px 12px',
                            backgroundColor: 'rgba(0, 0, 0, 0.9)',
                            color: 'white',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            whiteSpace: 'nowrap',
                            zIndex: 1000,
                            pointerEvents: 'none'
                          }}
                        >
                          {skillLevel === 'beginner' 
                            ? t('dashboard.rankTooltipBeginner')
                            : skillLevel === 'intermediate'
                            ? t('dashboard.rankTooltipIntermediate')
                            : t('dashboard.rankTooltipAdvanced')}
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '6px solid transparent',
                            borderRight: '6px solid transparent',
                            borderTop: '6px solid rgba(0, 0, 0, 0.9)'
                          }} />
                        </div>
                      )}
                    </div>
                    <div style={{ 
                      textAlign: 'center',
                      fontSize: '0.85rem',
                      color: 'var(--text-tertiary)',
                      marginTop: '0.5rem'
                    }}>
                      {t('dashboard.nextRank')} {rankInfo.next_rank}
                    </div>
                  </>
                ) : null}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem' }}>
                {t('common.loading')}
              </div>
            )}
          </div>
        </div>

        {/* Dolny rząd: Amunicja i Konserwacja */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '1.5rem'
        }}>
          {/* Stan amunicji */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#ff9800"/>
                <path d="M2 17L12 22L22 17" stroke="#ff9800" strokeWidth="2" fill="none"/>
                <path d="M2 12L12 17L22 12" stroke="#ff9800" strokeWidth="2" fill="none"/>
              </svg>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>
                {t('dashboard.ammoStatus')}
              </h3>
            </div>
            {lowAmmoAlerts.length > 0 ? (
              <div>
                {lowAmmoAlerts.slice(0, 3).map((item, index) => (
                  <div key={item.id} style={{ marginBottom: index < lowAmmoAlerts.length - 1 ? '1rem' : '0' }}>
                    <div style={{ 
                      fontWeight: 'bold',
                      marginBottom: '0.25rem'
                    }}>
                      {item.name}
                    </div>
                    <div style={{ 
                      fontSize: '0.9rem',
                      color: 'var(--text-tertiary)',
                      marginBottom: '0.5rem'
                    }}>
                      {item.caliber ? `${item.caliber} - ` : ''}{item.units_in_package} {t('dashboard.fromStock')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '1rem' }}>
                {t('dashboard.noAmmoInStock')}
              </div>
            )}
          </div>

          {/* Konserwacja */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" fill="currentColor"/>
              </svg>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>
                {t('dashboard.maintenance')}
              </h3>
            </div>
            {maintenanceAlerts.length > 0 ? (
              <div>
                {maintenanceAlerts.slice(0, 3).map((alert, index) => (
                  <div key={alert.gun.id} style={{ marginBottom: index < maintenanceAlerts.length - 1 ? '1rem' : '0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        {alert.status.status !== 'none' && <MaintenanceStatusIcon status={alert.status.status} />}
                        <Link 
                          to={`/my-weapons?gun_id=${alert.gun.id}`}
                          style={{ 
                            color: alert.status.color, 
                            textDecoration: 'none',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                          onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                        >
                          {alert.gun.name}
                        </Link>
                      </div>
                      {(alert.status.status === 'yellow' || alert.status.status === 'red') && alert.status.reason && (
                        <span style={{ fontSize: '0.8rem', color: '#aaa', marginLeft: '1.5rem' }}>
                          {alert.status.reason}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '1rem' }}>
                {t('dashboard.allGood')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

