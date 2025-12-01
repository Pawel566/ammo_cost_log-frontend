import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../services/api';
import './HomePage.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
      setSuccess(response.data.message || t('forgotPassword.success'));
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.detail || t('forgotPassword.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="homepage">
      <div className="homepage-container">
        <header className="homepage-header">
          <h1 className="app-title">{t('forgotPassword.title')}</h1>
          <p className="app-subtitle">{t('forgotPassword.subtitle')}</p>
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
                      {t('forgotPassword.backToLogin')}
                    </Link>
                  </div>
                </div>
              )}
              {!success && (
                <>
                  <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                      <label htmlFor="email">{t('forgotPassword.email')}</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError('');
                        }}
                        placeholder={t('forgotPassword.emailPlaceholder')}
                        required
                      />
                    </div>
                    <button type="submit" className="login-btn" disabled={loading}>
                      {loading ? t('forgotPassword.sending') : t('forgotPassword.sendButton')}
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
                      {t('forgotPassword.backToLogin')}
                    </Link>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
        <footer className="homepage-footer">
          <p>{t('forgotPassword.footer')}</p>
        </footer>
      </div>
    </div>
  );
};

export default ForgotPassword;











