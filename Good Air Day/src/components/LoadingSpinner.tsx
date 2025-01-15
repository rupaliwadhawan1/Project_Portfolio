import React from 'react';

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-brand-primary border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-brand-secondary border-t-transparent animate-ping opacity-20"></div>
      </div>
    </div>
  );
}