import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import NewsCard from './NewsCard';
import SkeletonCard from './SkeletonCard';
import { RotateCw } from 'lucide-react';

const NewsFeed = ({ initialSearchTerm }) => {
    const [articles, setArticles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);

    const observer = useRef();
    const lastArticleElementRef = useCallback(node => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                fetchNews(false);
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoading, hasMore, articles]);

    const fetchNews = async (isNewSearch = false) => {
        setIsLoading(true);
        if (isNewSearch) setError(null);

        const params = {
            tags: initialSearchTerm,
        };

        if (!isNewSearch && articles.length > 0) {
            params.exclude_urls = articles.map(a => a.url).join(',');
        }

        try {
            const response = await axios.get('http://127.0.0.1:8000/news', { params });

            const newArticles = response.data;

            if (newArticles.length < 10) {
                setHasMore(false);
            }

            setArticles(prevArticles => isNewSearch ? newArticles : [...prevArticles, ...newArticles]);

        } catch (err) {
            setError('Failed to fetch news. Is the backend server running?');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setArticles([]);
        setHasMore(true);
        fetchNews(true);
    }, [initialSearchTerm]);

    const handleRefresh = () => {
        setArticles([]);
        setHasMore(true);
        fetchNews(true);
    }

    return (
        <div className="news-feed-container">
            <div className="feed-controls">
                <h2>Results for: "{initialSearchTerm}"</h2>
                <button onClick={handleRefresh} disabled={isLoading} className="refresh-button">
                    <RotateCw size={16} className={isLoading ? 'spinning' : ''} />
                    Refresh
                </button>
            </div>
            {isLoading && articles.length === 0 && (
                <div className="news-grid">
                    {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
            )}
            <div className="news-grid">
                {articles.map((article, index) => {
                    if (articles.length === index + 1) {
                        return (
                            <div ref={lastArticleElementRef} key={article.id}>
                                <NewsCard article={article} />
                            </div>
                        );
                    } else {
                        return <NewsCard key={article.id} article={article} />;
                    }
                })}
            </div>
            {isLoading && articles.length > 0 && <p className="status-text">Loading more articles...</p>}
            {error && <p className="status-text error-text">{error}</p>}
            {!hasMore && articles.length > 0 && <p className="status-text">You've reached the end.</p>}
            {!isLoading && articles.length === 0 && !error && <p className="status-text">No articles found.</p>}
        </div>
    );
};

export default NewsFeed;