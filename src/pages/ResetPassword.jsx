import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../services/api';
import './HomePage.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  const [recoveryToken, setRecoveryToken] = useState(null);

  useEffect(() => {
    const checkRecoveryToken = async () => {
      setCheckingToken(true);
      setError('');

      try {
        // Check hash first (Supabase typically uses hash for redirects)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hashAccessToken = hashParams.get('access_token');
        const hashType = hashParams.get('type');
        const hashRefreshToken = hashParams.get('refresh_token');

        // Also check query params as fallback
        const searchParams = new URLSearchParams(window.location.search);
        const queryAccessToken = searchParams.get('access_token');
        const queryType = searchParams.get('type');
        const queryRefreshToken = searchParams.get('refresh_token');

        const accessToken = hashAccessToken || queryAccessToken;
        const refreshToken = hashRefreshToken || queryRefreshToken;
        const type = hashType || queryType;

        if (accessToken && type === 'recovery') {
          // Build the full token (Supabase recovery tokens are in format: access_token#refresh_token)
          const fullToken = refreshToken ? `${accessToken}#${refreshToken}` : accessToken;
          
          // Store token for later use in form submission
          setRecoveryToken(fullToken);
          setTokenValid(true);
          setCheckingToken(false);
          
          // Clear the hash/query from URL for cleaner UX
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          setError(t('resetPassword.invalidToken'));
          setCheckingToken(false);
        }
      } catch (err) {
        console.error('Error checking recovery token:', err);
        setError(t('resetPassword.resetError'));
        setCheckingToken(false);
      }
    };

    checkRecoveryToken();
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
      setError(t('resetPassword.passwordsNotMatch'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('resetPassword.passwordTooShort'));
      return;
    }

    setLoading(true);

    try {
      // Check if we have a recovery token
      if (!recoveryToken) {
        throw new Error(t('resetPassword.sessionExpired'));
      }

      // Reset password using backend API with token from URL
      await authAPI.resetPassword(recoveryToken, formData.password);

      setSuccess(t('resetPassword.passwordChanged'));
      setFormData({ password: '', confirmPassword: '' });
      setRecoveryToken(null);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || t('resetPassword.resetError'));
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="homepage">
        <div className="homepage-container">
          <header className="homepage-header">
            <h1 className="app-title">{t('resetPassword.title')}</h1>
            <p className="app-subtitle">{t('resetPassword.subtitle')}</p>
          </header>
          <div className="homepage-content" style={{ gridTemplateColumns: '1fr', maxWidth: '500px', margin: '0 auto' }}>
            <section className="login-section">
              <div className="login-card">
                {checkingToken ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <p>{t('resetPassword.checkingToken')}</p>
                  </div>
                ) : (
                  <>
                    {error && <div className="error-message">{error}</div>}
                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                      <Link 
                        to="/forgot-password" 
                        className="register-btn" 
                        style={{ display: 'inline-block', marginRight: '1rem' }}
                      >
                        {t('resetPassword.requestNewLink')}
                      </Link>
                      <Link 
                        to="/login" 
                        style={{ 
                          color: 'var(--text-secondary)', 
                          textDecoration: 'none',
                          fontSize: '0.9rem'
                        }}
                      >
                        {t('resetPassword.backToLogin')}
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>
          <footer className="homepage-footer">
            <p>{t('resetPassword.footer')}</p>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="homepage">
      <div className="homepage-container">
        <header className="homepage-header">
          <h1 className="app-title">{t('resetPassword.title')}</h1>
          <p className="app-subtitle">{t('resetPassword.newPasswordSubtitle')}</p>
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
                      {t('resetPassword.goToLogin')}
                    </Link>
                  </div>
                </div>
              )}
              {!success && (
                <form onSubmit={handleSubmit} className="login-form">
                  <div className="form-group">
                    <label htmlFor="password">{t('resetPassword.newPassword')}</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder={t('resetPassword.newPasswordPlaceholder')}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmPassword">{t('resetPassword.confirmPassword')}</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                      required
                      minLength={6}
                    />
                  </div>
                  <button type="submit" className="login-btn" disabled={loading}>
                    {loading ? t('resetPassword.changing') : t('resetPassword.changeButton')}
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
                    {t('resetPassword.backToLogin')}
                  </Link>
                </div>
              )}
            </div>
          </section>
        </div>
        <footer className="homepage-footer">
          <p>{t('resetPassword.footer')}</p>
        </footer>
      </div>
    </div>
  );
};

export default ResetPassword;

