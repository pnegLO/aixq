import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// 导入页面组件
import Home from './pages/Home';
import Game from './pages/Game';
import AIGame from './pages/AIGame';
import OnlineGame from './pages/OnlineGame';
import GameHistory from './pages/GameHistory';

// 导入布局组件
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/game" element={<Game />} />
            <Route path="/ai-game" element={<AIGame />} />
            <Route path="/online-game/:gameId?" element={<OnlineGame />} />
            <Route path="/game-history/:gameId" element={<GameHistory />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App; 