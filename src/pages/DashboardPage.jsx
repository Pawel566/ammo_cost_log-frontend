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
  const [guns, setGuns] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [maintenance, setMaintenance] = useState([]);

  useEffect(() => {
    if (authReady) {
      fetchDashboardData();
    }
  }, [authReady]);

  const getLastMaintenance = (gunId) => {
    const gunMaintenance = (maintenance || []).filter(m => m && m.gun_id === gunId);
    if (!gunMaintenance || gunMaintenance.length === 0) {
      return null;
    }
    try {
      return gunMaintenance.sort((a, b) => {
        try {
          return new Date(b?.date || 0) - new Date(a?.date || 0);
        } catch {
          return 0;
        }
      })[0];
    } catch {
      return null;
    }
  };

  const calculateRoundsSinceLastMaintenance = (gunId) => {
    const gunSessions = (sessions || []).filter(s => s && s.gun_id === gunId);
    if (!gunSessions || gunSessions.length === 0) return 0;

    const lastMaint = getLastMaintenance(gunId);
    
    // Jeśli nie ma konserwacji, liczymy wszystkie strzały od pierwszej sesji
    if (!lastMaint || !lastMaint.date) {
      return gunSessions.reduce((sum, session) => sum + (session?.shots || 0), 0);
    }

    try {
      const maintenanceDate = new Date(lastMaint.date);
      
      // Jeśli jest konserwacja, liczymy tylko strzały po dacie konserwacji
      let totalRounds = 0;
      gunSessions.forEach(session => {
        if (session && session.date) {
          try {
            const sessionDate = new Date(session.date);
            if (sessionDate >= maintenanceDate) {
              totalRounds += session.shots || 0;
            }
          } catch {
            // Ignore invalid dates
          }
        }
      });

      return totalRounds;
    } catch {
      return gunSessions.reduce((sum, session) => sum + (session?.shots || 0), 0);
    }
  };

  const calculateDaysSinceLastMaintenance = (gunId) => {
    const lastMaint = getLastMaintenance(gunId);
    if (!lastMaint || !lastMaint.date) return null;

    try {
      const maintenanceDate = new Date(lastMaint.date);
      const today = new Date();
      const diffTime = today - maintenanceDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays;
    } catch {
      return null;
    }
  };

  const getMaintenanceStatus = (gunId) => {
    const lastMaint = getLastMaintenance(gunId);
    if (!lastMaint) {
      // Sprawdź czy broń ma sesje bez konserwacji
      const gunSessions = (sessions || []).filter(s => s && s.gun_id === gunId);
      if (gunSessions.length === 0) {
        return { status: 'none', color: '#888', message: '-', reason: '' };
      }
      const totalShots = gunSessions.reduce((sum, s) => sum + (s?.shots || 0), 0);
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
      // Pobierz tylko dane krytyczne dla pierwszego renderu
      const [gunsRes, sessionsRes, settingsRes, rankRes] = await Promise.all([
        gunsAPI.getAll().catch((err) => {
          console.error('Błąd pobierania broni w Dashboard:', {
            error: err,
            response: err.response,
            status: err.response?.status,
            data: err.response?.data
          });
          const errorMsg = err.response?.data?.message || err.response?.data?.detail || t('common.error');
          setError(`Błąd pobierania broni: ${errorMsg}`);
          return { data: { items: [], total: 0 } };
        }),
        shootingSessionsAPI.getAll().catch((err) => {
          console.error('Błąd pobierania sesji:', err);
          return { data: [] };
        }),
        settingsAPI.get().catch((err) => {
          console.error('Błąd pobierania ustawień:', err);
          return { data: null };
        }),
        accountAPI.getRank().catch((err) => {
          console.error('Błąd pobierania rangi:', err);
          // Dla nowych użytkowników może zwracać 404/503 - zwróć domyślne wartości
          if (err.response?.status === 404 || err.response?.status === 503) {
            return { data: { rank: t('account.beginner'), passed_sessions: 0, progress_percent: 0 } };
          }
          return { data: null };
        })
      ]);

      const gunsData = Array.isArray(gunsRes.data) ? gunsRes.data : (gunsRes.data?.items ?? []);
      const sessionsData = Array.isArray(sessionsRes.data) ? sessionsRes.data : (Array.isArray(sessionsRes.data?.items) ? sessionsRes.data.items : []);
      
      // Debug logging
      if (import.meta.env.MODE === 'development') {
        console.log('Dashboard main data loaded:', {
          gunsCount: gunsData.length,
          sessionsCount: sessionsData.length
        });
      }
      
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
      

      // Ranga użytkownika
      if (rankRes && rankRes.data) {
        setRankInfo(rankRes.data);
      } else {
        setRankInfo({ rank: t('account.beginner'), passed_sessions: 0, progress_percent: 0 });
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

      // Najczęściej używana broń
      const gunUsage = {};
      (sessionsData || []).forEach(session => {
        if (session && session.gun_id) {
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
        const gun = (gunsData || []).find(g => {
          if (!g) return false;
          const gId = typeof g.id === 'string' ? parseInt(g.id, 10) : g.id;
          const mId = typeof mostUsedGunId === 'string' ? parseInt(mostUsedGunId, 10) : mostUsedGunId;
          return gId === mId || g.id === mostUsedGunId;
        });
        if (gun) {
          setMostUsedGun(gun);
          
          // Oblicz statystyki dla tej broni
          const gunSessions = (sessionsData || []).filter(s => {
            if (!s) return false;
            const sGunId = typeof s.gun_id === 'string' ? parseInt(s.gun_id, 10) : s.gun_id;
            const gId = typeof gun.id === 'string' ? parseInt(gun.id, 10) : gun.id;
            return sGunId === gId || s.gun_id === gun.id;
          });
          
          const sessionsCount = gunSessions.length;
          const shotsCount = gunSessions.reduce((sum, s) => sum + (s?.shots || 0), 0);
          const totalCost = gunSessions.reduce((sum, s) => sum + (parseFloat(s?.cost) || 0), 0);
          
          setMostUsedGunStats({
            sessionsCount,
            shotsCount,
            totalCost
          });
          
          // Zdjęcie broni będzie pobrane lazy (po renderze)
        }
      }

      // Statystyki miesięczne (bieżący miesiąc)
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const monthSessions = (sessionsData || []).filter(s => {
        if (!s || !s.date) return false;
        try {
          const sessionDate = new Date(s.date);
          const sessionMonth = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, '0')}`;
          return sessionMonth === currentMonth;
        } catch {
          return false;
        }
      });

      const totalShots = monthSessions.reduce((sum, s) => sum + (s?.shots || 0), 0);
      const totalCost = monthSessions.reduce((sum, s) => sum + (parseFloat(s?.cost) || 0), 0);
      const accuracySessions = monthSessions.filter(s => s && s.hits !== null && s.hits !== undefined && s.distance_m);
      const totalHits = accuracySessions.reduce((sum, s) => sum + (s?.hits || 0), 0);
      const accuracyShots = accuracySessions.reduce((sum, s) => sum + (s?.shots || 0), 0);
      const avgAccuracy = accuracyShots > 0 
        ? (totalHits / accuracyShots) * 100 
        : 0;

      setMonthlyStats({
        sessions: monthSessions.length || 0,
        shots: totalShots || 0,
        avgAccuracy: avgAccuracy || 0,
        cost: totalCost || 0
      });

      // Ustaw dane przed obliczaniem statusu
      setGuns(gunsData);
      setSessions(sessionsData);

      // Pobierz dane pomocnicze asynchronicznie (opóźnione)
      fetchSecondaryData(newSettings, gunsData, sessionsData);

      setError(null);
    } catch (err) {
      setError(t('common.error'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Pobierz dane pomocnicze po załadowaniu głównych danych
  const fetchSecondaryData = async (newSettings, gunsData, sessionsData) => {
    try {
      // Pobierz ammo tylko jeśli jest potrzebne
      const ammoPromise = ammoAPI.getAll().catch((err) => {
        console.error('Błąd pobierania amunicji:', err);
        return { data: { items: [], total: 0 } };
      });

      // Pobierz maintenance tylko jeśli notifications są włączone
      const maintenancePromise = newSettings.maintenance_notifications_enabled
        ? maintenanceAPI.getAll().catch((err) => {
            console.error('Błąd pobierania konserwacji:', err);
            return { data: [] };
          })
        : Promise.resolve({ data: [] });

      const [ammoRes, maintenanceRes] = await Promise.all([ammoPromise, maintenancePromise]);

      const ammo = Array.isArray(ammoRes.data) ? ammoRes.data : (ammoRes.data?.items ?? []);
      const maintenanceData = Array.isArray(maintenanceRes.data) ? maintenanceRes.data : (maintenanceRes.data?.items ?? []);

      // Stan amunicji - wszystkie pozycje
      setLowAmmoAlerts((ammo || []).filter(item => item && (item.units_in_package || 0) > 0));

      // Alerty o konserwacji - użyj tej samej logiki co MyWeaponsPage
      if (newSettings.maintenance_notifications_enabled) {
        setMaintenance(maintenanceData);
        const alerts = [];
        (gunsData || []).forEach(gun => {
          if (!gun) return;
          const tempSettings = newSettings;
          const lastMaint = (maintenanceData || []).filter(m => m && m.gun_id === gun.id)
            .sort((a, b) => {
              try {
                return new Date(b?.date || 0) - new Date(a?.date || 0);
              } catch {
                return 0;
              }
            })[0];
          
          let rounds = 0;
          let days = null;
          
          if (lastMaint && lastMaint.date) {
            try {
              const maintenanceDate = new Date(lastMaint.date);
              const gunSessions = (sessionsData || []).filter(s => s && s.gun_id === gun.id);
              gunSessions.forEach(session => {
                if (session && session.date) {
                  try {
                    const sessionDate = new Date(session.date);
                    if (sessionDate >= maintenanceDate) {
                      rounds += session.shots || 0;
                    }
                  } catch {
                    // Ignore invalid dates
                  }
                }
              });
              const today = new Date();
              const diffTime = today - maintenanceDate;
              days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            } catch {
              // If date parsing fails, treat as no maintenance
            }
          } else {
            const gunSessions = (sessionsData || []).filter(s => s && s.gun_id === gun.id);
            rounds = gunSessions.reduce((sum, s) => sum + (s?.shots || 0), 0);
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
      } else {
        setMaintenance([]);
      }
    } catch (err) {
      console.error('Błąd pobierania danych pomocniczych:', err);
    }
  };

  // Lazy load zdjęcia broni po renderze mostUsedGun
  useEffect(() => {
    if (mostUsedGun && !mostUsedGunImage) {
      gunsAPI.getImage(mostUsedGun.id)
        .then(imageRes => {
          if (imageRes.data?.url) {
            setMostUsedGunImage(imageRes.data.url);
          }
        })
        .catch(() => {
          // Ignore errors - zdjęcie nie jest krytyczne
        });
    }
  }, [mostUsedGun, mostUsedGunImage]);

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

