import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeBoard, isValidMove, isCheck, checkGameEnd, COLORS } from '../utils/chessRules';
import ChessBoard from '../components/ChessBoard';
import './Game.css';

const Game = () => {
  const [board, setBoard] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(COLORS.RED); // 红方先行
  const [gameStatus, setGameStatus] = useState('playing');
  const [winner, setWinner] = useState(null);
  const [isCheckState, setIsCheckState] = useState(false);
  const navigate = useNavigate();

  // 初始化棋盘
  useEffect(() => {
    resetGame();
  }, []);

  // 重置游戏
  const resetGame = () => {
    const newBoard = initializeBoard();
    setBoard(newBoard);
    setSelectedCell(null);
    setValidMoves([]);
    setCurrentTurn(COLORS.RED);
    setGameStatus('playing');
    setWinner(null);
    setIsCheckState(false);
  };

  // 处理棋盘点击
  const handleCellClick = (row, col) => {
    if (gameStatus !== 'playing') return;

    // 如果已经选择了一个棋子，尝试移动
    if (selectedCell) {
      const { row: fromRow, col: fromCol } = selectedCell;
      const piece = board[fromRow][fromCol];

      // 如果点击的是同一个位置，取消选择
      if (fromRow === row && fromCol === col) {
        setSelectedCell(null);
        setValidMoves([]);
        return;
      }

      // 如果点击了另一个自己的棋子，改变选择
      if (board[row][col] && board[row][col].color === currentTurn) {
        selectPiece(row, col);
        return;
      }

      // 尝试移动棋子
      if (validMoves.some(move => move.row === row && move.col === col)) {
        // 创建新的棋盘状态
        const newBoard = JSON.parse(JSON.stringify(board));
        newBoard[row][col] = piece;
        newBoard[fromRow][fromCol] = null;

        // 更新棋盘状态
        setBoard(newBoard);
        setSelectedCell(null);
        setValidMoves([]);

        // 检查将军和将死状态
        const opponentColor = currentTurn === COLORS.RED ? COLORS.BLACK : COLORS.RED;
        const isCheckState = isCheck(newBoard, opponentColor);
        setIsCheckState(isCheckState);

        // 检查游戏是否结束
        const { isGameOver, winner } = checkGameEnd(newBoard, currentTurn);
        if (isGameOver) {
          setGameStatus('over');
          setWinner(winner);
        } else {
          // 交换回合
          setCurrentTurn(opponentColor);
        }
      }
    } else {
      // 如果没有选择棋子，尝试选择一个
      const piece = board[row][col];
      if (piece && piece.color === currentTurn) {
        selectPiece(row, col);
      }
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

  // 返回主页
  const goToHome = () => {
    navigate('/');
  };

  if (!board) return <div>加载中...</div>;

  return (
    <div className="game-container">
      <div className="game-info">
        <h1>本地对战</h1>
        <div className="status-panel">
          <p>当前回合: <span className={currentTurn === COLORS.RED ? 'red-text' : 'black-text'}>
            {currentTurn === COLORS.RED ? '红方' : '黑方'}
          </span></p>
          {isCheckState && <p className="check-warning">将军！</p>}
          {gameStatus === 'over' && (
            <div className="game-result">
              <p>游戏结束！</p>
              <p>{winner === COLORS.RED ? '红方' : '黑方'}获胜</p>
            </div>
          )}
        </div>
        <div className="control-panel">
          <button onClick={resetGame}>重新开始</button>
          <button onClick={goToHome}>返回主页</button>
        </div>
      </div>
      <div className="board-container">
        <ChessBoard
          board={board}
          selectedCell={selectedCell}
          validMoves={validMoves}
          onCellClick={handleCellClick}
          perspective={COLORS.RED}
        />
      </div>
    </div>
  );
};

export default Game; 