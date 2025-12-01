import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

const Register = () => {
  const { signUp, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    const { error, status } = await signUp(formData.email, formData.password, formData.username);
    if (error) {
      if (status === 409) {
        setError(t('register.userExists'));
      } else {
        setError(t('register.registerError', { error }));
      }
    } else {
      setSuccess(t('register.registerSuccess'));
      setFormData({ email: '', password: '', username: '' });
    }
  };

  return (
    <div className="homepage">
      <div className="homepage-container">
        <header className="homepage-header">
          <h1 className="app-title">{t('register.title')}</h1>
          <p className="app-subtitle">{t('register.subtitle')}</p>
        </header>
        <div className="homepage-content" style={{ gridTemplateColumns: '1fr', maxWidth: '500px', margin: '0 auto' }}>
          <section className="login-section">
            <div className="login-card">
              <div className="auth-buttons-large">
                <Link to="/login" className="auth-btn-large login-btn-large">
                  {t('register.login')}
                </Link>
                <Link to="/register" className="auth-btn-large register-btn-large active">
                  {t('register.register')}
                </Link>
              </div>
              {error && <div className="error-message">{error}</div>}
              {success && (
                <div className="success-message">
                  {success}
                  <div style={{ marginTop: '15px' }}>
                    <Link to="/login" className="register-btn" style={{ display: 'inline-block' }}>
                      {t('register.goToLogin')}
                    </Link>
                  </div>
                </div>
              )}
              {!success && (
              <form onSubmit={handleSubmit} className="register-form">
                <div className="form-group">
                  <label htmlFor="username">{t('register.username')}</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder={t('register.usernamePlaceholder')}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">{t('register.email')}</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={t('register.emailPlaceholder')}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">{t('register.password')}</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={t('register.passwordPlaceholder')}
                    required
                  />
                </div>
                <button type="submit" className="register-btn" disabled={loading}>
                  {loading ? t('register.registering') : t('register.registerButton')}
                </button>
              </form>
              )}
              {!success && (
              <div className="guest-info">
                <p>{t('register.continueAsGuest')}</p>
                <Link to="/guns" className="guest-btn">
                  {t('register.goToApp')}
                </Link>
              </div>
              )}
            </div>
          </section>
        </div>
        <footer className="homepage-footer">
          <p>{t('register.footer')}</p>
        </footer>
      </div>
    </div>
  );
};

export default Register;

