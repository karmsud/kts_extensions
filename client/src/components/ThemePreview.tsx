import React from 'react';
import { Theme } from '../contexts/ThemeContext';
import { MailIcon, DatabaseIcon, BarChart3Icon } from 'lucide-react';

interface ThemePreviewProps {
  theme: Theme;
  isSelected?: boolean;
  onClick?: () => void;
}

const ThemePreview: React.FC<ThemePreviewProps> = ({ theme, isSelected = false, onClick }) => {
  const previewStyle = {
    '--preview-primary': theme.colors.primary,
    '--preview-primaryHover': theme.colors.primaryHover,
    '--preview-secondary': theme.colors.secondary,
    '--preview-accent': theme.colors.accent,
    '--preview-background': theme.colors.background,
    '--preview-surface': theme.colors.surface,
    '--preview-text': theme.colors.text,
    '--preview-textSecondary': theme.colors.textSecondary,
    '--preview-border': theme.colors.border,
    '--preview-sidebar': theme.colors.sidebar,
    '--preview-sidebarText': theme.colors.sidebarText,
    '--preview-topbar': theme.colors.topbar,
    '--preview-highlight': theme.colors.highlight,
  } as React.CSSProperties;

  return (
    <div
      className={`relative overflow-hidden rounded-lg border-2 transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-200'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      style={previewStyle}
      onClick={onClick}
    >
      <div
        className="p-4 h-40 scale-75 origin-top-left transform"
        style={{ backgroundColor: 'var(--preview-background)' }}
      >
        {/* Mini header */}
        <div
          className="flex items-center justify-between p-2 rounded mb-2"
          style={{
            backgroundColor: 'var(--preview-topbar)',
            borderColor: 'var(--preview-border)',
          }}
        >
          <div
            className="text-xs font-semibold"
            style={{ color: 'var(--preview-text)' }}
          >
            {theme.name}
          </div>
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: 'var(--preview-primary)' }}
          />
        </div>

        {/* Mini sidebar and content area */}
        <div className="flex space-x-2 h-24">
          {/* Mini sidebar */}
          <div
            className="w-16 rounded p-2 space-y-1"
            style={{ backgroundColor: 'var(--preview-sidebar)' }}
          >
            <div className="flex items-center space-x-1">
              <div
                className="w-3 h-3 rounded flex items-center justify-center"
                style={{ backgroundColor: 'var(--preview-primary)' }}
              >
                <MailIcon
                  className="w-2 h-2 text-white"
                  style={{ fontSize: '8px' }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <div
                className="w-8 h-1 rounded"
                style={{
                  backgroundColor: 'var(--preview-highlight)',
                  color: 'var(--preview-primary)',
                }}
              />
              <div
                className="w-6 h-1 rounded"
                style={{ backgroundColor: 'var(--preview-border)' }}
              />
              <div
                className="w-10 h-1 rounded"
                style={{ backgroundColor: 'var(--preview-border)' }}
              />
            </div>
          </div>

          {/* Mini content */}
          <div className="flex-1 space-y-2">
            <div
              className="p-2 rounded"
              style={{ backgroundColor: 'var(--preview-surface)' }}
            >
              <div
                className="w-12 h-1 rounded mb-1"
                style={{ backgroundColor: 'var(--preview-text)' }}
              />
              <div
                className="w-8 h-1 rounded"
                style={{ backgroundColor: 'var(--preview-textSecondary)' }}
              />
            </div>
            <div
              className="p-2 rounded"
              style={{ backgroundColor: 'var(--preview-surface)' }}
            >
              <div
                className="w-10 h-1 rounded mb-1"
                style={{ backgroundColor: 'var(--preview-text)' }}
              />
              <div
                className="w-6 h-1 rounded"
                style={{ backgroundColor: 'var(--preview-textSecondary)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Theme name overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-90 p-2">
        <div className="text-xs font-medium text-gray-900 text-center">
          {theme.name}
        </div>
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>
      )}
    </div>
  );
};

export default ThemePreview; 