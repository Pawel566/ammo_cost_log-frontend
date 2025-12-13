import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { gunsAPI, maintenanceAPI, shootingSessionsAPI, settingsAPI } from '../services/api';

const MaintenanceStatusIcon = ({ status }) => {
  const iconSize = 48;
  
  if (status === 'green' || status === 'ok') {
    // Zielona ikona z checkmarkiem - OK
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
    // Szara ikona z przekreśleniem - Nie dotyczy
    return (
      <svg width={iconSize} height={iconSize} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="9" fill="#888" stroke="none"/>
        <path d="M6 6 L14 14 M14 6 L6 14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    );
  }
};


// Mapowanie rodzajów broni do kalibrów
const CALIBERS_BY_GUN_TYPE = {
  'Pistolet': [
    '9×19',
    '.45 ACP',
    '.40 S&W',
    '.380 ACP (9×17)',
    '.32 ACP',
    '10 mm Auto',
    '.357 SIG',
    '.22 LR'
  ],
  'Pistolet maszynowy': [
    '9×19',
    '.45 ACP',
    '.40 S&W',
    '.380 ACP (9×17)',
    '.32 ACP',
    '10 mm Auto',
    '.357 SIG',
    '.22 LR'
  ],
  'Karabinek': [
    '5.56×45 / .223 Rem',
    '7.62×39',
    '7.62×51 / .308 Win',
    '7.62×54R',
    '6.5 Creedmoor',
    '.30-06 Springfield',
    '.300 WinMag',
    '.243 Win',
    '.270 Win',
    '.22 LR'
  ],
  'Karabin': [
    '5.56×45 / .223 Rem',
    '7.62×39',
    '7.62×51 / .308 Win',
    '7.62×54R',
    '6.5 Creedmoor',
    '.30-06 Springfield',
    '.300 WinMag',
    '.243 Win',
    '.270 Win',
    '.22 LR'
  ],
  'Strzelba': [
    '12/70',
    '12/76',
    '20/70',
    '.410 bore'
  ],
  'Rewolwer': [
    '.38 Special',
    '.357 Magnum',
    '.44 Magnum',
    '.44 Special',
    '.45 Colt',
    '.454 Casull'
  ],
  'Inna': [
    '4.6×30 HK',
    '5.7×28 FN',
    '.22 Hornet',
    '7.92×33 Kurz',
    '.458 SOCOM',
    '.50 Beowulf'
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [guns, setGuns] = useState([]);
  const [filteredGuns, setFilteredGuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [maintenance, setMaintenance] = useState({});
  const [sessions, setSessions] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    caliber: '',
    caliberCustom: '',
    type: '',
    notes: '',
    created_at: ''
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
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null, itemName: '' });
  
  // Ustawienia użytkownika
  const [userSettings, setUserSettings] = useState({
    maintenance_rounds_limit: 500,
    maintenance_days_limit: 90,
    maintenance_notifications_enabled: true,
    low_ammo_notifications_enabled: true
  });

  useEffect(() => {
    fetchGuns();
    fetchAllMaintenance();
    fetchAllSessions();
    fetchSettings();
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
      const errorMessage = err.response?.data?.message || err.response?.data?.detail || t('guns.errorLoading');
      setError(errorMessage);
      console.error('Błąd pobierania broni:', {
        error: err,
        response: err.response,
        message: errorMessage
      });
      // Ustaw puste dane, żeby strona się załadowała
      setGuns([]);
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
    const gunSessions = sessions[gunId];
    if (!gunSessions || !Array.isArray(gunSessions)) return 0;

    const lastMaint = getLastMaintenance(gunId);
    
    // Jeśli nie ma konserwacji, liczymy wszystkie strzały od pierwszej sesji
    if (!lastMaint) {
      return gunSessions.reduce((sum, session) => sum + (session.shots || 0), 0);
    }

    const maintenanceDate = new Date(lastMaint.date);
    
    // Jeśli jest konserwacja, liczymy tylko strzały po dacie konserwacji
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

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.get();
      setUserSettings({
        maintenance_rounds_limit: response.data.maintenance_rounds_limit || 500,
        maintenance_days_limit: response.data.maintenance_days_limit || 90,
        maintenance_notifications_enabled: response.data.maintenance_notifications_enabled !== undefined 
          ? response.data.maintenance_notifications_enabled : true,
        low_ammo_notifications_enabled: response.data.low_ammo_notifications_enabled !== undefined 
          ? response.data.low_ammo_notifications_enabled : true
      });
    } catch (err) {
      console.error('Błąd podczas pobierania ustawień:', err);
    }
  };

  const getMaintenanceStatus = (gunId) => {
    const lastMaint = getLastMaintenance(gunId);
    
    const rounds = calculateRoundsSinceLastMaintenance(gunId);
    const days = calculateDaysSinceLastMaintenance(gunId);
    
    // Jeśli nie ma konserwacji, sprawdź czy broń ma sesje bez konserwacji
    if (!lastMaint) {
      const gunSessions = sessions[gunId];
      if (!gunSessions || gunSessions.length === 0) {
        return { status: 'none', color: '#888', message: '-', reason: '' };
      }
      const totalShots = gunSessions.reduce((sum, s) => sum + (s.shots || 0), 0);
      const roundsLimit = userSettings.maintenance_rounds_limit || 500;
      const roundsPercentage = Math.round((totalShots / roundsLimit) * 100);
      
      if (totalShots >= roundsLimit) {
        return { 
          status: 'red', 
          color: '#f44336', 
          message: t('common.required'),
          reason: `${t('common.required')}: ${roundsPercentage}% (${totalShots}/${roundsLimit})`,
          rounds: totalShots,
          days: null
        };
      } else if (roundsPercentage >= 75) {
        return {
          status: 'yellow',
          color: '#ff9800',
          message: t('common.soonRequired'),
          reason: `${roundsPercentage}% (${totalShots}/${roundsLimit})`,
          rounds: totalShots,
          days: null
        };
      }
      // Jeśli nie przekroczono limitu strzałów, zwróć status 'green'
      return { status: 'green', color: '#4caf50', message: t('common.ok'), reason: '', rounds: totalShots, days: null };
    }

    const roundsLimit = userSettings.maintenance_rounds_limit || 500;
    const daysLimit = userSettings.maintenance_days_limit || 90;

    // Wybór kryterium: jeśli nie wystrzelaliśmy, to na podstawie dni; jeśli dni nie minęły, to na podstawie strzałów
    let useRounds = true;
    let percentage = 0;
    let finalStatus = 'green';

    if (rounds === 0) {
      // Jeśli nie wystrzelaliśmy, używamy dni
      useRounds = false;
      percentage = (days / daysLimit) * 100;
    } else if (days < daysLimit) {
      // Jeśli dni nie minęły, używamy strzałów
      useRounds = true;
      percentage = (rounds / roundsLimit) * 100;
    } else {
      // Jeśli dni minęły, używamy dni
      useRounds = false;
      percentage = (days / daysLimit) * 100;
    }

    // Status według procentów: zielona do 74%, żółta 75-99%, czerwona 100%+
    if (percentage >= 100) {
      finalStatus = 'red';
    } else if (percentage >= 75) {
      finalStatus = 'yellow';
    } else {
      finalStatus = 'green';
    }

    const colors = {
      green: '#4caf50',
      yellow: '#ff9800',
      red: '#f44336',
      none: '#888'
    };

    const messages = {
      green: t('common.ok'),
      yellow: t('common.soonRequired'),
      red: t('common.required'),
      none: '-'
    };

    let reason = '';
    const roundsPercentage = Math.round((rounds / roundsLimit) * 100);
    const daysPercentage = Math.round((days / daysLimit) * 100);

    if (finalStatus === 'red') {
      if (useRounds && rounds >= roundsLimit) {
        reason = `${t('common.required')}: ${roundsPercentage}% (${rounds}/${roundsLimit})`;
      } else if (!useRounds && days >= daysLimit) {
        reason = `${t('common.required')}: ${daysPercentage}% (${days}/${daysLimit} ${t('common.days')})`;
      } else if (useRounds) {
        reason = `${t('common.required')}: ${roundsPercentage}% (${rounds}/${roundsLimit})`;
      } else {
        reason = `${t('common.required')}: ${daysPercentage}% (${days}/${daysLimit} ${t('common.days')})`;
      }
    } else if (finalStatus === 'yellow') {
      if (useRounds) {
        reason = `${roundsPercentage}% (${rounds}/${roundsLimit})`;
      } else {
        reason = `${daysPercentage}% (${days}/${daysLimit} ${t('common.days')})`;
      }
    }

    return { status: finalStatus, color: colors[finalStatus], message: messages[finalStatus], reason, rounds, days };
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
        notes: formData.notes || null,
        created_at: formData.created_at || null
      };
      
      let gunName = formData.name;
      let gunType = formData.type || '';
      const gunDisplayName = `${gunType ? gunType + ' ' : ''}${gunName}`;
      if (editingId) {
        await gunsAPI.update(editingId, gunData);
        setEditingId(null);
        setSuccess(t('common.itemUpdated', { item: gunDisplayName }));
      } else {
        await gunsAPI.create(gunData);
        setSuccess(t('common.itemAdded', { item: gunDisplayName }));
      }
      
      setFormData({ name: '', caliber: '', caliberCustom: '', type: '', notes: '', created_at: '' });
      setUseCustomCaliber(false);
      setShowForm(false);
      setError(null);
      fetchGuns();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || t('common.errorSaving', { item: 'weapon' }));
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
      notes: gun.notes || '',
      created_at: gun.created_at ? gun.created_at.split('T')[0] : ''
    });
    setUseCustomCaliber(!isInList && gunCaliber !== '');
    setEditingId(gun.id);
    setShowForm(true);
    setActiveMenuId(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', caliber: '', caliberCustom: '', type: '', notes: '', created_at: '' });
    setUseCustomCaliber(false);
  };

  const handleDelete = async (id) => {
    const gunToDelete = guns.find(g => g.id === id);
    const gunName = gunToDelete ? gunToDelete.name : '';
    const gunType = gunToDelete ? (gunToDelete.type || '') : '';
    const gunDisplayName = `${gunType ? gunType + ' ' : ''}${gunName}`;
    
    setConfirmModal({
      show: true,
      title: 'Usuń broń',
      message: `Czy na pewno chcesz usunąć broń "${gunDisplayName}"?`,
      itemName: gunDisplayName,
      onConfirm: async () => {
        try {
          await gunsAPI.delete(id);
          setSuccess(t('common.itemDeleted', { item: gunDisplayName }));
          setConfirmModal({ show: false, title: '', message: '', onConfirm: null, itemName: '' });
          fetchGuns();
          setActiveMenuId(null);
          setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
          setError(err.response?.data?.detail || t('common.errorDeleting', { item: 'weapon' }));
          console.error(err);
          setConfirmModal({ show: false, title: '', message: '', onConfirm: null, itemName: '' });
        }
      }
    });
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
    return <div className="text-center">{t('common.loading')}</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>{t('guns.title')}</h2>
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
              color: 'var(--text-primary)',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            {t('guns.addWeapon')}
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

        {showForm && (
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
            onClick={handleCancel}
          >
            <div
              className="card"
              style={{
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative',
                marginBottom: 0
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleCancel}
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
                  lineHeight: 1,
                  zIndex: 1
                }}
                onMouseEnter={(e) => e.target.style.color = '#dc3545'}
                onMouseLeave={(e) => e.target.style.color = '#fff'}
              >
                ×
              </button>

              <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>
                {editingId ? t('guns.editWeapon') : t('guns.addNewWeapon')}
              </h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">{t('guns.weaponName')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('guns.weaponType')}</label>
                <select
                  className="form-input"
                  value={formData.type}
                  onChange={handleTypeChange}
                >
                  <option value="">{t('guns.selectType')}</option>
                  <option value="Pistolet">{t('guns.pistol')}</option>
                  <option value="Pistolet maszynowy">{t('guns.submachineGun')}</option>
                  <option value="Rewolwer">{t('guns.revolver')}</option>
                  <option value="Karabinek">{t('guns.carbine')}</option>
                  <option value="Karabin">{t('guns.rifle')}</option>
                  <option value="Strzelba">{t('guns.shotgun')}</option>
                  <option value="Inna">{t('guns.other')}</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('guns.caliber')}</label>
                {!useCustomCaliber ? (
                  <select
                    className="form-input"
                    value={formData.caliber}
                    onChange={handleCaliberChange}
                    disabled={!formData.type}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: 'var(--input-bg)',
                      color: 'var(--text-primary)',
                      border: `1px solid var(--border-color)`,
                      borderRadius: '4px',
                      fontSize: '1rem',
                      opacity: formData.type ? 1 : 0.6,
                      cursor: formData.type ? 'pointer' : 'not-allowed'
                    }}
                  >
                    <option value="">
                      {formData.type ? t('guns.selectCaliber') : t('guns.selectTypeFirst')}
                    </option>
                    {formData.type && getAvailableCalibers().map(caliber => (
                      <option key={caliber} value={caliber}>{caliber}</option>
                    ))}
                    {formData.type && <option value="custom">{t('guns.customCaliber')}</option>}
                  </select>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.caliberCustom}
                      onChange={handleCustomCaliberChange}
                      placeholder={t('guns.enterCustomCaliber')}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        backgroundColor: 'var(--input-bg)',
                        color: 'var(--text-primary)',
                        border: `1px solid var(--border-color)`,
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
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">{t('guns.notes')}</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ display: 'none' }}>
                <label className="form-label">{t('guns.createdAt')}</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.created_at}
                  onChange={(e) => setFormData({ ...formData, created_at: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={handleCancel}
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-success">
                  {editingId ? t('guns.saveChanges') : t('guns.addWeapon')}
                </button>
              </div>
            </form>
            </div>
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
                <label style={{ marginRight: '0.5rem', color: '#aaa', fontSize: '0.9rem' }}>{t('guns.filterByType')}</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    border: `1px solid var(--border-color)`,
                    borderRadius: '4px',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="">{t('common.all')}</option>
                  {getUniqueTypes().map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ marginRight: '0.5rem', color: '#aaa', fontSize: '0.9rem' }}>{t('guns.filterByCaliber')}</label>
                <select
                  value={caliberFilter}
                  onChange={(e) => setCaliberFilter(e.target.value)}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    border: `1px solid var(--border-color)`,
                    borderRadius: '4px',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="">{t('common.all')}</option>
                  {getUniqueCalibers().map(caliber => (
                    <option key={caliber} value={caliber}>{caliber}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#aaa', fontSize: '0.9rem' }}>{t('common.show')}:</span>
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
                  color: currentPage === 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
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
                  color: currentPage === totalPages ? 'var(--text-tertiary)' : 'var(--text-primary)',
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
              {t('guns.noWeaponsMatch')}
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
                      {t('common.name')}
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
                      {t('common.type')}
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
                      {t('guns.caliber')}
                    </th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: '#aaa', fontWeight: 'normal' }}>{t('guns.maintenance')}</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: '#aaa', fontWeight: 'normal' }}>{t('common.actions')}</th>
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
                          {userSettings.maintenance_notifications_enabled ? (
                            (maintenanceStatus.status === 'yellow' || maintenanceStatus.status === 'red') ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <MaintenanceStatusIcon status={maintenanceStatus.status} />
                                  <span style={{ color: maintenanceStatus.color }}>{maintenanceStatus.message}</span>
                                </div>
                                {maintenanceStatus.reason && (
                                  <span style={{ fontSize: '0.8rem', color: '#aaa', marginLeft: '1.5rem' }}>
                                    {maintenanceStatus.reason}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: '#888' }}>-</span>
                            )
                          ) : (
                            <span style={{ color: '#888' }}>-</span>
                          )}
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
                                  backgroundColor: 'var(--bg-secondary)',
                                  border: `1px solid var(--border-color)`,
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
                                      color: 'var(--text-primary)',
                                      borderBottom: `1px solid var(--border-color)`
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-hover-bg)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                  >
                                    {t('common.details')}
                                  </div>
                                )}
                                <div
                          onClick={() => handleEdit(gun)}
                                  style={{
                                    padding: '0.75rem 1rem',
                                    cursor: 'pointer',
                                    color: 'var(--text-primary)',
                                    borderBottom: user ? `1px solid var(--border-color)` : 'none'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-hover-bg)'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          {t('common.edit')}
                                </div>
                                <div
                          onClick={() => handleDelete(gun.id)}
                                  style={{
                                    padding: '0.75rem 1rem',
                                    cursor: 'pointer',
                                    color: '#f44336'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-hover-bg)'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          {t('common.delete')}
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

      {confirmModal.show && (
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
            zIndex: 3000
          }}
          onClick={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: null, itemName: '' })}
        >
          <div
            className="card"
            style={{ maxWidth: '400px', width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: 0, marginBottom: '1rem', color: '#f44336' }}>{confirmModal.title}</h3>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>{confirmModal.message}</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: null, itemName: '' })}
                className="btn btn-secondary"
              >
                Anuluj
              </button>
              <button
                onClick={() => {
                  if (confirmModal.onConfirm) {
                    confirmModal.onConfirm();
                  }
                }}
                className="btn btn-primary"
                style={{ backgroundColor: '#f44336', borderColor: '#f44336' }}
              >
                Usuń
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GunsPage;
