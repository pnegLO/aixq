const dotenv = require('dotenv');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { Game, syncDatabase } = require('./models');
const gameLogic = require('./services/gameLogic');

dotenv.config();

// 初始化Express应用和Socket.io
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.get('/', (req, res) => {
  res.send('中国象棋游戏服务器正在运行');
});

// 创建新游戏
app.post('/api/games', async (req, res) => {
  try {
    const gameId = uuidv4().substring(0, 8);
    const initialBoard = gameLogic.initializeBoard();
    
    await Game.create({
      gameId,
      boardState: initialBoard,
      currentTurn: gameLogic.COLORS.RED,
      status: 'waiting',
      players: [],
      moveHistory: [],
      chatMessages: []
    });
    
    res.status(201).json({ gameId });
  } catch (error) {
    console.error('创建游戏失败:', error);
    res.status(500).json({ error: '创建游戏失败' });
  }
});

// 获取游戏信息
app.get('/api/games/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const game = await Game.findOne({ where: { gameId } });
    
    if (!game) {
      return res.status(404).json({ error: '游戏不存在' });
    }
    
    res.json(game);
  } catch (error) {
    console.error('获取游戏信息失败:', error);
    res.status(500).json({ error: '获取游戏信息失败' });
  }
});

// 获取游戏历史记录
app.get('/api/games/:gameId/history', async (req, res) => {
  try {
    const { gameId } = req.params;
    const game = await Game.findOne({ where: { gameId } });
    
    if (!game) {
      return res.status(404).json({ error: '游戏不存在' });
    }
    
    // 返回游戏的移动历史
    res.json({
      gameId,
      history: game.moveHistory,
      status: game.status,
      players: game.players
    });
  } catch (error) {
    console.error('获取游戏历史失败:', error);
    res.status(500).json({ error: '获取游戏历史失败' });
  }
});

// 加入游戏
app.post('/api/games/:gameId/join', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerName } = req.body;
    
    if (!playerName) {
      return res.status(400).json({ error: '玩家名称不能为空' });
    }
    
    const game = await Game.findOne({ where: { gameId } });
    
    if (!game) {
      return res.status(404).json({ error: '游戏不存在' });
    }
    
    const players = game.players;
    
    // 检查游戏是否已满
    if (players.length >= 2) {
      return res.status(400).json({ error: '游戏已满' });
    }
    
    // 检查玩家名称是否已存在
    if (players.some(p => p.name === playerName)) {
      return res.status(400).json({ error: '玩家名称已存在' });
    }
    
    // 分配颜色
    const color = players.length === 0 ? gameLogic.COLORS.RED : gameLogic.COLORS.BLACK;
    const playerId = uuidv4();
    
    // 更新玩家列表
    players.push({
      id: playerId,
      name: playerName,
      color
    });
    
    // 如果两名玩家都加入，更新游戏状态
    const newStatus = players.length === 2 ? 'playing' : 'waiting';
    
    await game.update({
      players,
      status: newStatus
    });
    
    res.json({
      gameId,
      playerId,
      color,
      status: newStatus
    });
  } catch (error) {
    console.error('加入游戏失败:', error);
    res.status(500).json({ error: '加入游戏失败' });
  }
});

// Socket.io事件处理
io.on('connection', (socket) => {
  console.log('新用户连接:', socket.id);
  
  // 加入游戏房间
  socket.on('join-game', ({ gameId, playerName }) => {
    socket.join(gameId);
    console.log(`玩家 ${playerName} 加入游戏 ${gameId}`);
    socket.to(gameId).emit('player-joined', { playerName });
  });
  
  // 处理移动
  socket.on('make-move', async ({ gameId, move, playerId }) => {
    try {
      const { fromRow, fromCol, toRow, toCol } = move;
      const game = await Game.findOne({ where: { gameId } });
      
      if (!game) {
        return socket.emit('error', { message: '游戏不存在' });
      }
      
      // 验证是否是玩家的回合
      const player = game.players.find(p => p.id === playerId);
      if (!player || player.color !== game.currentTurn) {
        return socket.emit('error', { message: '不是你的回合' });
      }
      
      // 验证移动
      const { isValid, newBoard, capturedPiece } = gameLogic.validateMove(
        game.boardState,
        fromRow,
        fromCol,
        toRow,
        toCol,
        player.color
      );
      
      if (!isValid) {
        return socket.emit('error', { message: '无效的移动' });
      }
      
      // 记录移动历史
      const moveHistory = [...game.moveHistory, {
        fromRow,
        fromCol,
        toRow,
        toCol,
        piece: game.boardState[fromRow][fromCol],
        captured: game.boardState[toRow][toCol],
        timestamp: new Date()
      }];
      
      // 切换回合
      const nextTurn = game.currentTurn === gameLogic.COLORS.RED 
        ? gameLogic.COLORS.BLACK 
        : gameLogic.COLORS.RED;
      
      // 检查游戏是否结束
      const { isGameOver, winner } = gameLogic.checkGameEnd(newBoard, game.currentTurn);
      const newStatus = isGameOver ? 'completed' : 'playing';
      
      // 更新游戏状态
      await game.update({
        boardState: newBoard,
        currentTurn: nextTurn,
        moveHistory,
        status: newStatus
      });
      
      // 广播移动结果
      io.to(gameId).emit('game-update', {
        boardState: newBoard,
        currentTurn: nextTurn,
        lastMove: move,
        isGameOver,
        winner
      });
      
    } catch (error) {
      console.error('处理移动失败:', error);
      socket.emit('error', { message: '处理移动失败' });
    }
  });
  
  // 聊天消息
  socket.on('chat-message', async ({ gameId, playerId, message }) => {
    try {
      const game = await Game.findOne({ where: { gameId } });
      
      if (!game) return;
      
      const player = game.players.find(p => p.id === playerId);
      if (!player) return;
      
      const chatMessage = {
        playerId,
        playerName: player.name,
        message,
        timestamp: new Date()
      };
      
      const chatMessages = [...game.chatMessages, chatMessage];
      
      await game.update({ chatMessages });
      
      io.to(gameId).emit('chat-message', chatMessage);
    } catch (error) {
      console.error('发送聊天消息失败:', error);
    }
  });
  
  // 请求悔棋
  socket.on('request-undo', async ({ gameId, playerId }) => {
    try {
      const game = await Game.findOne({ where: { gameId } });
      
      if (!game || game.players.length < 2) return;
      
      const player = game.players.find(p => p.id === playerId);
      if (!player) return;
      
      const opponent = game.players.find(p => p.id !== playerId);
      
      io.to(gameId).emit('undo-requested', {
        requestedBy: player.name,
        requestedById: playerId
      });
    } catch (error) {
      console.error('请求悔棋失败:', error);
    }
  });
  
  // 响应悔棋请求
  socket.on('respond-undo', async ({ gameId, playerId, accepted }) => {
    try {
      const game = await Game.findOne({ where: { gameId } });
      
      if (!game) return;
      
      if (accepted && game.moveHistory.length > 0) {
        // 回退到上一步
        const newHistory = [...game.moveHistory];
        newHistory.pop(); // 移除最后一步
        
        // 如果历史记录为空，使用初始棋盘
        let newBoard;
        let newTurn;
        
        if (newHistory.length === 0) {
          newBoard = gameLogic.initializeBoard();
          newTurn = gameLogic.COLORS.RED;
        } else {
          // 使用上一步的棋盘状态
          const lastMove = newHistory[newHistory.length - 1];
          newBoard = lastMove.board;
          newTurn = game.currentTurn === gameLogic.COLORS.RED 
            ? gameLogic.COLORS.BLACK 
            : gameLogic.COLORS.RED;
        }
        
        await game.update({
          boardState: newBoard,
          currentTurn: newTurn,
          moveHistory: newHistory
        });
        
        io.to(gameId).emit('game-update', {
          boardState: newBoard,
          currentTurn: newTurn,
          undoAccepted: true
        });
      } else {
        io.to(gameId).emit('undo-responded', {
          accepted: false,
          respondedBy: playerId
        });
      }
    } catch (error) {
      console.error('响应悔棋请求失败:', error);
    }
  });
  
  // 投降
  socket.on('surrender', async ({ gameId, playerId }) => {
    try {
      const game = await Game.findOne({ where: { gameId } });
      
      if (!game) return;
      
      const player = game.players.find(p => p.id === playerId);
      if (!player) return;
      
      // 对手获胜
      const winner = player.color === gameLogic.COLORS.RED 
        ? gameLogic.COLORS.BLACK 
        : gameLogic.COLORS.RED;
      
      await game.update({
        status: 'completed'
      });
      
      io.to(gameId).emit('player-surrendered', {
        playerId,
        playerName: player.name,
        winner
      });
    } catch (error) {
      console.error('处理投降失败:', error);
    }
  });
  
  // 断开连接
  socket.on('disconnect', () => {
    console.log('用户断开连接:', socket.id);
  });
});

// 启动服务器
const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`服务器运行在端口 ${PORT}`);
  
  // 同步数据库
  await syncDatabase();
}); 