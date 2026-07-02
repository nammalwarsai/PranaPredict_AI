import { memo } from "react";

// Skeleton loader for cards
const CardSkeleton = memo(() => (
  <div className="skeleton-card" role="status" aria-live="polite">
    <div className="skeleton skeleton-header" />
    <div className="skeleton skeleton-content" />
    <div className="skeleton skeleton-content" />
    <div className="skeleton skeleton-footer" />
  </div>
));

CardSkeleton.displayName = 'CardSkeleton';

// Skeleton loader for text
const TextSkeleton = memo(({ lines = 3, width = '100%' }) => (
  <div className="skeleton-text" role="status" aria-live="polite">
    {Array.from({ length: lines }).map((_, index) => (
      <div 
        key={index} 
        className="skeleton skeleton-line"
        style={{ width: index === 0 ? width : `${Math.max(70, 100 - (index * 10))}%` }}
      />
    ))}
  </div>
));

TextSkeleton.displayName = 'TextSkeleton';

// Skeleton loader for forms
const FormSkeleton = memo(() => (
  <div className="skeleton-form" role="status" aria-live="polite">
    <div className="skeleton skeleton-title" />
    <div className="skeleton skeleton-input" />
    <div className="skeleton skeleton-input" />
    <div className="skeleton skeleton-input" />
    <div className="skeleton skeleton-button" />
  </div>
));

FormSkeleton.displayName = 'FormSkeleton';

// Main loading fallback component
const LoadingFallback = memo(({ type = 'page' }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return <CardSkeleton />;
      case 'text':
        return <TextSkeleton lines={4} />;
      case 'form':
        return <FormSkeleton />;
      case 'list':
        return (
          <div className="skeleton-list">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        );
      default:
        return (
          <div className="loading-screen" role="status" aria-live="polite">
            <div className="loading-spinner" aria-hidden="true" />
            <span className="sr-only">Loading...</span>
            <p className="loading-text">Loading content...</p>
          </div>
        );
    }
  };

  return renderSkeleton();
});

LoadingFallback.displayName = 'LoadingFallback';

export default LoadingFallback;

export { CardSkeleton, TextSkeleton, FormSkeleton };
