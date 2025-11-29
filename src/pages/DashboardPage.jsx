import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gunsAPI, ammoAPI, shootingSessionsAPI, maintenanceAPI, settingsAPI, accountAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Dane do wyświetlenia
  const [mostUsedGun, setMostUsedGun] = useState(null);
  const [mostUsedGunImage, setMostUsedGunImage] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [lowAmmoAlerts, setLowAmmoAlerts] = useState([]);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState([]);
  const [rankInfo, setRankInfo] = useState(null);
  const [userSettings, setUserSettings] = useState({
    low_ammo_notifications_enabled: true,
    maintenance_notifications_enabled: true,
    maintenance_rounds_limit: 500,
    maintenance_days_limit: 90
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [gunsRes, sessionsRes, ammoRes, maintenanceRes, settingsRes, rankRes] = await Promise.all([
        gunsAPI.getAll(),
        shootingSessionsAPI.getAll(),
        ammoAPI.getAll(),
        maintenanceAPI.getAll(),
        settingsAPI.get(),
        accountAPI.getRank().catch((err) => {
          console.error('Błąd pobierania rangi:', err);
          return { data: null };
        })
      ]);

      const guns = Array.isArray(gunsRes.data) ? gunsRes.data : gunsRes.data?.items ?? [];
      const sessions = Array.isArray(sessionsRes.data) ? sessionsRes.data : [];
      const ammo = Array.isArray(ammoRes.data) ? ammoRes.data : ammoRes.data?.items ?? [];
      const maintenance = maintenanceRes.data || [];
      
      // Ustawienia użytkownika
      if (settingsRes.data) {
        setUserSettings({
          low_ammo_notifications_enabled: settingsRes.data.low_ammo_notifications_enabled !== undefined 
            ? settingsRes.data.low_ammo_notifications_enabled : true,
          maintenance_notifications_enabled: settingsRes.data.maintenance_notifications_enabled !== undefined
            ? settingsRes.data.maintenance_notifications_enabled : true,
          maintenance_rounds_limit: settingsRes.data.maintenance_rounds_limit || 500,
          maintenance_days_limit: settingsRes.data.maintenance_days_limit || 90
        });
      }

      // Ranga użytkownika
      if (rankRes && rankRes.data) {
        setRankInfo(rankRes.data);
      } else {
        setRankInfo({ rank: "Nowicjusz", passed_sessions: 0, progress_percent: 0 });
      }

      // Najczęściej używana broń
      const gunUsage = {};
      sessions.forEach(session => {
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
        const gun = guns.find(g => g.id === mostUsedGunId);
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
      const monthSessions = sessions.filter(s => {
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

      // Alerty o konserwacji
      if (userSettings.maintenance_notifications_enabled) {
        const alerts = [];
        guns.forEach(gun => {
          const gunMaintenance = maintenance.filter(m => m.gun_id === gun.id);
          const gunSessions = sessions.filter(s => s.gun_id === gun.id);
          
          if (gunMaintenance.length > 0) {
            const lastMaintenance = gunMaintenance.sort((a, b) => 
              new Date(b.date) - new Date(a.date)
            )[0];
            const lastMaintenanceDate = new Date(lastMaintenance.date);
            const daysSince = Math.floor((now - lastMaintenanceDate) / (1000 * 60 * 60 * 24));
            
            // Strzały od ostatniej konserwacji
            const sessionsAfterMaintenance = gunSessions.filter(s => 
              new Date(s.date) >= lastMaintenanceDate
            );
            const shotsSince = sessionsAfterMaintenance.reduce((sum, s) => sum + (s.shots || 0), 0);
            
            const needsMaintenance = 
              daysSince >= userSettings.maintenance_days_limit ||
              shotsSince >= userSettings.maintenance_rounds_limit;
            
            if (needsMaintenance) {
              alerts.push({
                gun,
                lastMaintenance: lastMaintenanceDate,
                daysSince,
                shotsSince
              });
            }
          } else if (gunSessions.length > 0) {
            // Broń bez konserwacji, ale z sesjami
            const totalShots = gunSessions.reduce((sum, s) => sum + (s.shots || 0), 0);
            if (totalShots >= userSettings.maintenance_rounds_limit) {
              alerts.push({
                gun,
                lastMaintenance: null,
                daysSince: null,
                shotsSince: totalShots
              });
            }
          }
        });
        setMaintenanceAlerts(alerts);
      }

      setError(null);
    } catch (err) {
      setError('Błąd podczas pobierania danych');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center">Ładowanie...</div>;
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
            Ammo Cost Log – Pulpit
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
              Najczęściej używana broń
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
                  Zobacz sesje
                  <span>→</span>
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '1rem' }}>
                Brak danych
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
                Wyniki
              </h3>
              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>w tym miesiącu</span>
            </div>
            {monthlyStats ? (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>SESJE</span>
                  <span style={{ fontWeight: 'bold' }}>{monthlyStats.sessions}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>STRZAŁY</span>
                  <span style={{ fontWeight: 'bold' }}>{monthlyStats.shots}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>ŚR. CELNOŚĆ</span>
                  <span style={{ 
                    fontWeight: 'bold',
                    color: monthlyStats.avgAccuracy >= 80 ? '#4caf50' : monthlyStats.avgAccuracy >= 60 ? '#ffc107' : '#dc3545'
                  }}>
                    {monthlyStats.avgAccuracy.toFixed(0)}%
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>KOSZT</span>
                  <span style={{ fontWeight: 'bold', color: '#007bff' }}>
                    {monthlyStats.cost.toFixed(2).replace('.', ',')} zł
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '1rem' }}>
                Brak danych w tym miesiącu
              </div>
            )}
          </div>

          {/* Poziom z odznaką */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: 0, marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
              Poziom
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
                  {rankInfo.passed_sessions || 0} zaliczonych sesji
                </div>
                {rankInfo.is_max_rank ? (
                  <div style={{ 
                    textAlign: 'center',
                    fontSize: '0.85rem',
                    color: '#4caf50',
                    marginTop: '0.5rem',
                    fontWeight: 'bold'
                  }}>
                    Osiągnięto maksymalną rangę!
                  </div>
                ) : rankInfo.next_rank && rankInfo.next_rank_min !== null && rankInfo.next_rank_min !== undefined ? (
                  <>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        fontSize: '0.85rem',
                        color: 'var(--text-tertiary)',
                        marginBottom: '0.25rem'
                      }}>
                        <span>Do następnej rangi:</span>
                        <span>{Math.max(0, rankInfo.next_rank_min - rankInfo.passed_sessions)} sesji</span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '12px',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: '6px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${rankInfo.progress_percent || 0}%`,
                          height: '100%',
                          backgroundColor: '#007bff',
                          transition: 'width 0.3s',
                          borderRadius: '6px'
                        }} />
                      </div>
                    </div>
                    <div style={{ 
                      textAlign: 'center',
                      fontSize: '0.85rem',
                      color: 'var(--text-tertiary)',
                      marginTop: '0.5rem'
                    }}>
                      Następna: {rankInfo.next_rank}
                    </div>
                  </>
                ) : null}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem' }}>
                Ładowanie...
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
                Stan amunicji
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
                      {item.caliber ? `${item.caliber} - ` : ''}{item.units_in_package} szt z magazynu
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '1rem' }}>
                Brak amunicji w magazynie
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
                Konserwacja
              </h3>
            </div>
            {maintenanceAlerts.length > 0 ? (
              <div>
                {maintenanceAlerts.slice(0, 2).map((alert, index) => (
                  <div key={alert.gun.id} style={{ marginBottom: index < maintenanceAlerts.length - 1 ? '1rem' : '0' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      {alert.gun.name}
                    </div>
                    {alert.lastMaintenance ? (
                      <>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                          Ostatnia konserwacja: {alert.lastMaintenance.toLocaleDateString('pl-PL')}
                        </div>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                          Strzały od konserwacji: {alert.shotsSince}
                        </div>
                      </>
                    ) : (
                      <div style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        Brak konserwacji. Strzały: {alert.shotsSince}
                      </div>
                    )}
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${Math.min((alert.shotsSince / userSettings.maintenance_rounds_limit) * 100, 100)}%`,
                        height: '100%',
                        backgroundColor: alert.shotsSince >= userSettings.maintenance_rounds_limit ? '#dc3545' : '#ffc107',
                        transition: 'width 0.3s'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '1rem' }}>
                Wszystko w porządku
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

