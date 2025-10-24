import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import GunsPage from './pages/GunsPage';
import AmmoPage from './pages/AmmoPage';
import SessionsPage from './pages/SessionsPage';
import SummaryPage from './pages/SummaryPage';
import './App.css';

function App() {
  return (
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
                  <Link to="/sessions">Sesje</Link>
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
            <Route path="/guns" element={<GunsPage />} />
            <Route path="/ammo" element={<AmmoPage />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/summary" element={<SummaryPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
