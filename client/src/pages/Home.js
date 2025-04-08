import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGame } from '../services/gameService';
import './Home.css';

const Home = () => {
  const [showJoinGame, setShowJoinGame] = useState(false);
  const [gameId, setGameId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  // 处理AI对战游戏
  const handleAIGame = () => {
    navigate('/ai-game');
  };

  // 创建新的在线游戏
  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      setError('请输入您的名字');
      return;
    }

    try {
      setIsCreatingGame(true);
      const { gameId } = await createGame();
      // 使用创建的游戏ID和玩家名跳转到在线游戏页
      navigate(`/online-game/${gameId}`);
    } catch (err) {
      setError('创建游戏失败，请稍后再试');
      console.error(err);
    } finally {
      setIsCreatingGame(false);
    }
  };

  // 加入现有的在线游戏
  const handleJoinGame = () => {
    if (!gameId.trim()) {
      setError('请输入有效的游戏ID');
      return;
    }
    
    if (!playerName.trim()) {
      setError('请输入您的名字');
      return;
    }

    navigate(`/online-game/${gameId}`);
  };

  const handleViewHistory = () => {
    if (!gameId.trim()) {
      setError('请输入有效的游戏ID');
      return;
    }
    navigate(`/game-history/${gameId}`);
  };

  return (
    <div className="home-container">
      <div className="title-section">
        <h1>中国象棋</h1>
        <p>古老游戏，现代体验</p>
      </div>

      <div className="game-modes">
        <div className="game-mode-card">
          <h2>AI 对战</h2>
          <p>挑战电脑AI，提升您的棋艺</p>
          <button className="btn primary-btn" onClick={handleAIGame}>开始对战</button>
        </div>

        <div className="game-mode-card">
          <h2>在线对战</h2>
          <div className="player-input">
            <input
              type="text"
              placeholder="您的名字"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
          </div>
          <div className="game-actions">
            <div className="create-game">
              <button 
                className="btn primary-btn" 
                onClick={handleCreateGame}
                disabled={isCreatingGame}
              >
                {isCreatingGame ? '创建中...' : '创建游戏'}
              </button>
            </div>

            <div className="join-game">
              <input
                type="text"
                placeholder="游戏ID"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
              />
              <button className="btn secondary-btn" onClick={handleJoinGame}>加入游戏</button>
            </div>
          </div>
        </div>
      </div>

      {showJoinGame && (
        <div className="join-game-form">
          <input
            type="text"
            placeholder="输入游戏ID"
            value={gameId}
            onChange={(e) => {
              setGameId(e.target.value);
              setError('');
            }}
          />
          <div className="join-game-buttons">
            <button onClick={handleJoinGame}>加入游戏</button>
            <button onClick={handleViewHistory}>查看历史</button>
          </div>
          {error && <p className="error-message">{error}</p>}
        </div>
      )}

      <div className="game-instructions">
        <h3>游戏说明</h3>
        <p>中国象棋是一种传统的战略桌面游戏，两名玩家在一个9×10的棋盘上移动棋子，目标是将死对方的将（帅）。</p>
        <p>您可以选择与AI对战或邀请朋友进行在线对战。创建游戏后，将生成的游戏ID分享给您的对手，他们可以通过输入该ID来加入游戏。</p>
      </div>
    </div>
  );
};

export default Home; 