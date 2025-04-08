import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGameHistory } from '../services/gameService';
import ChessBoard from '../components/ChessBoard';
import { initializeBoard } from '../utils/chessRules';
import './Game.css';

const GameHistory = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [board, setBoard] = useState(null);

  useEffect(() => {
    const fetchGameHistory = async () => {
      try {
        setLoading(true);
        const data = await getGameHistory(gameId);
        setGameData(data);
        setLoading(false);
      } catch (err) {
        setError('获取游戏历史失败，请稍后再试');
        setLoading(false);
      }
    };

    fetchGameHistory();
  }, [gameId]);

  useEffect(() => {
    if (gameData) {
      // 初始化棋盘
      const initialBoard = initializeBoard();
      setBoard(initialBoard);
      setCurrentMoveIndex(-1);
    }
  }, [gameData]);

  // 播放到指定步骤
  const playToMove = (index) => {
    if (!gameData) return;

    // 重置到初始棋盘
    const initialBoard = initializeBoard();
    
    if (index === -1) {
      setBoard(initialBoard);
      setCurrentMoveIndex(-1);
      return;
    }

    // 应用所有移动直到指定索引
    let currentBoard = JSON.parse(JSON.stringify(initialBoard));
    for (let i = 0; i <= index; i++) {
      const move = gameData.history[i];
      const { fromRow, fromCol, toRow, toCol } = move;
      
      // 移动棋子
      const piece = currentBoard[fromRow][fromCol];
      currentBoard[toRow][toCol] = piece;
      currentBoard[fromRow][fromCol] = null;
    }

    setBoard(currentBoard);
    setCurrentMoveIndex(index);
  };

  // 返回主页
  const goToHome = () => {
    navigate('/');
  };

  if (loading) {
    return <div className="loading">加载游戏历史中...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={goToHome}>返回主页</button>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="error-container">
        <p className="error-message">未找到游戏记录</p>
        <button onClick={goToHome}>返回主页</button>
      </div>
    );
  }

  return (
    <div className="game-history-page">
      <h1>游戏历史记录</h1>
      <div className="game-info">
        <div>游戏ID: {gameId}</div>
        <div>状态: {gameData.status === 'completed' ? '已结束' : '进行中'}</div>
        <div>玩家: {gameData.players.map(p => `${p.name}(${p.color === 'RED' ? '红' : '黑'})`).join(' vs ')}</div>
      </div>
      
      <div className="history-controls">
        <button 
          onClick={() => playToMove(-1)} 
          disabled={currentMoveIndex === -1}
        >
          初始局面
        </button>
        <button 
          onClick={() => playToMove(currentMoveIndex - 1)} 
          disabled={currentMoveIndex <= -1}
        >
          上一步
        </button>
        <button 
          onClick={() => playToMove(currentMoveIndex + 1)} 
          disabled={!gameData.history || currentMoveIndex >= gameData.history.length - 1}
        >
          下一步
        </button>
        <button 
          onClick={() => playToMove(gameData.history.length - 1)} 
          disabled={!gameData.history || currentMoveIndex === gameData.history.length - 1}
        >
          最终局面
        </button>
      </div>
      
      <div className="board-container">
        {board && (
          <ChessBoard
            board={board}
            selectedCell={null}
            validMoves={[]}
            onCellClick={() => {}}
            perspective="red"
          />
        )}
      </div>
      
      <div className="move-history">
        <h3>移动记录</h3>
        <div className="move-list">
          {gameData.history && gameData.history.map((move, index) => (
            <div 
              key={index}
              className={`move-item ${index === currentMoveIndex ? 'current-move' : ''}`}
              onClick={() => playToMove(index)}
            >
              {index + 1}. {move.notation || `(${move.fromRow},${move.fromCol}) -> (${move.toRow},${move.toCol})`}
            </div>
          ))}
        </div>
      </div>
      
      <div className="history-actions">
        <button onClick={goToHome}>返回主页</button>
      </div>
    </div>
  );
};

export default GameHistory; 