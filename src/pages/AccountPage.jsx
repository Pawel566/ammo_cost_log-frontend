import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { accountAPI } from '../services/api';

const AccountPage = () => {
  const { t } = useTranslation();
  const { user, signOut, authReady } = useAuth();
  const navigate = useNavigate();
  const [skillLevel, setSkillLevel] = useState('beginner');
  const [rankInfo, setRankInfo] = useState(null);
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
    if (authReady) {
      fetchSkillLevel();
      fetchRank();
    }
  }, [authReady]);

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

  const fetchRank = async () => {
    try {
      const response = await accountAPI.getRank();
      setRankInfo(response.data);
    } catch (err) {
      console.error('Błąd pobierania rangi:', err);
      setRankInfo({ rank: "Nowicjusz", passed_sessions: 0 });
    }
  };

  const handleSkillLevelChange = async (e) => {
    const newLevel = e.target.value;
    setSkillLevel(newLevel);
    try {
      await accountAPI.updateSkillLevel(newLevel);
      setSuccess(t('account.skillLevelUpdated'));
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || t('account.errorUpdatingSkill'));
      setSkillLevel(skillLevel);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError(t('account.passwordsNotMatch'));
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setError(t('account.passwordTooShort'));
      return;
    }
    try {
      await accountAPI.changePassword(passwordForm.oldPassword, passwordForm.newPassword);
      setSuccess(t('account.passwordChanged'));
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || t('account.errorChangingPassword'));
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await accountAPI.changeEmail(emailForm.newEmail);
      setSuccess(t('account.emailChanged'));
      setEmailForm({ newEmail: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || t('account.errorChangingEmail'));
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setError(t('account.enterPasswordToDelete'));
      return;
    }
    try {
      await accountAPI.deleteAccount(deletePassword);
      await signOut();
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || t('account.errorDeletingAccount'));
      setShowDeleteModal(false);
      setDeletePassword('');
    }
  };

  if (loading) {
    return <div className="text-center">{t('common.loading')}</div>;
  }

  const skillLevelOptions = [
    { value: 'beginner', label: t('account.beginner') },
    { value: 'intermediate', label: t('account.intermediate') },
    { value: 'advanced', label: t('account.advanced') }
  ];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>{t('account.title')}</h2>
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
            <h3 style={{ marginBottom: '1rem' }}>{t('account.accountInfo')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
                    {t('account.email')}
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: '500' }}>
                    {user.email}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
                    {t('account.username')}
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: '500' }}>
                    {user.username || '-'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '1em', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
                      {t('account.rank')}
                    </div>
                    <div style={{ 
                      fontSize: '1rem', 
                      fontWeight: '500', 
                      color: '#007bff',
                      marginBottom: '0.25rem'
                    }}>
                      {rankInfo ? (rankInfo.rank || t('account.beginner')) : t('common.loading')}
                    </div>
                    {rankInfo && (
                      <div style={{ 
                        fontSize: '0.85rem', 
                        color: 'var(--text-tertiary)'
                      }}>
                        {rankInfo.passed_sessions || 0} {t('account.passedSessions')}
                      </div>
                    )}
                  </div>
                  {/* Ikona rangi */}
                  {rankInfo && (() => {
                    const rankName = rankInfo.rank || "Nowicjusz";
                    const rankMap = {
                      "Nowicjusz": 1,
                      "Adepciak": 2,
                      "Stabilny Strzelec": 3,
                      "Celny Strzelec": 4,
                      "Precyzyjny Strzelec": 5,
                      "Zaawansowany Strzelec": 6
                    };
                    const rankNumber = rankMap[rankName];
                    if (rankNumber) {
                      return (
                        <img 
                          src={`/badges/rank_${String(rankNumber).padStart(2, '0')}.png`}
                          alt={rankName}
                          style={{ 
                            maxWidth: '80px',
                            maxHeight: '80px',
                            width: 'auto',
                            height: 'auto',
                            objectFit: 'contain',
                            flexShrink: 0,
                            marginTop: '0.5rem'
                          }}
                        />
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>{t('account.skillLevel')}</h3>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('account.selectSkillLevel')}</label>
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
          <h3 style={{ marginBottom: '1.5rem' }}>{t('account.security')}</h3>
          
          <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: `1px solid var(--border-color)` }}>
            <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>{t('account.changePassword')}</h4>
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label className="form-label">{t('account.oldPassword')}</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('account.newPassword')}</label>
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
                <label className="form-label">{t('account.confirmPassword')}</label>
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
                {t('account.changePassword')}
              </button>
            </form>
          </div>

          <div>
            <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>{t('account.changeEmail')}</h4>
            <form onSubmit={handleEmailSubmit}>
              <div className="form-group">
                <label className="form-label">{t('account.newEmail')}</label>
                <input
                  type="email"
                  className="form-input"
                  value={emailForm.newEmail}
                  onChange={(e) => setEmailForm({ newEmail: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">
                {t('account.changeEmail')}
              </button>
            </form>
          </div>
        </div>

        <div className="card" style={{ borderColor: '#f44336', border: '1px solid #f44336' }}>
          <h3 style={{ marginBottom: '1rem', color: '#f44336' }}>{t('account.deleteAccount')}</h3>
          <p style={{ marginBottom: '1rem', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
            {t('account.deleteAccountWarning')}
          </p>
          <button
            className="btn btn-danger"
            onClick={() => setShowDeleteModal(true)}
          >
            {t('account.deleteAccount')}
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
            <h3 style={{ color: '#f44336', marginBottom: '1rem' }}>{t('account.confirmDelete')}</h3>
            <p style={{ marginBottom: '1rem', color: 'var(--text-tertiary)' }}>
              {t('account.confirmDeleteText')}
            </p>
            <div className="form-group">
              <label className="form-label">{t('account.password')}</label>
              <input
                type="password"
                className="form-input"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder={t('account.enterPassword')}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button
                className="btn btn-danger"
                onClick={handleDeleteAccount}
                disabled={!deletePassword}
              >
                {t('account.deleteAccount')}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
              >
                {t('account.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountPage;
