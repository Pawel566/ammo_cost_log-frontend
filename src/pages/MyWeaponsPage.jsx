import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { gunsAPI, attachmentsAPI, shootingSessionsAPI, ammoAPI, maintenanceAPI, settingsAPI } from '../services/api';
import imageCompression from 'browser-image-compression';

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

const AddGunImageIcon = ({ onClick }) => {
  return (
    <img 
      src="/assets/Add_weapon_icon.png" 
      alt="Dodaj zdjęcie broni"
      onClick={onClick}
      style={{ 
        cursor: 'pointer',
        width: '100%',
        height: '100%',
        objectFit: 'contain'
      }}
    />
  );
};

const MyWeaponsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [guns, setGuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedGun, setExpandedGun] = useState(null);
  const [attachments, setAttachments] = useState({});
  const [maintenance, setMaintenance] = useState({});
  const [sessions, setSessions] = useState({});
  const [ammo, setAmmo] = useState([]);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showMaintenanceDetailsModal, setShowMaintenanceDetailsModal] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);
  const [editingMaintenance, setEditingMaintenance] = useState(null);
  const [openMaintenanceMenu, setOpenMaintenanceMenu] = useState(null);
  const [attachmentForm, setAttachmentForm] = useState({ 
    type: 'red_dot', 
    name: '', 
    notes: '',
    precision_help: 'low',
    recoil_reduction: 'none',
    ergonomics: 'medium'
  });
  const [maintenanceForm, setMaintenanceForm] = useState({ 
    date: new Date().toISOString().split('T')[0], 
    notes: '',
    activities: []
  });
  const [showActivitiesList, setShowActivitiesList] = useState(false);
  const [userSettings, setUserSettings] = useState({
    maintenance_rounds_limit: 500,
    maintenance_days_limit: 90,
    maintenance_notifications_enabled: true,
    low_ammo_notifications_enabled: true
  });
  const [weaponImages, setWeaponImages] = useState({});
  const [openImageMenu, setOpenImageMenu] = useState(null);
  const [expandedImage, setExpandedImage] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null, itemName: '' });

  const getMaintenanceActivities = () => [
    t('myWeapons.activities.cleaning'),
    t('myWeapons.activities.barrelCleaning'),
    t('myWeapons.activities.chamberCleaning'),
    t('myWeapons.activities.slideCleaning'),
    t('myWeapons.activities.boltCleaning'),
    t('myWeapons.activities.firingPinCleaning'),
    t('myWeapons.activities.firingPinChannelCleaning'),
    t('myWeapons.activities.magazineCleaning'),
    t('myWeapons.activities.lubrication'),
    t('myWeapons.activities.railLubrication'),
    t('myWeapons.activities.boltLubrication'),
    t('myWeapons.activities.inspection'),
    t('myWeapons.activities.springWearCheck'),
    t('myWeapons.activities.boltLatchCheck'),
    t('myWeapons.activities.gasSystemCheck'),
    t('myWeapons.activities.pinsCheck'),
    t('myWeapons.activities.magazineInspection'),
    t('myWeapons.activities.railAndOpticMountCheck'),
    t('myWeapons.activities.barrelVisualCheck'),
    t('myWeapons.activities.triggerCheck'),
    t('myWeapons.activities.safetyCheck'),
    t('myWeapons.activities.service'),
    t('myWeapons.activities.opticZeroing'),
    t('myWeapons.activities.partsReplacement'),
    t('myWeapons.activities.opticCheck')
  ];

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchGuns(),
        fetchAmmo(),
        fetchAllMaintenance(),
        fetchAllSessions(),
        fetchSettings()
      ]);
      
      // Sprawdź query param po załadowaniu danych
      const gunIdFromQuery = searchParams.get('gun_id');
      if (gunIdFromQuery) {
        setExpandedGun(gunIdFromQuery);
      }
    };
    
    loadData();
  }, []);

  useEffect(() => {
    const fetchWeaponImages = async () => {
      if (guns.length === 0) return;
      
      const imagePromises = guns.map(async (gun) => {
        try {
          const response = await gunsAPI.getImage(gun.id);
          return { gunId: gun.id, url: response.data?.url || null };
        } catch (err) {
          // Cicho ignoruj błędy - po prostu nie pokazuj zdjęcia
          return { gunId: gun.id, url: null };
        }
      });
      
      try {
        const images = await Promise.all(imagePromises);
        const imagesMap = {};
        images.forEach(({ gunId, url }) => {
          imagesMap[gunId] = url;
        });
        setWeaponImages(imagesMap);
      } catch (err) {
        // Ignoruj błędy - nie blokuj renderowania strony
        console.error('Błąd pobierania zdjęć broni:', err);
      }
    };
    
    fetchWeaponImages();
  }, [guns]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMaintenanceMenu && !event.target.closest('[data-maintenance-menu]')) {
        setOpenMaintenanceMenu(null);
      }
      if (openImageMenu && !event.target.closest('[data-image-menu]')) {
        setOpenImageMenu(null);
      }
    };

    if (openMaintenanceMenu || openImageMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMaintenanceMenu, openImageMenu]);

  useEffect(() => {
    if (expandedGun) {
      fetchGunDetails(expandedGun);
      // Aktualizuj URL bez przeładowania strony tylko jeśli się różni
      const currentGunId = searchParams.get('gun_id');
      if (currentGunId !== expandedGun) {
        setSearchParams({ gun_id: expandedGun }, { replace: true });
      }
    } else {
      // Jeśli expandedGun jest null, usuń query param
      if (searchParams.get('gun_id')) {
        setSearchParams({}, { replace: true });
      }
    }
  }, [expandedGun]);

  // Resetuj typ dodatku jeśli nie jest dozwolony dla aktualnej broni
  useEffect(() => {
    if (expandedGun && showAttachmentModal) {
      const currentGun = guns.find(g => g.id === expandedGun);
      const allowedTypes = getAllowedAttachmentTypes(currentGun?.type);
      if (!allowedTypes.includes(attachmentForm.type) && allowedTypes.length > 0) {
        const firstAllowed = allowedTypes[0];
        const defaults = getAttachmentDefaults(firstAllowed);
        setAttachmentForm({
          ...attachmentForm,
          type: firstAllowed,
          precision_help: defaults.precision_help,
          recoil_reduction: defaults.recoil_reduction,
          ergonomics: defaults.ergonomics
        });
      }
    }
  }, [expandedGun, showAttachmentModal]);

  const fetchGuns = async () => {
    try {
      setLoading(true);
      const response = await gunsAPI.getAll();
      const data = response.data;
      const items = Array.isArray(data) ? data : data?.items ?? [];
      // Usuń duplikaty na podstawie ID
      const uniqueGuns = items.filter((gun, index, self) => 
        index === self.findIndex(g => g.id === gun.id)
      );
      setGuns(uniqueGuns);
      setError('');
    } catch (err) {
      setError(t('myWeapons.errorLoading'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAmmo = async () => {
    try {
      const response = await ammoAPI.getAll();
      const data = response.data;
      const items = Array.isArray(data) ? data : data?.items ?? [];
      setAmmo(items);
    } catch (err) {
      console.error('Błąd pobierania amunicji:', err);
    }
  };

  const fetchAllMaintenance = async () => {
    try {
      const response = await maintenanceAPI.getAll();
      const allMaintenance = response.data || [];
      
      // Grupuj konserwacje według gun_id
      const maintenanceByGun = {};
      allMaintenance.forEach(maint => {
        if (!maintenanceByGun[maint.gun_id]) {
          maintenanceByGun[maint.gun_id] = [];
        }
        maintenanceByGun[maint.gun_id].push(maint);
      });
      
      // Sortuj każdą grupę według daty (najnowsza pierwsza)
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
      
      // Grupuj sesje według gun_id
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

  const fetchGunDetails = async (gunId) => {
    try {
      const [attachmentsRes, maintenanceRes, sessionsRes] = await Promise.all([
        attachmentsAPI.getForGun(gunId).catch(() => ({ data: [] })),
        maintenanceAPI.getForGun(gunId).catch(() => ({ data: [] })),
        shootingSessionsAPI.getAll({ gun_id: gunId, limit: 100 }).catch(() => ({ data: [] }))
      ]);
      
      setAttachments({ ...attachments, [gunId]: attachmentsRes.data || [] });
      setMaintenance({ ...maintenance, [gunId]: maintenanceRes.data || [] });
      
      const gunSessions = Array.isArray(sessionsRes.data) ? sessionsRes.data : [];
      setSessions({ ...sessions, [gunId]: gunSessions });
    } catch (err) {
      console.error('Błąd pobierania szczegółów broni:', err);
    }
  };

  const getAllowedAttachmentTypes = (gunType) => {
    if (!gunType) return ['red_dot', 'reflex', 'lpvo', 'magnifier', 'suppressor', 'compensator', 'foregrip', 'angled_grip', 'bipod', 'tactical_light'];
    
    const normalizedType = gunType.toLowerCase().trim();
    
    // Mapowanie typów broni na dozwolone typy dodatków
    // Obsługujemy różne formaty: polskie nazwy, angielskie, stare formaty
    if (normalizedType === 'pistol' || normalizedType === 'pistolet' || normalizedType.includes('broń krótka')) {
      // Pistolet
      return ['red_dot', 'reflex', 'compensator', 'suppressor', 'tactical_light'];
    } else if (normalizedType.includes('pistolet maszynowy') || normalizedType.includes('pcc') || normalizedType.includes('pm') || normalizedType.includes('pdw')) {
      // Pistolet maszynowy (PCC, PM, PDW)
      return ['red_dot', 'reflex', 'lpvo', 'magnifier', 'suppressor', 'compensator', 'foregrip', 'angled_grip', 'tactical_light'];
    } else if (normalizedType === 'karabinek' || normalizedType === 'carbine' || normalizedType.includes('ar-15') || normalizedType.includes('ak') || normalizedType.includes('grot') || normalizedType.includes('mcx')) {
      // Karabinek (AR-15, AK, Grot, SIG MCX)
      return ['red_dot', 'reflex', 'lpvo', 'magnifier', 'suppressor', 'compensator', 'foregrip', 'angled_grip', 'bipod', 'tactical_light'];
    } else if (normalizedType === 'rifle' || normalizedType === 'karabin' || normalizedType.includes('bolt-action') || normalizedType.includes('dmr') || normalizedType.includes('precyzyjna')) {
      // Karabin (długa broń precyzyjna, bolt-action, DMR)
      return ['lpvo', 'red_dot', 'suppressor', 'compensator', 'bipod'];
    } else if (normalizedType === 'shotgun' || normalizedType === 'strzelba') {
      // Strzelba (Shotgun)
      return ['red_dot', 'reflex', 'compensator', 'suppressor', 'tactical_light'];
    } else if (normalizedType === 'rewolwer' || normalizedType === 'revolver') {
      // Rewolwer
      return ['red_dot', 'reflex', 'compensator', 'tactical_light'];
    } else {
      // Inna - wszystkie typy dozwolone
      return ['red_dot', 'reflex', 'lpvo', 'magnifier', 'suppressor', 'compensator', 'foregrip', 'angled_grip', 'bipod', 'tactical_light'];
    }
  };

  const getAttachmentDefaults = (type) => {
    const defaults = {
      red_dot: { precision_help: 'low', recoil_reduction: 'none', ergonomics: 'medium' },
      reflex: { precision_help: 'low', recoil_reduction: 'none', ergonomics: 'high' },
      lpvo: { precision_help: 'medium', recoil_reduction: 'none', ergonomics: 'low' },
      magnifier: { precision_help: 'medium', recoil_reduction: 'none', ergonomics: 'low' },
      suppressor: { precision_help: 'low', recoil_reduction: 'medium', ergonomics: 'none' },
      compensator: { precision_help: 'none', recoil_reduction: 'high', ergonomics: 'none' },
      foregrip: { precision_help: 'low', recoil_reduction: 'low', ergonomics: 'medium' },
      angled_grip: { precision_help: 'low', recoil_reduction: 'none', ergonomics: 'high' },
      bipod: { precision_help: 'high', recoil_reduction: 'medium', ergonomics: 'low' },
      tactical_light: { precision_help: 'none', recoil_reduction: 'none', ergonomics: 'low' }
    };
    return defaults[type] || { precision_help: 'none', recoil_reduction: 'none', ergonomics: 'none' };
  };

  const handleAttachmentTypeChange = (type) => {
    const defaults = getAttachmentDefaults(type);
    setAttachmentForm({
      ...attachmentForm,
      type: type,
      precision_help: defaults.precision_help,
      recoil_reduction: defaults.recoil_reduction,
      ergonomics: defaults.ergonomics
    });
  };

  const handleAddAttachment = async (e) => {
    e.preventDefault();
    try {
      await attachmentsAPI.create(expandedGun, attachmentForm);
      setShowAttachmentModal(false);
      setAttachmentForm({ 
        type: 'red_dot', 
        name: '', 
        notes: '',
        precision_help: 'low',
        recoil_reduction: 'none',
        ergonomics: 'medium'
      });
      fetchGunDetails(expandedGun);
      fetchGuns();
    } catch (err) {
      setError(err.response?.data?.detail || t('myWeapons.errorAddingAttachment'));
    }
  };

  const handleDeleteAttachment = async (attachmentId, attachmentName) => {
    setConfirmModal({
      show: true,
      title: 'Usuń dodatek',
      message: `Czy na pewno chcesz usunąć dodatek "${attachmentName}"?`,
      itemName: attachmentName,
      onConfirm: async () => {
        try {
          await attachmentsAPI.delete(attachmentId);
          setConfirmModal({ show: false, title: '', message: '', onConfirm: null, itemName: '' });
          fetchGunDetails(expandedGun);
          fetchGuns();
        } catch (err) {
          setError(err.response?.data?.detail || t('common.errorDeleting', { item: 'equipment' }));
          setConfirmModal({ show: false, title: '', message: '', onConfirm: null, itemName: '' });
        }
      }
    });
  };

  const handleAddMaintenance = async (e) => {
    e.preventDefault();
    if (!expandedGun && !editingMaintenance) {
      setError(t('myWeapons.noWeaponSelected'));
      return;
    }
    try {
      let formData;
      if (editingMaintenance) {
        formData = {};
        if (maintenanceForm.date) {
          formData.date = maintenanceForm.date;
        }
        if (maintenanceForm.notes !== undefined) {
          formData.notes = maintenanceForm.notes || null;
        }
        if (maintenanceForm.activities !== undefined) {
          formData.activities = maintenanceForm.activities.length > 0 ? maintenanceForm.activities : null;
        }
        await maintenanceAPI.update(editingMaintenance.id, formData);
      } else {
        formData = {
          date: maintenanceForm.date,
          notes: maintenanceForm.notes || null,
          activities: (maintenanceForm.activities && Array.isArray(maintenanceForm.activities) && maintenanceForm.activities.length > 0) ? maintenanceForm.activities : null
        };
        await maintenanceAPI.create(expandedGun, formData);
      }
      setShowMaintenanceModal(false);
      setEditingMaintenance(null);
      setShowActivitiesList(false);
      setMaintenanceForm({ 
        date: new Date().toISOString().split('T')[0], 
        notes: '',
        activities: []
      });
      await fetchGunDetails(expandedGun);
      await fetchAllMaintenance();
      fetchGuns();
    } catch (err) {
      setError(err.response?.data?.detail || t('common.errorSaving', { item: 'maintenance' }));
      console.error(err);
    }
  };

  const handleEditMaintenance = (maint) => {
    setEditingMaintenance(maint);
    const dateValue = maint.date instanceof Date 
      ? maint.date.toISOString().split('T')[0]
      : maint.date.split('T')[0];
    setMaintenanceForm({
      date: dateValue,
      notes: maint.notes || '',
      activities: maint.activities || []
    });
    setShowActivitiesList(maint.activities && maint.activities.length > 0);
    setShowMaintenanceModal(true);
  };

  const handleDeleteMaintenance = async (maintenanceId, maintenanceDate) => {
    const dateStr = maintenanceDate ? new Date(maintenanceDate).toLocaleDateString('pl-PL') : '';
    setConfirmModal({
      show: true,
      title: 'Usuń konserwację',
      message: `Czy na pewno chcesz usunąć konserwację z dnia ${dateStr}?`,
      itemName: dateStr,
      onConfirm: async () => {
        try {
          await maintenanceAPI.delete(maintenanceId);
          setConfirmModal({ show: false, title: '', message: '', onConfirm: null, itemName: '' });
          await fetchGunDetails(expandedGun);
          await fetchAllMaintenance();
          fetchGuns();
        } catch (err) {
          setError(err.response?.data?.detail || t('common.errorDeleting', { item: 'maintenance' }));
          setConfirmModal({ show: false, title: '', message: '', onConfirm: null, itemName: '' });
        }
      }
    });
  };

  const getAttachmentTypeLabel = (type) => {
    const labels = {
      red_dot: 'Kolimator (Red Dot)',
      reflex: 'Otwarty kolimator / Reflex Sight',
      lpvo: 'Optyka LPVO',
      magnifier: 'Powiększalnik (Magnifier)',
      suppressor: 'Tłumik (suppressor)',
      compensator: 'Hamulec wylotowy / kompensator',
      foregrip: 'Chwyt pionowy (foregrip)',
      angled_grip: 'Chwyt kątowy (angled grip)',
      bipod: 'Dwójnóg (bipod)',
      tactical_light: 'Latarka taktyczna'
    };
    return labels[type] || type;
  };

  const getAttachmentsCount = (gunId) => {
    return attachments[gunId]?.length || 0;
  };

  const getGunTypeLabel = (type) => {
    // Mapowanie starych wartości na nowe
    if (type === 'Broń krótka') {
      return t('guns.pistol');
    }
    
    const labels = {
      pistol: t('guns.pistol'),
      rifle: t('guns.rifle'),
      shotgun: t('guns.shotgun'),
      other: t('guns.other')
    };
    return labels[type?.toLowerCase()] || type || t('guns.other');
  };

  const getLastMaintenance = (gunId) => {
    const gunMaintenance = maintenance[gunId];
    if (!gunMaintenance || gunMaintenance.length === 0) {
      return null;
    }
    // Konserwacje są już posortowane od najnowszej
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
      if (!gunSessions || !Array.isArray(gunSessions) || gunSessions.length === 0) {
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

    let color, message, reason = '';
    const roundsPercentage = Math.round((rounds / roundsLimit) * 100);
    const daysPercentage = Math.round((days / daysLimit) * 100);

    if (finalStatus === 'red') {
      color = '#f44336';
      message = t('common.required');
      if (useRounds && rounds >= roundsLimit) {
        reason = `${t('common.required')}: ${t('common.shots')} ${rounds}/${roundsLimit}`;
      } else if (!useRounds && days >= daysLimit) {
        reason = `${t('common.required')}: ${days}/${daysLimit} ${t('common.days')}`;
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

  const getTotalShots = (gunId) => {
    const gunSessions = sessions[gunId];
    if (!gunSessions || !Array.isArray(gunSessions)) return 0;
    return gunSessions.reduce((total, session) => total + (session.shots || 0), 0);
  };

  const getAverageAccuracy = (gunId) => {
    const gunSessions = sessions[gunId];
    if (!gunSessions || !Array.isArray(gunSessions)) return 0;
    
    const accuracySessions = gunSessions.filter(s => 
      s.hits !== null && s.hits !== undefined && s.distance_m
    );
    
    if (accuracySessions.length === 0) return 0;
    
    const totalShots = accuracySessions.reduce((sum, session) => sum + (session.shots || 0), 0);
    const totalHits = accuracySessions.reduce((sum, session) => sum + (session.hits || 0), 0);
    
    return totalShots > 0 ? (totalHits / totalShots) * 100 : 0;
  };

  const handleImageUpload = async (gunId, e) => {
    e.stopPropagation();
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(t('myWeapons.fileMustBeImage'));
      return;
    }

    try {
      setError('');
      
      const options = {
        maxSizeMB: 0.4,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };
      
      const compressedFile = await imageCompression(file, options);
      
      const formData = new FormData();
      formData.append('file', compressedFile, file.name);

      await gunsAPI.uploadImage(gunId, formData);
      
      const response = await gunsAPI.getImage(gunId);
      setWeaponImages({ ...weaponImages, [gunId]: response.data.url });
      
      await fetchGuns();
      setOpenImageMenu(null);
    } catch (err) {
      setError(err.response?.data?.detail || t('myWeapons.errorUploadingImage'));
      console.error(err);
    }
    
    e.target.value = '';
  };

  const handleImageDelete = async (gunId) => {
    setConfirmModal({
      show: true,
      title: 'Usuń zdjęcie',
      message: 'Czy na pewno chcesz usunąć zdjęcie broni?',
      itemName: 'zdjęcie',
      onConfirm: async () => {
        try {
          setError('');
          await gunsAPI.deleteImage(gunId);
          setWeaponImages({ ...weaponImages, [gunId]: null });
          await fetchGuns();
          setOpenImageMenu(null);
          setConfirmModal({ show: false, title: '', message: '', onConfirm: null, itemName: '' });
        } catch (err) {
          setError(err.response?.data?.detail || t('common.errorDeleting', { item: 'image' }));
          console.error(err);
          setConfirmModal({ show: false, title: '', message: '', onConfirm: null, itemName: '' });
        }
      }
    });
  };

  const handleImageClick = (gunId, e) => {
    e.stopPropagation();
    if (weaponImages[gunId]) {
      setExpandedImage(weaponImages[gunId]);
    }
  };

  if (loading) {
    return <div className="text-center">{t('common.loading')}</div>;
  }

  const maintenanceActivities = getMaintenanceActivities();

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>{t('myWeapons.title')}</h2>
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}
        {guns.length === 0 ? (
          <p className="text-center">{t('myWeapons.noWeapons')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {guns.map((gun) => {
              const isExpanded = expandedGun === gun.id;
              const attCount = getAttachmentsCount(gun.id);
              const lastMaintenance = getLastMaintenance(gun.id);
              const maintenanceStatus = getMaintenanceStatus(gun.id);
              return (
                <div key={gun.id}>
                  <div 
                    className="card" 
                    style={{ 
                      marginBottom: '1rem',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isExpanded) {
                        setExpandedGun(null);
                      } else {
                        setExpandedGun(gun.id);
                      }
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', width: '100%' }}>
                      <div 
                        onClick={(e) => handleImageClick(gun.id, e)}
                        style={{
                          width: '80px',
                          height: '80px',
                          backgroundColor: 'var(--bg-secondary)',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          position: 'relative',
                          overflow: 'hidden',
                          cursor: weaponImages[gun.id] ? 'pointer' : 'default'
                        }}
                      >
                        {weaponImages[gun.id] ? (
                          <img
                            src={weaponImages[gun.id]}
                            alt={gun.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              pointerEvents: 'none'
                            }}
                          />
                        ) : (
                          <AddGunImageIcon onClick={(e) => {
                            e.stopPropagation();
                          }} />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0, marginBottom: '0.25rem' }}>{gun.name}</h3>
                        <p style={{ margin: '0.25rem 0', color: '#aaa', fontSize: '0.9rem' }}>
                          {gun.caliber && gun.caliber}
                        </p>
                        <p style={{ margin: '0.25rem 0', color: '#888', fontSize: '0.85rem' }}>
                          {getGunTypeLabel(gun.type)}
                        </p>
                        <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            {attCount > 0 && (
                              <span>{attCount} {attCount === 1 ? t('myWeapons.attachment') : attCount < 5 ? t('myWeapons.attachments') : t('myWeapons.attachmentsMany')}</span>
                            )}
                            {lastMaintenance && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ color: '#007bff' }}>
                                  {t('myWeapons.lastMaintenance')} {new Date(lastMaintenance.date).toLocaleDateString('pl-PL')}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{ position: 'relative', flexShrink: 0 }} data-image-menu>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenImageMenu(openImageMenu === gun.id ? null : gun.id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#aaa',
                            cursor: 'pointer',
                            fontSize: '1.2rem',
                            padding: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '4px'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-hover-bg)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          ⋯
                        </button>
                        {openImageMenu === gun.id && (
                          <div
                            style={{
                              position: 'absolute',
                              right: 0,
                              top: '100%',
                              marginTop: '0.25rem',
                              backgroundColor: 'var(--bg-secondary)',
                              border: `1px solid var(--border-color)`,
                              borderRadius: '8px',
                              minWidth: '150px',
                              zIndex: 1000,
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                              overflow: 'hidden'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <label
                              style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                textAlign: 'left',
                                fontSize: '0.9rem',
                                display: 'block'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-hover-bg)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(gun.id, e)}
                                style={{ display: 'none' }}
                                onClick={(e) => e.stopPropagation()}
                              />
                              {t('myWeapons.addImage')}
                            </label>
                            {weaponImages[gun.id] && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleImageDelete(gun.id);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '0.75rem 1rem',
                                  background: 'none',
                                  border: 'none',
                                  color: '#f44336',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  fontSize: '0.9rem',
                                  display: 'block',
                                  borderTop: `1px solid var(--border-color)`
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-hover-bg)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                {t('myWeapons.deleteImage')}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    
                    <div>

                      {/* Karta statystyk */}
                      <div className="card">
                        <h3 style={{ margin: 0, marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
                          {t('myWeapons.weaponStats')}
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          <li style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem', position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 0 }}>•</span>
                            {t('myWeapons.totalShots')} {getTotalShots(gun.id)}
                          </li>
                          <li style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem', position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 0 }}>•</span>
                            {t('myWeapons.avgAccuracy')} {getAverageAccuracy(gun.id).toFixed(1).replace('.', ',')}%
                          </li>
                          <li style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem', position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 0 }}>•</span>
                            {t('myWeapons.lastMaintenance')} {lastMaintenance 
                              ? new Date(lastMaintenance.date).toLocaleDateString('pl-PL')
                              : t('common.none')}
                          </li>
                          <li style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem', position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 0 }}>•</span>
                            {t('myWeapons.shotsSinceMaintenance')} {calculateRoundsSinceLastMaintenance(gun.id)}
                          </li>
                        </ul>
                        {userSettings.maintenance_notifications_enabled && (maintenanceStatus.status === 'yellow' || maintenanceStatus.status === 'red') && (
                          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MaintenanceStatusIcon status={maintenanceStatus.status} />
                                <span style={{ color: maintenanceStatus.color }}>{maintenanceStatus.message}</span>
                              </div>
                              {maintenanceStatus.reason && (
                                <span style={{ fontSize: '0.8rem', color: '#aaa', marginLeft: '3.5rem', marginTop: '0.1rem' }}>
                                  {maintenanceStatus.reason}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Karta dodatków */}
                      <div className="card">
                        <h3 style={{ margin: 0, marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
                          {t('myWeapons.attachments')}
                        </h3>
                        {attachments[gun.id]?.length > 0 ? (
                          <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontWeight: '500', marginBottom: '0.5rem' }}>Dodatki:</div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                              {attachments[gun.id].map((att) => (
                                <li key={att.id} style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <a
                                    href={`/attachment/${att.id}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      navigate(`/attachment/${att.id}`);
                                    }}
                                    style={{
                                      color: '#007bff',
                                      textDecoration: 'none',
                                      cursor: 'pointer',
                                      flex: 1
                                    }}
                                    onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                    onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                                  >
                                    - {getAttachmentTypeLabel(att.type)}: {att.name}
                                  </a>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteAttachment(att.id, `${getAttachmentTypeLabel(att.type)}: ${att.name}`);
                                    }}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#f44336',
                                      cursor: 'pointer',
                                      fontSize: '1rem',
                                      padding: '0.25rem 0.5rem',
                                      borderRadius: '4px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(244, 67, 54, 0.1)'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                    title="Usuń dodatek"
                                  >
                                    ×
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <p style={{ color: '#888', marginBottom: '1rem' }}>{t('myWeapons.noAttachments')}</p>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowAttachmentModal(true);
                          }}
                          style={{ 
                            color: '#007bff', 
                            textDecoration: 'none',
                            padding: 0,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <span>+</span> {t('myWeapons.addAttachment')}
                        </button>
                      </div>

                      {/* Karta konserwacji */}
                      <div className="card">
                        <h3 style={{ margin: 0, marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
                          {t('myWeapons.maintenance')}
                        </h3>
                        {maintenance[gun.id] && Array.isArray(maintenance[gun.id]) && maintenance[gun.id].length > 0 ? (
                          <div style={{ marginBottom: '1rem' }}>
                            {maintenance[gun.id]
                              .sort((a, b) => new Date(b.date) - new Date(a.date))
                              .map((maint) => (
                                <div 
                                  key={maint.id} 
                                  style={{ 
                                    marginBottom: '0.75rem', 
                                    padding: '0.75rem',
                                    backgroundColor: 'var(--bg-secondary)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    gap: '1rem'
                                  }}
                                >
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '500', marginBottom: '0.5rem', fontSize: '1rem' }}>
                                      {new Date(maint.date).toLocaleDateString('pl-PL')}
                                    </div>
                                    {maint.activities && maint.activities.length > 0 && (
                                      <div style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>
                                        <div style={{ marginBottom: '0.25rem', fontWeight: '500' }}>{t('myWeapons.activities')}</div>
                                        <ul style={{ margin: 0, paddingLeft: '1.25rem', listStyle: 'disc' }}>
                                          {maint.activities.map((activity, idx) => (
                                            <li key={idx} style={{ marginBottom: '0.15rem' }}>{activity}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                  <div style={{ position: 'relative' }} data-maintenance-menu>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMaintenanceMenu(openMaintenanceMenu === maint.id ? null : maint.id);
                                      }}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#aaa',
                                        cursor: 'pointer',
                                        fontSize: '1.2rem',
                                        padding: '0.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '4px'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                      ⋯
                                    </button>
                                    {openMaintenanceMenu === maint.id && (
                                      <div
                                        style={{
                                          position: 'absolute',
                                          right: 0,
                                          top: '100%',
                                          marginTop: '0.25rem',
                                          backgroundColor: 'var(--bg-secondary)',
                                          border: `1px solid var(--border-color)`,
                                          borderRadius: '8px',
                                          minWidth: '150px',
                                          zIndex: 1000,
                                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                                          overflow: 'hidden'
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenMaintenanceMenu(null);
                                            setSelectedMaintenance(maint);
                                            setShowMaintenanceDetailsModal(true);
                                          }}
                                          style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--text-primary)',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            fontSize: '0.9rem',
                                            display: 'block'
                                          }}
                                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-hover-bg)'}
                                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                          {t('common.details')}
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenMaintenanceMenu(null);
                                            handleEditMaintenance(maint);
                                          }}
                                          style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--text-primary)',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            fontSize: '0.9rem',
                                            display: 'block',
                                            borderTop: `1px solid var(--border-color)`
                                          }}
                                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-hover-bg)'}
                                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                          {t('common.edit')}
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenMaintenanceMenu(null);
                                            handleDeleteMaintenance(maint.id, maint.date);
                                          }}
                                          style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            background: 'none',
                                            border: 'none',
                                            color: '#f44336',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            fontSize: '0.9rem',
                                            display: 'block',
                                            borderTop: `1px solid var(--border-color)`
                                          }}
                                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-hover-bg)'}
                                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                          {t('common.delete')}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <p style={{ color: '#888', marginBottom: '1rem' }}>{t('myWeapons.noMaintenance')}</p>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingMaintenance(null);
                            setMaintenanceForm({ 
                              date: new Date().toISOString().split('T')[0], 
                              notes: '',
                              activities: []
                            });
                            setShowActivitiesList(false);
                            setShowMaintenanceModal(true);
                          }}
                          style={{ 
                            color: '#007bff', 
                            textDecoration: 'none',
                            padding: 0,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <span>+</span> {t('myWeapons.addMaintenance')}
                        </button>
                      </div>

                      {/* Karta historii użytkowania */}
                      <div className="card">
                        <h3 style={{ margin: 0, marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
                          {t('myWeapons.usageHistory')}
                        </h3>
                        {sessions[gun.id] && Array.isArray(sessions[gun.id]) && sessions[gun.id].length > 0 ? (
                          <div style={{ overflowX: 'auto' }}>
                            <table className="table" style={{ width: '100%' }}>
                              <thead>
                                <tr>
                                  <th>{t('myWeapons.date')}</th>
                                  <th>{t('myWeapons.ammunition')}</th>
                                  <th>{t('myWeapons.shots')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sessions[gun.id]
                                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                                  .map((session) => {
                                    const sessionAmmo = ammo.find(a => a.id === session.ammo_id);
                                    return (
                                      <tr key={session.id}>
                                        <td>{new Date(session.date).toLocaleDateString('pl-PL')}</td>
                                        <td>{sessionAmmo ? sessionAmmo.name : '-'}</td>
                                        <td>{session.shots}</td>
                                      </tr>
                                    );
                                  })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p style={{ color: '#888' }}>{t('myWeapons.noSessions')}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div 
              className="card" 
              style={{ 
                marginTop: '1rem', 
                cursor: 'pointer',
                textAlign: 'center',
                padding: '2rem',
                border: `2px dashed var(--border-color)`,
                backgroundColor: 'var(--bg-primary)'
              }}
              onClick={() => navigate('/guns')}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                e.currentTarget.style.borderColor = '#007bff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>+</div>
              <h3 style={{ margin: 0, color: '#007bff' }}>{t('myWeapons.addNewWeapon')}</h3>
            </div>
          </div>
        )}
      </div>

      {showAttachmentModal && (
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
            zIndex: 1000
          }}
          onClick={() => {
            setShowAttachmentModal(false);
            setAttachmentForm({ 
              type: 'red_dot', 
              name: '', 
              notes: '',
              precision_help: 'low',
              recoil_reduction: 'none',
              ergonomics: 'medium'
            });
          }}
        >
          <div
            className="card"
            style={{ maxWidth: '500px', width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{t('myWeapons.addAttachment')}</h3>
            <form onSubmit={handleAddAttachment}>
              <div className="form-group">
                <label className="form-label">Nazwa</label>
                <input
                  type="text"
                  className="form-input"
                  value={attachmentForm.name}
                  onChange={(e) => setAttachmentForm({ ...attachmentForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Typ</label>
                <select
                  className="form-input"
                  value={attachmentForm.type}
                  onChange={(e) => handleAttachmentTypeChange(e.target.value)}
                  required
                >
                  {(() => {
                    const currentGun = guns.find(g => g.id === expandedGun);
                    const allowedTypes = getAllowedAttachmentTypes(currentGun?.type);
                    const allOptions = [
                      { value: 'red_dot', label: 'Kolimator (Red Dot)' },
                      { value: 'reflex', label: 'Otwarty kolimator / Reflex Sight' },
                      { value: 'lpvo', label: 'Optyka LPVO' },
                      { value: 'magnifier', label: 'Powiększalnik (Magnifier)' },
                      { value: 'suppressor', label: 'Tłumik (suppressor)' },
                      { value: 'compensator', label: 'Hamulec wylotowy / kompensator' },
                      { value: 'foregrip', label: 'Chwyt pionowy (foregrip)' },
                      { value: 'angled_grip', label: 'Chwyt kątowy (angled grip)' },
                      { value: 'bipod', label: 'Dwójnóg (bipod)' },
                      { value: 'tactical_light', label: 'Latarka taktyczna' }
                    ];
                    
                    return allOptions
                      .filter(option => allowedTypes.includes(option.value))
                      .map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ));
                  })()}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Pomoc precyzji</label>
                <select
                  className="form-input"
                  value={attachmentForm.precision_help}
                  disabled
                  style={{ backgroundColor: 'var(--bg-secondary)', cursor: 'not-allowed', opacity: 0.7 }}
                  required
                >
                  <option value="none">none</option>
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
                <small style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                  Automatycznie ustawiane na podstawie typu
                </small>
              </div>
              <div className="form-group">
                <label className="form-label">Redukcja odrzutu</label>
                <select
                  className="form-input"
                  value={attachmentForm.recoil_reduction}
                  disabled
                  style={{ backgroundColor: 'var(--bg-secondary)', cursor: 'not-allowed', opacity: 0.7 }}
                  required
                >
                  <option value="none">none</option>
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
                <small style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                  Automatycznie ustawiane na podstawie typu
                </small>
              </div>
              <div className="form-group">
                <label className="form-label">Ergonomia</label>
                <select
                  className="form-input"
                  value={attachmentForm.ergonomics}
                  disabled
                  style={{ backgroundColor: 'var(--bg-secondary)', cursor: 'not-allowed', opacity: 0.7 }}
                  required
                >
                  <option value="none">none</option>
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
                <small style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                  Automatycznie ustawiane na podstawie typu
                </small>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary">
                  Dodaj wyposażenie
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAttachmentModal(false);
                    setAttachmentForm({ 
                      type: 'red_dot', 
                      name: '', 
                      notes: '',
                      precision_help: 'low',
                      recoil_reduction: 'none',
                      ergonomics: 'medium'
                    });
                  }}
                >
                  {t('myWeapons.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMaintenanceModal && (
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
            zIndex: 2000
          }}
          onClick={() => {
            setShowMaintenanceModal(false);
            setEditingMaintenance(null);
            setShowActivitiesList(false);
            setMaintenanceForm({ 
              date: new Date().toISOString().split('T')[0], 
              notes: '',
              activities: []
            });
          }}
        >
          <div
            className="card"
            style={{ maxWidth: '500px', width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{editingMaintenance ? t('myWeapons.editMaintenance') : t('myWeapons.addMaintenance')}</h3>
            <form onSubmit={handleAddMaintenance}>
              <div className="form-group">
                <label className="form-label">{t('myWeapons.maintenanceDate')}</label>
                <input
                  type="date"
                  className="form-input"
                  value={maintenanceForm.date}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('myWeapons.activitiesList')}</label>
                <div style={{ border: `1px solid var(--border-color)`, borderRadius: '4px', backgroundColor: 'var(--bg-secondary)' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowActivitiesList(!showActivitiesList);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-primary)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>
                      {maintenanceForm.activities && Array.isArray(maintenanceForm.activities) && maintenanceForm.activities.length > 0 
                        ? `${t('myWeapons.selected')} ${maintenanceForm.activities.length}` 
                        : t('myWeapons.selectActivities')}
                    </span>
                    <span style={{ fontSize: '0.8rem' }}>
                      {showActivitiesList ? '▼' : '▶'}
                    </span>
                  </button>
                  {showActivitiesList && (
                    <div style={{ 
                      padding: '0.5rem 0.5rem 0.5rem 0', 
                      borderTop: `1px solid var(--border-color)`,
                      maxHeight: '200px',
                      overflowY: 'auto',
                      textAlign: 'left'
                    }}>
                      {maintenanceActivities.map((activity) => {
                        const isSectionTitle = activity === t('myWeapons.activities.cleaning') ||
                                               activity === t('myWeapons.activities.lubrication') ||
                                               activity === t('myWeapons.activities.inspection') ||
                                               activity === t('myWeapons.activities.service');
                        
                        if (isSectionTitle) {
                          return (
                            <div
                              key={activity}
                              style={{
                                padding: '0.75rem 0.5rem 0.5rem 1rem',
                                fontWeight: '600',
                                fontSize: '1rem',
                                color: 'var(--text-primary)',
                                marginTop: '0.5rem',
                                borderTop: '1px solid var(--border-color)',
                                margin: '0.5rem 0 0.25rem 0',
                                paddingTop: '0.75rem'
                              }}
                            >
                              {activity}
                            </div>
                          );
                        }
                        
                        return (
                          <label
                            key={activity}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '0.5rem 0.5rem 0.5rem 1rem',
                              cursor: 'pointer',
                              borderRadius: '4px',
                              margin: 0
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-hover-bg)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <input
                              type="checkbox"
                              checked={maintenanceForm.activities && Array.isArray(maintenanceForm.activities) && maintenanceForm.activities.includes(activity)}
                              onChange={(e) => {
                                const currentActivities = maintenanceForm.activities || [];
                                if (e.target.checked) {
                                  setMaintenanceForm({
                                    ...maintenanceForm,
                                    activities: [...currentActivities, activity]
                                  });
                                } else {
                                  setMaintenanceForm({
                                    ...maintenanceForm,
                                    activities: currentActivities.filter(a => a !== activity)
                                  });
                                }
                              }}
                              style={{ cursor: 'pointer', margin: 0, marginRight: '1rem', flexShrink: 0, width: '16px', height: '16px', minWidth: '16px' }}
                            />
                            <span style={{ textAlign: 'left' }}>{activity}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t('myWeapons.maintenanceDescription')}</label>
                <textarea
                  className="form-input"
                  value={maintenanceForm.notes}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, notes: e.target.value })}
                  rows={3}
                  placeholder={t('myWeapons.descriptionPlaceholder')}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {t('myWeapons.saveMaintenance')}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowMaintenanceModal(false);
                    setEditingMaintenance(null);
                    setShowActivitiesList(false);
                    setMaintenanceForm({ 
                      date: new Date().toISOString().split('T')[0], 
                      notes: '',
                      activities: []
                    });
                  }}
                >
                  {t('myWeapons.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMaintenanceDetailsModal && selectedMaintenance && (
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
            zIndex: 1000
          }}
          onClick={() => {
            setShowMaintenanceDetailsModal(false);
            setSelectedMaintenance(null);
          }}
        >
          <div
            className="card"
            style={{ maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>{t('myWeapons.maintenanceDetails')}</h3>
              <button
                onClick={() => {
                  setShowMaintenanceDetailsModal(false);
                  setSelectedMaintenance(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#aaa',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  padding: '0.25rem 0.5rem'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#aaa' }}>
                  {t('myWeapons.executionDate')}
                </label>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', color: 'var(--text-primary)' }}>
                  {new Date(selectedMaintenance.date).toLocaleDateString('pl-PL')}
                </div>
              </div>

              {selectedMaintenance.activities && selectedMaintenance.activities.length > 0 && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#aaa' }}>
                    {t('myWeapons.activitiesList')}
                  </label>
                  <div style={{ padding: '0.75rem', backgroundColor: '#2c2c2c', borderRadius: '4px' }}>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', listStyle: 'disc', color: 'var(--text-primary)' }}>
                      {selectedMaintenance.activities.map((activity, idx) => (
                        <li key={idx} style={{ marginBottom: '0.5rem' }}>{activity}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {selectedMaintenance.notes && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#aaa' }}>
                    {t('myWeapons.description')}
                  </label>
                  <div style={{ padding: '0.75rem', backgroundColor: '#2c2c2c', borderRadius: '4px', color: '#fff', whiteSpace: 'pre-wrap' }}>
                    {selectedMaintenance.notes}
                  </div>
                </div>
              )}

              {!selectedMaintenance.notes && (!selectedMaintenance.activities || selectedMaintenance.activities.length === 0) && (
                <div style={{ color: '#888', textAlign: 'center', padding: '1rem' }}>
                  {t('myWeapons.noAdditionalInfo')}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                onClick={() => {
                  setShowMaintenanceDetailsModal(false);
                  const maintToEdit = selectedMaintenance;
                  setSelectedMaintenance(null);
                  handleEditMaintenance(maintToEdit);
                }}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {t('myWeapons.edit')}
              </button>
              <button
                onClick={() => {
                  setShowMaintenanceDetailsModal(false);
                  setSelectedMaintenance(null);
                }}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                {t('myWeapons.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {expandedImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            cursor: 'pointer'
          }}
          onClick={() => setExpandedImage(null)}
        >
          <img
            src={expandedImage}
            alt="Powiększone zdjęcie"
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain',
              borderRadius: '8px'
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setExpandedImage(null)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(0, 0, 0, 0.7)',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '2rem',
              padding: '0.5rem 1rem',
              borderRadius: '4px'
            }}
          >
            ×
          </button>
        </div>
      )}

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

export default MyWeaponsPage;
