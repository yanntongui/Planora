
import React from 'react';

const TableIcon: React.FC<{ className?: string }> = ({ className }) => (
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
    <path d="M12 3v18" />
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 12h18" />
    <path d="M12 3v2" />
    <path d="M12 19v2" />
  </svg>
);

export default TableIcon;