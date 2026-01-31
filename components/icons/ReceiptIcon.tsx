
import React from 'react';

const ReceiptIcon: React.FC<{ className?: string }> = ({ className }) => (
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
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
    <path d="M22 6.5h-1.5l-1-4h-7l-1 4H10" />
    <path d="M5.5 21L3 8" />
    <path d="M18.5 21L21 8" />
    <path d="M12 11v10" />
  </svg>
);

export default ReceiptIcon;
