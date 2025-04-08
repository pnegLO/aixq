import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="container header-container">
        <div className="logo">
          <Link to="/">中国象棋</Link>
        </div>
        <nav className="nav">
          <ul className="nav-list">
            <li className="nav-item">
              <Link to="/" className="nav-link">首页</Link>
            </li>
            <li className="nav-item">
              <Link to="/ai-game" className="nav-link">人机对战</Link>
            </li>
            <li className="nav-item">
              <Link to="/" className="nav-link">在线对战</Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header; 