import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

const Register = () => {
  const { signUp, loading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
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
    const { error } = await signUp(formData.email, formData.password, formData.username);
    if (error) {
      setError('Błąd rejestracji: ' + error);
    } else {
      setSuccess('Konto zostało utworzone!');
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
          <p className="app-subtitle">Utwórz nowe konto</p>
        </header>
        <div className="homepage-content" style={{ gridTemplateColumns: '1fr', maxWidth: '500px', margin: '0 auto' }}>
          <section className="login-section">
            <div className="login-card">
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              <form onSubmit={handleSubmit} className="register-form">
                <div className="form-group">
                  <label htmlFor="username">Nazwa użytkownika</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Wprowadź nazwę użytkownika"
                    required
                  />
                </div>
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
                <button type="submit" className="register-btn" disabled={loading}>
                  {loading ? 'Rejestracja...' : 'Zarejestruj się'}
                </button>
              </form>
              <div className="register-link">
                <p>Masz już konto?</p>
                <Link to="/login" className="register-btn" style={{ display: 'inline-block' }}>
                  Zaloguj się
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

export default Register;

