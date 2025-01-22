import React, { useEffect } from 'react';

export function Intro({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-[#fcfcfc] overflow-hidden">
      <div className="w-full h-screen flex items-center justify-center">
        <img
          src="/intro.gif"
          alt="Welcome"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
}