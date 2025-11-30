import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './HomePage.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    // Check if we have a recovery token in the URL hash
    // Supabase automatically processes the hash and sets the session
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');

    if (accessToken && type === 'recovery') {
      // Supabase automatically processes the hash and sets the session
      // We just need to wait a moment for it to process
      setTimeout(() => {
        setTokenValid(true);
      }, 100);
    } else {
      setError('Nieprawidłowy lub brakujący link resetujący. Proszę poprosić o nowy link.');
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Hasła nie są identyczne.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków.');
      return;
    }

    setLoading(true);

    try {
      // Get the token from URL hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');

      if (!accessToken) {
        throw new Error('Brak tokena resetującego.');
      }

      // Check if Supabase is configured
      if (!supabase || !supabase.auth) {
        throw new Error('Usługa resetowania hasła nie jest dostępna.');
      }

      // Update password using Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess('Hasło zostało zmienione pomyślnie! Możesz się teraz zalogować nowym hasłem.');
      setFormData({ password: '', confirmPassword: '' });
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Wystąpił błąd podczas resetowania hasła.');
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="homepage">
        <div className="homepage-container">
          <header className="homepage-header">
            <h1 className="app-title">Ammo Cost Log</h1>
            <p className="app-subtitle">Resetowanie hasła</p>
          </header>
          <div className="homepage-content" style={{ gridTemplateColumns: '1fr', maxWidth: '500px', margin: '0 auto' }}>
            <section className="login-section">
              <div className="login-card">
                {error && <div className="error-message">{error}</div>}
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <Link 
                    to="/forgot-password" 
                    className="register-btn" 
                    style={{ display: 'inline-block', marginRight: '1rem' }}
                  >
                    Poproś o nowy link
                  </Link>
                  <Link 
                    to="/login" 
                    style={{ 
                      color: 'var(--text-secondary)', 
                      textDecoration: 'none',
                      fontSize: '0.9rem'
                    }}
                  >
                    Wróć do logowania
                  </Link>
                </div>
              </div>
            </section>
          </div>
          <footer className="homepage-footer">
            <p>&copy; 2024 Ammo Cost Log. Wszystkie prawa zastrzeżone.</p>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="homepage">
      <div className="homepage-container">
        <header className="homepage-header">
          <h1 className="app-title">Ammo Cost Log</h1>
          <p className="app-subtitle">Ustaw nowe hasło</p>
        </header>
        <div className="homepage-content" style={{ gridTemplateColumns: '1fr', maxWidth: '500px', margin: '0 auto' }}>
          <section className="login-section">
            <div className="login-card">
              {error && <div className="error-message">{error}</div>}
              {success && (
                <div className="success-message">
                  {success}
                  <div style={{ marginTop: '15px' }}>
                    <Link to="/login" className="register-btn" style={{ display: 'inline-block' }}>
                      Przejdź do logowania
                    </Link>
                  </div>
                </div>
              )}
              {!success && (
                <form onSubmit={handleSubmit} className="login-form">
                  <div className="form-group">
                    <label htmlFor="password">Nowe hasło</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Wprowadź nowe hasło"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Potwierdź hasło</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Powtórz hasło"
                      required
                      minLength={6}
                    />
                  </div>
                  <button type="submit" className="login-btn" disabled={loading}>
                    {loading ? 'Zmienianie hasła...' : 'Zmień hasło'}
                  </button>
                </form>
              )}
              {!success && (
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <Link 
                    to="/login" 
                    style={{ 
                      color: 'var(--text-secondary)', 
                      textDecoration: 'none',
                      fontSize: '0.9rem'
                    }}
                  >
                    Wróć do logowania
                  </Link>
                </div>
              )}
            </div>
          </section>
        </div>
        <footer className="homepage-footer">
          <p>&copy; 2024 Ammo Cost Log. Wszystkie prawa zastrzeżone.</p>
        </footer>
      </div>
    </div>
  );
};

export default ResetPassword;

