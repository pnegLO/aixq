# 中国象棋在线对战系统架构与数据库设计说明

## 1. 系统概述

中国象棋在线对战系统是一个基于Web的多人在线游戏平台，支持人机对战和在线多人对战模式。系统采用现代Web技术栈构建，提供实时对战、游戏记录回放、聊天系统等功能，为用户提供流畅的中国象棋对弈体验。

## 2. 系统架构

### 2.1 整体架构

本系统采用典型的三层架构设计：
- **前端层**：负责用户界面展示和交互
- **后端层**：处理游戏逻辑和业务规则
- **数据层**：负责数据的持久化存储

整个系统通过Socket.io实现前后端的实时通信，保证了对弈过程的即时性和流畅性。

### 2.2 系统组件图

系统主要由以下组件构成：

**前端组件**：
- 客户端UI（React）：整体用户界面框架
- 游戏棋盘：展示棋盘和棋子
- 游戏控制器：处理用户的游戏操作
- 聊天界面：支持对战时的实时聊天
- Socket.io客户端：处理与服务器的实时通信

**后端组件**：
- Express服务器：提供HTTP API服务
- Socket.io服务器：处理实时通信
- 游戏逻辑模块：实现象棋规则和游戏状态管理
- 用户管理模块：处理用户认证和信息管理
- AI引擎：实现人机对战的AI算法

**数据层组件**：
- Sequelize ORM：对象关系映射中间件
- MySQL数据库：存储游戏数据和用户信息

### 2.3 数据流图

系统中的数据流动主要包括：
1. 玩家输入移动 → 前端UI → Socket.io服务器 → 游戏逻辑验证 → 数据库存储
2. AI计算移动 → 游戏逻辑验证 → Socket.io服务器 → 前端UI → 玩家界面更新
3. 用户聊天信息 → 前端UI → Socket.io服务器 → 其他用户前端 → 聊天界面更新

## 3. 数据库设计

### 3.1 数据库架构

系统使用MySQL数据库作为持久化存储，通过Sequelize ORM实现数据的操作和管理。

**数据库名称**：`chinese_chess_db`
**字符集**：`utf8mb4`
**排序规则**：`utf8mb4_unicode_ci`

### 3.2 核心数据表

#### games表

存储游戏的所有相关信息，包括棋盘状态、玩家信息、移动历史等。

| 字段名 | 类型 | 描述 | 约束 |
|--------|------|------|------|
| id | INT | 自增主键 | AUTO_INCREMENT, PRIMARY KEY |
| gameId | VARCHAR(36) | 游戏唯一标识符 | NOT NULL, UNIQUE |
| boardState | JSON | 棋盘当前状态 | NOT NULL |
| currentTurn | VARCHAR(10) | 当前回合(red/black) | NOT NULL |
| status | VARCHAR(20) | 游戏状态(waiting/playing/over) | NOT NULL, DEFAULT 'waiting' |
| players | JSON | 玩家信息 | NOT NULL |
| moveHistory | JSON | 移动历史记录 | NOT NULL |
| chatMessages | JSON | 聊天记录 | NOT NULL |
| createdAt | TIMESTAMP | 创建时间 | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| updatedAt | TIMESTAMP | 更新时间 | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### 3.3 数据模型设计

系统使用Sequelize ORM管理数据模型，主要模型包括：

**Game模型**：
```javascript
const Game = sequelize.define('Game', {
  gameId: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  boardState: {
    type: DataTypes.JSON,
    allowNull: false
  },
  currentTurn: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'waiting'
  },
  players: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  moveHistory: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  chatMessages: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  }
});
```

## 4. 关键技术实现

### 4.1 实时通信实现

系统采用Socket.io实现实时通信，主要处理以下事件：
- 游戏棋子移动
- 游戏状态更新
- 玩家加入/离开
- 聊天消息
- 悔棋请求/回应

```javascript
// 服务端Socket.io事件处理示例
io.on('connection', (socket) => {
  // 玩家加入游戏
  socket.on('joinGame', async (data) => {
    // 处理加入游戏逻辑
  });
  
  // 处理移动事件
  socket.on('makeMove', async (data) => {
    // 验证并处理棋子移动
  });
  
  // 处理聊天消息
  socket.on('chatMessage', (data) => {
    // 广播聊天消息
  });
});
```

### 4.2 象棋规则实现

象棋规则通过`gameLogic.js`模块实现，包括：
- 棋子移动规则验证
- 将军检测
- 胜负判定
- 特殊规则（如阻车腿、马撇脚等）

### 4.3 AI引擎实现

系统实现了基于Alpha-Beta剪枝算法的AI，具有以下特点：
- 多层次难度设置
- 基于评估函数的棋局评分
- 优化的走法搜索策略
- 特定局面的开局库支持

## 5. 部署架构

### 5.1 开发环境部署

开发环境使用Docker Compose部署，包含三个主要容器：
- MySQL数据库容器
- Node.js后端服务容器
- React前端开发服务器容器

### 5.2 生产环境部署

生产环境采用Docker Compose进行部署，优化了容器配置和网络设置，提高了系统的稳定性和性能。

## 6. 性能与可扩展性

系统设计考虑了以下性能和可扩展性因素：
- 数据库索引优化
- Socket.io连接池管理
- 游戏状态缓存策略
- 支持水平扩展的无状态服务设计

## 7. 总结

中国象棋在线对战系统通过现代Web技术栈实现了一个功能完善、性能优良的在线象棋平台。系统架构清晰，数据模型设计合理，技术实现符合行业最佳实践，为用户提供了流畅的游戏体验。

本文档可作为系统架构参考和论文撰写的基础资料，详细说明了系统的技术选型、组件设计和数据库实现。 
