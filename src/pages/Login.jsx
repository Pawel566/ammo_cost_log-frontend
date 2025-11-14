import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

const Login = () => {
  const { signIn, loading } = useAuth();
  const navigate = useNavigate();
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
      setError('Błąd logowania: ' + error);
    } else {
      setSuccess('Zalogowano pomyślnie!');
      setTimeout(() => {
        navigate('/guns');
      }, 1000);
    }
  };

  return (
    <div className="homepage">
      <div className="homepage-container">
        <header className="homepage-header">
          <h1 className="app-title">Ammo Cost Log</h1>
          <p className="app-subtitle">Zaloguj się do swojego konta</p>
        </header>
        <div className="homepage-content" style={{ gridTemplateColumns: '1fr', maxWidth: '500px', margin: '0 auto' }}>
          <section className="login-section">
            <div className="login-card">
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
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
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Wprowadź hasło"
                    required
                  />
                </div>
                <button type="submit" className="login-btn" disabled={loading}>
                  {loading ? 'Logowanie...' : 'Zaloguj się'}
                </button>
              </form>
              <div className="register-link">
                <p>Nie masz konta?</p>
                <Link to="/register" className="register-btn" style={{ display: 'inline-block' }}>
                  Zarejestruj się
                </Link>
              </div>
              <div className="guest-info">
                <p>💡 <strong>Tryb gościa:</strong> Możesz korzystać z aplikacji bez logowania!</p>
                <Link to="/guns" className="guest-btn">
                  Przejdź do aplikacji
                </Link>
              </div>
            </div>
          </section>
        </div>
        <footer className="homepage-footer">
          <p>&copy; 2024 Ammo Cost Log. Wszystkie prawa zastrzeżone.</p>
        </footer>
      </div>
    </div>
  );
};

export default Login;

