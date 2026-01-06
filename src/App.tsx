import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import Today from './pages/Today';
import Routines from './pages/Routines';
import History from './pages/History';
import Settings from './pages/Settings';
import './App.css';

function App() {
  return (
    <HashRouter>
      <div className="app">
        <nav className="nav">
          <Link to="/">✨ 오늘</Link>
          <Link to="/routines">📝 루틴</Link>
          <Link to="/history">📊 기록</Link>
          <Link to="/settings">⚙️ 설정</Link>
        </nav>

        <main className="main">
          <Routes>
            <Route path="/" element={<Today />} />
            <Route path="/routines" element={<Routines />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}

export default App;
