import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import NewsFeed from './components/NewsFeed';
import './App.css';

function App() {
  const [theme, setTheme] = useState('light');
  const [searchTerm, setSearchTerm] = useState('latest tech news');

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme(currentTheme => (currentTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="app-container">
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        onSearch={setSearchTerm}
      />
      <main>
        <NewsFeed key={searchTerm} initialSearchTerm={searchTerm} />
      </main>
    </div>
  );
}

export default App;