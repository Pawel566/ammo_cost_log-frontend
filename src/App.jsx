import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Register from './pages/Register';
import GunsPage from './pages/GunsPage';
import AmmoPage from './pages/AmmoPage';
import CostSessionsPage from './pages/CostSessionsPage';
import AccuracySessionsPage from './pages/AccuracySessionsPage';
import SummaryPage from './pages/SummaryPage';
import './App.css';

const NavbarUser = () => {
  const { user, signOut } = useAuth();
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
                Moje konto
              </div>
              <div className="user-menu-item" onClick={() => { setIsMenuOpen(false); navigate('/my-stats'); }}>
                Moje statystyki
              </div>
              <div className="user-menu-item disabled">
                Moja broń i wyposażenie (0.4.0)
              </div>
              <div className="user-menu-divider"></div>
              <div className="user-menu-item" onClick={handleLogout}>
                Wyloguj
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="auth-buttons">
          <button className="register-btn-navbar" onClick={() => navigate('/register')}>
            Rejestracja
          </button>
          <button className="login-btn-navbar" onClick={() => navigate('/login')}>
            Zaloguj
          </button>
        </div>
      )}
    </div>
  );
};

function AppContent() {
  return (
    <div className="App">
      <nav className="navbar">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link to="/" className="navbar-brand">
              🎯 Ammo Cost Log
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <ul className="navbar-nav">
                <li>
                  <Link to="/guns">Broń</Link>
                </li>
                <li>
                  <Link to="/ammo">Amunicja</Link>
                </li>
                <li>
                  <Link to="/cost-sessions">Sesje kosztowe</Link>
                </li>
                <li>
                  <Link to="/accuracy-sessions">Sesje celnościowe</Link>
                </li>
                <li>
                  <Link to="/summary">Podsumowanie</Link>
                </li>
              </ul>
              <NavbarUser />
            </div>
          </div>
        </div>
      </nav>

      <main className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/guns" element={<GunsPage />} />
          <Route path="/ammo" element={<AmmoPage />} />
          <Route path="/cost-sessions" element={<CostSessionsPage />} />
          <Route path="/accuracy-sessions" element={<AccuracySessionsPage />} />
          <Route path="/summary" element={<SummaryPage />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
