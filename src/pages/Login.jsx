import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

const Login = () => {
  const { signIn, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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
    const { error } = await signIn(formData.email, formData.password);
    if (error) {
      setError(t('login.loginError', { error }));
    } else {
      setSuccess(t('login.loginSuccess'));
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    }
  };

  return (
    <div className="homepage">
      <div className="homepage-container">
        <header className="homepage-header">
          <h1 className="app-title">{t('login.title')}</h1>
          <p className="app-subtitle">{t('login.subtitle')}</p>
        </header>
        <div className="homepage-content" style={{ gridTemplateColumns: '1fr', maxWidth: '500px', margin: '0 auto' }}>
          <section className="login-section">
            <div className="login-card">
              <div className="auth-buttons-large">
                <Link to="/login" className="auth-btn-large login-btn-large active">
                  {t('login.login')}
                </Link>
                <Link to="/register" className="auth-btn-large register-btn-large">
                  {t('login.register')}
                </Link>
              </div>
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                  <label htmlFor="email">{t('login.email')}</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={t('login.emailPlaceholder')}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">{t('login.password')}</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={t('login.passwordPlaceholder')}
                    required
                  />
                </div>
                <button type="submit" className="login-btn" disabled={loading}>
                  {loading ? t('login.loggingIn') : t('login.loginButton')}
                </button>
              </form>
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <Link 
                  to="/forgot-password" 
                  style={{ 
                    color: 'var(--text-secondary)', 
                    textDecoration: 'none',
                    fontSize: '0.9rem'
                  }}
                >
                  {t('login.forgotPassword')}
                </Link>
              </div>
            </div>
          </section>
        </div>
        <footer className="homepage-footer">
          <p>{t('login.footer')}</p>
        </footer>
      </div>
    </div>
  );
};

export default Login;

