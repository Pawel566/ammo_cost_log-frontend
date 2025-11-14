import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

const HomePage = () => {
  const { user, signIn, signUp, signOut, loading } = useAuth();
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    username: ''
  });
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (isLoginMode) {
      setLoginData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setRegisterData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const { error } = await signIn(loginData.email, loginData.password);
    if (error) {
      setError('Błąd logowania: ' + error);
    } else {
      setSuccess('Zalogowano pomyślnie!');
      setLoginData({ email: '', password: '' });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const { error } = await signUp(registerData.email, registerData.password, registerData.username);
    if (error) {
      setError('Błąd rejestracji: ' + error);
    } else {
      setSuccess('Konto zostało utworzone!');
      setRegisterData({ email: '', password: '', username: '' });
    }
  };

  const handleLogout = async () => {
    await signOut();
    setSuccess('Wylogowano pomyślnie!');
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
                <p>Pomiar i ocena wyników strzeleckich z inteligentnymi komentarzami AI</p>
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

          {/* Login Form */}
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
                  <div className="auth-tabs">
                    <button 
                      className={`tab ${isLoginMode ? 'active' : ''}`}
                      onClick={() => setIsLoginMode(true)}
                    >
                      Logowanie
                    </button>
                    <button 
                      className={`tab ${!isLoginMode ? 'active' : ''}`}
                      onClick={() => setIsLoginMode(false)}
                    >
                      Rejestracja
                    </button>
                  </div>

                  {error && <div className="error-message">{error}</div>}
                  {success && <div className="success-message">{success}</div>}

                  {isLoginMode ? (
                    <form onSubmit={handleLogin} className="login-form">
                      <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={loginData.email}
                          onChange={handleInputChange}
                          placeholder="Wprowadź email"
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
                      <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? 'Logowanie...' : 'Zaloguj się'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleRegister} className="register-form">
                      <div className="form-group">
                        <label htmlFor="reg-username">Nazwa użytkownika</label>
                        <input
                          type="text"
                          id="reg-username"
                          name="username"
                          value={registerData.username}
                          onChange={handleInputChange}
                          placeholder="Wprowadź nazwę użytkownika"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="reg-email">Email</label>
                        <input
                          type="email"
                          id="reg-email"
                          name="email"
                          value={registerData.email}
                          onChange={handleInputChange}
                          placeholder="Wprowadź email"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="reg-password">Hasło</label>
                        <input
                          type="password"
                          id="reg-password"
                          name="password"
                          value={registerData.password}
                          onChange={handleInputChange}
                          placeholder="Wprowadź hasło"
                          required
                        />
                      </div>
                      <button type="submit" className="register-btn" disabled={loading}>
                        {loading ? 'Rejestracja...' : 'Zarejestruj się'}
                      </button>
                    </form>
                  )}
                </>
              )}
              
              <div className="guest-info">
                <p>💡 <strong>Tryb gościa:</strong> Możesz korzystać z aplikacji bez logowania!</p>
                <Link to="/guns" className="guest-btn">
                  Przejdź do aplikacji
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

