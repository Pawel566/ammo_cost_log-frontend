import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { shootingSessionsAPI, gunsAPI, ammoAPI, settingsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';

const AddShootingSessionPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { formatCurrency, getCurrencySymbol } = useCurrencyConverter();
  const isEditMode = !!id;
  const [guns, setGuns] = useState([]);
  const [ammo, setAmmo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [distanceUnit, setDistanceUnit] = useState('m');
  const [sessionMode, setSessionMode] = useState('standard'); // 'standard' lub 'advanced'
  const [targetImageFile, setTargetImageFile] = useState(null);
  const [targetImageUrl, setTargetImageUrl] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    gun_id: '',
    ammo_id: '',
    date: new Date().toISOString().split('T')[0],
    shots: '',
    distance_m: '',
    hits: '',
    group_cm: '',
    cost: ''
  });

  useEffect(() => {
    fetchData();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.get();
      setDistanceUnit(response.data.distance_unit || 'm');
    } catch (err) {
      console.error('Błąd pobierania ustawień:', err);
    }
  };

  useEffect(() => {
    if (isEditMode && id && distanceUnit) {
      loadSessionData();
    }
  }, [id, isEditMode, distanceUnit]);

  const loadSessionData = async () => {
    try {
      setLoading(true);
      const [sessionRes, ammoRes] = await Promise.all([
        shootingSessionsAPI.getById(id),
        ammoAPI.getAll()
      ]);
      const session = sessionRes.data;
      const ammoData = ammoRes.data;
      const ammoItems = Array.isArray(ammoData) ? ammoData : ammoData?.items ?? [];
      
      const selectedAmmo = session.ammo_id ? ammoItems.find(a => a.id === session.ammo_id) : null;
      
      // Oblicz koszt stały: session.cost to suma kosztu stałego + (shots * price_per_unit)
      // Musimy odjąć koszt amunicji od całkowitego kosztu, aby uzyskać tylko koszt stały
      let fixedCost = '';
      if (session.cost && selectedAmmo && session.shots) {
        const totalCost = parseFloat(session.cost);
        const ammoCost = session.shots * selectedAmmo.price_per_unit;
        const fixedCostValue = totalCost - ammoCost;
        // Jeśli koszt stały jest <= 0, ustawiamy na pusty string (będzie wyświetlane jako 0)
        if (fixedCostValue > 0) {
          fixedCost = fixedCostValue.toFixed(2).replace('.', ',');
        }
      } else if (session.cost) {
        // Jeśli nie ma amunicji lub shots, ale jest koszt, może to być tylko koszt stały
        const totalCost = parseFloat(session.cost);
        if (totalCost > 0) {
          fixedCost = totalCost.toFixed(2).replace('.', ',');
        }
      }
      
      // Użyj przeliczonych wartości z API (distance i distance_unit)
      let distanceDisplay = '';
      if (session.distance && session.distance_unit) {
        distanceDisplay = `${session.distance} ${session.distance_unit}`;
      } else if (session.distance_m) {
        // Fallback dla starych danych
        const distanceInMeters = session.distance_m;
        const currentUnit = distanceUnit || 'm';
        if (currentUnit === 'yd') {
          const distanceInYards = Math.round(distanceInMeters * 1.09361);
          distanceDisplay = `${distanceInYards} yd`;
        } else {
          distanceDisplay = `${distanceInMeters} m`;
        }
      }
      
      setFormData({
        gun_id: session.gun_id || '',
        ammo_id: session.ammo_id || '',
        date: session.date || new Date().toISOString().split('T')[0],
        shots: session.shots ? session.shots.toString() : '',
        distance_m: distanceDisplay || '',
        hits: session.hits !== null && session.hits !== undefined ? session.hits.toString() : '',
        group_cm: session.group_cm !== null && session.group_cm !== undefined ? session.group_cm.toString() : '',
        cost: fixedCost
      });
      
      // Ustaw tryb sesji na podstawie session_type
      if (session.session_type === 'advanced') {
        setSessionMode('advanced');
      } else {
        setSessionMode('standard');
      }
      
      // Załaduj zdjęcie tarczy jeśli istnieje, w przeciwnym razie wyczyść stan
      if (session.target_image_path && user && !user.is_guest) {
        loadTargetImage();
      } else {
        setTargetImageUrl(null);
        setTargetImageFile(null);
      }
    } catch (err) {
      setError('Błąd podczas ładowania sesji');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };



  const fetchData = async () => {
    try {
      setLoading(true);
      const [gunsRes, ammoRes] = await Promise.all([
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
      const gunsData = gunsRes.data;
      const ammoData = ammoRes.data;
      const gunItems = Array.isArray(gunsData) ? gunsData : gunsData?.items ?? [];
      const ammoItems = Array.isArray(ammoData) ? ammoData : ammoData?.items ?? [];
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

  const calculateAccuracy = () => {
    if (formData.shots && formData.hits) {
      const shots = parseInt(formData.shots, 10);
      const hits = parseInt(formData.hits, 10);
      if (shots > 0 && !isNaN(hits)) {
        return ((hits / shots) * 100).toFixed(0);
      }
    }
    return '0';
  };

  const calculateFinalScore = () => {
    if (!formData.shots || !formData.hits) {
      return null;
    }
    
    const shots = parseInt(formData.shots, 10);
    const hits = parseInt(formData.hits, 10);
    
    if (shots <= 0 || isNaN(hits)) {
      return null;
    }
    
    const accuracy = hits / shots;
    
    if (formData.group_cm && formData.distance_m) {
      const groupCm = parseFloat(formData.group_cm);
      const distanceStr = formData.distance_m.trim();
      let distanceInMeters = 0;
      
      if (distanceUnit === 'yd') {
        const distanceInYards = parseFloat(distanceStr.replace(' yd', '').trim());
        if (!isNaN(distanceInYards) && distanceInYards > 0) {
          distanceInMeters = distanceInYards * 0.9144;
        } else {
          return null;
        }
      } else {
        distanceInMeters = parseFloat(distanceStr.replace(' m', '').trim());
        if (isNaN(distanceInMeters) || distanceInMeters <= 0) {
          return null;
        }
      }
      
      if (!isNaN(groupCm) && groupCm > 0 && distanceInMeters > 0) {
        const moa = (groupCm / distanceInMeters) * 34.38;
        const effective_moa = moa * distanceInMeters / 100;
        const precision = Math.max(0, 1 - (effective_moa / 10));
        const final = (accuracy * 0.4) + (precision * 0.6);
        return Math.round(final * 100);
      }
    }
    
    return Math.round(accuracy * 100);
  };

  const calculateTotalCost = () => {
    let total = 0;
    
    // Koszt stały
    if (formData.cost && formData.cost.trim()) {
      const fixedCost = parseFloat(formData.cost.replace(',', '.').trim()) || 0;
      total += fixedCost;
    }
    
    // Koszt amunicji: liczba strzałów × cena za sztukę
    if (formData.ammo_id && formData.shots) {
      const selectedAmmo = ammo.find(a => a.id === formData.ammo_id);
      if (selectedAmmo && selectedAmmo.price_per_unit) {
        const shots = parseInt(formData.shots, 10);
        if (!isNaN(shots) && shots > 0) {
          total += shots * selectedAmmo.price_per_unit;
        }
      }
    }
    
    return total.toFixed(2).replace('.', ',');
  };

  const loadTargetImage = async () => {
    if (!id || !user || user.is_guest) return;
    
    try {
      const response = await shootingSessionsAPI.getTargetImage(id);
      if (response.data && response.data.url) {
        setTargetImageUrl(response.data.url);
      }
    } catch (err) {
      console.error('Błąd podczas pobierania zdjęcia tarczy:', err);
    }
  };

  const compressImage = (file, maxWidth = 1600, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Oblicz nowe wymiary zachowując proporcje
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Błąd podczas kompresji obrazu'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => reject(new Error('Błąd podczas wczytywania obrazu'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Błąd podczas odczytu pliku'));
      reader.readAsDataURL(file);
    });
  };

  const handleTargetImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setError('Plik musi być obrazem');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setError('Plik jest zbyt duży (max 10MB)');
      return;
    }
    
    setUploadingImage(true);
    setError(null);
    
    try {
      // Kompresuj obraz przed przesłaniem
      const compressedFile = await compressImage(file, 1600, 0.7);
      setTargetImageFile(compressedFile);
      
      const formData = new FormData();
      formData.append('file', compressedFile);
      
      if (isEditMode && id) {
        await shootingSessionsAPI.uploadTargetImage(id, formData);
        await loadTargetImage();
        setSuccess('Zdjęcie tarczy zostało przesłane');
      } else {
        setTargetImageUrl(URL.createObjectURL(compressedFile));
        setSuccess('Zdjęcie zostanie przesłane po zapisaniu sesji');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Błąd podczas przesyłania zdjęcia');
      setTargetImageFile(null);
      setTargetImageUrl(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteTargetImage = async () => {
    if (!id || !user || user.is_guest) return;
    
    try {
      await shootingSessionsAPI.deleteTargetImage(id);
      setTargetImageUrl(null);
      setTargetImageFile(null);
      setSuccess('Zdjęcie tarczy zostało usunięte');
      // Odśwież dane sesji, żeby usunąć zdjęcie z widoku
      await loadSessionData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Błąd podczas usuwania zdjęcia');
    }
  };

  const handleTargetIconClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const normalize = (v) => {
    if (v === "" || v === null || v === undefined) return null;
    return v;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.gun_id) {
      setError('Musisz wybrać broń');
      return;
    }

    if (!formData.ammo_id) {
      setError('Musisz wybrać amunicję');
      return;
    }

    if (!formData.shots || parseInt(formData.shots, 10) <= 0) {
      setError("Liczba strzałów musi być większa od 0");
      return;
    }

    const shots = parseInt(formData.shots, 10);

    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (selectedDate > today) {
      setError('Data nie może być w przyszłości');
      return;
    }

    // Walidacja danych celności (w obu trybach)
    if (formData.hits) {
      const hits = parseInt(formData.hits, 10);
      if (isNaN(hits) || hits < 0 || hits > shots) {
        setError('Liczba trafień musi być między 0 a liczbą strzałów');
        return;
      }
    }
    
    if (formData.distance_m) {
      // Parsowanie dystansu z jednostkami użytkownika i konwersja na metry
      let distanceInMeters = 0;
      const distanceStr = formData.distance_m.trim();
      if (distanceUnit === 'yd') {
        const distanceInYards = parseFloat(distanceStr.replace(' yd', '').trim());
        if (isNaN(distanceInYards) || distanceInYards <= 0) {
          setError('Dystans musi być większy od 0');
          return;
        }
        // Konwersja jardów na metry: 1 yd = 0.9144 m
        distanceInMeters = Math.round(distanceInYards * 0.9144);
      } else {
        distanceInMeters = parseInt(distanceStr.replace(' m', '').trim(), 10);
        if (isNaN(distanceInMeters) || distanceInMeters <= 0) {
          setError('Dystans musi być większy od 0');
          return;
        }
      }
    }
    
    try {
      const sessionData = {
        gun_id: formData.gun_id,
        ammo_id: formData.ammo_id,
        date: formData.date,
        shots: Number(shots),
        session_type: sessionMode,  // 'standard' or 'advanced'
      };

      // Dane celności (w obu trybach)
      if (formData.distance_m) {
        // Parsowanie dystansu z jednostkami użytkownika i konwersja na metry
        const distanceStr = formData.distance_m.trim();
        let distanceInMeters = 0;
        if (distanceUnit === 'yd') {
          const distanceInYards = parseFloat(distanceStr.replace(' yd', '').trim());
          // Konwersja jardów na metry: 1 yd = 0.9144 m
          distanceInMeters = Number((distanceInYards * 0.9144).toFixed(2));
        } else {
          distanceInMeters = Number(parseFloat(distanceStr.replace(' m', '').trim()).toFixed(2));
        }
        sessionData.distance_m = distanceInMeters;
      }
      
      if (formData.hits) {
        const hitsValue = parseInt(formData.hits, 10);
        if (!isNaN(hitsValue)) {
          sessionData.hits = Number(hitsValue);
        }
      }
      
      if (formData.group_cm) {
        const groupCmValue = parseFloat(formData.group_cm);
        if (!isNaN(groupCmValue) && groupCmValue > 0) {
          sessionData.group_cm = Number(groupCmValue);
        }
      }

      // Koszt stały + koszt amunicji
      const selectedAmmo = ammo.find(a => a.id === formData.ammo_id);
      if (selectedAmmo) {
        const baseCost = formData.cost ? parseFloat(formData.cost.replace(',', '.').replace(' zł', '').trim()) || 0 : 0;
        const ammoPrice = selectedAmmo.price_per_unit || 0;
        const totalCost = baseCost + (shots * ammoPrice);
        if (totalCost > 0) {
          sessionData.cost = Number(totalCost.toFixed(2));
        }
      } else if (formData.cost && formData.cost.trim()) {
        const baseCost = parseFloat(formData.cost.replace(',', '.').replace(' zł', '').trim()) || 0;
        if (baseCost > 0) {
          sessionData.cost = Number(baseCost.toFixed(2));
        }
      }
      
      const selectedGun = guns.find(g => g.id === formData.gun_id);
      const gunName = selectedGun ? selectedGun.name : '';
      const gunType = selectedGun ? (selectedGun.type || '') : '';
      
      if (isEditMode) {
        // W trybie edycji zawsze wysyłaj pola, które mogą być wyczyszczone
        const normalizedData = {
          date: sessionData.date,
          shots: sessionData.shots,
          distance_m: normalize(sessionData.distance_m),
          hits: normalize(sessionData.hits),
          group_cm: normalize(sessionData.group_cm),
          cost: normalize(sessionData.cost),
          session_type: sessionMode  // 'standard' or 'advanced'
        };
        // Tylko dodaj gun_id i ammo_id jeśli zostały zmienione
        if (sessionData.gun_id) {
          normalizedData.gun_id = sessionData.gun_id;
        }
        if (sessionData.ammo_id) {
          normalizedData.ammo_id = sessionData.ammo_id;
        }
        await shootingSessionsAPI.update(id, normalizedData);
        
        // Prześlij zdjęcie tarczy jeśli zostało dodane w edycji
        if (targetImageFile && user && !user.is_guest) {
          try {
            const imageFormData = new FormData();
            imageFormData.append('file', targetImageFile);
            await shootingSessionsAPI.uploadTargetImage(id, imageFormData);
          } catch (err) {
            console.error('Błąd podczas przesyłania zdjęcia tarczy:', err);
          }
        }
        
        // Wygeneruj komentarz AI jeśli są wymagane dane (także po edycji)
        if (sessionMode === 'advanced' && formData.distance_m && formData.shots && user && !user.is_guest) {
          const hasHits = formData.hits && formData.hits.trim() !== '';
          const hasTargetImage = targetImageUrl !== null || (targetImageFile !== null);
          const shouldGenerateAI = hasHits || hasTargetImage;
          
          if (shouldGenerateAI) {
            try {
              setAnalyzingAI(true);
              const result = await shootingSessionsAPI.generateAIComment(id);
              // Jeśli Vision policzyło trafienia (przypadek A), zaktualizuj widok
              if (result.data && result.data.hits !== undefined && !hasHits) {
                setFormData(prev => ({
                  ...prev,
                  hits: result.data.hits.toString()
                }));
              }
            } catch (err) {
              // Nie blokuj zapisu sesji, jeśli generowanie komentarza się nie powiodło
              console.error('Błąd podczas generowania komentarza AI:', err);
              // Pokaż użytkownikowi informację o błędzie
              if (err.response?.data?.detail) {
                setError(`Błąd analizy AI: ${err.response.data.detail}`);
              } else {
                setError('Nie udało się wygenerować komentarza AI. Sprawdź czy masz ustawiony klucz OpenAI API.');
              }
            } finally {
              setAnalyzingAI(false);
            }
          }
        }
        
        setSuccess(`Sesja dla ${gunType ? gunType + ' ' : ''}${gunName} zaktualizowana!`);
        setTimeout(() => {
          navigate('/shooting-sessions');
        }, 1500);
      } else {
        const response = await shootingSessionsAPI.create(sessionData);
        const sessionId = response.data.id;
        
        // Prześlij zdjęcie tarczy jeśli zostało wybrane
        let hasTargetImage = false;
        if (targetImageFile && user && !user.is_guest) {
          try {
            const imageFormData = new FormData();
            imageFormData.append('file', targetImageFile);
            await shootingSessionsAPI.uploadTargetImage(sessionId, imageFormData);
            hasTargetImage = true;
          } catch (err) {
            console.error('Błąd podczas przesyłania zdjęcia tarczy:', err);
          }
        }
        
        // Wygeneruj komentarz AI jeśli są wymagane dane
        // Wymagania: dystans + strzały + (trafienia LUB zdjęcie) + użytkownik zalogowany
        if (sessionMode === 'advanced' && formData.distance_m && formData.shots && user && !user.is_guest) {
          const hasHits = formData.hits && formData.hits.trim() !== '';
          // Sprawdź czy jest zdjęcie (przesłane lub wybrane przez użytkownika)
          const hasTargetImageFinal = hasTargetImage || (targetImageFile !== null);
          const shouldGenerateAI = hasHits || hasTargetImageFinal;
          
          if (shouldGenerateAI) {
          try {
              setAnalyzingAI(true);
              const result = await shootingSessionsAPI.generateAIComment(sessionId);
              // Jeśli Vision policzyło trafienia (przypadek A), zaktualizuj widok
              if (result.data && result.data.hits !== undefined && !hasHits) {
                setFormData(prev => ({
                  ...prev,
                  hits: result.data.hits.toString()
                }));
              }
          } catch (err) {
            // Nie blokuj zapisu sesji, jeśli generowanie komentarza się nie powiodło
            console.error('Błąd podczas generowania komentarza AI:', err);
              // Pokaż użytkownikowi informację o błędzie
              if (err.response?.data?.detail) {
                setError(`Błąd analizy AI: ${err.response.data.detail}`);
              } else {
                setError('Nie udało się wygenerować komentarza AI. Sprawdź czy masz ustawiony klucz OpenAI API.');
              }
            } finally {
              setAnalyzingAI(false);
            }
          }
        }
        
        let successMessage = `Sesja dla ${gunType ? gunType + ' ' : ''}${gunName} dodana!`;
        if (response.data && response.data.remaining_ammo !== undefined) {
          successMessage += ` Pozostało ${response.data.remaining_ammo} sztuk amunicji.`;
        }
        setSuccess(successMessage);
        
        setTimeout(() => {
          navigate('/shooting-sessions');
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Błąd podczas dodawania sesji');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-center">Ładowanie...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, textAlign: 'center', width: '100%' }}>
            {isEditMode ? 'Edytuj sesję strzelecką' : 'Dodaj sesję strzelecką'}
          </h2>
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

        {analyzingAI && (
          <div className="alert alert-info" style={{ 
            marginBottom: '1rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            backgroundColor: '#1a5490',
            border: '1px solid #2d6fb8',
            color: '#fff'
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              border: `2px solid var(--text-primary)`,
              borderTop: `2px solid transparent`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <span>Trwa analiza AI...</span>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {guns.length === 0 && (
          <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
            Najpierw dodaj broń w sekcji "Broń"
          </div>
        )}

        {ammo.length === 0 && (
          <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
            Najpierw dodaj amunicję w sekcji "Amunicja"
          </div>
        )}

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <form onSubmit={handleSubmit}>
            {/* Przełącznik standardowa/zaawansowana */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
              <div style={{ 
                display: 'flex', 
                backgroundColor: 'var(--bg-secondary)', 
                borderRadius: '8px', 
                padding: '4px',
                gap: '4px'
              }}>
                <button
                  type="button"
                  onClick={() => setSessionMode('standard')}
                  style={{
                    padding: '0.5rem 1.5rem',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: sessionMode === 'standard' ? '#007bff' : 'transparent',
                    color: sessionMode === 'standard' ? '#fff' : 'var(--text-tertiary)',
                    fontWeight: sessionMode === 'standard' ? 'bold' : 'normal',
                    transition: 'all 0.2s'
                  }}
                >
                  Standardowa
                </button>
                <button
                  type="button"
                  onClick={() => setSessionMode('advanced')}
                  style={{
                    padding: '0.5rem 1.5rem',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: sessionMode === 'advanced' ? '#007bff' : 'transparent',
                    color: sessionMode === 'advanced' ? '#fff' : 'var(--text-tertiary)',
                    fontWeight: sessionMode === 'advanced' ? 'bold' : 'normal',
                    transition: 'all 0.2s'
                  }}
                >
                  Zaawansowana
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Lewa kolumna */}
              <div>
                <h4 style={{ margin: 0, marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Sesja</h4>
                <div className="form-group">
                  <label className="form-label">Broń *</label>
                  <select
                    className="form-input"
                    value={formData.gun_id}
                    onChange={(e) => setFormData({ ...formData, gun_id: e.target.value })}
                    required
                    style={{ appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23aaa\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', paddingRight: '2.5rem' }}
                  >
                    <option value="">Wybierz broń</option>
                    {guns.map((gun) => (
                      <option key={gun.id} value={gun.id}>
                        {gun.name} {gun.caliber ? `(${gun.caliber})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amunicja *</label>
                  <select
                    className="form-input"
                    value={formData.ammo_id}
                    onChange={(e) => setFormData({ ...formData, ammo_id: e.target.value })}
                    required
                    style={{ appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23aaa\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', paddingRight: '2.5rem' }}
                  >
                    <option value="">Wybierz amunicję</option>
                    {ammo.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} {item.caliber ? `(${item.caliber})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Data *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Koszt stały (np. opłata za tor)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="0,00"
                    value={formData.cost}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9,]/g, '');
                      setFormData({ ...formData, cost: value });
                    }}
                  />
                </div>
              </div>

              {/* Prawa kolumna */}
              <div>
                <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Celność</h4>
                <div className="form-group">
                  <label className="form-label">Dystans</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.distance_m}
                    onChange={(e) => setFormData({ ...formData, distance_m: e.target.value })}
                    placeholder={distanceUnit === 'yd' ? '20 yd' : '20 m'}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Liczba strzałów *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={formData.shots}
                    onChange={(e) => setFormData({ ...formData, shots: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Liczba trafień</label>
                  <input
                    type="number"
                    min="0"
                    max={formData.shots || 0}
                    className="form-input"
                    value={formData.hits}
                    onChange={(e) => setFormData({ ...formData, hits: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Grupa strzałów (cm)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    className="form-input"
                    value={formData.group_cm}
                    onChange={(e) => setFormData({ ...formData, group_cm: e.target.value })}
                    placeholder="np. 5.5"
                  />
                </div>
                {formData.shots && formData.hits && (() => {
                  const finalScore = calculateFinalScore();
                  if (finalScore !== null) {
                    return (
                      <div className="form-group">
                        <label className="form-label">Wynik końcowy</label>
                        <input
                          type="text"
                          className="form-input"
                          value={`${finalScore}/100`}
                          readOnly
                          style={{ 
                            backgroundColor: 'var(--bg-secondary)',
                            color: finalScore >= 80 ? '#4caf50' : finalScore >= 60 ? '#ffc107' : finalScore > 0 ? '#dc3545' : '#4caf50',
                            fontWeight: 'bold'
                          }}
                        />
                      </div>
                    );
                  }
                  return null;
                })()}
                
                {/* Zdjęcie tarczy - tylko w trybie zaawansowanym i dla zalogowanych użytkowników */}
                {sessionMode === 'advanced' && user && !user.is_guest && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleTargetImageUpload}
                        style={{ display: 'none' }}
                      />
                      <img
                        src="/assets/target_icon.png"
                        alt="Dodaj zdjęcie tarczy"
                        onClick={handleTargetIconClick}
                        style={{
                          width: '24px',
                          height: '24px',
                          cursor: 'pointer',
                          opacity: targetImageUrl ? 1 : 0.6,
                          transition: 'opacity 0.2s'
                        }}
                        title="Dodaj zdjęcie tarczy"
                      />
                      <label 
                        style={{ cursor: 'pointer', fontSize: '0.9rem' }} 
                        onClick={handleTargetIconClick}
                      >
                        Dodaj zdjęcie tarczy
                      </label>
                    </div>
                    
                    {targetImageUrl && (
                      <div style={{ padding: '1rem', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '1px solid #333' }}>
                        <img 
                          src={targetImageUrl} 
                          alt="Zdjęcie tarczy" 
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '300px', 
                            borderRadius: '4px',
                            marginBottom: '1rem',
                            display: 'block'
                          }} 
                        />
                        {isEditMode && (
                          <button
                            type="button"
                            onClick={handleDeleteTargetImage}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#dc3545',
                              color: 'var(--text-primary)',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.9rem'
                            }}
                          >
                            Usuń zdjęcie
                          </button>
                        )}
                        {!isEditMode && (
                          <button
                            type="button"
                            onClick={() => {
                              setTargetImageFile(null);
                              setTargetImageUrl(null);
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                            }}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#dc3545',
                              color: 'var(--text-primary)',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.9rem'
                            }}
                          >
                            Usuń zdjęcie
                          </button>
                        )}
                        {uploadingImage && (
                          <p style={{ color: '#888', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                            Przesyłanie...
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Koszt całkowity */}
            <div style={{ 
              marginTop: '2rem', 
              padding: '1rem', 
              backgroundColor: 'var(--bg-primary)', 
              borderRadius: '8px',
              border: `1px solid var(--border-color)`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Koszt całkowity:</label>
                <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#4caf50' }}>
                  {formatCurrency(calculateTotalCost())}
                </div>
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>
                {formData.cost && formData.cost.trim() ? (
                  <>
                    Koszt stały: {formatCurrency(parseFloat(formData.cost.replace(',', '.').trim()) || 0)}
                    {formData.ammo_id && formData.shots && (() => {
                      const selectedAmmo = ammo.find(a => a.id === formData.ammo_id);
                      if (selectedAmmo && selectedAmmo.price_per_unit) {
                        const shots = parseInt(formData.shots, 10);
                        if (!isNaN(shots) && shots > 0) {
                          return ` + (${shots} × ${formatCurrency(selectedAmmo.price_per_unit)})`;
                        }
                      }
                      return null;
                    })()}
                  </>
                ) : formData.ammo_id && formData.shots ? (
                  (() => {
                    const selectedAmmo = ammo.find(a => a.id === formData.ammo_id);
                    if (selectedAmmo && selectedAmmo.price_per_unit) {
                      const shots = parseInt(formData.shots, 10);
                      if (!isNaN(shots) && shots > 0) {
                        return `${shots} × ${formatCurrency(selectedAmmo.price_per_unit)}`;
                      }
                    }
                    return formatCurrency(0);
                  })()
                ) : (
                  formatCurrency(0)
                )}
              </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button 
                type="button" 
                className="btn" 
                style={{ 
                  padding: '0.75rem 2rem', 
                  fontSize: '1.1rem', 
                  backgroundColor: '#6c757d', 
                  color: 'var(--text-primary)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => navigate('/shooting-sessions')}
              >
                Anuluj
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={analyzingAI}
                style={{ 
                  padding: '0.75rem 2rem', 
                  fontSize: '1.1rem',
                  backgroundColor: analyzingAI ? '#6c757d' : '#007bff',
                  color: 'var(--text-primary)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: analyzingAI ? 'not-allowed' : 'pointer',
                  opacity: analyzingAI ? 0.6 : 1
                }}
              >
                {analyzingAI ? 'Analiza AI...' : 'Zapisz'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddShootingSessionPage;
