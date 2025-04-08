import axios from 'axios';
import io from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
let socket;

/**
 * 初始化Socket.io连接
 * @param {Object} callbacks - 回调函数对象
 * @returns {Object} - socket实例
 */
export const initializeSocket = (callbacks) => {
  const {
    onGameUpdate,
    onPlayerJoined,
    onGameStarted,
    onError,
    onChatMessage,
    onUndoRequested,
    onUndoResponded,
    onPlayerSurrendered
  } = callbacks;

  socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');

  socket.on('connect', () => {
    console.log('Connected to WebSocket server');
  });

  socket.on('game-update', (data) => {
    if (onGameUpdate) onGameUpdate(data);
  });

  socket.on('player-joined', (data) => {
    if (onPlayerJoined) onPlayerJoined(data);
  });

  socket.on('game-started', (data) => {
    if (onGameStarted) onGameStarted(data);
  });

  socket.on('chat-message', (data) => {
    if (onChatMessage) onChatMessage(data);
  });

  socket.on('undo-requested', (data) => {
    if (onUndoRequested) onUndoRequested(data);
  });

  socket.on('undo-responded', (data) => {
    if (onUndoResponded) onUndoResponded(data);
  });

  socket.on('player-surrendered', (data) => {
    if (onPlayerSurrendered) onPlayerSurrendered(data);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
    if (onError) onError(error);
  });

  return socket;
};

/**
 * 创建新的在线游戏
 * @returns {Promise} - 返回游戏ID
 */
export const createGame = async () => {
  try {
    const response = await axios.post(`${API_URL}/games`);
    return response.data;
  } catch (error) {
    console.error('Failed to create game:', error);
    throw error;
  }
};

/**
 * 加入现有游戏
 * @param {String} gameId - 游戏ID
 * @param {String} playerName - 玩家名称
 * @returns {Promise} - 返回游戏数据
 */
export const joinGame = async (gameId, playerName) => {
  try {
    const response = await axios.post(`${API_URL}/games/${gameId}/join`, { playerName });
    if (socket) {
      socket.emit('join-game', { gameId, playerName });
    }
    return response.data;
  } catch (error) {
    console.error('Failed to join game:', error);
    throw error;
  }
};

/**
 * 发送移动棋子请求
 * @param {String} gameId - 游戏ID
 * @param {Object} move - 移动数据 {fromRow, fromCol, toRow, toCol}
 * @param {String} playerId - 玩家ID
 * @returns {void}
 */
export const makeMove = (gameId, move, playerId) => {
  if (socket) {
    socket.emit('make-move', { gameId, move, playerId });
  }
};

/**
 * 获取游戏数据
 * @param {String} gameId - 游戏ID
 * @returns {Promise} - 返回游戏数据
 */
export const getGame = async (gameId) => {
  try {
    const response = await axios.get(`${API_URL}/games/${gameId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get game:', error);
    throw error;
  }
};

/**
 * 投降
 * @param {String} gameId - 游戏ID
 * @param {String} playerId - 玩家ID
 * @returns {void}
 */
export const surrender = (gameId, playerId) => {
  if (socket) {
    socket.emit('surrender', { gameId, playerId });
  }
};

/**
 * 请求悔棋
 * @param {String} gameId - 游戏ID
 * @param {String} playerId - 玩家ID
 * @returns {void}
 */
export const requestUndo = (gameId, playerId) => {
  if (socket) {
    socket.emit('request-undo', { gameId, playerId });
  }
};

/**
 * 响应悔棋请求
 * @param {String} gameId - 游戏ID
 * @param {String} playerId - 玩家ID
 * @param {Boolean} accepted - 是否接受悔棋
 * @returns {void}
 */
export const respondToUndoRequest = (gameId, playerId, accepted) => {
  if (socket) {
    socket.emit('respond-undo', { gameId, playerId, accepted });
  }
};

/**
 * 发送聊天消息
 * @param {String} gameId - 游戏ID
 * @param {String} playerId - 玩家ID
 * @param {String} message - 消息内容
 * @returns {void}
 */
export const sendChatMessage = (gameId, playerId, message) => {
  if (socket) {
    socket.emit('chat-message', { gameId, playerId, message });
  }
};

/**
 * 获取游戏历史记录
 * @param {String} gameId - 游戏ID
 * @returns {Promise} - 返回游戏历史数据
 */
export const getGameHistory = async (gameId) => {
  try {
    const response = await axios.get(`${API_URL}/games/${gameId}/history`);
    return response.data;
  } catch (error) {
    console.error('Failed to get game history:', error);
    throw error;
  }
};

/**
 * 断开WebSocket连接
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
}; 