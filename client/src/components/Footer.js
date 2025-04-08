import React from 'react';
import './Footer.css';

const Footer = () => {
  const year = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-content">
          <p className="copyright">© {year} 中国象棋在线游戏</p>
          <p className="footer-description">
            这个项目使用了 React、Node.js 和 Express 构建，
            采用了深度优先搜索 (DFS)、宽度优先搜索 (BFS) 和 Alpha-Beta 剪枝算法来实现 AI 对战功能。
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 