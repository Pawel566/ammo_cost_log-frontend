import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { gunsAPI, attachmentsAPI, shootingSessionsAPI, ammoAPI, maintenanceAPI, settingsAPI } from '../services/api';

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
    // Żółta ikona z wykrzyknikiem - Wkrótce wymagana
    return (
      <svg width={iconSize} height={iconSize} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 2 L18 18 L2 18 Z" fill="#ff9800" stroke="none"/>
        <path d="M10 6 L10 11" stroke="black" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="10" cy="14" r="1" fill="black"/>
      </svg>
    );
  } else if (status === 'red' || status === 'required') {
    // Czerwona ikona z wykrzyknikiem - Wymagana
    return (
      <svg width={iconSize} height={iconSize} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="9" fill="#f44336" stroke="none"/>
        <path d="M10 5 L10 11" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="10" cy="14" r="1" fill="white"/>
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

const MyWeaponsPage = () => {
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

  const maintenanceActivities = [
    'Czyszczenie lufy',
    'Czyszczenie suwadła',
    'Czyszczenie zamka',
    'Czyszczenie iglicy',
    'Smarowanie prowadnic',
    'Smarowanie zamka',
    'Kontrola zużycia sprężyn',
    'Kontrola zamka / rygli',
    'Wymiana części',
    'Sprawdzenie optyki',
    'Czyszczenie magazynków'
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
    const handleClickOutside = (event) => {
      if (openMaintenanceMenu && !event.target.closest('[data-maintenance-menu]')) {
        setOpenMaintenanceMenu(null);
      }
    };

    if (openMaintenanceMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMaintenanceMenu]);

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
      setError('Błąd podczas pobierania listy broni');
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
      setError(err.response?.data?.detail || 'Błąd podczas dodawania wyposażenia');
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (window.confirm('Czy na pewno chcesz usunąć to wyposażenie?')) {
      try {
        await attachmentsAPI.delete(attachmentId);
        fetchGunDetails(expandedGun);
        fetchGuns();
      } catch (err) {
        setError(err.response?.data?.detail || 'Błąd podczas usuwania wyposażenia');
      }
    }
  };

  const handleAddMaintenance = async (e) => {
    e.preventDefault();
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
          activities: maintenanceForm.activities.length > 0 ? maintenanceForm.activities : null
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
      setError(err.response?.data?.detail || 'Błąd podczas zapisywania konserwacji');
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
    if (window.confirm('Czy na pewno chcesz usunąć tę konserwację?')) {
      try {
        await maintenanceAPI.delete(maintenanceId);
        await fetchGunDetails(expandedGun);
        await fetchAllMaintenance();
        fetchGuns();
      } catch (err) {
        setError(err.response?.data?.detail || 'Błąd podczas usuwania konserwacji');
      }
    }
  };

  const getAttachmentTypeLabel = (type) => {
    const labels = {
      optic: 'Celownik',
      light: 'Latarka',
      laser: 'Laser',
      suppressor: 'Tłumik',
      bipod: 'Dwójnóg',
      compensator: 'Kompensator',
      grip: 'Chwyt',
      trigger: 'Spust',
      other: 'Inne'
    };
    return labels[type] || type;
  };

  const getAttachmentsCount = (gunId) => {
    return attachments[gunId]?.length || 0;
  };

  const getGunTypeLabel = (type) => {
    // Mapowanie starych wartości na nowe
    if (type === 'Broń krótka') {
      return 'Pistolet';
    }
    
    const labels = {
      pistol: 'Pistolet',
      rifle: 'Karabin',
      shotgun: 'Strzelba',
      other: 'Inne'
    };
    return labels[type?.toLowerCase()] || type || 'Inne';
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
      return { status: 'none', color: '#888', message: 'Nie dotyczy' };
    }

    const rounds = calculateRoundsSinceLastMaintenance(gunId);
    const days = calculateDaysSinceLastMaintenance(gunId);

    const roundsLimit = userSettings.maintenance_rounds_limit || 500;
    const daysLimit = userSettings.maintenance_days_limit || 90;
    const warningThresholdRounds = roundsLimit * 0.6;
    const warningThresholdDays = daysLimit * 0.33;

    // Status według strzałów
    let roundsStatus = 'green';
    if (rounds >= roundsLimit) roundsStatus = 'red';
    else if (rounds >= warningThresholdRounds) roundsStatus = 'yellow';

    // Status według dni
    let daysStatus = 'green';
    if (days >= daysLimit) daysStatus = 'red';
    else if (days >= warningThresholdDays) daysStatus = 'yellow';

    // Najgorszy status
    let finalStatus = roundsStatus;
    if (daysStatus === 'red' || roundsStatus === 'red') {
      finalStatus = 'red';
    } else if (daysStatus === 'yellow' || roundsStatus === 'yellow') {
      finalStatus = 'yellow';
    }

    let color, message;
    if (finalStatus === 'red') {
      color = '#f44336';
      message = 'Wymagana';
    } else if (finalStatus === 'yellow') {
      color = '#ff9800';
      message = 'Wkrótce wymagana';
    } else {
      color = '#4caf50';
      message = 'OK';
    }

    return { status: finalStatus, color, message, rounds, days };
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

  if (loading) {
    return <div className="text-center">Ładowanie...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Moja broń</h2>
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}
        {guns.length === 0 ? (
          <p className="text-center">Brak dodanej broni</p>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        backgroundColor: '#2c2c2c',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <span style={{ fontSize: '2rem' }}>🔫</span>
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
                              <span>{attCount} {attCount === 1 ? 'dodatek' : attCount < 5 ? 'dodatki' : 'dodatków'}</span>
                            )}
                            {lastMaintenance && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ color: '#007bff' }}>
                                  Ostatnia konserwacja: {new Date(lastMaintenance.date).toLocaleDateString('pl-PL')}
                                </span>
                                {userSettings.maintenance_notifications_enabled && (
                                  <span style={{ color: maintenanceStatus.color, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <MaintenanceStatusIcon status={maintenanceStatus.status} />
                                    {maintenanceStatus.message}
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedGun(gun.id);
                              setEditingMaintenance(null);
                              setMaintenanceForm({ 
                                date: new Date().toISOString().split('T')[0], 
                                notes: '',
                                activities: []
                              });
                              setShowMaintenanceModal(true);
                            }}
                            className="btn btn-primary"
                            style={{ 
                              padding: '0.5rem 1rem',
                              fontSize: '0.85rem',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            + Dodaj konserwację
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    
                    <div>

                      {/* Karta statystyk */}
                      <div className="card">
                        <h3 style={{ margin: 0, marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
                          Statystyki broni
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          <li style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem', position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 0 }}>•</span>
                            Łączna liczba strzałów: {getTotalShots(gun.id)}
                          </li>
                          <li style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem', position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 0 }}>•</span>
                            Średnia celność: {getAverageAccuracy(gun.id).toFixed(1).replace('.', ',')}%
                          </li>
                          <li style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem', position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 0 }}>•</span>
                            Ostatnia konserwacja: {lastMaintenance 
                              ? new Date(lastMaintenance.date).toLocaleDateString('pl-PL')
                              : 'Brak'}
                          </li>
                          <li style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem', position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 0 }}>•</span>
                            Strzałów od ostatniej konserwacji: {calculateRoundsSinceLastMaintenance(gun.id)}
                          </li>
                          {userSettings.maintenance_notifications_enabled && (
                            <li style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem', position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ position: 'absolute', left: 0 }}>•</span>
                              Status: <span style={{ 
                                display: 'inline-flex',
                                alignItems: 'center',
                                marginLeft: '0.5rem'
                              }}>
                                <MaintenanceStatusIcon status={maintenanceStatus.status} />
                              </span> {maintenanceStatus.message}
                            </li>
                          )}
                        </ul>
                      </div>

                      {/* Karta dodatków */}
                      <div className="card">
                        <h3 style={{ margin: 0, marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
                          Dodatki
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
                          <p style={{ color: '#888', marginBottom: '1rem' }}>Brak dodatków</p>
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
                          <span>+</span> Dodaj dodatek
                        </button>
                      </div>

                      {/* Karta konserwacji */}
                      <div className="card">
                        <h3 style={{ margin: 0, marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
                          Konserwacja
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
                                    backgroundColor: '#2c2c2c',
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
                                      <div style={{ fontSize: '0.9rem', color: '#aaa' }}>
                                        <div style={{ marginBottom: '0.25rem', fontWeight: '500' }}>Wykonane czynności:</div>
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
                                          backgroundColor: '#2c2c2c',
                                          border: '1px solid #555',
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
                                            color: '#fff',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            fontSize: '0.9rem',
                                            display: 'block'
                                          }}
                                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                          Szczegóły
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
                                            color: '#fff',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            fontSize: '0.9rem',
                                            display: 'block',
                                            borderTop: '1px solid #555'
                                          }}
                                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                          Edytuj
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
                                            borderTop: '1px solid #555'
                                          }}
                                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                          Usuń
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <p style={{ color: '#888', marginBottom: '1rem' }}>Brak konserwacji</p>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingMaintenance(null);
                            setMaintenanceForm({ 
                              date: new Date().toISOString().split('T')[0], 
                              notes: ''
                            });
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
                          <span>+</span> Dodaj konserwację
                        </button>
                      </div>

                      {/* Karta historii użytkowania */}
                      <div className="card">
                        <h3 style={{ margin: 0, marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
                          Historia użytkowania
                        </h3>
                        {sessions[gun.id] && Array.isArray(sessions[gun.id]) && sessions[gun.id].length > 0 ? (
                          <div style={{ overflowX: 'auto' }}>
                            <table className="table" style={{ width: '100%' }}>
                              <thead>
                                <tr>
                                  <th>Data</th>
                                  <th>Amunicja</th>
                                  <th>Strzały</th>
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
                          <p style={{ color: '#888' }}>Brak sesji</p>
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
                border: '2px dashed #555',
                backgroundColor: '#1a1a1a'
              }}
              onClick={() => navigate('/guns')}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2c2c2c';
                e.currentTarget.style.borderColor = '#007bff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1a1a1a';
                e.currentTarget.style.borderColor = '#555';
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>+</div>
              <h3 style={{ margin: 0, color: '#007bff' }}>Dodaj nową broń</h3>
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
            <h3>Dodaj wyposażenie</h3>
            <form onSubmit={handleAddAttachment}>
              <div className="form-group">
                <label className="form-label">Typ</label>
                <select
                  className="form-input"
                  value={attachmentForm.type}
                  onChange={(e) => setAttachmentForm({ ...attachmentForm, type: e.target.value })}
                  required
                >
                  <option value="optic">Celownik</option>
                  <option value="light">Latarka</option>
                  <option value="laser">Laser</option>
                  <option value="suppressor">Tłumik</option>
                  <option value="bipod">Dwójnóg</option>
                  <option value="compensator">Kompensator</option>
                  <option value="grip">Chwyt</option>
                  <option value="trigger">Spust</option>
                  <option value="other">Inne</option>
                </select>
              </div>
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
                <label className="form-label">Notatki</label>
                <textarea
                  className="form-input"
                  value={attachmentForm.notes}
                  onChange={(e) => setAttachmentForm({ ...attachmentForm, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary">
                  Dodaj
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAttachmentModal(false)}
                >
                  Anuluj
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
            zIndex: 1000
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
            <h3>{editingMaintenance ? 'Edytuj konserwację' : 'Dodaj konserwację'}</h3>
            <form onSubmit={handleAddMaintenance}>
              <div className="form-group">
                <label className="form-label">Data</label>
                <input
                  type="date"
                  className="form-input"
                  value={maintenanceForm.date}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Lista czynności</label>
                <div style={{ border: '1px solid #555', borderRadius: '4px', backgroundColor: '#2c2c2c' }}>
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
                      color: '#fff',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>
                      {maintenanceForm.activities.length > 0 
                        ? `Wybrano: ${maintenanceForm.activities.length}` 
                        : 'Wybierz czynności'}
                    </span>
                    <span style={{ fontSize: '0.8rem' }}>
                      {showActivitiesList ? '▼' : '▶'}
                    </span>
                  </button>
                  {showActivitiesList && (
                    <div style={{ 
                      padding: '0.5rem 0.5rem 0.5rem 0', 
                      borderTop: '1px solid #555',
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
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <input
                            type="checkbox"
                            checked={maintenanceForm.activities.includes(activity)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setMaintenanceForm({
                                  ...maintenanceForm,
                                  activities: [...maintenanceForm.activities, activity]
                                });
                              } else {
                                setMaintenanceForm({
                                  ...maintenanceForm,
                                  activities: maintenanceForm.activities.filter(a => a !== activity)
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
                <label className="form-label">Opis:</label>
                <textarea
                  className="form-input"
                  value={maintenanceForm.notes}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, notes: e.target.value })}
                  rows={3}
                  placeholder="Opcjonalny opis konserwacji..."
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Zapisz konserwację
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
                  Anuluj
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
              <h3 style={{ margin: 0 }}>Szczegóły konserwacji</h3>
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
                  Data wykonania
                </label>
                <div style={{ padding: '0.75rem', backgroundColor: '#2c2c2c', borderRadius: '4px', color: '#fff' }}>
                  {new Date(selectedMaintenance.date).toLocaleDateString('pl-PL')}
                </div>
              </div>

              {selectedMaintenance.activities && selectedMaintenance.activities.length > 0 && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#aaa' }}>
                    Lista czynności
                  </label>
                  <div style={{ padding: '0.75rem', backgroundColor: '#2c2c2c', borderRadius: '4px' }}>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', listStyle: 'disc', color: '#fff' }}>
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
                    Opis
                  </label>
                  <div style={{ padding: '0.75rem', backgroundColor: '#2c2c2c', borderRadius: '4px', color: '#fff', whiteSpace: 'pre-wrap' }}>
                    {selectedMaintenance.notes}
                  </div>
                </div>
              )}

              {!selectedMaintenance.notes && (!selectedMaintenance.activities || selectedMaintenance.activities.length === 0) && (
                <div style={{ color: '#888', textAlign: 'center', padding: '1rem' }}>
                  Brak dodatkowych informacji
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
                Edytuj
              </button>
              <button
                onClick={() => {
                  setShowMaintenanceDetailsModal(false);
                  setSelectedMaintenance(null);
                }}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyWeaponsPage;
