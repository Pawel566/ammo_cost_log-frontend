import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { gunsAPI, attachmentsAPI, shootingSessionsAPI, ammoAPI, maintenanceAPI, settingsAPI } from '../services/api';
import imageCompression from 'browser-image-compression';

const MaintenanceStatusIcon = ({ status }) => {
  const iconSize = 20;
  
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
    // Czerwona ikona ostrzegawcza - Wymagana
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
  const [attachmentForm, setAttachmentForm] = useState({ type: 'optic', name: '', notes: '' });
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

  const getMaintenanceActivities = () => [
    t('myWeapons.activities.barrelCleaning'),
    t('myWeapons.activities.slideCleaning'),
    t('myWeapons.activities.boltCleaning'),
    t('myWeapons.activities.firingPinCleaning'),
    t('myWeapons.activities.railLubrication'),
    t('myWeapons.activities.boltLubrication'),
    t('myWeapons.activities.springWearCheck'),
    t('myWeapons.activities.boltLatchCheck'),
    t('myWeapons.activities.partsReplacement'),
    t('myWeapons.activities.opticCheck'),
    t('myWeapons.activities.magazineCleaning')
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

  const handleAddAttachment = async (e) => {
    e.preventDefault();
    try {
      await attachmentsAPI.create(expandedGun, attachmentForm);
      setShowAttachmentModal(false);
      setAttachmentForm({ type: 'optic', name: '', notes: '' });
      fetchGunDetails(expandedGun);
      fetchGuns();
    } catch (err) {
      setError(err.response?.data?.detail || t('myWeapons.errorAddingAttachment'));
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (window.confirm(`${t('common.confirmDeleteItem')} ${t('myWeapons.attachment')}?`)) {
      try {
        await attachmentsAPI.delete(attachmentId);
        fetchGunDetails(expandedGun);
        fetchGuns();
      } catch (err) {
        setError(err.response?.data?.detail || t('common.errorDeleting', { item: 'equipment' }));
      }
    }
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

  const handleDeleteMaintenance = async (maintenanceId) => {
    if (window.confirm(`${t('common.confirmDeleteItem')} ${t('common.maintenance')}?`)) {
      try {
        await maintenanceAPI.delete(maintenanceId);
        await fetchGunDetails(expandedGun);
        await fetchAllMaintenance();
        fetchGuns();
      } catch (err) {
        setError(err.response?.data?.detail || t('common.errorDeleting', { item: 'maintenance' }));
      }
    }
  };

  const getAttachmentTypeLabel = (type) => {
    const labels = {
      optic: t('myWeapons.optic'),
      light: t('myWeapons.light'),
      laser: t('myWeapons.laser'),
      suppressor: t('myWeapons.suppressor'),
      bipod: t('myWeapons.bipod'),
      compensator: t('myWeapons.compensator'),
      grip: t('myWeapons.grip'),
      trigger: t('myWeapons.trigger'),
      other: t('myWeapons.other')
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
    const lastMaint = getLastMaintenance(gunId);
    if (!lastMaint) return 0;

    const gunSessions = sessions[gunId];
    if (!gunSessions || !Array.isArray(gunSessions)) return 0;

    const maintenanceDate = new Date(lastMaint.date);
    
    // Sumuj strzały tylko z sesji po dacie konserwacji
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
    if (!lastMaint) {
      return { status: 'none', color: '#888', message: '-' };
    }

    const rounds = calculateRoundsSinceLastMaintenance(gunId);
    const days = calculateDaysSinceLastMaintenance(gunId);

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
    if (!window.confirm(`${t('common.confirmDeleteItem')} image?`)) {
      return;
    }

    try {
      setError('');
      await gunsAPI.deleteImage(gunId);
      
      setWeaponImages({ ...weaponImages, [gunId]: null });
      await fetchGuns();
      setOpenImageMenu(null);
    } catch (err) {
      setError(err.response?.data?.detail || t('common.errorDeleting', { item: 'image' }));
      console.error(err);
    }
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
                                {userSettings.maintenance_notifications_enabled && (
                                  <span style={{ color: maintenanceStatus.color, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {maintenanceStatus.status !== 'none' && <MaintenanceStatusIcon status={maintenanceStatus.status} />}
                                    <span>
                                      {maintenanceStatus.message}
                                      {(maintenanceStatus.status === 'yellow' || maintenanceStatus.status === 'red') && maintenanceStatus.reason && (
                                        <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', opacity: 0.9 }}>
                                          ({maintenanceStatus.reason})
                                        </span>
                                      )}
                                    </span>
                                  </span>
                                )}
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
                          {userSettings.maintenance_notifications_enabled && (
                            <li style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem', position: 'relative' }}>
                              <span style={{ position: 'absolute', left: 0 }}>•</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {t('myWeapons.status')} <span style={{ 
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  marginLeft: '0.5rem'
                                }}>
                                  {maintenanceStatus.status !== 'none' && <MaintenanceStatusIcon status={maintenanceStatus.status} />}
                                </span> 
                                <span>
                                  {maintenanceStatus.message}
                                  {(maintenanceStatus.status === 'yellow' || maintenanceStatus.status === 'red') && maintenanceStatus.reason && (
                                    <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', opacity: 0.9, display: 'block', marginTop: '0.25rem' }}>
                                      {maintenanceStatus.reason}
                                    </span>
                                  )}
                                </span>
                              </div>
                            </li>
                          )}
                        </ul>
                      </div>

                      {/* Karta dodatków */}
                      <div className="card">
                        <h3 style={{ margin: 0, marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
                          {t('myWeapons.attachments')}
                        </h3>
                        {attachments[gun.id]?.length > 0 ? (
                          <div style={{ marginBottom: '1rem' }}>
                            {attachments[gun.id].map((att) => (
                              <div key={att.id} style={{ marginBottom: '0.5rem' }}>
                                {getAttachmentTypeLabel(att.type)} - {att.name}
                              </div>
                            ))}
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
                                            handleDeleteMaintenance(maint.id);
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
          onClick={() => setShowAttachmentModal(false)}
        >
          <div
            className="card"
            style={{ maxWidth: '500px', width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{t('myWeapons.addAttachment')}</h3>
            <form onSubmit={handleAddAttachment}>
              <div className="form-group">
                <label className="form-label">{t('myWeapons.attachmentType')}</label>
                <select
                  className="form-input"
                  value={attachmentForm.type}
                  onChange={(e) => setAttachmentForm({ ...attachmentForm, type: e.target.value })}
                  required
                >
                  <option value="optic">{t('myWeapons.optic')}</option>
                  <option value="light">{t('myWeapons.light')}</option>
                  <option value="laser">{t('myWeapons.laser')}</option>
                  <option value="suppressor">{t('myWeapons.suppressor')}</option>
                  <option value="bipod">{t('myWeapons.bipod')}</option>
                  <option value="compensator">{t('myWeapons.compensator')}</option>
                  <option value="grip">{t('myWeapons.grip')}</option>
                  <option value="trigger">{t('myWeapons.trigger')}</option>
                  <option value="other">{t('myWeapons.other')}</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('myWeapons.attachmentName')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={attachmentForm.name}
                  onChange={(e) => setAttachmentForm({ ...attachmentForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('myWeapons.attachmentNotes')}</label>
                <textarea
                  className="form-input"
                  value={attachmentForm.notes}
                  onChange={(e) => setAttachmentForm({ ...attachmentForm, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary">
                  {t('myWeapons.add')}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAttachmentModal(false)}
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
                      {maintenanceActivities.map((activity) => (
                        <label
                          key={activity}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0.5rem 0.5rem 0.5rem 0',
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
                            style={{ cursor: 'pointer', margin: 0, marginRight: '1rem', flexShrink: 0 }}
                          />
                          <span style={{ textAlign: 'left' }}>{activity}</span>
                        </label>
                      ))}
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
    </div>
  );
};

export default MyWeaponsPage;
