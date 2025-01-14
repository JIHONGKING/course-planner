// src/components/ui/tooltip.tsx

import * as React from 'react';

export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  return (
    <div className="relative group">
      {children}
      <div className="absolute invisible group-hover:visible bg-gray-900 text-white text-sm px-2 py-1 rounded bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2">
        {content}
      </div>
    </div>
  );
};