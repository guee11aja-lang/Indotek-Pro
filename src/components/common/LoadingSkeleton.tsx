import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number; className?: string }> = ({
  rows = 5,
  className = '',
}) => {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      <div className="h-9 bg-[#EAEFEA] rounded-lg w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          <div className="h-8 bg-[#F1F4F2] rounded w-1/4" />
          <div className="h-8 bg-[#F1F4F2] rounded w-1/3" />
          <div className="h-8 bg-[#F1F4F2] rounded w-1/5" />
          <div className="h-8 bg-[#F1F4F2] rounded w-1/6" />
        </div>
      ))}
    </div>
  );
};
