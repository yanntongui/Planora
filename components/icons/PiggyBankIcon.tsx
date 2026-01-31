
import React from 'react';

const PiggyBankIcon: React.FC<{ className?: string }> = ({ className }) => (
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
    <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-2-2-3z" />
    <path d="M2 9v1c0 1.1.9 2 2 2h1" />
    <path d="M16 5.5v-1.5c0-.8.7-1.5 1.5-1.5.8 0 1.5.7 1.5 1.5V5" />
  </svg>
);

export default PiggyBankIcon;
