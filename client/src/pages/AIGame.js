import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  initializeBoard, 
  isValidMove, 
  isCheck, 
  checkGameEnd, 
  COLORS 
} from '../utils/chessRules';
import { getBestMove } from '../utils/chessAI';
import ChessBoard from '../components/ChessBoard';
import './Game.css';

const AIGame = () => {
  const [board, setBoard] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(COLORS.RED); // 红方先行
  const [gameStatus, setGameStatus] = useState('playing');
  const [winner, setWinner] = useState(null);
  const [isCheckState, setIsCheckState] = useState(false);
  const [difficulty, setDifficulty] = useState(3); // 默认难度级别为3
  const [playerColor, setPlayerColor] = useState(COLORS.RED); // 默认玩家执红
  const [moveHistory, setMoveHistory] = useState([]);
  
  const navigate = useNavigate();

  // 初始化棋盘
  useEffect(() => {
    console.log('初始化棋盘useEffect触发, 玩家颜色:', playerColor);
    resetGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerColor]);

  // 调试当前回合和玩家颜色的变化
  useEffect(() => {
    console.log('回合/玩家颜色状态更新 - 当前回合:', currentTurn, '玩家颜色:', playerColor, '是否为玩家回合:', currentTurn === playerColor);
  }, [currentTurn, playerColor]);

  // 重置游戏
  const resetGame = () => {
    console.log('重置游戏，玩家颜色:', playerColor);
    const newBoard = initializeBoard();
    
    // 重置所有状态
    setBoard(newBoard);
    setSelectedCell(null);
    setValidMoves([]);
    setCurrentTurn(COLORS.RED);  // 红方永远先行
    setGameStatus('playing');
    setWinner(null);
    setIsCheckState(false);
    setMoveHistory([]);
    
    // 如果AI是红方且先行，立即执行AI移动
    if (playerColor === COLORS.BLACK) {
      // 延迟执行，确保状态已更新
      setTimeout(() => {
        console.log('AI执红先行，计算首步移动');
        try {
          // 这是关键 - 直接使用COLORS.RED作为AI颜色
          const aiColor = COLORS.RED;
          
          // 计算AI的首步移动
          const aiMove = getBestMove(newBoard, aiColor, difficulty);
          
          if (aiMove) {
            console.log('AI首步移动:', aiMove);
            
            // 创建AI的新棋盘
            const aiNewBoard = JSON.parse(JSON.stringify(newBoard));
            
            // 执行AI的移动
            const { fromRow, fromCol, toRow, toCol } = aiMove;
            
            // 记录AI移动历史
            const aiHistoryEntry = {
              fromRow,
              fromCol,
              toRow,
              toCol,
              piece: aiNewBoard[fromRow][fromCol],
              captured: aiNewBoard[toRow][toCol],
              board: JSON.parse(JSON.stringify(aiNewBoard))
            };
            
            // 执行AI的移动
            aiNewBoard[toRow][toCol] = aiNewBoard[fromRow][fromCol];
            aiNewBoard[fromRow][fromCol] = null;
            
            // AI的下一回合颜色（玩家的黑色）
            const aiNextTurn = COLORS.BLACK;
            
            // 检查AI移动后是否将军
            const aiIsInCheck = isCheck(aiNewBoard, aiNextTurn);
            
            // 更新状态，应用AI的移动
            setBoard(aiNewBoard);
            setMoveHistory([aiHistoryEntry]);
            setCurrentTurn(aiNextTurn);
            setIsCheckState(aiIsInCheck);
          } else {
            console.log('AI无法找到最佳首步移动，尝试随机移动');
            
            // 收集所有可能的移动
            const moves = [];
            for (let fromRow = 0; fromRow < 10; fromRow++) {
              for (let fromCol = 0; fromCol < 9; fromCol++) {
                const piece = newBoard[fromRow][fromCol];
                if (piece && piece.color === COLORS.RED) {
                  for (let toRow = 0; toRow < 10; toRow++) {
                    for (let toCol = 0; toCol < 9; toCol++) {
                      if (isValidMove(piece, newBoard, fromRow, fromCol, toRow, toCol)) {
                        const tempBoard = JSON.parse(JSON.stringify(newBoard));
                        tempBoard[toRow][toCol] = tempBoard[fromRow][fromCol];
                        tempBoard[fromRow][fromCol] = null;
                        
                        // 确保移动后不会导致自己被将军
                        if (!isCheck(tempBoard, COLORS.RED)) {
                          moves.push({
                            fromRow, 
                            fromCol, 
                            toRow, 
                            toCol,
                            piece: piece
                          });
                        }
                      }
                    }
                  }
                }
              }
            }
            
            if (moves.length > 0) {
              console.log(`找到${moves.length}个合法随机首步移动，执行其中一个`);
              
              // 随机选择一个移动
              const randomMove = moves[Math.floor(Math.random() * moves.length)];
              const { fromRow, fromCol, toRow, toCol } = randomMove;
              
              // 创建AI的新棋盘
              const aiNewBoard = JSON.parse(JSON.stringify(newBoard));
              
              // 记录移动历史
              const aiHistoryEntry = {
                fromRow,
                fromCol,
                toRow,
                toCol,
                piece: aiNewBoard[fromRow][fromCol],
                captured: aiNewBoard[toRow][toCol],
                board: JSON.parse(JSON.stringify(aiNewBoard))
              };
              
              // 执行AI的移动
              aiNewBoard[toRow][toCol] = aiNewBoard[fromRow][fromCol];
              aiNewBoard[fromRow][fromCol] = null;
              
              // 更新状态
              setBoard(aiNewBoard);
              setMoveHistory([aiHistoryEntry]);
              setCurrentTurn(COLORS.BLACK);
              
              // 检查是否将军
              const aiIsInCheck = isCheck(aiNewBoard, COLORS.BLACK);
              setIsCheckState(aiIsInCheck);
              
              console.log('AI随机首步移动执行完成');
            } else {
              console.error('AI无法找到任何合法首步移动');
            }
          }
        } catch (error) {
          console.error('AI首步移动出错:', error);
        }
      }, 500);
    }
  };

  // 当前是否轮到玩家行动
  const isPlayerTurn = currentTurn === playerColor;

  // 格子点击处理
  const handleCellClick = (row, col) => {
    try {
      // 坐标验证
      if (row < 0 || row >= 10 || col < 0 || col >= 9) {
        return;
      }
      
      // 游戏结束或非玩家回合时不允许操作
      if (gameStatus !== 'playing' || !isPlayerTurn) {
        return;
      }
      
      const clickedPiece = board[row][col];
      
      // 如果已选中棋子，尝试移动
      if (selectedCell) {
        const { row: selectedRow, col: selectedCol } = selectedCell;
        
        // 验证选中的格子是否有效
        if (selectedRow < 0 || selectedRow >= 10 || selectedCol < 0 || selectedCol >= 9) {
          setSelectedCell(null);
          setValidMoves([]);
          return;
        }
        
        const selectedPiece = board[selectedRow][selectedCol];
        
        // 点击同一个棋子，取消选择
        if (selectedRow === row && selectedCol === col) {
          setSelectedCell(null);
          setValidMoves([]);
          return;
        }
        
        // 检查是否是有效移动
        const isValid = validMoves.some(move => move.row === row && move.col === col);
        
        if (selectedPiece && selectedPiece.color === currentTurn && isValid) {
          // 执行移动
          makeMove(selectedRow, selectedCol, row, col);
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
    } catch (error) {
      console.error('点击处理出错:', error);
      // 重置选择状态
      setSelectedCell(null);
      setValidMoves([]);
    }
  };

  // 选择棋子，计算有效移动
  const selectPiece = (row, col) => {
    try {
      // 验证坐标
      if (row < 0 || row >= 10 || col < 0 || col >= 9) {
        return;
      }
      
      // 验证有棋子
      const piece = board[row][col];
      if (!piece) {
        return;
      }
      
      // 验证是当前回合的棋子
      if (piece.color !== currentTurn) {
        return;
      }
      
      setSelectedCell({ row, col });
      
      // 计算有效移动
      const newValidMoves = [];
      
      for (let toRow = 0; toRow < 10; toRow++) {
        for (let toCol = 0; toCol < 9; toCol++) {
          try {
            if (isValidMove(piece, board, row, col, toRow, toCol)) {
              // 模拟移动，检查是否会导致自己被将军
              const newBoard = JSON.parse(JSON.stringify(board));
              newBoard[toRow][toCol] = newBoard[row][col];
              newBoard[row][col] = null;
              
              if (!isCheck(newBoard, piece.color)) {
                newValidMoves.push({ row: toRow, col: toCol });
              }
            }
          } catch (error) {
            continue; // 跳过这个移动
          }
        }
      }
      
      setValidMoves(newValidMoves);
    } catch (error) {
      console.error('选择棋子出错:', error);
      setSelectedCell(null);
      setValidMoves([]);
    }
  };

  // 执行移动
  const makeMove = (fromRow, fromCol, toRow, toCol) => {
    try {
      // 验证坐标和棋子
      if (
        fromRow < 0 || fromRow >= 10 || fromCol < 0 || fromCol >= 9 ||
        toRow < 0 || toRow >= 10 || toCol < 0 || toCol >= 9
      ) {
        return;
      }
      
      const piece = board[fromRow][fromCol];
      if (!piece || piece.color !== currentTurn) {
        return;
      }
      
      // 创建新棋盘
      const newBoard = JSON.parse(JSON.stringify(board));
      
      // 记录移动历史
      const historyEntry = {
        fromRow,
        fromCol,
        toRow,
        toCol,
        piece: board[fromRow][fromCol],
        captured: board[toRow][toCol],
        board: JSON.parse(JSON.stringify(board))
      };
      
      // 执行移动
      newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
      newBoard[fromRow][fromCol] = null;
      
      // 下一回合颜色
      const nextTurn = currentTurn === COLORS.RED ? COLORS.BLACK : COLORS.RED;
      
      // 检查将军状态
      const isInCheck = isCheck(newBoard, nextTurn);
      
      // 检查游戏结束
      const gameEndResult = checkGameEnd(newBoard, currentTurn);
      
      // 判断游戏是否应该继续
      if (gameEndResult.isGameOver) {
        // 更新所有状态
        setBoard(newBoard);
        setSelectedCell(null);
        setValidMoves([]);
        setMoveHistory(prev => [...prev, historyEntry]);
        setCurrentTurn(nextTurn);
        setIsCheckState(isInCheck);
        setGameStatus('over');
        setWinner(gameEndResult.winner);
        return;
      }
      
      // 判断这一步是否是玩家走的（这很重要！）
      const isPlayerMove = piece.color === playerColor;
      
      // 更新所有状态
      setBoard(newBoard);
      setSelectedCell(null);
      setValidMoves([]);
      setMoveHistory(prev => [...prev, historyEntry]);
      setCurrentTurn(nextTurn);
      setIsCheckState(isInCheck);
      
      // 如果是玩家走的这一步，且游戏应该继续，则我们需要让AI响应
      if (isPlayerMove && !gameEndResult.isGameOver) {
        // 延迟让AI行动，确保状态已更新
        setTimeout(() => {
          // 这是关键 - 我们使用闭包中的nextTurn而不是currentTurn
          const aiColor = nextTurn; // 注意：这里应该是当前回合的下一个颜色
          
          try {
            console.log('AI正在计算移动...');
            
            // 计算AI的下一步移动
            // 注意我们使用newBoard而不是board
            const aiMove = getBestMove(newBoard, aiColor, difficulty);
            
            if (aiMove) {
              console.log('AI决定移动:', aiMove);
              
              // 创建AI的新棋盘
              const aiNewBoard = JSON.parse(JSON.stringify(newBoard));
              
              // 执行AI的移动
              const { fromRow: aiFromRow, fromCol: aiFromCol, toRow: aiToRow, toCol: aiToCol } = aiMove;
              
              // 记录AI移动历史
              const aiHistoryEntry = {
                fromRow: aiFromRow,
                fromCol: aiFromCol,
                toRow: aiToRow,
                toCol: aiToCol,
                piece: aiNewBoard[aiFromRow][aiFromCol],
                captured: aiNewBoard[aiToRow][aiToCol],
                board: JSON.parse(JSON.stringify(aiNewBoard))
              };
              
              // 执行AI的移动
              aiNewBoard[aiToRow][aiToCol] = aiNewBoard[aiFromRow][aiFromCol];
              aiNewBoard[aiFromRow][aiFromCol] = null;
              
              // AI的下一回合颜色（应该是玩家的颜色）
              const aiNextTurn = aiColor === COLORS.RED ? COLORS.BLACK : COLORS.RED;
              
              // 检查AI移动后是否将军
              const aiIsInCheck = isCheck(aiNewBoard, aiNextTurn);
              
              // 检查AI移动后游戏是否结束
              const aiGameEndResult = checkGameEnd(aiNewBoard, aiColor);
              
              // 更新状态，应用AI的移动
              setBoard(aiNewBoard);
              setMoveHistory(prev => [...prev, aiHistoryEntry]);
              setCurrentTurn(aiNextTurn);
              setIsCheckState(aiIsInCheck);
              
              // 如果AI移动导致游戏结束
              if (aiGameEndResult.isGameOver) {
                setGameStatus('over');
                setWinner(aiGameEndResult.winner);
              }
            } else {
              console.log('AI无法找到最佳移动，尝试随机移动');
              
              // 尝试随机移动
              const moves = [];
              
              // 收集AI所有合法移动
              for (let fromRow = 0; fromRow < 10; fromRow++) {
                for (let fromCol = 0; fromCol < 9; fromCol++) {
                  const piece = newBoard[fromRow][fromCol];
                  if (piece && piece.color === aiColor) {
                    for (let toRow = 0; toRow < 10; toRow++) {
                      for (let toCol = 0; toCol < 9; toCol++) {
                        if (isValidMove(piece, newBoard, fromRow, fromCol, toRow, toCol)) {
                          // 检查移动后是否会导致自己被将军
                          const tempBoard = JSON.parse(JSON.stringify(newBoard));
                          tempBoard[toRow][toCol] = tempBoard[fromRow][fromCol];
                          tempBoard[fromRow][fromCol] = null;
                          
                          if (!isCheck(tempBoard, aiColor)) {
                            moves.push({ 
                              fromRow, 
                              fromCol, 
                              toRow, 
                              toCol,
                              piece: piece,
                              captured: newBoard[toRow][toCol]
                            });
                          }
                        }
                      }
                    }
                  }
                }
              }
              
              if (moves.length > 0) {
                console.log(`找到${moves.length}个合法随机移动，执行其中一个`);
                // 随机选择一个移动
                const randomMove = moves[Math.floor(Math.random() * moves.length)];
                
                // 创建AI的新棋盘
                const aiNewBoard = JSON.parse(JSON.stringify(newBoard));
                
                // 执行随机移动
                const { fromRow, fromCol, toRow, toCol } = randomMove;
                
                // 记录移动历史
                const aiHistoryEntry = {
                  fromRow,
                  fromCol,
                  toRow,
                  toCol,
                  piece: randomMove.piece,
                  captured: randomMove.captured,
                  board: JSON.parse(JSON.stringify(aiNewBoard))
                };
                
                // 执行AI的移动
                aiNewBoard[toRow][toCol] = aiNewBoard[fromRow][fromCol];
                aiNewBoard[fromRow][fromCol] = null;
                
                // AI的下一回合颜色
                const aiNextTurn = aiColor === COLORS.RED ? COLORS.BLACK : COLORS.RED;
                
                // 检查AI移动后是否将军
                const aiIsInCheck = isCheck(aiNewBoard, aiNextTurn);
                
                // 更新状态
                setBoard(aiNewBoard);
                setMoveHistory(prev => [...prev, aiHistoryEntry]);
                setCurrentTurn(aiNextTurn);
                setIsCheckState(aiIsInCheck);
                
                console.log('AI随机移动执行完成');
              } else {
                console.log('AI找不到任何合法移动，玩家获胜');
                setGameStatus('over');
                setWinner(playerColor);
              }
            }
          } catch (error) {
            console.error('AI移动出错:', error);
          }
        }, 500);
      }
    } catch (error) {
      console.error('执行移动时出错:', error);
    }
  };

  // 悔棋
  const handleUndo = () => {
    if (moveHistory.length < 2 || gameStatus !== 'playing') return;
    
    // 需要撤销两步（玩家和AI的移动）
    const previousState = moveHistory[moveHistory.length - 2];
    setBoard(previousState.board);
    setMoveHistory(moveHistory.slice(0, -2));
    setSelectedCell(null);
    setValidMoves([]);
    setCurrentTurn(playerColor);
    setIsCheckState(false);
  };

  // 切换玩家颜色
  const togglePlayerColor = () => {
    setPlayerColor(playerColor === COLORS.RED ? COLORS.BLACK : COLORS.RED);
  };

  // 修改AI难度
  const changeDifficulty = (newDifficulty) => {
    setDifficulty(newDifficulty);
  };

  // 返回主页
  const goToHome = () => {
    navigate('/');
  };

  if (!board) return <div>加载中...</div>;

  return (
    <div className="game-container">
      <div className="game-info">
        <h1>人机对战</h1>
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
          <div className="difficulty-control">
            <label>AI难度：</label>
            <select 
              value={difficulty} 
              onChange={(e) => changeDifficulty(Number(e.target.value))}
              disabled={gameStatus === 'playing' && moveHistory.length > 0}
            >
              <option value={1}>简单</option>
              <option value={2}>中等</option>
              <option value={3}>困难</option>
              <option value={4}>专家</option>
              <option value={5}>大师</option>
            </select>
          </div>
          
          <div className="color-control">
            <label>执子：</label>
            <select 
              value={playerColor} 
              onChange={() => togglePlayerColor()}
              disabled={gameStatus === 'playing' && moveHistory.length > 0}
            >
              <option value={COLORS.RED}>红方</option>
              <option value={COLORS.BLACK}>黑方</option>
            </select>
          </div>
          
          <button 
            className="btn secondary-btn" 
            onClick={handleUndo}
            disabled={moveHistory.length < 2 || gameStatus !== 'playing'}
          >
            悔棋
          </button>
          
          <button 
            className="btn primary-btn" 
            onClick={resetGame}
          >
            重新开始
          </button>
          
          <button 
            className="btn secondary-btn" 
            onClick={goToHome}
          >
            返回主页
          </button>
        </div>
      </div>
      
      <div className="board-container">
        <ChessBoard 
          board={board}
          selectedCell={selectedCell}
          validMoves={validMoves}
          onCellClick={handleCellClick}
          reversed={playerColor === COLORS.BLACK}
        />
      </div>
    </div>
  );
};

export default AIGame; 