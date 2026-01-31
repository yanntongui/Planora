
import React from 'react';

const ChatPlusIcon: React.FC<{ className?: string }> = ({ className }) => (
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
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h8.5" />
    <line x1="16" y1="9" x2="22" y2="9" />
    <line x1="19" y1="6" x2="19" y2="12" />
  </svg>
);

export default ChatPlusIcon;
