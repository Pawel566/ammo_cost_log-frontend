import React, { useState, useEffect } from 'react';
import { shootingSessionsAPI } from '../services/api';

const SummaryPage = () => {
  const [summary, setSummary] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summaryRes, sessionsRes] = await Promise.all([
        shootingSessionsAPI.getSummary(),
        shootingSessionsAPI.getAll()
      ]);
      const summaryData = summaryRes.data;
      const summaryItems = Array.isArray(summaryData) ? summaryData : summaryData?.items ?? [];
      const allSessions = Array.isArray(sessionsRes.data) ? sessionsRes.data : [];
      setSummary(summaryItems);
      setSessions(allSessions);
      setError(null);
    } catch (err) {
      setError('Błąd podczas pobierania danych');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTotalCost = () => {
    return sessions.reduce((total, session) => {
      return total + (session.cost ? parseFloat(session.cost) : 0);
    }, 0);
  };

  const getTotalShots = () => {
    return sessions.reduce((total, session) => total + (session.shots || 0), 0);
  };

  const getAccuracyStats = () => {
    const accuracySessions = sessions.filter(s => s.hits !== null && s.hits !== undefined && s.distance_m);
    if (accuracySessions.length === 0) {
      return { averageAccuracy: 0, totalSessions: 0, totalShots: 0, totalHits: 0 };
    }
    
    const totalShots = accuracySessions.reduce((sum, session) => sum + (session.shots || 0), 0);
    const totalHits = accuracySessions.reduce((sum, session) => sum + (session.hits || 0), 0);
    const averageAccuracy = totalShots > 0 ? (totalHits / totalShots) * 100 : 0;
    
    return {
      averageAccuracy,
      totalSessions: accuracySessions.length,
      totalShots,
      totalHits
    };
  };

  const getMonthlyAccuracy = () => {
    const monthlyData = {};
    
    sessions
      .filter(s => s.hits !== null && s.hits !== undefined && s.distance_m)
      .forEach(session => {
        const month = session.date.substring(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = { shots: 0, hits: 0, sessions: 0 };
        }
        monthlyData[month].shots += session.shots || 0;
        monthlyData[month].hits += session.hits || 0;
        monthlyData[month].sessions += 1;
      });
    
    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      accuracy: data.shots > 0 ? (data.hits / data.shots) * 100 : 0,
      shots: data.shots,
      hits: data.hits,
      sessions: data.sessions
    })).sort((a, b) => a.month.localeCompare(b.month));
  };

  const formatMonth = (monthString) => {
    const [year, month] = monthString.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('pl-PL', { year: 'numeric', month: 'long' });
  };

  if (loading) {
    return <div className="text-center">Ładowanie...</div>;
  }

  const accuracyStats = getAccuracyStats();

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>Podsumowanie</h2>
          <button 
            className="btn btn-primary" 
            onClick={fetchData}
          >
            Odśwież
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {summary.length === 0 && sessions.length === 0 ? (
          <div className="card">
            <p className="text-center" style={{ color: '#888', padding: '2rem' }}>
              Brak danych do wyświetlenia
            </p>
            <p className="text-center" style={{ color: '#888' }}>
              Dodaj sesje strzeleckie, aby zobaczyć podsumowanie.
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="card" style={{ textAlign: 'center' }}>
                <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem', color: '#aaa' }}>Łączny koszt</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc3545' }}>
                  {getTotalCost().toFixed(2)} zł
                </div>
              </div>
              <div className="card" style={{ textAlign: 'center' }}>
                <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem', color: '#aaa' }}>Łączna liczba strzałów</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>
                  {getTotalShots()}
                </div>
              </div>
              <div className="card" style={{ textAlign: 'center' }}>
                <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem', color: '#aaa' }}>Średni koszt za strzał</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>
                  {getTotalShots() > 0 ? (getTotalCost() / getTotalShots()).toFixed(2) : '0.00'} zł
                </div>
              </div>
            </div>

            {sessions.filter(s => s.hits !== null && s.hits !== undefined && s.distance_m).length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ textAlign: 'center' }}>
                  <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem', color: '#aaa' }}>Średnia celność</h3>
                  <div style={{ 
                    fontSize: '2rem', 
                    fontWeight: 'bold', 
                    color: accuracyStats.averageAccuracy >= 80 ? '#28a745' : accuracyStats.averageAccuracy >= 60 ? '#ffc107' : '#dc3545' 
                  }}>
                    {accuracyStats.averageAccuracy.toFixed(1)}%
                  </div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                  <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem', color: '#aaa' }}>Sesje celnościowe</h3>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6f42c1' }}>
                    {accuracyStats.totalSessions}
                  </div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                  <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem', color: '#aaa' }}>Łączne trafienia</h3>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#17a2b8' }}>
                    {accuracyStats.totalHits}
                  </div>
                </div>
              </div>
            )}

            {summary.length > 0 && (
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Podsumowanie miesięczne</h3>
                <div style={{ overflowX: 'auto' }}>
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
                          <td style={{ fontWeight: '500' }}>{formatMonth(month.month)}</td>
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
              </div>
            )}

            {summary.length > 0 && (
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Wykres kosztów miesięcznych</h3>
                <div style={{ height: '300px', display: 'flex', alignItems: 'end', gap: '10px', padding: '20px' }}>
                  {summary.map((month) => {
                    const maxCost = Math.max(...summary.map(m => m.total_cost));
                    const height = maxCost > 0 ? (month.total_cost / maxCost) * 200 : 0;
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
                            fontWeight: 'bold',
                            minHeight: height > 0 ? '20px' : '0'
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
            )}

            {getMonthlyAccuracy().length > 0 && (
              <div className="card">
                <h3 style={{ marginBottom: '1rem' }}>Wykres celności miesięcznej</h3>
                <div style={{ height: '300px', display: 'flex', alignItems: 'end', gap: '10px', padding: '20px' }}>
                  {getMonthlyAccuracy().map((month) => {
                    const maxAccuracy = Math.max(...getMonthlyAccuracy().map(m => m.accuracy), 100);
                    const height = (month.accuracy / maxAccuracy) * 200;
                    return (
                      <div key={month.month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                        <div
                          style={{
                            width: '100%',
                            height: `${height}px`,
                            backgroundColor: month.accuracy >= 80 ? '#28a745' : month.accuracy >= 60 ? '#ffc107' : '#dc3545',
                            borderRadius: '4px 4px 0 0',
                            marginBottom: '10px',
                            display: 'flex',
                            alignItems: 'end',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            minHeight: height > 0 ? '20px' : '0'
                          }}
                          title={`${month.accuracy.toFixed(1)}% (${month.hits}/${month.shots})`}
                        >
                          {month.accuracy > 0 && (
                            <span style={{ marginBottom: '5px' }}>
                              {month.accuracy.toFixed(0)}%
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
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SummaryPage;
