import React, { useState } from 'react';
import { ChevronDownIcon, CheckIcon, PaletteIcon, GridIcon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import ThemePreview from './ThemePreview';

interface ThemeSelectorProps {
  className?: string;
  showPreview?: boolean;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ 
  className = '', 
  showPreview = false 
}) => {
  const { currentTheme, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [showPreviewGrid, setShowPreviewGrid] = useState(false);

  const handleThemeSelect = (themeId: string) => {
    setTheme(themeId);
    setIsOpen(false);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Standard Dropdown */}
      <div className="relative">
        <button
          type="button"
          className="relative w-full cursor-default rounded-lg py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
            borderWidth: '1px',
          }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="flex items-center">
            <PaletteIcon className="h-5 w-5 mr-2" style={{ color: 'var(--color-primary)' }} />
            <span className="block truncate">{currentTheme.name}</span>
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDownIcon
              className="h-5 w-5"
              style={{ color: 'var(--color-textSecondary)' }}
            />
          </span>
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <div
              className="absolute z-20 mt-1 max-h-96 w-full overflow-auto rounded-md py-1 text-base shadow-lg ring-1 ring-opacity-5 focus:outline-none sm:text-sm"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  className="relative cursor-default select-none py-2 pl-3 pr-9 hover:opacity-80"
                  style={{
                    backgroundColor: currentTheme.id === theme.id ? 'var(--color-highlight)' : 'transparent',
                  }}
                  onClick={() => handleThemeSelect(theme.id)}
                >
                  <div className="flex items-center">
                    <div
                      className="h-4 w-4 rounded-full mr-3 border-2"
                      style={{
                        backgroundColor: theme.colors.primary,
                        borderColor: theme.colors.border,
                      }}
                    />
                    <span
                      className={`block truncate ${
                        currentTheme.id === theme.id ? 'font-medium' : 'font-normal'
                      }`}
                      style={{ color: 'var(--color-text)' }}
                    >
                      {theme.name}
                    </span>
                  </div>

                  {currentTheme.id === theme.id && (
                    <span
                      className="absolute inset-y-0 right-0 flex items-center pr-4"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      <CheckIcon className="h-5 w-5" />
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Preview Toggle Button */}
      {showPreview && (
        <button
          type="button"
          className="btn-secondary w-full justify-center"
          onClick={() => setShowPreviewGrid(!showPreviewGrid)}
        >
          <GridIcon className="h-4 w-4 mr-2" />
          {showPreviewGrid ? 'Hide' : 'Show'} Theme Previews
        </button>
      )}

      {/* Theme Preview Grid */}
      {showPreview && showPreviewGrid && (
        <div 
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 rounded-lg border"
          style={{ 
            backgroundColor: 'var(--color-surface)', 
            borderColor: 'var(--color-border)' 
          }}
        >
          {themes.map((theme) => (
            <ThemePreview
              key={theme.id}
              theme={theme}
              isSelected={currentTheme.id === theme.id}
              onClick={() => handleThemeSelect(theme.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemeSelector; 