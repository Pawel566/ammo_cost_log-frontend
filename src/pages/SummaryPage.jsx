import React, { useState, useEffect } from 'react';
import { sessionsAPI } from '../services/api';

const SummaryPage = () => {
  const [summary, setSummary] = useState([]);
  const [sessions, setSessions] = useState({ cost_sessions: [], accuracy_sessions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summaryRes, sessionsRes] = await Promise.all([
        sessionsAPI.getSummary(),
        sessionsAPI.getAll()
      ]);
      
      setSummary(summaryRes.data);
      setSessions(sessionsRes.data);
      setError(null);
    } catch (err) {
      setError('Błąd podczas pobierania danych');
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

  const getAccuracyStats = () => {
    if (sessions.accuracy_sessions.length === 0) {
      return { averageAccuracy: 0, totalSessions: 0, totalShots: 0, totalHits: 0 };
    }
    
    const totalShots = sessions.accuracy_sessions.reduce((sum, session) => sum + session.shots, 0);
    const totalHits = sessions.accuracy_sessions.reduce((sum, session) => sum + session.hits, 0);
    const averageAccuracy = totalShots > 0 ? (totalHits / totalShots) * 100 : 0;
    
    return {
      averageAccuracy,
      totalSessions: sessions.accuracy_sessions.length,
      totalShots,
      totalHits
    };
  };

  const getMonthlyAccuracy = () => {
    const monthlyData = {};
    
    sessions.accuracy_sessions.forEach(session => {
      const month = session.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { shots: 0, hits: 0, sessions: 0 };
      }
      monthlyData[month].shots += session.shots;
      monthlyData[month].hits += session.hits;
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

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Podsumowanie kosztów strzelania</h2>
          <button 
            className="btn btn-primary" 
            onClick={fetchData}
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

            <div className="grid grid-3 mb-20">
              <div className="card text-center">
                <h3>Średnia celność</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: getAccuracyStats().averageAccuracy >= 80 ? '#28a745' : getAccuracyStats().averageAccuracy >= 60 ? '#ffc107' : '#dc3545' }}>
                  {getAccuracyStats().averageAccuracy.toFixed(1)}%
                </div>
              </div>
              <div className="card text-center">
                <h3>Sesje celnościowe</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6f42c1' }}>
                  {getAccuracyStats().totalSessions}
                </div>
              </div>
              <div className="card text-center">
                <h3>Łączne trafienia</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#17a2b8' }}>
                  {getAccuracyStats().totalHits}
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

            <div className="card">
              <h3 className="card-title">Wykres celności miesięcznej</h3>
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
                          fontWeight: 'bold'
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
          </>
        )}
      </div>
    </div>
  );
};

export default SummaryPage;
