const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
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
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'games'
  });

  return Game;
}; 