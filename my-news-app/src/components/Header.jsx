import React, { useState } from 'react';
import { Sun, Moon, Search } from 'lucide-react';

const Header = ({ theme, toggleTheme, onSearch }) => {
    const [inputValue, setInputValue] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (inputValue.trim()) {
            onSearch(inputValue.trim());
        }
    };

    return (
        <header className="app-header">
            <h1>AI News Brief</h1>
            <form className="search-form" onSubmit={handleSearch}>
                <Search className="search-icon" size={20} />
                <input
                    type="text"
                    placeholder="Filter by topic or location..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                />
            </form>
            <button onClick={toggleTheme} className="theme-toggle">
                {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
            </button>
        </header>
    );
};

export default Header;