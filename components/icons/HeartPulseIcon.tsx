
import React from 'react';

const HeartPulseIcon: React.FC<{ className?: string }> = ({ className }) => (
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
    <path d="M19.5 12.5c0-1.5-3-4-3-4-1 0-2.5 1-3.5 1.5-1-.5-2.5-1.5-3.5-1.5-1 0-3 2.5-3 4 0 2.5 4 6.5 7 6.5s7-4 7-6.5z" />
    <path d="M4 15.5h2.5l1.5-2 2 4 2-4 1.5 2H19" />
  </svg>
);

export default HeartPulseIcon;
