import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { CurrencyProvider } from './context/CurrencyContext';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import DashboardPage from './pages/DashboardPage';
import GunsPage from './pages/GunsPage';
import AmmoPage from './pages/AmmoPage';
import ShootingSessionsPage from './pages/ShootingSessionsPage';
import AddShootingSessionPage from './pages/AddShootingSessionPage';
import SummaryPage from './pages/SummaryPage';
import AccountPage from './pages/AccountPage';
import MyWeaponsPage from './pages/MyWeaponsPage';
import MaintenancePage from './pages/MaintenancePage';
import SettingsPage from './pages/SettingsPage';
import AttachmentDetailsPage from './pages/AttachmentDetailsPage';
import './App.css';

const NavbarUser = () => {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    await signOut();
    setIsMenuOpen(false);
    navigate('/');
  };

  return (
    <div className="navbar-user" ref={menuRef}>
      {user ? (
        <div className="user-menu-container">
          <div 
            className="user-menu" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {user.username || user.email} ▼
          </div>
          {isMenuOpen && (
            <div className="user-menu-dropdown">
              <div className="user-menu-item" onClick={() => { setIsMenuOpen(false); navigate('/account'); }}>
                {t('userMenu.myAccount')}
              </div>
              <div className="user-menu-item" onClick={() => { setIsMenuOpen(false); navigate('/my-weapons'); }}>
                {t('userMenu.myWeapons')}
              </div>
              <div className="user-menu-item" onClick={() => { setIsMenuOpen(false); navigate('/maintenance'); }}>
                {t('userMenu.maintenance')}
              </div>
              <div className="user-menu-item" onClick={() => { setIsMenuOpen(false); navigate('/settings'); }}>
                {t('userMenu.settings')}
              </div>
              <div className="user-menu-divider"></div>
              <div className="user-menu-item" onClick={handleLogout}>
                {t('userMenu.logout')}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const isHomePage = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/forgot-password' || location.pathname === '/reset-password';

  // Check for password reset token in URL and redirect to reset-password page
  useEffect(() => {
    // Check if we have recovery token in hash or query params
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const searchParams = new URLSearchParams(window.location.search);
    
    const hashAccessToken = hashParams.get('access_token');
    const hashType = hashParams.get('type');
    const queryAccessToken = searchParams.get('access_token');
    const queryType = searchParams.get('type');
    
    const accessToken = hashAccessToken || queryAccessToken;
    const type = hashType || queryType;

    // If we have a recovery token and we're not already on reset-password page
    if (accessToken && type === 'recovery' && location.pathname !== '/reset-password') {
      // Build the new URL with the token
      let newPath = '/reset-password';
      
      if (hashAccessToken) {
        // Token is in hash - preserve hash
        newPath += window.location.hash;
      } else if (queryAccessToken) {
        // Token is in query - preserve query params
        newPath += window.location.search;
      }
      
      navigate(newPath, { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <div className={`App ${!isHomePage ? `theme-${theme}` : ''}`}>
      {!isHomePage && (
        <nav className="navbar">
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link to="/dashboard" className="navbar-brand">
                🎯 Ammo Cost Log
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <ul className="navbar-nav">
                  <li>
                    <Link to="/guns">{t('nav.guns')}</Link>
                  </li>
                  <li>
                    <Link to="/ammo">{t('nav.ammo')}</Link>
                  </li>
                  <li>
                    <Link to="/shooting-sessions">{t('nav.shootingSessions')}</Link>
                  </li>
                  <li>
                    <Link to="/summary">{t('nav.summary')}</Link>
                  </li>
                </ul>
                <NavbarUser />
              </div>
            </div>
          </div>
        </nav>
      )}

      <main className={!isHomePage ? "container" : ""}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/guns" element={<GunsPage />} />
          <Route path="/ammo" element={<AmmoPage />} />
          <Route path="/shooting-sessions" element={<ShootingSessionsPage />} />
          <Route path="/shooting-sessions/add" element={<AddShootingSessionPage />} />
          <Route path="/shooting-sessions/edit/:id" element={<AddShootingSessionPage />} />
          <Route path="/summary" element={<SummaryPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/my-weapons" element={<MyWeaponsPage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/attachment/:id" element={<AttachmentDetailsPage />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <CurrencyProvider>
          <ThemeProvider>
            <Router future={{ v7_startTransition: true }}>
              <AppContent />
            </Router>
          </ThemeProvider>
        </CurrencyProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
