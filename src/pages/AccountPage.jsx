import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { accountAPI } from '../services/api';

const AccountPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [skillLevel, setSkillLevel] = useState('beginner');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [emailForm, setEmailForm] = useState({
    newEmail: ''
  });

  useEffect(() => {
    fetchSkillLevel();
  }, []);

  const fetchSkillLevel = async () => {
    try {
      const response = await accountAPI.getSkillLevel();
      setSkillLevel(response.data.skill_level || 'beginner');
    } catch (err) {
      console.error('Błąd pobierania poziomu zaawansowania:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkillLevelChange = async (e) => {
    const newLevel = e.target.value;
    setSkillLevel(newLevel);
    try {
      await accountAPI.updateSkillLevel(newLevel);
      setSuccess('Poziom zaawansowania został zaktualizowany');
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Błąd podczas aktualizacji poziomu zaawansowania');
      setSkillLevel(skillLevel);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Nowe hasła nie są identyczne');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setError('Nowe hasło musi mieć co najmniej 6 znaków');
      return;
    }
    try {
      await accountAPI.changePassword(passwordForm.oldPassword, passwordForm.newPassword);
      setSuccess('Hasło zostało zmienione pomyślnie');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Błąd podczas zmiany hasła');
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await accountAPI.changeEmail(emailForm.newEmail);
      setSuccess('Email został zmieniony pomyślnie');
      setEmailForm({ newEmail: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Błąd podczas zmiany emaila');
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setError('Wprowadź hasło aby potwierdzić usunięcie konta');
      return;
    }
    try {
      await accountAPI.deleteAccount(deletePassword);
      await signOut();
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Błąd podczas usuwania konta');
      setShowDeleteModal(false);
      setDeletePassword('');
    }
  };

  if (loading) {
    return <div className="text-center">Ładowanie...</div>;
  }

  const skillLevelOptions = [
    { value: 'beginner', label: 'Początkujący' },
    { value: 'intermediate', label: 'Średniozaawansowany' },
    { value: 'advanced', label: 'Zaawansowany' }
  ];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Moje konto</h2>
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
            {success}
          </div>
        )}

        {user && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Informacje o koncie</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
                  Email
                </div>
                <div style={{ fontSize: '1rem', fontWeight: '500' }}>
                  {user.email}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
                  Nazwa użytkownika
                </div>
                <div style={{ fontSize: '1rem', fontWeight: '500' }}>
                  {user.username || '-'}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Poziom zaawansowania</h3>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Wybierz swój poziom zaawansowania</label>
            <select
              className="form-input"
              value={skillLevel}
              onChange={handleSkillLevelChange}
            >
              {skillLevelOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Bezpieczeństwo</h3>
          
          <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: `1px solid var(--border-color)` }}>
            <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Zmiana hasła</h4>
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label className="form-label">Stare hasło</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nowe hasło</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Powtórz nowe hasło</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Zmień hasło
              </button>
            </form>
          </div>

          <div>
            <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Zmiana emaila</h4>
            <form onSubmit={handleEmailSubmit}>
              <div className="form-group">
                <label className="form-label">Nowy email</label>
                <input
                  type="email"
                  className="form-input"
                  value={emailForm.newEmail}
                  onChange={(e) => setEmailForm({ newEmail: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Zmień email
              </button>
            </form>
          </div>
        </div>

        <div className="card" style={{ borderColor: '#f44336', border: '1px solid #f44336' }}>
          <h3 style={{ marginBottom: '1rem', color: '#f44336' }}>Usuń konto</h3>
          <p style={{ marginBottom: '1rem', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
            Usunięcie konta jest nieodwracalne. Wszystkie Twoje dane zostaną trwale usunięte.
          </p>
          <button
            className="btn btn-danger"
            onClick={() => setShowDeleteModal(true)}
          >
            Usuń konto
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: '500px',
              width: '90%',
              margin: '0 auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: '#f44336', marginBottom: '1rem' }}>Potwierdź usunięcie konta</h3>
            <p style={{ marginBottom: '1rem', color: 'var(--text-tertiary)' }}>
              To działanie jest nieodwracalne. Wprowadź hasło aby potwierdzić usunięcie konta.
            </p>
            <div className="form-group">
              <label className="form-label">Hasło</label>
              <input
                type="password"
                className="form-input"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Wprowadź hasło"
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button
                className="btn btn-danger"
                onClick={handleDeleteAccount}
                disabled={!deletePassword}
              >
                Usuń konto
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountPage;
