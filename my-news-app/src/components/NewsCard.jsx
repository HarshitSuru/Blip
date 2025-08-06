import React from 'react';
import { format } from 'timeago.js';
import { ExternalLink } from 'lucide-react';

const NewsCard = ({ article }) => {
    return (
        <div className="news-card">
            <div className="card-header">
                <a href={article.url} target="_blank" rel="noopener noreferrer">
                    <h3>{article.title}</h3>
                </a>
            </div>
            <p className="summary">{article.summary}</p>
            <div className="card-footer">
                <div className="tags">
                    {article.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="tag">{tag}</span>
                    ))}
                </div>
                <div className="metadata">
                    <span className="source">{article.source}</span>
                    <span className="time">{format(article.publishedAt)}</span>
                    <a href={article.url} target="_blank" rel="noopener noreferrer" className="external-link">
                        <ExternalLink size={16} />
                    </a>
                </div>
            </div>
        </div>
    );
};

export default NewsCard;