import React, { useState } from 'react';
import { InfoIcon } from 'lucide-react';

interface TooltipHelperProps {
  text: string;
  examples?: string[];
  className?: string;
}

const TooltipHelper: React.FC<TooltipHelperProps> = ({ text, examples, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <InfoIcon
        className={`h-4 w-4 cursor-help transition-colors ${className}`}
        style={{ color: 'var(--color-textSecondary)' }}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      />
      
      {isVisible && (
        <div className="absolute bottom-full right-0 mb-2 z-[9999]">
          <div 
            className="px-3 py-2 text-xs rounded-lg shadow-lg border max-w-4xl min-w-96"
            style={{ 
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)'
            }}
          >
            <div className="font-medium mb-1">{text}</div>
            {examples && examples.length > 0 && (
              <div>
                <div 
                  className="text-xs font-medium mb-1"
                  style={{ color: 'var(--color-textSecondary)' }}
                >
                  Examples:
                </div>
                <ul className="text-xs space-y-0.5">
                  {examples.map((example, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-1">•</span>
                      <code 
                        className="text-xs px-1 py-0.5 rounded flex-1"
                        style={{ 
                          backgroundColor: 'var(--color-highlight)',
                          color: 'var(--color-text)'
                        }}
                      >
                        {example}
                      </code>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Arrow pointing down, positioned towards the right */}
            <div 
              className="absolute top-full right-4 w-2 h-2 rotate-45"
              style={{ 
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                borderRightWidth: '1px',
                borderBottomWidth: '1px'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TooltipHelper; 