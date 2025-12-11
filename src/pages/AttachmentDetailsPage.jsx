import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attachmentsAPI } from '../services/api';

const AttachmentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAttachment();
  }, [id]);

  const fetchAttachment = async () => {
    try {
      setLoading(true);
      const response = await attachmentsAPI.getById(id);
      setAttachment(response.data);
      setError(null);
    } catch (err) {
      setError('Nie udało się pobrać szczegółów dodatku');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getAttachmentTypeLabel = (type) => {
    const labels = {
      red_dot: 'Kolimator (Red Dot)',
      reflex: 'Otwarty kolimator / Reflex Sight',
      lpvo: 'Optyka LPVO',
      magnifier: 'Powiększalnik (Magnifier)',
      suppressor: 'Tłumik (suppressor)',
      compensator: 'Hamulec wylotowy / kompensator',
      foregrip: 'Chwyt pionowy (foregrip)',
      angled_grip: 'Chwyt kątowy (angled grip)',
      bipod: 'Dwójnóg (bipod)',
      tactical_light: 'Latarka taktyczna'
    };
    return labels[type] || type;
  };

  const translateValue = (value) => {
    const translations = {
      none: 'none',
      low: 'low',
      medium: 'medium',
      high: 'high'
    };
    return translations[value] || value;
  };

  if (loading) {
    return <div className="text-center">Ładowanie...</div>;
  }

  if (error || !attachment) {
    return (
      <div>
        <div className="alert alert-danger">{error || 'Dodatek nie został znaleziony'}</div>
        <button onClick={() => navigate(-1)} className="btn btn-secondary">
          Wróć
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            color: '#007bff',
            cursor: 'pointer',
            fontSize: '1rem',
            marginBottom: '1rem',
            padding: 0
          }}
        >
          ← Wróć
        </button>
        <h2 style={{ marginBottom: '1.5rem' }}>Szczegóły dodatku</h2>
        <div className="card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#aaa' }}>
                Nazwa:
              </label>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', color: 'var(--text-primary)' }}>
                {attachment.name}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#aaa' }}>
                Typ:
              </label>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', color: 'var(--text-primary)' }}>
                {getAttachmentTypeLabel(attachment.type)}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#aaa' }}>
                Cechy:
              </label>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', color: 'var(--text-primary)' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  Pomoc precyzji: {translateValue(attachment.precision_help)}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  Redukcja odrzutu: {translateValue(attachment.recoil_reduction)}
                </div>
                <div>
                  Ergonomia: {translateValue(attachment.ergonomics)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttachmentDetailsPage;

