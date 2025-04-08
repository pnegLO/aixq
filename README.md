# 中国象棋在线对战系统

中国象棋在线对战系统是一个基于Web的多人在线中国象棋游戏平台，支持人机对战和在线对战模式。

## 功能特点

- **多种游戏模式**：支持人机对战、在线多人对战
- **实时对战**：基于Socket.io的实时通信
- **游戏历史**：查看历史对局记录，可回放棋局
- **聊天系统**：在线对战时支持实时聊天
- **悔棋功能**：支持请求悔棋和响应悔棋
- **响应式设计**：适配不同设备屏幕大小

## 技术栈

### 前端
- React.js
- Socket.io客户端
- CSS3动画效果

### 后端
- Node.js
- Express
- Socket.io
- MySQL (Sequelize ORM)

## 安装与运行

### 环境要求
- Node.js v14+
- MySQL 8.0+
- npm 或 yarn

### 克隆仓库
```bash
git clone https://github.com/yourusername/chinese-chess-game.git
cd chinese-chess-game
```

### 后端设置
1. 进入服务器目录
```bash
cd server
```

2. 安装依赖
```bash
npm install
```

3. 创建MySQL数据库
```sql
CREATE DATABASE chinese_chess_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

4. 配置环境变量
复制`.env.example`为`.env`并根据你的环境修改配置：
```bash
cp .env.example .env
```

5. 启动服务器
```bash
npm start
```

### 前端设置
1. 进入客户端目录
```bash
cd client
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
创建`.env`文件：
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

4. 启动开发服务器
```bash
npm start
```

## 使用Docker部署

本项目支持使用Docker进行开发和部署。

### 开发环境

使用Docker Compose启动开发环境：

```bash
docker-compose up
```

这将启动三个容器：
- MySQL数据库
- Node.js后端API服务
- React前端开发服务器

### 生产环境

1. 构建前端Docker镜像
```bash
cd client
docker build -t chinese-chess-client .
```

2. 构建后端Docker镜像
```bash
cd server
docker build -t chinese-chess-server .
```

3. 使用Docker Compose进行部署
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 数据库说明

项目使用MySQL数据库存储游戏相关的所有数据，包括游戏状态、玩家信息、移动历史和聊天记录。

数据表结构：
- `games` - 存储游戏信息和状态

## 最近更新

- 增加游戏历史记录回放功能
- 添加实时聊天系统
- 支持使用Docker进行部署
- 将数据库从MongoDB迁移到MySQL

## 贡献指南

1. Fork本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 许可证

本项目使用MIT许可证 