import React, { useState, useEffect, useRef } from 'react';
import './ChatBox.css';

const ChatBox = ({ messages, onSendMessage, currentPlayer }) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  
  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // 发送消息
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };
  
  // 格式化时间
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="chat-box">
      <div className="chat-header">
        <h3>游戏聊天</h3>
      </div>
      
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>暂无消息，开始聊天吧！</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={index} 
              className={`message ${msg.playerId === currentPlayer?.id ? 'my-message' : 'other-message'}`}
            >
              <div className="message-header">
                <span className="sender-name">{msg.playerName}</span>
                <span className="message-time">{formatTime(msg.timestamp)}</span>
              </div>
              <div className="message-content">{msg.message}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chat-input" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="输入消息..."
          disabled={!currentPlayer}
        />
        <button 
          type="submit" 
          disabled={!message.trim() || !currentPlayer}
        >
          发送
        </button>
      </form>
    </div>
  );
};

export default ChatBox; 