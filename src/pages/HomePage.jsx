import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './HomePage.css';

const HomePage = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();

  useEffect(() => {
    // Check for password reset token first
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const searchParams = new URLSearchParams(window.location.search);
    
    const hashAccessToken = hashParams.get('access_token');
    const hashType = hashParams.get('type');
    const queryAccessToken = searchParams.get('access_token');
    const queryType = searchParams.get('type');
    
    const accessToken = hashAccessToken || queryAccessToken;
    const type = hashType || queryType;

    // If we have a recovery token, redirect to reset-password page
    if (accessToken && type === 'recovery') {
      let newPath = '/reset-password';
      if (hashAccessToken) {
        newPath += window.location.hash;
      } else if (queryAccessToken) {
        newPath += window.location.search;
      }
      navigate(newPath, { replace: true });
      return;
    }

    // Jeśli użytkownik jest zalogowany, przekieruj na dashboard
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    await signOut();
  };

  const handleLanguageChange = async (lang) => {
    await changeLanguage(lang);
  };

  return (
    <div className="homepage">
      <div className="homepage-container">
        {/* Language Selector */}
        <div className="language-selector" style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 1000 }}>
          <select
            value={currentLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
            style={{ padding: '0.5rem', fontSize: '1rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
          >
            <option value="pl">PL</option>
            <option value="en">EN</option>
          </select>
        </div>
        {/* Header */}
        <header className="homepage-header">
          <h1 className="app-title">{t('homepage.title')}</h1>
          <p className="app-subtitle">{t('homepage.subtitle')}</p>
        </header>

        {/* Main Content */}
        <div className="homepage-content">
          {/* App Description */}
          <section className="app-description">
            <h2>{t('homepage.aboutApp')}</h2>
            <div className="description-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 15h6M4 12h16M6 8h12M8 4h8M12 2v2M12 22v2"/>
                  </svg>
                </div>
                <h3>{t('homepage.equipmentManagement')}</h3>
                <p>{t('homepage.equipmentManagementDesc')}</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <h3>{t('homepage.costTracking')}</h3>
                <p>{t('homepage.costTrackingDesc')}</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="6"></circle>
                    <circle cx="12" cy="12" r="2"></circle>
                  </svg>
                </div>
                <h3>{t('homepage.accuracyAnalysis')}</h3>
                <p>{t('homepage.accuracyAnalysisDesc')}</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                  </svg>
                </div>
                <h3>{t('homepage.statistics')}</h3>
                <p>{t('homepage.statisticsDesc')}</p>
              </div>
            </div>
          </section>

          {/* Auth Section */}
          <section className="login-section">
            <div className="login-card">
              {user ? (
                <div className="user-info">
                  <h2>{t('homepage.welcome', { username: user.username || user.email })}</h2>
                  <p>{t('homepage.loggedInAs', { email: user.email })}</p>
                  <button onClick={handleLogout} className="logout-btn">
                    {t('homepage.logout')}
                  </button>
                </div>
              ) : (
                <>
                  <div className="auth-buttons-large">
                    <Link to="/login" className="auth-btn-large login-btn-large">
                      {t('homepage.login')}
                    </Link>
                    <Link to="/register" className="auth-btn-large register-btn-large">
                      {t('homepage.register')}
                    </Link>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="homepage-footer">
          <p>{t('homepage.footer')}</p>
        </footer>
      </div>
    </div>
  );
};

export default HomePage;

