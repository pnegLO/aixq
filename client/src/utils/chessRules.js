/**
 * 中国象棋规则工具函数
 */

// 棋子类型常量
export const PIECE_TYPES = {
  GENERAL: 'general',  // 将/帅
  ADVISOR: 'advisor',  // 士/仕
  ELEPHANT: 'elephant', // 象/相
  HORSE: 'horse',     // 马
  CHARIOT: 'chariot',  // 车
  CANNON: 'cannon',    // 炮
  SOLDIER: 'soldier'   // 兵/卒
};

// 棋子颜色常量
export const COLORS = {
  RED: 'red',
  BLACK: 'black'
};

/**
 * 检查移动是否有效
 * @param {Object} piece - 棋子对象
 * @param {Array} board - 棋盘状态
 * @param {Number} fromRow - 起始行
 * @param {Number} fromCol - 起始列
 * @param {Number} toRow - 目标行
 * @param {Number} toCol - 目标列
 * @returns {Boolean} - 移动是否有效
 */
export const isValidMove = (piece, board, fromRow, fromCol, toRow, toCol) => {
  // 检查坐标是否越界
  if (fromRow < 0 || fromRow >= 10 || fromCol < 0 || fromCol >= 9 ||
      toRow < 0 || toRow >= 10 || toCol < 0 || toCol >= 9) {
    return false;
  }
  
  // 起始位置和目标位置相同
  if (fromRow === toRow && fromCol === toCol) {
    return false;
  }
  
  // 确保起始位置有棋子
  if (!piece) {
    return false;
  }
  
  // 目标位置已经有己方棋子
  if (board[toRow][toCol] && board[toRow][toCol].color === piece.color) {
    return false;
  }

  // 根据不同棋子类型验证移动
  switch (piece.type) {
    case PIECE_TYPES.GENERAL:
      return isValidGeneralMove(board, fromRow, fromCol, toRow, toCol, piece.color);
    case PIECE_TYPES.ADVISOR:
      return isValidAdvisorMove(board, fromRow, fromCol, toRow, toCol, piece.color);
    case PIECE_TYPES.ELEPHANT:
      return isValidElephantMove(board, fromRow, fromCol, toRow, toCol, piece.color);
    case PIECE_TYPES.HORSE:
      return isValidHorseMove(board, fromRow, fromCol, toRow, toCol);
    case PIECE_TYPES.CHARIOT:
      return isValidChariotMove(board, fromRow, fromCol, toRow, toCol);
    case PIECE_TYPES.CANNON:
      return isValidCannonMove(board, fromRow, fromCol, toRow, toCol);
    case PIECE_TYPES.SOLDIER:
      return isValidSoldierMove(board, fromRow, fromCol, toRow, toCol, piece.color);
    default:
      return false;
  }
};

/**
 * 检查将/帅移动是否有效
 */
const isValidGeneralMove = (board, fromRow, fromCol, toRow, toCol, color) => {
  // 将/帅只能在九宫格内移动
  const isInPalace = color === COLORS.RED
    ? toRow >= 7 && toRow <= 9 && toCol >= 3 && toCol <= 5  // 红方九宫
    : toRow >= 0 && toRow <= 2 && toCol >= 3 && toCol <= 5; // 黑方九宫
  
  if (!isInPalace) return false;

  // 将/帅每次只能移动一格，且只能横向或纵向移动
  const rowDiff = Math.abs(toRow - fromRow);
  const colDiff = Math.abs(toCol - fromCol);
  
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
};

/**
 * 检查士/仕移动是否有效
 */
const isValidAdvisorMove = (board, fromRow, fromCol, toRow, toCol, color) => {
  // 士/仕只能在九宫格内移动
  const isInPalace = color === COLORS.RED
    ? toRow >= 7 && toRow <= 9 && toCol >= 3 && toCol <= 5  // 红方九宫
    : toRow >= 0 && toRow <= 2 && toCol >= 3 && toCol <= 5; // 黑方九宫
  
  if (!isInPalace) return false;

  // 士/仕每次只能斜着移动一格
  const rowDiff = Math.abs(toRow - fromRow);
  const colDiff = Math.abs(toCol - fromCol);
  
  return rowDiff === 1 && colDiff === 1;
};

/**
 * 检查象/相移动是否有效
 */
const isValidElephantMove = (board, fromRow, fromCol, toRow, toCol, color) => {
  // 象/相不能过河
  const cannotCrossRiver = color === COLORS.RED
    ? toRow < 5  // 红方象不能过河
    : toRow > 4; // 黑方相不能过河
  
  if (cannotCrossRiver) return false;

  // 象/相每次斜着走两格
  const rowDiff = Math.abs(toRow - fromRow);
  const colDiff = Math.abs(toCol - fromCol);
  
  if (rowDiff !== 2 || colDiff !== 2) return false;

  // 象眼被塞住不能走
  const eyeRow = (fromRow + toRow) / 2;
  const eyeCol = (fromCol + toCol) / 2;
  
  return !board[eyeRow][eyeCol]; // 象眼位置无子，可以移动
};

/**
 * 检查马移动是否有效
 */
const isValidHorseMove = (board, fromRow, fromCol, toRow, toCol) => {
  const rowDiff = Math.abs(toRow - fromRow);
  const colDiff = Math.abs(toCol - fromCol);
  
  // 马走"日"字
  if (!((rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2))) {
    return false;
  }

  // 检查马腿是否被绊住
  let legRow = fromRow;
  let legCol = fromCol;
  
  if (rowDiff === 2) {
    // 向上或向下跳的马，检查竖向的马腿
    legRow = fromRow + (toRow > fromRow ? 1 : -1);
  } else {
    // 向左或向右跳的马，检查横向的马腿
    legCol = fromCol + (toCol > fromCol ? 1 : -1);
  }
  
  return !board[legRow][legCol]; // 马腿位置无子，可以移动
};

/**
 * 检查车移动是否有效
 */
const isValidChariotMove = (board, fromRow, fromCol, toRow, toCol) => {
  // 车只能横向或纵向移动
  if (fromRow !== toRow && fromCol !== toCol) {
    return false;
  }
  
  // 检查路径上是否有障碍物
  if (fromRow === toRow) {
    // 横向移动
    const minCol = Math.min(fromCol, toCol);
    const maxCol = Math.max(fromCol, toCol);
    
    for (let col = minCol + 1; col < maxCol; col++) {
      if (board[fromRow][col]) {
        return false; // 路径上有障碍物
      }
    }
  } else {
    // 纵向移动
    const minRow = Math.min(fromRow, toRow);
    const maxRow = Math.max(fromRow, toRow);
    
    for (let row = minRow + 1; row < maxRow; row++) {
      if (board[row][fromCol]) {
        return false; // 路径上有障碍物
      }
    }
  }
  
  return true;
};

/**
 * 检查炮移动是否有效
 */
const isValidCannonMove = (board, fromRow, fromCol, toRow, toCol) => {
  // 炮只能横向或纵向移动
  if (fromRow !== toRow && fromCol !== toCol) {
    return false;
  }
  
  let pieceCount = 0; // 路径上的棋子数量
  
  if (fromRow === toRow) {
    // 横向移动
    const minCol = Math.min(fromCol, toCol);
    const maxCol = Math.max(fromCol, toCol);
    
    for (let col = minCol + 1; col < maxCol; col++) {
      if (board[fromRow][col]) {
        pieceCount++;
      }
    }
  } else {
    // 纵向移动
    const minRow = Math.min(fromRow, toRow);
    const maxRow = Math.max(fromRow, toRow);
    
    for (let row = minRow + 1; row < maxRow; row++) {
      if (board[row][fromCol]) {
        pieceCount++;
      }
    }
  }
  
  // 目标位置有对方棋子时，炮需要翻越一个棋子
  if (board[toRow][toCol]) {
    return pieceCount === 1;
  }
  
  // 目标位置为空时，炮不能翻越任何棋子
  return pieceCount === 0;
};

/**
 * 检查兵/卒移动是否有效
 */
const isValidSoldierMove = (board, fromRow, fromCol, toRow, toCol, color) => {
  const rowDiff = toRow - fromRow;
  const colDiff = Math.abs(toCol - fromCol);
  
  // 兵/卒每次只能移动一格
  if (colDiff > 1 || Math.abs(rowDiff) > 1 || (colDiff === 1 && rowDiff !== 0)) {
    return false;
  }
  
  if (color === COLORS.RED) {
    // 红方兵
    if (fromRow >= 5) {
      // 未过河，只能向前移动
      return rowDiff === -1 && colDiff === 0;
    } else {
      // 已过河，可以向前或向左右移动
      return rowDiff === -1 || (rowDiff === 0 && colDiff === 1);
    }
  } else {
    // 黑方卒
    if (fromRow <= 4) {
      // 未过河，只能向前移动
      return rowDiff === 1 && colDiff === 0;
    } else {
      // 已过河，可以向前或向左右移动
      return rowDiff === 1 || (rowDiff === 0 && colDiff === 1);
    }
  }
};

/**
 * 检查将军状态
 * @param {Array} board - 棋盘状态
 * @param {String} kingColor - 被将军的将/帅颜色
 * @returns {Boolean} - 是否被将军
 */
export const isCheck = (board, kingColor) => {
  // 找到将/帅的位置
  let kingRow = -1;
  let kingCol = -1;
  
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (piece && piece.type === PIECE_TYPES.GENERAL && piece.color === kingColor) {
        kingRow = row;
        kingCol = col;
        break;
      }
    }
    if (kingRow !== -1) break;
  }
  
  // 如果找不到将/帅，返回false
  if (kingRow === -1 || kingCol === -1) {
    return false;
  }
  
  // 检查所有对方棋子是否可以吃掉将/帅
  const opponentColor = kingColor === COLORS.RED ? COLORS.BLACK : COLORS.RED;
  
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (piece && piece.color === opponentColor) {
        if (isValidMove(piece, board, row, col, kingRow, kingCol)) {
          return true; // 被将军
        }
      }
    }
  }
  
  return false;
};

/**
 * 检查将帅是否面对面（长将情况）
 */
export const isGeneralsFacing = (board) => {
  let redGeneralCol = -1;
  let blackGeneralCol = -1;
  let redGeneralRow = -1;
  let blackGeneralRow = -1;
  
  // 找到两方将帅的位置
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (piece && piece.type === PIECE_TYPES.GENERAL) {
        if (piece.color === COLORS.RED) {
          redGeneralRow = row;
          redGeneralCol = col;
        } else {
          blackGeneralRow = row;
          blackGeneralCol = col;
        }
      }
    }
  }
  
  // 如果任一方将帅不存在，返回false
  if (redGeneralRow === -1 || blackGeneralRow === -1) {
    return false;
  }
  
  // 检查是否在同一列
  if (redGeneralCol === blackGeneralCol) {
    // 确定上下位置关系
    const minRow = Math.min(redGeneralRow, blackGeneralRow);
    const maxRow = Math.max(redGeneralRow, blackGeneralRow);
    
    // 检查两将之间是否有其他棋子
    let hasPieceBetween = false;
    for (let row = minRow + 1; row < maxRow; row++) {
      if (board[row][redGeneralCol]) {
        hasPieceBetween = true;
        break;
      }
    }
    
    return !hasPieceBetween; // 如果中间没有棋子，则将帅对面
  }
  
  return false;
};

/**
 * 初始化棋盘
 * @returns {Array} - 初始棋盘状态
 */
export const initializeBoard = () => {
  const board = Array(10).fill().map(() => Array(9).fill(null));
  
  // 红方（下方）
  board[9][0] = { type: PIECE_TYPES.CHARIOT, color: COLORS.RED };
  board[9][1] = { type: PIECE_TYPES.HORSE, color: COLORS.RED };
  board[9][2] = { type: PIECE_TYPES.ELEPHANT, color: COLORS.RED };
  board[9][3] = { type: PIECE_TYPES.ADVISOR, color: COLORS.RED };
  board[9][4] = { type: PIECE_TYPES.GENERAL, color: COLORS.RED };
  board[9][5] = { type: PIECE_TYPES.ADVISOR, color: COLORS.RED };
  board[9][6] = { type: PIECE_TYPES.ELEPHANT, color: COLORS.RED };
  board[9][7] = { type: PIECE_TYPES.HORSE, color: COLORS.RED };
  board[9][8] = { type: PIECE_TYPES.CHARIOT, color: COLORS.RED };
  board[7][1] = { type: PIECE_TYPES.CANNON, color: COLORS.RED };
  board[7][7] = { type: PIECE_TYPES.CANNON, color: COLORS.RED };
  board[6][0] = { type: PIECE_TYPES.SOLDIER, color: COLORS.RED };
  board[6][2] = { type: PIECE_TYPES.SOLDIER, color: COLORS.RED };
  board[6][4] = { type: PIECE_TYPES.SOLDIER, color: COLORS.RED };
  board[6][6] = { type: PIECE_TYPES.SOLDIER, color: COLORS.RED };
  board[6][8] = { type: PIECE_TYPES.SOLDIER, color: COLORS.RED };
  
  // 黑方（上方）
  board[0][0] = { type: PIECE_TYPES.CHARIOT, color: COLORS.BLACK };
  board[0][1] = { type: PIECE_TYPES.HORSE, color: COLORS.BLACK };
  board[0][2] = { type: PIECE_TYPES.ELEPHANT, color: COLORS.BLACK };
  board[0][3] = { type: PIECE_TYPES.ADVISOR, color: COLORS.BLACK };
  board[0][4] = { type: PIECE_TYPES.GENERAL, color: COLORS.BLACK };
  board[0][5] = { type: PIECE_TYPES.ADVISOR, color: COLORS.BLACK };
  board[0][6] = { type: PIECE_TYPES.ELEPHANT, color: COLORS.BLACK };
  board[0][7] = { type: PIECE_TYPES.HORSE, color: COLORS.BLACK };
  board[0][8] = { type: PIECE_TYPES.CHARIOT, color: COLORS.BLACK };
  board[2][1] = { type: PIECE_TYPES.CANNON, color: COLORS.BLACK };
  board[2][7] = { type: PIECE_TYPES.CANNON, color: COLORS.BLACK };
  board[3][0] = { type: PIECE_TYPES.SOLDIER, color: COLORS.BLACK };
  board[3][2] = { type: PIECE_TYPES.SOLDIER, color: COLORS.BLACK };
  board[3][4] = { type: PIECE_TYPES.SOLDIER, color: COLORS.BLACK };
  board[3][6] = { type: PIECE_TYPES.SOLDIER, color: COLORS.BLACK };
  board[3][8] = { type: PIECE_TYPES.SOLDIER, color: COLORS.BLACK };
  
  return board;
};

/**
 * 检查游戏是否结束
 * @param {Array} board - 棋盘状态
 * @param {String} currentTurn - 当前回合的颜色
 * @returns {Object} - { isGameOver, winner }
 */
export const checkGameEnd = (board, currentTurn) => {
  const opponentColor = currentTurn === COLORS.RED ? COLORS.BLACK : COLORS.RED;
  
  // 检查对方是否被将军
  if (isCheck(board, opponentColor)) {
    // 检查对方是否有合法移动可解除将军
    for (let fromRow = 0; fromRow < 10; fromRow++) {
      for (let fromCol = 0; fromCol < 9; fromCol++) {
        const piece = board[fromRow][fromCol];
        if (piece && piece.color === opponentColor) {
          // 尝试该棋子的所有可能移动
          for (let toRow = 0; toRow < 10; toRow++) {
            for (let toCol = 0; toCol < 9; toCol++) {
              if (isValidMove(piece, board, fromRow, fromCol, toRow, toCol)) {
                // 创建临时棋盘（深拷贝）
                const tempBoard = JSON.parse(JSON.stringify(board));
                
                // 在临时棋盘上模拟移动
                tempBoard[toRow][toCol] = tempBoard[fromRow][fromCol];
                tempBoard[fromRow][fromCol] = null;
                
                // 检查移动后是否仍被将军
                const stillInCheck = isCheck(tempBoard, opponentColor);
                
                if (!stillInCheck) {
                  // 有解除将军的移动，游戏继续
                  return { isGameOver: false, winner: null };
                }
              }
            }
          }
        }
      }
    }
    
    // 无法解除将军，游戏结束，当前玩家胜利
    return { isGameOver: true, winner: currentTurn };
  }
  
  return { isGameOver: false, winner: null };
}; 