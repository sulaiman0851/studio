import React from 'react';

const LoadingAnimation = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-white dark:bg-gray-900">
      <div className="animate-pulse text-2xl font-bold text-gray-800 dark:text-white">
        Biznet | NOA
      </div>
    </div>
  );
};

export default LoadingAnimation;