import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import './HomePage.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await authAPI.forgotPassword(email);
      setSuccess(response.data.message || 'Jeśli podany email istnieje w systemie, wysłaliśmy link do resetowania hasła.');
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Wystąpił błąd podczas wysyłania emaila resetującego.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="homepage">
      <div className="homepage-container">
        <header className="homepage-header">
          <h1 className="app-title">Ammo Cost Log</h1>
          <p className="app-subtitle">Odzyskaj dostęp do konta</p>
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
                      Wróć do logowania
                    </Link>
                  </div>
                </div>
              )}
              {!success && (
                <>
                  <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                      <label htmlFor="email">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError('');
                        }}
                        placeholder="Wprowadź email"
                        required
                      />
                    </div>
                    <button type="submit" className="login-btn" disabled={loading}>
                      {loading ? 'Wysyłanie...' : 'Wyślij link resetujący'}
                    </button>
                  </form>
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
                </>
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

export default ForgotPassword;



