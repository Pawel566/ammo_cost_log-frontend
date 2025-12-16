import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ammoAPI, settingsAPI } from '../services/api';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';

const CALIBERS = [
  // Pistoletowe (pistol)
  { name: '9×19', ammo_class: 'pistol' },
  { name: '.45 ACP', ammo_class: 'pistol' },
  { name: '.40 S&W', ammo_class: 'pistol' },
  { name: '.380 ACP (9×17)', ammo_class: 'pistol' },
  { name: '.32 ACP', ammo_class: 'pistol' },
  { name: '10 mm Auto', ammo_class: 'pistol' },
  { name: '.357 SIG', ammo_class: 'pistol' },
  { name: '.22 LR', ammo_class: 'pistol' },
  
  // Rewolwerowe (revolver)
  { name: '.38 Special', ammo_class: 'revolver' },
  { name: '.357 Magnum', ammo_class: 'revolver' },
  { name: '.44 Magnum', ammo_class: 'revolver' },
  { name: '.44 Special', ammo_class: 'revolver' },
  { name: '.45 Colt', ammo_class: 'revolver' },
  { name: '.454 Casull', ammo_class: 'revolver' },
  
  // Karabinowe (rifle)
  { name: '5.56×45 / .223 Rem', ammo_class: 'rifle' },
  { name: '7.62×39', ammo_class: 'rifle' },
  { name: '7.62×51 / .308 Win', ammo_class: 'rifle' },
  { name: '7.62×54R', ammo_class: 'rifle' },
  { name: '6.5 Creedmoor', ammo_class: 'rifle' },
  { name: '.30-06 Springfield', ammo_class: 'rifle' },
  { name: '.300 WinMag', ammo_class: 'rifle' },
  { name: '.243 Win', ammo_class: 'rifle' },
  { name: '.270 Win', ammo_class: 'rifle' },
  { name: '.22 LR', ammo_class: 'rifle' },
  
  // Strzelbowe (shotgun)
  { name: '12/70', ammo_class: 'shotgun' },
  { name: '12/76', ammo_class: 'shotgun' },
  { name: '20/70', ammo_class: 'shotgun' },
  { name: '.410 bore', ammo_class: 'shotgun' }
];

const AMMO_TYPES = [
  { value: 'FMJ', label: 'FMJ' },
  { value: 'HP', label: 'HP' },
  { value: 'SP', label: 'SP' },
  { value: 'Match', label: 'Match' },
  { value: 'Training', label: 'Training' },
  { value: 'Subsonic', label: 'Subsonic' },
  { value: 'Magnum', label: 'Magnum' },
  { value: 'Birdshot', label: 'Birdshot' },
  { value: 'Buckshot', label: 'Buckshot' },
  { value: 'Slug', label: 'Slug' }
];

const AMMO_CATEGORIES = [
  { value: 'pistol', label: 'Amunicja do pistoletu/PM' },
  { value: 'revolver', label: 'Amunicja do rewolweru' },
  { value: 'rifle', label: 'Amunicja karabinowa' },
  { value: 'shotgun', label: 'Amunicja do strzelby' },
  { value: 'other', label: 'Inna' }
];

const AmmoPage = () => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrencyConverter();
  const [ammo, setAmmo] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit] = useState(25);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    caliber: '',
    caliberCustom: '',
    type: '',
    category: '',
    price_per_unit: '',
    units_in_package: ''
  });
  const [useCustomCaliber, setUseCustomCaliber] = useState(false);
  
  // Filtry
  const [caliberFilter, setCaliberFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Sortowanie
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' lub 'desc'
  
  // Menu akcji
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null, itemName: '' });
  
  // Ustawienia użytkownika
  const [userSettings, setUserSettings] = useState({
    low_ammo_notifications_enabled: true
  });

  useEffect(() => {
    fetchAmmo();
    fetchSettings();
  }, [offset, caliberFilter, typeFilter]);

  // Odśwież dane amunicji gdy strona staje się aktywna (np. po powrocie z innej strony)
  useEffect(() => {
    const handleFocus = () => {
      fetchAmmo();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.get();
      setUserSettings({
        low_ammo_notifications_enabled: response.data.low_ammo_notifications_enabled !== undefined 
          ? response.data.low_ammo_notifications_enabled : true
      });
    } catch (err) {
      console.error('Błąd podczas pobierania ustawień:', err);
    }
  };

  const fetchAmmo = async () => {
    try {
      setLoading(true);
      const params = { limit, offset };
      const response = await ammoAPI.getAll(params);
      const data = response.data;
      const items = Array.isArray(data) ? data : data?.items ?? [];
      const totalCount = data?.total ?? 0;
      setAmmo(items);
      setTotal(totalCount);
      setError(null);
    } catch (err) {
      setError(t('ammo.errorLoading'));
      console.error(err);
      setAmmo([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
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


  const getUniqueCalibers = () => {
    const calibers = ammo.map(item => item.caliber).filter(Boolean);
    return [...new Set(calibers)].sort();
  };

  const getUniqueTypes = () => {
    const types = ammo.map(item => item.type).filter(Boolean);
    return [...new Set(types)].sort();
  };

  const getAvailableCalibers = () => {
    if (!formData.category || formData.category === 'other') {
      // Dla kategorii "other" lub brak kategorii - pokaż wszystkie (usuwamy duplikaty)
      const allCalibers = CALIBERS.map(c => c.name);
      return [...new Set(allCalibers)];
    }
    // Filtruj kalibry według wybranej kategorii
    return CALIBERS
      .filter(c => c.ammo_class === formData.category)
      .map(c => c.name);
  };

  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    const currentCaliber = formData.caliber;
    
    // Jeśli zmieniono kategorię, sprawdź czy obecny kaliber pasuje do nowej kategorii
    let updatedCaliber = currentCaliber;
    if (newCategory && currentCaliber) {
      const availableCalibers = newCategory === 'other' 
        ? [...new Set(CALIBERS.map(c => c.name))]
        : CALIBERS.filter(c => c.ammo_class === newCategory).map(c => c.name);
      
      if (!availableCalibers.includes(currentCaliber)) {
        // Kaliber nie pasuje do nowej kategorii - wyczyść go
        updatedCaliber = '';
        setUseCustomCaliber(false);
        setFormData({ ...formData, caliberCustom: '' });
      }
    }
    
    setFormData({ 
      ...formData, 
      category: newCategory,
      caliber: updatedCaliber
    });
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
    
    const price = parseFloat(formData.price_per_unit.replace(',', '.'));
    if (isNaN(price) || price <= 0) {
      setError(t('ammo.invalidPrice'));
      return;
    }
    
    try {
      const finalCaliber = useCustomCaliber ? formData.caliberCustom : formData.caliber;
      
      const ammoData = {
        name: formData.name,
        caliber: finalCaliber || null,
        type: formData.type || null,
        category: formData.category || null,
        price_per_unit: price,
        units_in_package: formData.units_in_package ? parseInt(formData.units_in_package) : null
      };
      
      if (editingId) {
        await ammoAPI.update(editingId, ammoData);
        setEditingId(null);
        setSuccess(t('common.itemUpdated', { item: `${t('ammo.title')} ${formData.name}` }));
      } else {
        await ammoAPI.create(ammoData);
        setSuccess(t('common.itemAdded', { item: `${t('ammo.title')} ${formData.name}` }));
      }
      
      setFormData({ 
        name: '', 
        caliber: '', 
        caliberCustom: '',
        type: '',
        category: '',
        price_per_unit: '', 
        units_in_package: '' 
      });
      setUseCustomCaliber(false);
      setEditingId(null);
      setError(null);
      setShowForm(false);
      fetchAmmo();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || t('common.errorAdding', { item: 'ammunition' }));
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    const ammoToDelete = ammo.find(a => a.id === id);
    const ammoName = ammoToDelete ? ammoToDelete.name : '';
    
    setConfirmModal({
      show: true,
      title: 'Usuń amunicję',
      message: `Czy na pewno chcesz usunąć amunicję "${ammoName}"?`,
      itemName: ammoName,
      onConfirm: async () => {
        try {
          await ammoAPI.delete(id);
          setSuccess(t('common.itemDeleted', { item: `${t('ammo.title')} ${ammoName}` }));
          setConfirmModal({ show: false, title: '', message: '', onConfirm: null, itemName: '' });
          fetchAmmo();
          setActiveMenuId(null);
          setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
          setError(err.response?.data?.detail || t('common.errorDeleting', { item: 'ammunition' }));
          console.error(err);
          setConfirmModal({ show: false, title: '', message: '', onConfirm: null, itemName: '' });
        }
      }
    });
  };

  const handleEdit = (ammoItem) => {
    const ammoCaliber = ammoItem.caliber || '';
    const ammoCategory = ammoItem.category || '';
    
    // Sprawdź czy kaliber jest w dostępnych dla danej kategorii
    const availableCalibers = ammoCategory && ammoCategory !== 'other'
      ? CALIBERS.filter(c => c.ammo_class === ammoCategory).map(c => c.name)
      : CALIBERS.map(c => c.name);
    const isInList = availableCalibers.includes(ammoCaliber) || CALIBERS.map(c => c.name).includes(ammoCaliber);
    
    setFormData({
      name: ammoItem.name,
      caliber: isInList ? ammoCaliber : '',
      caliberCustom: isInList ? '' : ammoCaliber,
      type: ammoItem.type || '',
      category: ammoCategory || '',
      price_per_unit: ammoItem.price_per_unit ? ammoItem.price_per_unit.toString().replace('.', ',') : '',
      units_in_package: ammoItem.units_in_package ? ammoItem.units_in_package.toString() : ''
    });
    setUseCustomCaliber(!isInList && ammoCaliber !== '');
    setEditingId(ammoItem.id);
    setShowForm(true);
    setActiveMenuId(null);
  };

  const handleAddQuantity = async (id) => {
    const amountStr = window.prompt(t('ammo.howMany'));
    if (amountStr === null) {
      setActiveMenuId(null);
      return;
    }
    const amount = parseInt(amountStr, 10);
    if (Number.isNaN(amount) || amount <= 0) {
      setError(t('ammo.enterValidNumber'));
      setActiveMenuId(null);
      return;
    }
    try {
      await ammoAPI.addQuantity(id, amount);
      setError(null);
      setActiveMenuId(null);
      fetchAmmo();
    } catch (err) {
      setError(err.response?.data?.detail || t('ammo.errorAddingQuantity'));
      console.error(err);
      setActiveMenuId(null);
    }
  };

  const getAmmoTypeLabel = (type) => {
    const ammoType = AMMO_TYPES.find(t => t.value === type);
    return ammoType ? ammoType.label : type || '-';
  };

  const isLowStock = (units) => {
    // Sprawdź czy units jest liczbą i czy jest mniejsza niż 20
    if (units === null || units === undefined || units === '') {
      return false; // Jeśli nie ma danych o ilości, nie pokazuj ostrzeżenia
    }
    const unitsNum = typeof units === 'number' ? units : parseInt(units, 10);
    return !isNaN(unitsNum) && unitsNum > 0 && unitsNum < 20;
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

  const lowStockItems = ammo.filter(item => isLowStock(item.units_in_package));

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>{t('ammo.title')}</h2>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowForm(true)}
            style={{ 
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            {t('ammo.addAmmo')}
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

        {lowStockItems.length > 0 && userSettings.low_ammo_notifications_enabled && (
          <div 
            style={{ 
              marginBottom: '1rem',
              padding: '1rem',
              backgroundColor: '#ff9800',
              color: 'white',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {t('ammo.lowStockWarning')}
              </div>
              <div style={{ fontSize: '0.9rem' }}>
                {lowStockItems.map((item, index) => (
                  <span key={item.id}>
                    {item.name} ({item.units_in_package || 0} szt.)
                    {index < lowStockItems.length - 1 && ', '}
                  </span>
                ))}
              </div>
            </div>
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
            onClick={() => {
              setShowForm(false);
              setEditingId(null);
              setFormData({ 
                name: '', 
                caliber: '', 
                caliberCustom: '',
                type: '',
                category: '',
                price_per_unit: '', 
                units_in_package: '' 
              });
              setUseCustomCaliber(false);
            }}
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
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({ 
                    name: '', 
                    caliber: '', 
                    caliberCustom: '',
                    type: '',
                    category: '',
                    price_per_unit: '', 
                    units_in_package: '' 
                  });
                  setUseCustomCaliber(false);
                }}
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

              <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {editingId ? t('common.edit') + ' ' + t('ammo.title') : t('ammo.addNewAmmo')}
              </h3>
              <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  {t('ammo.ammoName')}
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('ammo.ammoNamePlaceholder')}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    border: `1px solid var(--border-color)`,
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Kategoria
                </label>
                <select
                  className="form-input"
                  value={formData.category}
                  onChange={handleCategoryChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    border: `1px solid var(--border-color)`,
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Wybierz kategorię</option>
                  {AMMO_CATEGORIES.map(category => (
                    <option key={category.value} value={category.value}>{category.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  {t('ammo.caliber')}
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {!useCustomCaliber ? (
                    <>
                      <select
                        className="form-input"
                        value={formData.caliber}
                        onChange={handleCaliberChange}
                        required
                        disabled={!formData.category}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          backgroundColor: 'var(--input-bg)',
                          color: 'var(--text-primary)',
                          border: `1px solid var(--border-color)`,
                          borderRadius: '4px',
                          fontSize: '1rem',
                          opacity: formData.category ? 1 : 0.6,
                          cursor: formData.category ? 'pointer' : 'not-allowed'
                        }}
                      >
                        <option value="">
                          {formData.category 
                            ? (t('ammo.selectCaliber') || 'Wybierz kaliber') 
                            : (t('ammo.selectCategoryFirst') || 'Najpierw wybierz kategorię')}
                        </option>
                        {getAvailableCalibers().map((caliber, index) => (
                          <option key={`${caliber}-${index}`} value={caliber}>{caliber}</option>
                        ))}
                        <option value="custom">{t('ammo.customCaliber') || 'Własny kaliber'}</option>
                      </select>
                    </>
                  ) : (
                    <>
                <input
                  type="text"
                        className="form-input"
                        value={formData.caliberCustom}
                        onChange={handleCustomCaliberChange}
                        placeholder={t('ammo.enterCustomCaliber')}
                        required
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
                    </>
                  )}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  {t('ammo.ammoType')}
                </label>
                <select
                  className="form-input"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    border: `1px solid var(--border-color)`,
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">{t('ammo.selectType')}</option>
                  {AMMO_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  {t('ammo.pricePerUnit')}
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.price_per_unit}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9,.]/g, '');
                    setFormData({ ...formData, price_per_unit: value });
                  }}
                  placeholder={t('ammo.pricePlaceholder')}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    border: `1px solid var(--border-color)`,
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  {t('ammo.unitsInPackage')}
                </label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={formData.units_in_package}
                  onChange={(e) => setFormData({ ...formData, units_in_package: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    border: `1px solid var(--border-color)`,
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ 
                      name: '', 
                      caliber: '', 
                      caliberCustom: '',
                      type: '',
                      category: '',
                      price_per_unit: '', 
                      units_in_package: '' 
                    });
                    setUseCustomCaliber(false);
                  }}
                >
                  {t('common.cancel')}
                </button>
                <button 
                  type="submit" 
                  className="btn btn-success"
                  style={{
                    backgroundColor: '#4caf50',
                    color: 'var(--text-primary)',
                    border: 'none',
                    padding: '0.75rem 2rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}
                >
                  {editingId ? t('common.save') : t('ammo.addAmmo')}
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
                <label style={{ marginRight: '0.5rem', color: '#aaa', fontSize: '0.9rem' }}>{t('ammo.filterByCaliber')}</label>
                <select
                  value={caliberFilter}
                  onChange={(e) => {
                    setCaliberFilter(e.target.value);
                    setOffset(0);
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
                  <option value="">{t('common.all')}</option>
                  {getUniqueCalibers().map((caliber, index) => (
                    <option key={`caliber-filter-${caliber}-${index}`} value={caliber}>{caliber}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ marginRight: '0.5rem', color: '#aaa', fontSize: '0.9rem' }}>{t('ammo.filterByType')}</label>
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setOffset(0);
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
                  <option value="">{t('common.all')}</option>
                  {getUniqueTypes().map(type => (
                    <option key={type} value={type}>{getAmmoTypeLabel(type)}</option>
                  ))}
                </select>
              </div>
            </div>
            
          </div>

          {/* Tabela */}
          {ammo.length === 0 ? (
            <p className="text-center" style={{ color: '#888', padding: '2rem' }}>
              {t('ammo.noAmmoMatch')}
            </p>
          ) : (
            <>
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
                        onClick={() => handleSort('caliber')}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        {t('ammo.caliber')}
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
                        onClick={() => handleSort('price_per_unit')}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        {t('ammo.pricePerPiece')}
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
                        onClick={() => handleSort('units_in_package')}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        {t('ammo.availableQuantity')}
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', color: '#aaa', fontWeight: 'normal' }}></th>
                  </tr>
                </thead>
                <tbody>
                    {ammo.map((item) => {
                    const price = Number(item.price_per_unit || 0);
                      const units = item.units_in_package || 0;
                      const lowStock = isLowStock(units) && userSettings.low_ammo_notifications_enabled;
                    return (
                        <tr 
                          key={item.id} 
                          style={{ 
                            borderBottom: '1px solid #333',
                            backgroundColor: lowStock ? 'rgba(255, 152, 0, 0.1)' : 'transparent'
                          }}
                        >
                          <td style={{ padding: '0.75rem', fontWeight: '500' }}>{item.name}</td>
                          <td style={{ padding: '0.75rem' }}>{item.caliber || '-'}</td>
                          <td style={{ padding: '0.75rem' }}>{formatCurrency(price)}</td>
                          <td style={{ padding: '0.75rem' }}>{getAmmoTypeLabel(item.type)}</td>
                          <td style={{ 
                            padding: '0.75rem',
                            color: lowStock ? '#ff9800' : 'inherit',
                            fontWeight: lowStock ? 'bold' : 'normal'
                          }}>
                            {units} {t('common.pieces')}
                          </td>
                          <td style={{ padding: '0.75rem', position: 'relative' }}>
                            <div className="action-menu-container" style={{ position: 'relative' }}>
                          <button
                                onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
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
                              {activeMenuId === item.id && (
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
                                  <div
                            onClick={() => handleAddQuantity(item.id)}
                                    style={{
                                      padding: '0.75rem 1rem',
                                      cursor: 'pointer',
                                      color: 'var(--text-primary)',
                                      borderBottom: `1px solid var(--border-color)`
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            {t('ammo.addQuantity')}
                                  </div>
                                  <div
                            onClick={() => handleEdit(item)}
                                    style={{
                                      padding: '0.75rem 1rem',
                                      cursor: 'pointer',
                                      color: 'var(--text-primary)',
                                      borderBottom: `1px solid var(--border-color)`
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            {t('common.edit')}
                                  </div>
                                  <div
                            onClick={() => handleDelete(item.id)}
                                    style={{
                                      padding: '0.75rem 1rem',
                                      cursor: 'pointer',
                                      color: '#f44336'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
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
              
              {/* Paginacja */}
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
                    {Math.floor(offset / limit) + 1} / {Math.ceil(total / limit)}
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
            </>
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

export default AmmoPage;
