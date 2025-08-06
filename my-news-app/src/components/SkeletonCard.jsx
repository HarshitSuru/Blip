import React from 'react';

const SkeletonCard = () => {
    return (
        <div className="news-card skeleton">
            <div className="skeleton-line title"></div>
            <div className="skeleton-line text"></div>
            <div className="skeleton-line text short"></div>
            <div className="skeleton-footer">
                <div className="skeleton-line tag"></div>
                <div className="skeleton-line tag"></div>
            </div>
        </div>
    );
};

export default SkeletonCard;