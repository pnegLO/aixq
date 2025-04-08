/**
 * 中国象棋 AI 算法
 * 实现 Alpha-Beta 剪枝搜索
 */
import { isValidMove, isCheck, COLORS, PIECE_TYPES } from './chessRules';

// 棋子价值表（基础分值）
const PIECE_VALUES = {
  [PIECE_TYPES.GENERAL]: 10000,
  [PIECE_TYPES.ADVISOR]: 200,
  [PIECE_TYPES.ELEPHANT]: 200,
  [PIECE_TYPES.HORSE]: 400,
  [PIECE_TYPES.CHARIOT]: 900,
  [PIECE_TYPES.CANNON]: 450,
  [PIECE_TYPES.SOLDIER]: 100
};

// 位置加成表（根据棋子在棋盘上的位置给予额外分数）
const POSITION_BONUSES = {
  // 兵/卒位置价值表
  [PIECE_TYPES.SOLDIER]: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [30, 40, 50, 60, 70, 60, 50, 40, 30],
    [70, 80, 90, 100, 110, 100, 90, 80, 70],
    [80, 90, 100, 110, 120, 110, 100, 90, 80],
    [90, 100, 110, 120, 130, 120, 110, 100, 90],
    [90, 100, 110, 120, 130, 120, 110, 100, 90],
    [90, 100, 110, 120, 130, 120, 110, 100, 90],
    [90, 100, 110, 120, 130, 120, 110, 100, 90]
  ],
  // 马位置价值表 
  [PIECE_TYPES.HORSE]: [
    [60, 70, 80, 90, 90, 90, 80, 70, 60],
    [70, 80, 90, 100, 100, 100, 90, 80, 70],
    [80, 90, 100, 110, 110, 110, 100, 90, 80],
    [90, 100, 110, 120, 120, 120, 110, 100, 90],
    [90, 100, 110, 120, 120, 120, 110, 100, 90],
    [90, 100, 110, 120, 120, 120, 110, 100, 90],
    [80, 90, 100, 110, 110, 110, 100, 90, 80],
    [70, 80, 90, 100, 100, 100, 90, 80, 70],
    [60, 70, 80, 90, 90, 90, 80, 70, 60],
    [50, 60, 70, 80, 80, 80, 70, 60, 50]
  ]
};

/**
 * 生成当前棋盘所有合法移动
 * @param {Array} board - 棋盘状态
 * @param {String} color - 当前行动方颜色
 * @returns {Array} - 所有合法移动 [{fromRow, fromCol, toRow, toCol}, ...]
 */
export const generateAllMoves = (board, color) => {
  const moves = [];
  
  // 验证棋盘是否有效
  if (!board || !Array.isArray(board) || board.length !== 10) {
    return moves;
  }
  
  for (let fromRow = 0; fromRow < 10; fromRow++) {
    for (let fromCol = 0; fromCol < 9; fromCol++) {
      const piece = board[fromRow][fromCol];
      if (piece && piece.color === color) {
        // 尝试所有可能的目标位置
        for (let toRow = 0; toRow < 10; toRow++) {
          for (let toCol = 0; toCol < 9; toCol++) {
            // 过滤掉明显无效的移动以提高效率
            if (fromRow === toRow && fromCol === toCol) continue;
            
            try {
              if (isValidMove(piece, board, fromRow, fromCol, toRow, toCol)) {
                // 检查此移动是否会导致自己被将军
                const tempBoard = JSON.parse(JSON.stringify(board));
                tempBoard[toRow][toCol] = tempBoard[fromRow][fromCol];
                tempBoard[fromRow][fromCol] = null;
                
                if (!isCheck(tempBoard, color)) {
                  moves.push({ fromRow, fromCol, toRow, toCol });
                }
              }
            } catch (error) {
              console.error('Error in generateAllMoves:', error);
              // 跳过有问题的移动
              continue;
            }
          }
        }
      }
    }
  }
  
  return moves;
};

/**
 * 对棋盘进行评估，计算局势分数
 * 正分表示红方有利，负分表示黑方有利
 * @param {Array} board - 棋盘状态
 * @returns {Number} - 评估分数
 */
export const evaluateBoard = (board) => {
  let score = 0;
  
  // 检查棋盘是否有效
  if (!board || !Array.isArray(board) || board.length !== 10) {
    return 0;
  }
  
  // 计算每个棋子的基础价值和位置加成
  for (let row = 0; row < 10; row++) {
    if (!Array.isArray(board[row]) || board[row].length !== 9) {
      continue; // 跳过无效的行
    }
    
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (!piece) continue;
      
      // 基础棋子价值
      let pieceValue = PIECE_VALUES[piece.type] || 0;
      
      // 位置加成（如果定义了该棋子类型的位置加成表）
      if (POSITION_BONUSES[piece.type]) {
        // 黑方棋子需要翻转位置加成表
        const positionRow = piece.color === COLORS.RED ? row : 9 - row;
        if (positionRow >= 0 && positionRow < 10 && POSITION_BONUSES[piece.type][positionRow]) {
          pieceValue += (POSITION_BONUSES[piece.type][positionRow][col] || 0);
        }
      }
      
      // 红方加分，黑方减分
      score += piece.color === COLORS.RED ? pieceValue : -pieceValue;
    }
  }
  
  try {
    // 检查将军状态，给予额外分数
    if (isCheck(board, COLORS.BLACK)) {
      score += 50; // 红方将军加分
    }
    if (isCheck(board, COLORS.RED)) {
      score -= 50; // 黑方将军加分（红方减分）
    }
  } catch (error) {
    console.error('Error checking isCheck in evaluateBoard:', error);
  }
  
  return score;
};

/**
 * 应用移动到棋盘（不改变原棋盘）
 * @param {Array} board - 原棋盘
 * @param {Object} move - 移动 {fromRow, fromCol, toRow, toCol}
 * @returns {Array} - 移动后的新棋盘
 */
export const applyMove = (board, move) => {
  try {
    if (!board || !Array.isArray(board) || board.length !== 10) {
      console.error('Invalid board in applyMove');
      return board; // 返回原始棋盘
    }
    
    if (!move || typeof move !== 'object') {
      console.error('Invalid move in applyMove:', move);
      return board; // 返回原始棋盘
    }
    
    const { fromRow, fromCol, toRow, toCol } = move;
    
    // 验证移动坐标
    if (
      fromRow < 0 || fromRow >= 10 || fromCol < 0 || fromCol >= 9 ||
      toRow < 0 || toRow >= 10 || toCol < 0 || toCol >= 9
    ) {
      console.error('Invalid move coordinates in applyMove:', move);
      return board; // 返回原始棋盘
    }
    
    // 验证起始位置有棋子
    if (!board[fromRow] || !board[fromRow][fromCol]) {
      console.error('No piece at source position in applyMove:', move);
      return board; // 返回原始棋盘
    }
    
    // 创建新棋盘（深拷贝）
    const newBoard = board.map(row => [...row]);
    
    // 执行移动
    newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
    newBoard[fromRow][fromCol] = null;
    
    return newBoard;
  } catch (error) {
    console.error('Error in applyMove:', error);
    return board; // 错误时返回原始棋盘
  }
};

/**
 * Alpha-Beta 剪枝搜索算法
 * @param {Array} board - 当前棋盘状态
 * @param {Number} depth - 搜索深度
 * @param {Number} alpha - Alpha 值
 * @param {Number} beta - Beta 值
 * @param {Boolean} maximizingPlayer - 是否为最大化玩家（红方）
 * @returns {Object} - {score, move} 最佳分数和最佳移动
 */
export const alphaBetaSearch = (board, depth, alpha, beta, maximizingPlayer) => {
  // 验证棋盘和深度
  if (!board || !Array.isArray(board) || board.length !== 10 || depth < 0) {
    return { score: 0, move: null };
  }
  
  // 达到搜索深度或游戏结束
  if (depth === 0) {
    return { score: evaluateBoard(board), move: null };
  }
  
  try {
    const color = maximizingPlayer ? COLORS.RED : COLORS.BLACK;
    const moves = generateAllMoves(board, color);
    
    // 如果没有合法移动，可能是将军或和棋
    if (!moves || moves.length === 0) {
      try {
        if (isCheck(board, color)) {
          // 被将死，返回极低/极高分数
          return { 
            score: maximizingPlayer ? -9999 : 9999,
            move: null
          };
        }
      } catch (error) {
        console.error('Error checking isCheck in alphaBetaSearch:', error);
      }
      // 无子可动，和棋
      return { score: 0, move: null };
    }
    
    let bestMove = moves[0]; // 默认使用第一个移动
    
    if (maximizingPlayer) {
      let maxScore = -Infinity;
      
      for (const move of moves) {
        try {
          // 应用移动
          const newBoard = applyMove(board, move);
          
          // 递归搜索
          const { score } = alphaBetaSearch(newBoard, depth - 1, alpha, beta, false);
          
          if (score > maxScore) {
            maxScore = score;
            bestMove = move;
          }
          
          alpha = Math.max(alpha, maxScore);
          if (beta <= alpha) {
            break; // Beta 剪枝
          }
        } catch (error) {
          console.error('Error in alphaBetaSearch maximizing loop:', error);
          continue;
        }
      }
      
      return { score: maxScore, move: bestMove };
    } else {
      let minScore = Infinity;
      
      for (const move of moves) {
        try {
          // 应用移动
          const newBoard = applyMove(board, move);
          
          // 递归搜索
          const { score } = alphaBetaSearch(newBoard, depth - 1, alpha, beta, true);
          
          if (score < minScore) {
            minScore = score;
            bestMove = move;
          }
          
          beta = Math.min(beta, minScore);
          if (beta <= alpha) {
            break; // Alpha 剪枝
          }
        } catch (error) {
          console.error('Error in alphaBetaSearch minimizing loop:', error);
          continue;
        }
      }
      
      return { score: minScore, move: bestMove };
    }
  } catch (error) {
    console.error('Error in alphaBetaSearch:', error);
    return { score: 0, move: null };
  }
};

/**
 * 获取 AI 的最佳移动
 * @param {Array} board - 当前棋盘状态
 * @param {String} aiColor - AI 的颜色
 * @param {Number} difficulty - 难度级别（1-5，影响搜索深度）
 * @returns {Object} - 最佳移动 {fromRow, fromCol, toRow, toCol}
 */
export const getBestMove = (board, aiColor, difficulty = 3) => {
  try {
    // 验证输入
    if (!board || !Array.isArray(board) || board.length !== 10) {
      console.error('Invalid board in getBestMove');
      return null;
    }
    
    if (!aiColor || (aiColor !== COLORS.RED && aiColor !== COLORS.BLACK)) {
      console.error('Invalid aiColor in getBestMove:', aiColor);
      return null;
    }
    
    // 生成当前所有合法移动
    const availableMoves = generateAllMoves(board, aiColor);
    if (!availableMoves || availableMoves.length === 0) {
      console.log('No available moves for AI');
      return null;
    }
    
    // 如果只有一个可用移动，直接返回
    if (availableMoves.length === 1) {
      return availableMoves[0];
    }
    
    // 根据难度设置搜索深度
    const depth = Math.min(Math.max(1, difficulty), 5);
    
    // 是否为最大化玩家
    const maximizingPlayer = aiColor === COLORS.RED;
    
    // 执行 Alpha-Beta 搜索
    const result = alphaBetaSearch(
      board,
      depth,
      -Infinity,
      Infinity,
      maximizingPlayer
    );
    
    return result.move;
  } catch (error) {
    console.error('Error in getBestMove:', error);
    
    // 在出错时随机选择一个合法移动
    try {
      const availableMoves = generateAllMoves(board, aiColor);
      if (availableMoves && availableMoves.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableMoves.length);
        return availableMoves[randomIndex];
      }
    } catch (fallbackError) {
      console.error('Error in getBestMove fallback:', fallbackError);
    }
    
    return null;
  }
}; 