import React from 'react';

interface TypingIndicatorProps {
  userNames: string[];
  className?: string;
}

export default function TypingIndicator({ userNames, className = '' }: TypingIndicatorProps) {
  if (userNames.length === 0) return null;

  const getTypingText = () => {
    if (userNames.length === 1) {
      return `${userNames[0]} is typing...`;
    } else if (userNames.length === 2) {
      return `${userNames[0]} and ${userNames[1]} are typing...`;
    } else {
      return `${userNames[0]} and ${userNames.length - 1} others are typing...`;
    }
  };

  return (
    <div className={`flex items-center gap-2 px-4 py-2 text-muted-foreground ${className}`}>
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
        <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
      </div>
      <span className="text-sm italic">{getTypingText()}</span>
    </div>
  );
}