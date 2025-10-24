import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    // TODO: Implementacja logowania w przyszłości
    console.log('Logowanie:', loginData);
    alert('Funkcja logowania będzie dostępna wkrótce!');
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
                <div className="feature-icon">🔫</div>
                <h3>Zarządzanie sprzętem</h3>
                <p>Katalog broni i amunicji z cenami i dostępnością</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">💰</div>
                <h3>Śledzenie kosztów</h3>
                <p>Rejestrowanie sesji strzeleckich z automatycznym obliczaniem wydatków</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🎯</div>
                <h3>Analiza celności</h3>
                <p>Pomiar i ocena wyników strzeleckich z inteligentnymi komentarzami AI</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📊</div>
                <h3>Statystyki</h3>
                <p>Miesięczne podsumowania kosztów i analiza wyników</p>
              </div>
            </div>
          </section>

          {/* Login Form */}
          <section className="login-section">
            <div className="login-card">
              <h2>Zaloguj się</h2>
              <form onSubmit={handleLogin} className="login-form">
                <div className="form-group">
                  <label htmlFor="username">Nazwa użytkownika</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={loginData.username}
                    onChange={handleInputChange}
                    placeholder="Wprowadź nazwę użytkownika"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">Hasło</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={loginData.password}
                    onChange={handleInputChange}
                    placeholder="Wprowadź hasło"
                    required
                  />
                </div>
                <button type="submit" className="login-btn">
                  Zaloguj się
                </button>
              </form>
              
              <div className="register-link">
                <p>Nie masz jeszcze konta?</p>
                <Link to="/register" className="register-btn">
                  Zarejestruj się
                </Link>
              </div>
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

