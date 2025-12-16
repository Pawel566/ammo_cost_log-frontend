import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { shootingSessionsAPI } from '../services/api';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';

const MonthlyCostsChart = ({ data, t, formatCurrency }) => {
  if (!data || data.length === 0) return null;

  const width = 800;
  const height = 300;
  const padding = { top: 20, right: 40, bottom: 60, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxCost = Math.max(...data.map(m => m.total_cost), 100);
  const minCost = Math.min(...data.map(m => m.total_cost), 0);
  const costRange = maxCost - minCost || 100;

  const formatMonthLabel = (monthString) => {
    const [year, month] = monthString.split('-');
    const date = new Date(year, month - 1);
    const monthNames = [
      t('common.months.jan'), t('common.months.feb'), t('common.months.mar'), t('common.months.apr'),
      t('common.months.may'), t('common.months.jun'), t('common.months.jul'), t('common.months.aug'),
      t('common.months.sep'), t('common.months.oct'), t('common.months.nov'), t('common.months.dec')
    ];
    const monthName = monthNames[date.getMonth()];
    const yearFull = date.getFullYear();
    return { month: monthName, year: yearFull.toString() };
  };

  const points = data.map((item, index) => {
    const x = padding.left + (index / (data.length - 1 || 1)) * chartWidth;
    const y = padding.top + chartHeight - ((item.total_cost - minCost) / costRange) * chartHeight;
    return { x, y, cost: item.total_cost, month: item.month };
  });

  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  const yAxisTicks = 5;
  const yTickValues = [];
  for (let i = 0; i <= yAxisTicks; i++) {
    yTickValues.push(minCost + (costRange / yAxisTicks) * i);
  }

  return (
    <div style={{ overflowX: 'auto', padding: '20px' }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', maxWidth: '100%', height: 'auto' }}>
        {/* Y-axis grid lines and labels */}
        {yTickValues.map((value, index) => {
          const y = padding.top + chartHeight - ((value - minCost) / costRange) * chartHeight;
          return (
            <g key={index}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#404040"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                fill="#aaa"
                fontSize="12"
                textAnchor="end"
              >
                {Math.round(value)}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {points.map((point, index) => {
          const label = formatMonthLabel(point.month);
          const isYearLabel = index === 0 || 
            (index > 0 && formatMonthLabel(data[index - 1].month).year !== label.year) ||
            index === data.length - 1;
          
          return (
            <g key={index}>
              <text
                x={point.x}
                y={height - padding.bottom + 20}
                fill="#aaa"
                fontSize="11"
                textAnchor="middle"
              >
                {label.month}
              </text>
              {isYearLabel && (
                <text
                  x={point.x}
                  y={height - padding.bottom + 35}
                  fill="#aaa"
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {label.year}
                </text>
              )}
            </g>
          );
        })}

        {/* Line path */}
        <path
          d={pathData}
          fill="none"
          stroke="#007bff"
          strokeWidth="2"
        />

        {/* Data points */}
        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#007bff"
              stroke="#fff"
              strokeWidth="2"
            />
          </g>
        ))}
      </svg>
    </div>
  );
};

const SummaryPage = () => {
  const { t } = useTranslation();
  const { formatCurrency, convert } = useCurrencyConverter();
  const [summary, setSummary] = useState({ total: 0, items: [] });
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
      const summaryResult = Array.isArray(summaryData) ? { total: 0, items: summaryData } : (summaryData || { total: 0, items: [] });
      const allSessions = Array.isArray(sessionsRes.data) ? sessionsRes.data : [];
      setSummary(summaryResult);
      setSessions(allSessions);
      setError(null);
    } catch (err) {
      setError(t('common.error'));
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

  const formatMonth = (monthString) => {
    const [year, month] = monthString.split('-');
    const date = new Date(year, month - 1);
    const monthNames = [
      t('common.months.january'), t('common.months.february'), t('common.months.march'), t('common.months.april'),
      t('common.months.may'), t('common.months.june'), t('common.months.july'), t('common.months.august'),
      t('common.months.september'), t('common.months.october'), t('common.months.november'), t('common.months.december')
    ];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  if (loading) {
    return <div className="text-center">{t('common.loading')}</div>;
  }

  const accuracyStats = getAccuracyStats();

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>{t('summary.title')}</h2>
          <button 
            className="btn btn-primary" 
            onClick={fetchData}
          >
            {t('summary.refresh')}
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {summary.items.length === 0 ? (
          <div className="card">
            <p className="text-center" style={{ color: '#888', padding: '2rem' }}>
              {t('summary.noData')}
            </p>
            <p className="text-center" style={{ color: '#888' }}>
              {t('summary.addSessions')}
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem', fontWeight: '500' }}>{t('summary.summary')}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem', overflowX: 'auto' }}>
              <div className="card" style={{ textAlign: 'center' }}>
                <h3 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#aaa' }}>{t('summary.totalCost')}</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc3545' }}>
                  {formatCurrency(getTotalCost())}
                </div>
              </div>
              <div className="card" style={{ textAlign: 'center' }}>
                <h3 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#aaa' }}>{t('summary.totalShots')}</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>
                  {getTotalShots()}
                </div>
              </div>
              <div className="card" style={{ textAlign: 'center' }}>
                <h3 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#aaa' }}>{t('summary.avgCostPerShot')}</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>
                  {getTotalShots() > 0 ? formatCurrency(getTotalCost() / getTotalShots()) : formatCurrency(0)}
                </div>
              </div>
                <div className="card" style={{ textAlign: 'center' }}>
                  <h3 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#aaa' }}>{t('summary.avgAccuracy')}</h3>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff9800' }}>
                    {accuracyStats.averageAccuracy.toFixed(1).replace('.', ',')}%
                  </div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                  <h3 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#aaa' }}>{t('summary.accuracySessions')}</h3>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6f42c1' }}>
                    {accuracyStats.totalSessions}
                  </div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                  <h3 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#aaa' }}>{t('summary.totalHits')}</h3>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>
                    {accuracyStats.totalHits}
                  </div>
                </div>
              </div>
            </div>

            {summary.items.length > 0 && (
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>{t('summary.monthlyCosts')}</h3>
                <MonthlyCostsChart data={summary.items} t={t} formatCurrency={formatCurrency} />
              </div>
            )}

            {summary.items.length > 0 && (
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>{t('summary.monthlySummary')}</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{t('summary.month')}</th>
                        <th>{t('summary.cost')}</th>
                        <th>{t('summary.shots')}</th>
                        <th>{t('summary.avgCostPerShot')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.items.map((month) => (
                        <tr key={month.month}>
                          <td style={{ fontWeight: '500' }}>{formatMonth(month.month)}</td>
                          <td style={{ fontWeight: 'bold', color: '#dc3545' }}>
                            {formatCurrency(month.total_cost)}
                          </td>
                          <td style={{ fontWeight: 'bold', color: '#007bff' }}>
                            {month.total_shots}
                          </td>
                          <td style={{ fontWeight: 'bold', color: '#28a745' }}>
                            {month.total_shots > 0 ? formatCurrency(month.total_cost / month.total_shots) : formatCurrency(0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
