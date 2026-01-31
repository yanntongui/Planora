
import React from 'react';

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 3L9.27 9.27L3 12l6.27 2.73L12 21l2.73-6.27L21 12l-6.27-2.73L12 3z" />
    <path d="M4 4l1.5 3L8 8.5 5.5 11 4 14l-1.5-3L0 9.5 2.5 7 4 4z" />
    <path d="M20 12l-1.5 3-2.5 1.5 2.5 1.5 1.5 3 1.5-3 2.5-1.5-2.5-1.5-1.5-3z" />
  </svg>
);

export default SparklesIcon;
