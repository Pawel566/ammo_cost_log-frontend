import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { dashboardAPI, accountAPI } from '../services/api';
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
    // Pomarańczowa ikona ostrzegawcza - Wkrótce wymagana
    return (
      <svg width={iconSize} height={iconSize} viewBox="0 0 1536.000000 1024.000000" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle', overflow: 'visible' }}>
        <g transform="translate(0.000000,1024.000000) scale(0.100000,-0.100000)" fill="#ff9800" stroke="none">
          <path d="M7217 8129 c-91 -13 -202 -72 -272 -143 -51 -52 -103 -137 -337 -541 -152 -264 -368 -637 -480 -830 -428 -733 -744 -1275 -816 -1400 -41 -71 -125 -215 -187 -320 -62 -104 -200 -341 -307 -525 -108 -184 -281 -481 -386 -660 -105 -179 -200 -355 -213 -390 -16 -49 -22 -87 -21 -155 1 -207 104 -370 292 -465 141 -70 -89 -65 2835 -65 2540 0 2653 1 2715 18 335 95 510 433 374 722 -10 22 -93 168 -184 325 -92 157 -242 416 -335 575 -92 160 -234 403 -315 540 -81 138 -201 342 -267 455 -66 113 -245 419 -398 680 -153 261 -335 572 -405 690 -70 118 -194 330 -275 470 -514 885 -519 893 -656 965 -113 59 -219 75 -362 54z m199 -376 c31 -22 109 -151 484 -793 259 -445 570 -976 775 -1325 84 -143 271 -462 415 -710 144 -247 281 -481 305 -520 23 -38 104 -176 180 -305 76 -129 209 -354 295 -500 228 -386 230 -390 230 -442 0 -55 -31 -106 -80 -130 -33 -17 -182 -18 -2685 -18 -2550 0 -2652 1 -2690 19 -61 28 -78 53 -83 121 -5 70 -35 12 313 605 126 215 259 442 296 505 37 63 174 297 304 520 131 223 357 610 503 860 145 250 317 545 382 655 64 110 152 261 195 335 153 266 588 1006 621 1058 48 73 84 94 155 90 36 -3 66 -11 85 -25z"/>
          <path d="M6347 5638 c-9 -7 -23 -30 -32 -50 -12 -29 -21 -38 -40 -38 -13 0 -35 -10 -49 -22 -31 -28 -186 -384 -193 -443 -7 -54 15 -73 94 -81 103 -11 183 -75 183 -147 0 -16 -69 -206 -154 -421 -186 -474 -190 -486 -191 -561 0 -73 39 -162 89 -200 66 -50 98 -55 382 -55 328 0 309 -9 304 145 -2 70 6 108 56 298 l57 217 227 0 c242 0 307 7 380 42 55 27 141 110 168 164 27 53 76 206 102 321 l21 92 267 3 c248 3 270 5 313 24 49 23 92 70 110 122 8 23 23 37 55 51 58 26 60 33 56 267 -2 155 -11 173 -82 183 -38 5 -47 11 -63 42 -10 19 -28 41 -39 48 -31 19 -76 4 -95 -32 -8 -18 -21 -35 -27 -39 -6 -4 -403 -8 -883 -8 -779 0 -873 2 -887 16 -9 8 -16 22 -16 29 0 36 -79 58 -113 33z m1213 -753 c0 -55 -75 -275 -113 -333 -53 -79 -107 -92 -368 -92 -164 0 -179 1 -179 18 0 17 36 137 45 152 3 4 33 -7 67 -25 133 -71 316 -89 333 -33 9 25 -6 41 -69 77 -70 39 -152 116 -205 190 l-42 61 265 0 c226 0 266 -2 266 -15z"/>
        </g>
      </svg>
    );
  } else if (status === 'red' || status === 'required') {
    // Czerwona ikona ostrzegawcza - Wymagana
    return (
      <svg width={iconSize} height={iconSize} viewBox="0 0 1536.000000 1024.000000" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle', overflow: 'visible' }}>
        <g transform="translate(0.000000,1024.000000) scale(0.100000,-0.100000)" fill="#f44336" stroke="none">
          <path d="M7217 8129 c-91 -13 -202 -72 -272 -143 -51 -52 -103 -137 -337 -541 -152 -264 -368 -637 -480 -830 -428 -733 -744 -1275 -816 -1400 -41 -71 -125 -215 -187 -320 -62 -104 -200 -341 -307 -525 -108 -184 -281 -481 -386 -660 -105 -179 -200 -355 -213 -390 -16 -49 -22 -87 -21 -155 1 -207 104 -370 292 -465 141 -70 -89 -65 2835 -65 2540 0 2653 1 2715 18 335 95 510 433 374 722 -10 22 -93 168 -184 325 -92 157 -242 416 -335 575 -92 160 -234 403 -315 540 -81 138 -201 342 -267 455 -66 113 -245 419 -398 680 -153 261 -335 572 -405 690 -70 118 -194 330 -275 470 -514 885 -519 893 -656 965 -113 59 -219 75 -362 54z m199 -376 c31 -22 109 -151 484 -793 259 -445 570 -976 775 -1325 84 -143 271 -462 415 -710 144 -247 281 -481 305 -520 23 -38 104 -176 180 -305 76 -129 209 -354 295 -500 228 -386 230 -390 230 -442 0 -55 -31 -106 -80 -130 -33 -17 -182 -18 -2685 -18 -2550 0 -2652 1 -2690 19 -61 28 -78 53 -83 121 -5 70 -35 12 313 605 126 215 259 442 296 505 37 63 174 297 304 520 131 223 357 610 503 860 145 250 317 545 382 655 64 110 152 261 195 335 153 266 588 1006 621 1058 48 73 84 94 155 90 36 -3 66 -11 85 -25z"/>
          <path d="M6347 5638 c-9 -7 -23 -30 -32 -50 -12 -29 -21 -38 -40 -38 -13 0 -35 -10 -49 -22 -31 -28 -186 -384 -193 -443 -7 -54 15 -73 94 -81 103 -11 183 -75 183 -147 0 -16 -69 -206 -154 -421 -186 -474 -190 -486 -191 -561 0 -73 39 -162 89 -200 66 -50 98 -55 382 -55 328 0 309 -9 304 145 -2 70 6 108 56 298 l57 217 227 0 c242 0 307 7 380 42 55 27 141 110 168 164 27 53 76 206 102 321 l21 92 267 3 c248 3 270 5 313 24 49 23 92 70 110 122 8 23 23 37 55 51 58 26 60 33 56 267 -2 155 -11 173 -82 183 -38 5 -47 11 -63 42 -10 19 -28 41 -39 48 -31 19 -76 4 -95 -32 -8 -18 -21 -35 -27 -39 -6 -4 -403 -8 -883 -8 -779 0 -873 2 -887 16 -9 8 -16 22 -16 29 0 36 -79 58 -113 33z m1213 -753 c0 -55 -75 -275 -113 -333 -53 -79 -107 -92 -368 -92 -164 0 -179 1 -179 18 0 17 36 137 45 152 3 4 33 -7 67 -25 133 -71 316 -89 333 -33 9 25 -6 41 -69 77 -70 39 -152 116 -205 190 l-42 61 265 0 c226 0 266 -2 266 -15z"/>
        </g>
      </svg>
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
  const { user, authReady } = useAuth();
  const { formatCurrency } = useCurrencyConverter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Dane do wyświetlenia
  const [mostUsedGun, setMostUsedGun] = useState(null);
  const [mostUsedGunImage, setMostUsedGunImage] = useState(null);
  const [mostUsedGunStats, setMostUsedGunStats] = useState({
    sessionsCount: 0,
    shotsCount: 0,
    totalCost: 0
  });
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

  useEffect(() => {
    if (authReady) {
      fetchDashboardData();
    }
  }, [authReady]);


  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Jeden request do /dashboard
      const dashboardRes = await dashboardAPI.get().catch((err) => {
        console.error('Błąd pobierania dashboardu:', err);
        const errorMsg = err.response?.data?.message || err.response?.data?.detail || t('common.error');
        setError(`Błąd pobierania dashboardu: ${errorMsg}`);
        return { data: null };
      });

      if (!dashboardRes.data) {
        setError(t('common.error'));
        return;
      }

      const dashboard = dashboardRes.data;

      // Najczęściej używana broń
      if (dashboard.most_used_gun) {
        setMostUsedGun({
          id: dashboard.most_used_gun.id,
          name: dashboard.most_used_gun.name
        });
        setMostUsedGunStats({
          sessionsCount: dashboard.most_used_gun.total_sessions || 0,
          shotsCount: dashboard.most_used_gun.total_shots || 0,
          totalCost: dashboard.most_used_gun.total_cost || 0
        });
        // Thumbnail jest już w danych z backendu
        if (dashboard.most_used_gun.thumbnail) {
          setMostUsedGunImage(dashboard.most_used_gun.thumbnail);
        }
      }

      // Statystyki bieżącego miesiąca
      if (dashboard.current_month_stats) {
        setMonthlyStats({
          sessions: dashboard.current_month_stats.sessions || 0,
          shots: dashboard.current_month_stats.shots || 0,
          avgAccuracy: dashboard.current_month_stats.avg_accuracy || 0,
          cost: dashboard.current_month_stats.cost || 0
        });
      }

      // Ranga użytkownika
      if (dashboard.rank) {
        setRankInfo({
          rank: dashboard.rank.name || t('account.beginner'),
          passed_sessions: dashboard.rank.passed_sessions || 0,
          progress_percent: dashboard.rank.progress_percent || 0,
          is_max_rank: dashboard.rank.is_max_rank || false,
          next_rank: dashboard.rank.next_rank,
          next_rank_min: dashboard.rank.next_rank_min
        });
      } else {
        setRankInfo({ rank: t('account.beginner'), passed_sessions: 0, progress_percent: 0 });
      }

      // Status amunicji
      if (dashboard.ammo_status && Array.isArray(dashboard.ammo_status)) {
        setLowAmmoAlerts(dashboard.ammo_status);
      } else {
        setLowAmmoAlerts([]);
      }

      // Status konserwacji
      if (dashboard.maintenance_status) {
        if (dashboard.maintenance_status.state === 'OK') {
          setMaintenanceAlerts([]);
        } else {
          // Przekształć dane z backendu do formatu używanego w UI
          const alerts = dashboard.maintenance_status.items.map(item => ({
            gun: {
              id: item.gun_id,
              name: item.gun_name
            },
            status: {
              status: item.status,
              color: item.status === 'red' ? '#f44336' : '#ff9800',
              message: item.status === 'red' ? t('common.required') : t('common.soonRequired'),
              reason: item.reason
            }
          }));
          setMaintenanceAlerts(alerts);
        }
      } else {
        setMaintenanceAlerts([]);
      }

      // Poziom zaawansowania - opóźnione pobieranie (tylko tooltip)
      accountAPI.getSkillLevel()
        .then(res => {
          if (res.data) {
            setSkillLevel(res.data.skill_level || 'beginner');
          }
        })
        .catch(() => {
          setSkillLevel('beginner');
        });

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
              loading="lazy"
              decoding="async"
              style={{ width: '32px', height: '32px' }}
            />
            {t('dashboard.title')}
          </h2>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ 
            marginBottom: '1rem', 
            padding: '1rem',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb',
            borderRadius: '4px'
          }}>
            <strong>Błąd:</strong> {error}
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
                  backgroundColor: 'rgb(84, 84, 84)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  padding: 0
                }}>
                  {mostUsedGunImage ? (
                    <img 
                      src={mostUsedGunImage}
                      alt={mostUsedGun.name}
                      loading="lazy"
                      decoding="async"
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
                      loading="lazy"
                      decoding="async"
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
                
                {/* Statystyki broni */}
                <div style={{ 
                  display: 'grid', 
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>{t('dashboard.sessions')}</span>
                    <span style={{ fontWeight: 'bold' }}>{mostUsedGunStats.sessionsCount}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>{t('dashboard.shots')}</span>
                    <span style={{ fontWeight: 'bold' }}>{mostUsedGunStats.shotsCount}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>{t('dashboard.cost')}</span>
                    <span style={{ fontWeight: 'bold', color: '#007bff' }}>
                      {formatCurrency(mostUsedGunStats.totalCost)}
                    </span>
                  </div>
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
                {/* Ikona rangi */}
                {(() => {
                  const rankName = rankInfo.rank || "Nowicjusz";
                  const rankMap = {
                    "Nowicjusz": 1,
                    "Adepciak": 2,
                    "Stabilny Strzelec": 3,
                    "Celny Strzelec": 4,
                    "Precyzyjny Strzelec": 5,
                    "Zaawansowany Strzelec": 6
                  };
                  const rankNumber = rankMap[rankName];
                  if (rankNumber) {
                    return (
                      <div style={{ 
                        textAlign: 'center', 
                        marginBottom: '1rem',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        <img 
                          src={`/badges/rank_${String(rankNumber).padStart(2, '0')}.png`}
                          alt={rankName}
                          loading="lazy"
                          decoding="async"
                          style={{ 
                            maxWidth: '180px',
                            maxHeight: '180px',
                            width: 'auto',
                            height: 'auto',
                            objectFit: 'contain'
                          }}
                        />
                      </div>
                    );
                  }
                  return null;
                })()}
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
            {(lowAmmoAlerts && lowAmmoAlerts.length > 0) ? (
              <div>
                {lowAmmoAlerts.slice(0, 3).map((item, index) => (
                  item ? (
                    <div key={item.id || index} style={{ marginBottom: index < lowAmmoAlerts.length - 1 ? '1rem' : '0' }}>
                      <div style={{ 
                        fontWeight: 'bold',
                        marginBottom: '0.25rem'
                      }}>
                        {item.name || '-'}
                      </div>
                      <div style={{ 
                        fontSize: '0.9rem',
                        color: 'var(--text-tertiary)',
                        marginBottom: '0.5rem'
                      }}>
                        {item.caliber ? `${item.caliber} - ` : ''}{item.units_in_package || 0} {t('dashboard.fromStock')}
                      </div>
                    </div>
                  ) : null
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
            {(maintenanceAlerts && maintenanceAlerts.length > 0) ? (
              <div>
                {maintenanceAlerts.slice(0, 3).map((alert, index) => (
                  alert && alert.gun ? (
                    <div key={alert.gun.id || index} style={{ marginBottom: index < maintenanceAlerts.length - 1 ? '1rem' : '0' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                          {(alert.status?.status === 'yellow' || alert.status?.status === 'red') && <MaintenanceStatusIcon status={alert.status.status} />}
                          <Link 
                            to={`/my-weapons?gun_id=${alert.gun.id}`}
                            style={{ 
                              color: alert.status?.color || '#aaa', 
                              textDecoration: 'none',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                          >
                            {alert.gun.name || '-'}
                          </Link>
                        </div>
                        {(alert.status?.status === 'yellow' || alert.status?.status === 'red') && alert.status?.reason && (
                          <span style={{ fontSize: '0.8rem', color: '#aaa', marginLeft: '1.5rem' }}>
                            {alert.status.reason}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : null
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

