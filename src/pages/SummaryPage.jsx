import React, { useState, useEffect } from 'react';
import { sessionsAPI } from '../services/api';

const SummaryPage = () => {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await sessionsAPI.getSummary();
      setSummary(response.data);
      setError(null);
    } catch (err) {
      setError('Błąd podczas pobierania podsumowania');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTotalCost = () => {
    return summary.reduce((total, month) => total + month.total_cost, 0);
  };

  const getTotalShots = () => {
    return summary.reduce((total, month) => total + month.total_shots, 0);
  };

  const formatMonth = (monthString) => {
    const [year, month] = monthString.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('pl-PL', { year: 'numeric', month: 'long' });
  };

  if (loading) {
    return <div className="text-center">Ładowanie...</div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Podsumowanie kosztów strzelania</h2>
          <button 
            className="btn btn-primary" 
            onClick={fetchSummary}
          >
            Odśwież
          </button>
        </div>

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        {summary.length === 0 ? (
          <div className="text-center">
            <p>Brak danych do wyświetlenia</p>
            <p>Dodaj sesje strzeleckie, aby zobaczyć podsumowanie kosztów.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-3 mb-20">
              <div className="card text-center">
                <h3>Łączny koszt</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc3545' }}>
                  {getTotalCost().toFixed(2)} zł
                </div>
              </div>
              <div className="card text-center">
                <h3>Łączna liczba strzałów</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>
                  {getTotalShots()}
                </div>
              </div>
              <div className="card text-center">
                <h3>Średni koszt za strzał</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>
                  {getTotalShots() > 0 ? (getTotalCost() / getTotalShots()).toFixed(2) : '0.00'} zł
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="card-title">Podsumowanie miesięczne</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Miesiąc</th>
                    <th>Koszt</th>
                    <th>Strzały</th>
                    <th>Średni koszt za strzał</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((month) => (
                    <tr key={month.month}>
                      <td>{formatMonth(month.month)}</td>
                      <td style={{ fontWeight: 'bold', color: '#dc3545' }}>
                        {month.total_cost.toFixed(2)} zł
                      </td>
                      <td style={{ fontWeight: 'bold', color: '#007bff' }}>
                        {month.total_shots}
                      </td>
                      <td style={{ fontWeight: 'bold', color: '#28a745' }}>
                        {month.total_shots > 0 ? (month.total_cost / month.total_shots).toFixed(2) : '0.00'} zł
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <h3 className="card-title">Wykres kosztów miesięcznych</h3>
              <div style={{ height: '300px', display: 'flex', alignItems: 'end', gap: '10px', padding: '20px' }}>
                {summary.map((month) => {
                  const maxCost = Math.max(...summary.map(m => m.total_cost));
                  const height = (month.total_cost / maxCost) * 200;
                  return (
                    <div key={month.month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <div
                        style={{
                          width: '100%',
                          height: `${height}px`,
                          backgroundColor: '#007bff',
                          borderRadius: '4px 4px 0 0',
                          marginBottom: '10px',
                          display: 'flex',
                          alignItems: 'end',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                        title={`${month.total_cost.toFixed(2)} zł`}
                      >
                        {month.total_cost > 0 && (
                          <span style={{ marginBottom: '5px' }}>
                            {month.total_cost.toFixed(0)}zł
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', textAlign: 'center', transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>
                        {month.month.split('-')[1]}/{month.month.split('-')[0].slice(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SummaryPage;
