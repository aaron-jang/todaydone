import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Today from './pages/Today';
import Routines from './pages/Routines';
import History from './pages/History';
import Settings from './pages/Settings';
import UserSelect from './pages/UserSelect';
import './App.css';

function App() {
  const location = useLocation();
  const isUserSelectPage = location.pathname === '/user-select';

  return (
    <div className="app">
      {!isUserSelectPage && (
        <nav className="nav">
          <Link to="/">✨ 오늘</Link>
          <Link to="/routines">📝 루틴</Link>
          <Link to="/history">📊 기록</Link>
          <Link to="/settings">⚙️ 설정</Link>
        </nav>
      )}

      <main className="main">
        <Routes>
          <Route path="/user-select" element={<UserSelect />} />
          <Route path="/" element={<Today />} />
          <Route path="/routines" element={<Routines />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

function AppWrapper() {
  return (
    <HashRouter>
      <App />
    </HashRouter>
  );
}

export default AppWrapper;
