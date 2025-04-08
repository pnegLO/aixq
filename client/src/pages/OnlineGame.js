import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { 
  initializeBoard, 
  isValidMove, 
  isCheck, 
  checkGameEnd, 
  COLORS 
} from '../utils/chessRules';
import {
  initializeSocket,
  joinGame,
  makeMove as sendMove,
  getGame,
  surrender,
  requestUndo,
  respondToUndoRequest,
  disconnectSocket,
  sendChatMessage
} from '../services/gameService';
import ChessBoard from '../components/ChessBoard';
import ChatBox from '../components/ChatBox';
import './Game.css';
import io from 'socket.io-client';

// API基础URL
const API_BASE_URL = 'http://localhost:5000';

const OnlineGame = () => {
  const { gameId: urlGameId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // 游戏状态
  const [board, setBoard] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(COLORS.RED); // 红方先行
  const [gameStatus, setGameStatus] = useState('waiting'); // waiting, playing, over
  const [winner, setWinner] = useState(null);
  
  // 玩家信息
  const [gameId, setGameId] = useState(urlGameId || '');
  const [playerName, setPlayerName] = useState('');
  const [playerColor, setPlayerColor] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [playerId, setPlayerId] = useState('');
  
  // 聊天功能
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);
  const [notification, setNotification] = useState('');
  
  // 悔棋功能
  const [undoRequest, setUndoRequest] = useState({ pending: false, requester: null });
  
  // Socket连接
  const socketRef = useRef(null);
  const [socketConnected, setSocketConnected] = useState(false);
  
  // 游戏历史记录
  const [moveHistory, setMoveHistory] = useState([]);
  const [isCheckState, setIsCheckState] = useState(false);
  
  // 从URL参数中获取游戏ID和玩家名称
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const gameIdParam = searchParams.get('gameId');
    const playerNameParam = searchParams.get('playerName');
    const isCreator = searchParams.get('isCreator') === 'true';
    
    if (gameIdParam && playerNameParam) {
      setGameId(gameIdParam);
      setPlayerName(playerNameParam);
      
      // 如果是创建者，默认为红方
      if (isCreator) {
        setPlayerColor(COLORS.RED);
      }
      
      // 加入游戏并初始化Socket连接
      joinGameAndConnect(gameIdParam, playerNameParam);
    } else {
      // 如果没有必要的参数，返回主页
      navigate('/');
    }
    
    // 组件卸载时断开Socket连接
    return () => {
      if (socketRef.current) {
        disconnectSocket();
      }
    };
  }, []);

  // 聊天消息自动滚动到底部
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // 加入游戏并初始化Socket连接
  const joinGameAndConnect = async (gameId, playerName) => {
    try {
      // 获取游戏信息
      const gameData = await getGame(gameId);
      
      // 如果游戏已存在，更新状态
      if (gameData) {
        updateGameState(gameData);
      }
      
      // 加入游戏
      const joinResponse = await joinGame(gameId, playerName);
      
      // 如果玩家颜色还未确定，设置颜色
      if (!playerColor && joinResponse.playerColor) {
        setPlayerColor(joinResponse.playerColor);
      }
      
      // 初始化Socket连接
      const socket = io(API_BASE_URL);
      
      socketRef.current = socket;
      
      // 设置Socket事件监听
      socket.on('connect', () => {
        setSocketConnected(true);
      });

      socket.on('disconnect', () => {
        setSocketConnected(false);
      });

      socket.on('gameUpdate', handleGameUpdate);
      socket.on('playerJoined', handlePlayerJoined);
      socket.on('gameStarted', handleGameStarted);
      socket.on('chatMessage', handleChatMessage);
      socket.on('undoRequested', handleUndoRequested);
      socket.on('undoResponded', handleUndoResponded);
    } catch (error) {
      console.error('Failed to join game:', error);
      setGameStatus('error');
    }
  };

  // 更新游戏状态
  const updateGameState = (gameData) => {
    if (gameData.board) {
      setBoard(gameData.board);
    }
    
    if (gameData.currentTurn) {
      setCurrentTurn(gameData.currentTurn);
    }
    
    if (gameData.status) {
      setGameStatus(gameData.status);
    }
    
    if (gameData.players) {
      const otherPlayer = gameData.players.find(p => p.name !== playerName);
      if (otherPlayer) {
        setOpponent(otherPlayer);
      }
    }
    
    if (gameData.moveHistory) {
      setMoveHistory(gameData.moveHistory);
    }
    
    if (gameData.chatMessages) {
      setChatMessages(gameData.chatMessages);
    }
  };

  // Socket事件处理函数
  const handleGameUpdate = (data) => {
    console.log('Game update received:', data);
    const { board: newBoard, currentTurn: newTurn, gameStatus: newStatus, winner: newWinner } = data;
    
    setBoard(newBoard);
    setCurrentTurn(newTurn);
    setGameStatus(newStatus);
    setWinner(newWinner);
    
    // 重置选择状态
    setSelectedCell(null);
    setValidMoves([]);
  };

  const handlePlayerJoined = (data) => {
    console.log('Player joined:', data);
    const { player } = data;
    setOpponent(player);
    
    // 显示通知
    setNotification(`${player.name} 加入了游戏`);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleGameStarted = (data) => {
    console.log('Game started:', data);
    const { board: newBoard, players } = data;
    
    setBoard(newBoard);
    setGameStatus('playing');
    
    // 确定玩家颜色
    const self = players.find(p => p.name === playerName);
    if (self) {
      setPlayerColor(self.color);
      setOpponent(players.find(p => p.name !== playerName));
    }
    
    // 显示通知
    setNotification('游戏开始！');
    setTimeout(() => setNotification(''), 3000);
  };

  const handleMoveMade = (data) => {
    const { fromRow, fromCol, toRow, toCol, board: newBoard, currentTurn: nextTurn } = data;
    
    // 更新棋盘
    setBoard(newBoard);
    setCurrentTurn(nextTurn);
    
    // 添加到移动历史
    addMoveToHistory(fromRow, fromCol, toRow, toCol, data.piece, data.captured);
    
    // 检查是否将军
    setIsCheckState(data.isCheck);
    
    // 检查游戏是否结束
    if (data.gameStatus === 'over') {
      setGameStatus('over');
      setWinner(data.winner);
    }
  };

  const handleChatMessage = (message) => {
    setChatMessages(prev => [...prev, message]);
  };

  const handleUndoRequested = (data) => {
    console.log('Undo requested by:', data.requester);
    setUndoRequest({ pending: true, requester: data.requester });
  };

  const handleUndoResponded = (data) => {
    console.log('Undo response:', data);
    const { approved, board: newBoard, currentTurn: newTurn } = data;
    
    if (approved) {
      setBoard(newBoard);
      setCurrentTurn(newTurn);
      setNotification('悔棋请求已被接受');
    } else {
      setNotification('悔棋请求被拒绝');
    }
    
    setUndoRequest({ pending: false, requester: null });
    setTimeout(() => setNotification(''), 3000);
  };

  const handlePlayerSurrendered = (data) => {
    setGameStatus('over');
    setWinner(data.winner);
    
    addChatMessage({
      sender: 'System',
      text: `${data.playerName} 认输了，${data.winner === COLORS.RED ? '红方' : '黑方'}获胜！`,
      timestamp: new Date().toISOString()
    });
  };

  const handleError = (error) => {
    console.error('Socket error:', error);
  };

  // 添加移动到历史记录
  const addMoveToHistory = (fromRow, fromCol, toRow, toCol, piece, captured) => {
    setMoveHistory(prev => [...prev, {
      fromRow,
      fromCol,
      toRow,
      toCol,
      piece,
      captured,
      timestamp: new Date().toISOString()
    }]);
  };

  // 添加聊天消息
  const addChatMessage = (message) => {
    setChatMessages(prev => [...prev, message]);
  };

  // 格子点击处理
  const handleCellClick = (row, col) => {
    // 游戏未开始、已结束或不是玩家回合时不允许操作
    if (gameStatus !== 'playing' || currentTurn !== playerColor) return;
    
    const clickedPiece = board[row][col];
    
    // 如果已选中棋子，尝试移动
    if (selectedCell) {
      const { row: selectedRow, col: selectedCol } = selectedCell;
      const selectedPiece = board[selectedRow][selectedCol];
      
      // 检查是否是有效移动
      if (
        selectedPiece && 
        selectedPiece.color === currentTurn &&
        validMoves.some(move => move.row === row && move.col === col)
      ) {
        // 发送移动请求
        sendMove(gameId, {
          fromRow: selectedRow,
          fromCol: selectedCol,
          toRow: row,
          toCol: col
        }, playerId);
        
        // 清除选择状态
        setSelectedCell(null);
        setValidMoves([]);
      } else if (clickedPiece && clickedPiece.color === currentTurn) {
        // 选择新的己方棋子
        selectPiece(row, col);
      } else {
        // 无效点击，取消选择
        setSelectedCell(null);
        setValidMoves([]);
      }
    } 
    // 如果未选中棋子，选择一个棋子
    else if (clickedPiece && clickedPiece.color === currentTurn) {
      selectPiece(row, col);
    }
  };

  // 选择棋子，计算有效移动
  const selectPiece = (row, col) => {
    setSelectedCell({ row, col });
    
    // 计算有效移动
    const piece = board[row][col];
    const newValidMoves = [];
    
    for (let toRow = 0; toRow < 10; toRow++) {
      for (let toCol = 0; toCol < 9; toCol++) {
        if (isValidMove(piece, board, row, col, toRow, toCol)) {
          // 模拟移动，检查是否会导致自己被将军
          const newBoard = JSON.parse(JSON.stringify(board));
          newBoard[toRow][toCol] = newBoard[row][col];
          newBoard[row][col] = null;
          
          if (!isCheck(newBoard, piece.color)) {
            newValidMoves.push({ row: toRow, col: toCol });
          }
        }
      }
    }
    
    setValidMoves(newValidMoves);
  };

  // 复制游戏ID到剪贴板
  const copyGameId = () => {
    navigator.clipboard.writeText(gameId);
    
    addChatMessage({
      sender: 'System',
      text: '游戏ID已复制到剪贴板',
      timestamp: new Date().toISOString()
    });
  };

  // 发送聊天消息
  const handleSendMessage = (message) => {
    if (playerId && gameId) {
      sendChatMessage(gameId, playerId, message);
    }
  };

  // 请求悔棋
  const handleRequestUndo = () => {
    requestUndo(gameId, playerId);
    
    addChatMessage({
      sender: 'System',
      text: '您已请求悔棋，等待对方回应',
      timestamp: new Date().toISOString()
    });
  };

  // 回应悔棋请求
  const handleRespondUndo = (accepted) => {
    respondToUndoRequest(gameId, playerId, accepted);
    setUndoRequest({ pending: false, requester: null });
  };

  // 投降
  const handleSurrender = () => {
    if (window.confirm('确定要认输吗？')) {
      surrender(gameId, playerId);
    }
  };

  // 返回主页
  const goToHome = () => {
    navigate('/');
  };

  // 渲染移动历史
  const renderMoveHistory = () => {
    if (moveHistory.length === 0) {
      return <p>暂无移动记录</p>;
    }
    
    return (
      <ul className="move-list">
        {moveHistory.map((move, index) => {
          const pieceType = getPieceTypeName(move.piece.type);
          const pieceColor = move.piece.color === COLORS.RED ? '红' : '黑';
          const capturedText = move.captured ? `，吃${move.captured.color === COLORS.RED ? '红' : '黑'}${getPieceTypeName(move.captured.type)}` : '';
          
          return (
            <li key={index}>
              {index + 1}. {pieceColor}{pieceType}：{getPositionName(move.fromRow, move.fromCol)} 至 {getPositionName(move.toRow, move.toCol)}{capturedText}
            </li>
          );
        })}
      </ul>
    );
  };

  // 获取棋子类型的中文名称
  const getPieceTypeName = (type) => {
    const typeNames = {
      general: '将/帅',
      advisor: '士/仕',
      elephant: '象/相',
      horse: '马',
      chariot: '车',
      cannon: '炮',
      soldier: '卒/兵'
    };
    
    return typeNames[type] || type;
  };

  // 获取位置的坐标名称
  const getPositionName = (row, col) => {
    const colNames = ['九', '八', '七', '六', '五', '四', '三', '二', '一'];
    const rowNames = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    
    return `${colNames[col]}${rowNames[row]}`;
  };

  // 渲染聊天消息
  const renderChatMessages = () => {
    return (
      <div className="chat-messages">
        {chatMessages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.sender === 'System' ? 'system-message' : (msg.sender === playerName ? 'my-message' : 'opponent-message')}`}>
            <span className="sender">{msg.sender === 'System' ? '' : `${msg.sender}: `}</span>
            <span className="message-text">{msg.text}</span>
            <div ref={index === chatMessages.length - 1 ? chatEndRef : null} />
          </div>
        ))}
      </div>
    );
  };

  if (!board) return <div className="loading">加载中...</div>;

  return (
    <div className="online-game-page">
      <h1>在线对战</h1>
      
      {/* 游戏ID信息 */}
      <div className="game-id-section">
        <span className="game-id-label">游戏ID: {gameId}</span>
        <button 
          className="copy-button"
          onClick={() => {
            navigator.clipboard.writeText(gameId);
            setNotification('游戏ID已复制到剪贴板');
          }}
        >
          复制ID
        </button>
        <Link to={`/game-history/${gameId}`} className="history-link">
          查看历史记录
        </Link>
      </div>
      
      <div className="game-container">
        <div className="board-section">
          {board && (
            <ChessBoard
              board={board}
              selectedCell={selectedCell}
              validMoves={validMoves}
              onCellClick={handleCellClick}
              reversed={playerColor === COLORS.BLACK}
            />
          )}
        </div>
        
        <div className="side-section">
          {/* 游戏状态信息 */}
          <div className="game-status">
            {gameStatus === 'waiting' && (
              <p className="waiting-message">等待对手加入...</p>
            )}
            
            {gameStatus === 'playing' && (
              <>
                <p>当前回合: <span className={currentTurn === COLORS.RED ? 'red-text' : 'black-text'}>
                  {currentTurn === COLORS.RED ? '红方' : '黑方'}
                </span></p>
                {isCheckState && <p className="check-warning">将军！</p>}
              </>
            )}
            
            {gameStatus === 'over' && (
              <div className="game-result">
                <p>游戏结束！</p>
                <p>{winner === COLORS.RED ? '红方' : '黑方'}获胜</p>
              </div>
            )}
          </div>
          
          {/* 聊天区域 */}
          <div className="chat-container">
            <ChatBox
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              currentPlayer={playerName}
            />
          </div>
          
          {/* 游戏控制按钮 */}
          <div className="game-controls">
            {gameStatus === 'playing' && (
              <div>
                <button 
                  className="btn secondary-btn" 
                  onClick={handleRequestUndo}
                  disabled={moveHistory.length < 2 || currentTurn !== playerColor}
                >
                  请求悔棋
                </button>
                
                {undoRequest.pending && undoRequest.requester !== playerName && (
                  <>
                    <button 
                      className="btn primary-btn" 
                      onClick={() => handleRespondUndo(true)}
                    >
                      接受悔棋
                    </button>
                    
                    <button 
                      className="btn secondary-btn" 
                      onClick={() => handleRespondUndo(false)}
                    >
                      拒绝悔棋
                    </button>
                  </>
                )}
                
                <button 
                  className="btn secondary-btn" 
                  onClick={handleSurrender}
                  disabled={gameStatus !== 'playing'}
                >
                  认输
                </button>
              </div>
            )}
            
            <button 
              className="btn secondary-btn" 
              onClick={goToHome}
            >
              返回主页
            </button>
          </div>
        </div>
      </div>
      
      {/* 移动历史 */}
      {gameStatus !== 'waiting' && (
        <div className="move-history">
          <h3>移动记录</h3>
          {renderMoveHistory()}
        </div>
      )}
    </div>
  );
};

export default OnlineGame; 