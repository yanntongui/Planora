
import React from 'react';

const CarIcon: React.FC<{ className?: string }> = ({ className }) => (
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
    <path d="M14 16H9m10 0h1.12a2 2 0 0 0 1.9-1.55l.8-4.2a2 2 0 0 0-1.9-2.45H5.12a2 2 0 0 0-1.9 2.45l.8 4.2A2 2 0 0 0 5.88 16H7m0 0v2m10-2v2M5 16H3.34a2 2 0 0 1-1.9-2.45l.8-4.2A2 2 0 0 1 4.12 7H19.88a2 2 0 0 1 1.9 2.45l.8 4.2A2 2 0 0 1 20.66 16H17" />
    <path d="M7 16V8a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v8" />
  </svg>
);

export default CarIcon;
