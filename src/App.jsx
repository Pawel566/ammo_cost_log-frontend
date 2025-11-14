import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Register from './pages/Register';
import GunsPage from './pages/GunsPage';
import AmmoPage from './pages/AmmoPage';
import CostSessionsPage from './pages/CostSessionsPage';
import AccuracySessionsPage from './pages/AccuracySessionsPage';
import SummaryPage from './pages/SummaryPage';
import './App.css';

function App() {

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <nav className="navbar">
            <div className="container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/" className="navbar-brand">
                  🎯 Ammo Cost Log
                </Link>
                <ul className="navbar-nav">
                  <li>
                    <Link to="/guns">Broń</Link>
                  </li>
                  <li>
                    <Link to="/ammo">Amunicja</Link>
                  </li>
                  <li>
                    <Link to="/cost-sessions">Sesje kosztowe</Link>
                  </li>
                  <li>
                    <Link to="/accuracy-sessions">Sesje celnościowe</Link>
                  </li>
                  <li>
                    <Link to="/summary">Podsumowanie</Link>
                  </li>
                </ul>
              </div>
            </div>
          </nav>

          <main className="container">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/guns" element={<GunsPage />} />
              <Route path="/ammo" element={<AmmoPage />} />
              <Route path="/cost-sessions" element={<CostSessionsPage />} />
              <Route path="/accuracy-sessions" element={<AccuracySessionsPage />} />
              <Route path="/summary" element={<SummaryPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
