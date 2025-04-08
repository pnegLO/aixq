const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// 配置数据库连接
const sequelize = new Sequelize(
  process.env.DB_NAME || 'chinese_chess_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '8prvp55k',
  {
    host: process.env.DB_HOST || 'mysql',
    dialect: 'mysql',
    port: process.env.DB_PORT || 3306,
    logging: false,
    dialectOptions: {
      ssl: false
    }
  }
);

// 初始化模型
const Game = require('./Game')(sequelize);

// 同步数据库模型
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('数据库同步成功');
  } catch (error) {
    console.error('数据库同步失败:', error);
  }
};

module.exports = {
  sequelize,
  Game,
  syncDatabase
}; 