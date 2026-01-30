import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

const HomePage = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Jeśli użytkownik jest zalogowany, przekieruj na dashboard
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="homepage">
      <div className="homepage-container">
        {/* Header */}
        <header className="homepage-header">
          <h1 className="app-title">Ammo Cost Log</h1>
          <p className="app-subtitle">Kompleksowe zarządzanie strzelectwem</p>
        </header>

        {/* Main Content */}
        <div className="homepage-content">
          {/* App Description */}
          <section className="app-description">
            <h2>O aplikacji</h2>
            <div className="description-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 15h6M4 12h16M6 8h12M8 4h8M12 2v2M12 22v2"/>
                  </svg>
                </div>
                <h3>Zarządzanie sprzętem</h3>
                <p>Katalog broni i amunicji z cenami i dostępnością</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <h3>Śledzenie kosztów</h3>
                <p>Rejestrowanie sesji strzeleckich z automatycznym obliczaniem wydatków</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="6"></circle>
                    <circle cx="12" cy="12" r="2"></circle>
                  </svg>
                </div>
                <h3>Analiza celności</h3>
                <p>Pomiar i ocena wyników strzeleckich</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                  </svg>
                </div>
                <h3>Statystyki</h3>
                <p>Miesięczne podsumowania kosztów i analiza wyników</p>
              </div>
            </div>
          </section>

          {/* Auth Section */}
          <section className="login-section">
            <div className="login-card">
              {user ? (
                <div className="user-info">
                  <h2>Witaj, {user.username || user.email}!</h2>
                  <p>Jesteś zalogowany jako: {user.email}</p>
                  <button onClick={handleLogout} className="logout-btn">
                    Wyloguj się
                  </button>
                </div>
              ) : (
                <>
                  <div className="auth-buttons-large">
                    <Link to="/login" className="auth-btn-large login-btn-large">
                      Zaloguj się
                    </Link>
                    <Link to="/register" className="auth-btn-large register-btn-large">
                      Zarejestruj się
                    </Link>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="homepage-footer">
          <p>&copy; 2024 Ammo Cost Log. Wszystkie prawa zastrzeżone.</p>
        </footer>
      </div>
    </div>
  );
};

export default HomePage;
