
import React from 'react';

const ClapperboardIcon: React.FC<{ className?: string }> = ({ className }) => (
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
    <path d="M20.2 6.8l-4.5 4.5-2.5-2.5-4.5 4.5-1.5-1.5-2.7 2.7" />
    <path d="M19 5L5 19" />
    <path d="M4 11l4.5-4.5 2.5 2.5 4.5-4.5 1.5 1.5 2.7-2.7" />
  </svg>
);

export default ClapperboardIcon;
