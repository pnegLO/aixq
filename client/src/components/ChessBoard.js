import React from 'react';
import './ChessBoard.css';
import { PIECE_TYPES, COLORS } from '../utils/chessRules';

const ChessBoard = ({ board, selectedCell, validMoves, onCellClick, reversed }) => {
  if (!board || !Array.isArray(board) || board.length !== 10) {
    console.error('Invalid board passed to ChessBoard component');
    return <div className="chessboard-error">棋盘数据无效</div>;
  }
  
  // 棋子类型对应的中文名称
  const pieceNames = {
    [PIECE_TYPES.GENERAL]: { [COLORS.RED]: '帅', [COLORS.BLACK]: '将' },
    [PIECE_TYPES.ADVISOR]: { [COLORS.RED]: '仕', [COLORS.BLACK]: '士' },
    [PIECE_TYPES.ELEPHANT]: { [COLORS.RED]: '相', [COLORS.BLACK]: '象' },
    [PIECE_TYPES.HORSE]: { [COLORS.RED]: '马', [COLORS.BLACK]: '马' },
    [PIECE_TYPES.CHARIOT]: { [COLORS.RED]: '车', [COLORS.BLACK]: '车' },
    [PIECE_TYPES.CANNON]: { [COLORS.RED]: '炮', [COLORS.BLACK]: '炮' },
    [PIECE_TYPES.SOLDIER]: { [COLORS.RED]: '兵', [COLORS.BLACK]: '卒' }
  };

  // 安全地获取棋子名称，避免错误
  const getPieceName = (piece) => {
    if (!piece || !piece.type || !piece.color) return '';
    
    try {
      return pieceNames[piece.type]?.[piece.color] || '';
    } catch (error) {
      console.error('Error getting piece name:', error, piece);
      return '';
    }
  };

  // 渲染棋盘网格
  const renderBoard = () => {
    try {
      const rows = [];
      
      // 根据是否翻转决定渲染顺序
      const rowStart = reversed ? 9 : 0;
      const rowEnd = reversed ? -1 : 10;
      const rowStep = reversed ? -1 : 1;
      
      const colStart = reversed ? 8 : 0;
      const colEnd = reversed ? -1 : 9;
      const colStep = reversed ? -1 : 1;
      
      for (let row = rowStart; row !== rowEnd; row += rowStep) {
        const cells = [];
        
        for (let col = colStart; col !== colEnd; col += colStep) {
          // 判断是否为选中的格子
          const isSelected = selectedCell && selectedCell.row === row && selectedCell.col === col;
          
          // 判断是否为有效移动的目标格子
          const isValidMove = Array.isArray(validMoves) && validMoves.some(move => move.row === row && move.col === col);
          
          // 渲染格子
          cells.push(
            <div
              key={`${row}-${col}`}
              className={`cell ${isSelected ? 'selected' : ''} ${isValidMove ? 'valid-move' : ''}`}
              onClick={() => onCellClick(row, col)}
              data-row={row}
              data-col={col}
            >
              {renderPiece(row, col)}
              {renderCellDecoration(row, col)}
            </div>
          );
        }
        
        rows.push(<div key={row} className="board-row">{cells}</div>);
      }
      
      return rows;
    } catch (error) {
      console.error('Error rendering board:', error);
      return <div className="board-error">棋盘渲染错误</div>;
    }
  };

  // 渲染棋子
  const renderPiece = (row, col) => {
    try {
      if (row < 0 || row >= 10 || col < 0 || col >= 9) return null;
      
      const piece = board[row][col];
      
      if (!piece) return null;
      
      return (
        <div className={`chess-piece ${piece.color}`}>
          {getPieceName(piece)}
        </div>
      );
    } catch (error) {
      console.error('Error rendering piece:', error, row, col);
      return null;
    }
  };

  // 渲染格子装饰（河界、九宫格等）
  const renderCellDecoration = (row, col) => {
    try {
      const decorations = [];
      
      // 渲染九宫格的斜线
      if (
        // 红方九宫
        ((row >= 7 && row <= 9) && (col >= 3 && col <= 5)) ||
        // 黑方九宫
        ((row >= 0 && row <= 2) && (col >= 3 && col <= 5))
      ) {
        // 中心点
        if (row === 8 && col === 4) {
          decorations.push(<div key="center" className="palace-center"></div>);
        }
        
        // 左上到右下斜线
        if (
          (row === 7 && col === 3) ||
          (row === 9 && col === 5) ||
          (row === 0 && col === 3) ||
          (row === 2 && col === 5)
        ) {
          decorations.push(<div key="diagonal-1" className="palace-diagonal diagonal-1"></div>);
        }
        
        // 右上到左下斜线
        if (
          (row === 7 && col === 5) ||
          (row === 9 && col === 3) ||
          (row === 0 && col === 5) ||
          (row === 2 && col === 3)
        ) {
          decorations.push(<div key="diagonal-2" className="palace-diagonal diagonal-2"></div>);
        }
      }
      
      // 兵/卒位置标记
      if (
        // 红方兵初始位置
        (row === 6 && (col === 0 || col === 2 || col === 4 || col === 6 || col === 8)) ||
        // 黑方卒初始位置
        (row === 3 && (col === 0 || col === 2 || col === 4 || col === 6 || col === 8))
      ) {
        decorations.push(<div key="soldier-point" className="soldier-point"></div>);
      }
      
      // 炮台位置
      if (
        (row === 2 && (col === 1 || col === 7)) ||
        (row === 7 && (col === 1 || col === 7))
      ) {
        decorations.push(<div key="cannon-platform" className="cannon-platform"></div>);
      }
      
      return decorations;
    } catch (error) {
      console.error('Error rendering cell decoration:', error, row, col);
      return [];
    }
  };

  // 渲染坐标标注
  const renderCoordinates = () => {
    try {
      const colLabels = ['九', '八', '七', '六', '五', '四', '三', '二', '一'];
      const rowLabels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
      
      // 根据棋盘方向调整标签顺序
      const colCoords = reversed ? [...colLabels].reverse() : colLabels;
      const rowCoords = reversed ? [...rowLabels].reverse() : rowLabels;
      
      return (
        <>
          <div className="col-coordinates">
            {colCoords.map((label, index) => (
              <div key={index} className="coordinate-label">{label}</div>
            ))}
          </div>
          <div className="row-coordinates">
            {rowCoords.map((label, index) => (
              <div key={index} className="coordinate-label">{label}</div>
            ))}
          </div>
        </>
      );
    } catch (error) {
      console.error('Error rendering coordinates:', error);
      return null;
    }
  };

  return (
    <div className="chessboard-wrapper">
      {renderCoordinates()}
      <div className="chessboard">
        {/* 河界 */}
        <div className="river-boundary">楚河 汉界</div>
        
        {/* 棋盘网格 */}
        {renderBoard()}
      </div>
    </div>
  );
};

export default ChessBoard; 