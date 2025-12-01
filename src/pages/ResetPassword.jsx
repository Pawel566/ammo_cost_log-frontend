import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
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

  useEffect(() => {
    const checkRecoveryToken = async () => {
      setCheckingToken(true);
      setError('');

      if (!supabase || !supabase.auth) {
        console.error('Supabase client not initialized. Missing environment variables:', {
          hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
          hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
          url: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing',
          key: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
        });
        setError(t('resetPassword.serviceUnavailable'));
        setCheckingToken(false);
        return;
      }

      try {
        // Check hash first (Supabase typically uses hash for redirects)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hashAccessToken = hashParams.get('access_token');
        const hashType = hashParams.get('type');

        // Also check query params as fallback
        const searchParams = new URLSearchParams(window.location.search);
        const queryAccessToken = searchParams.get('access_token');
        const queryType = searchParams.get('type');

        const accessToken = hashAccessToken || queryAccessToken;
        const type = hashType || queryType;

        if (accessToken && type === 'recovery') {
          // Supabase automatically processes the hash and sets the session
          // Wait a bit for Supabase to process the token
          await new Promise(resolve => setTimeout(resolve, 500));

          // Check if we have a valid session
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Session error:', sessionError);
            setError(t('resetPassword.invalidToken'));
            setCheckingToken(false);
            return;
          }

          if (session) {
            setTokenValid(true);
            setCheckingToken(false);
            // Clear the hash/query from URL for cleaner UX
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            setError(t('resetPassword.invalidToken'));
            setCheckingToken(false);
          }
        } else {
          // Check if we have an active session (user might have already processed the token)
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            setTokenValid(true);
            setCheckingToken(false);
          } else {
            setError(t('resetPassword.invalidToken'));
            setCheckingToken(false);
          }
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
      // Check if Supabase is configured
      if (!supabase || !supabase.auth) {
        console.error('Supabase client not initialized during password reset');
        throw new Error(t('resetPassword.serviceUnavailable'));
      }

      // Verify we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error(t('resetPassword.sessionExpired'));
      }

      // Update password using Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (updateError) {
        throw updateError;
      }

      // Sign out after password change for security
      await supabase.auth.signOut();

      setSuccess(t('resetPassword.passwordChanged'));
      setFormData({ password: '', confirmPassword: '' });
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || t('resetPassword.resetError'));
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

