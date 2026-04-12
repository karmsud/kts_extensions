import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    primaryHover: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    sidebar: string;
    sidebarText: string;
    topbar: string;
    highlight: string;
  };
}

export const themes: Theme[] = [
  {
    id: 'light-blue',
    name: 'Light Blue',
    colors: {
      primary: '#3B82F6',
      primaryHover: '#2563EB',
      secondary: '#64748B',
      accent: '#06B6D4',
      background: '#F8FAFC',
      surface: '#FFFFFF',
      text: '#1E293B',
      textSecondary: '#64748B',
      border: '#E2E8F0',
      sidebar: '#FFFFFF',
      sidebarText: '#374151',
      topbar: '#FFFFFF',
      highlight: '#EFF6FF',
    },
  },
  {
    id: 'light-orange',
    name: 'Light Orange',
    colors: {
      primary: '#EA580C',
      primaryHover: '#C2410C',
      secondary: '#78716C',
      accent: '#F97316',
      background: '#FFFBEB',
      surface: '#FFFFFF',
      text: '#1C1917',
      textSecondary: '#78716C',
      border: '#FED7AA',
      sidebar: '#FFF7ED',
      sidebarText: '#9A3412',
      topbar: '#FFFFFF',
      highlight: '#FFF7ED',
    },
  },
  {
    id: 'light-green',
    name: 'Light Green',
    colors: {
      primary: '#059669',
      primaryHover: '#047857',
      secondary: '#6B7280',
      accent: '#10B981',
      background: '#F0FDF4',
      surface: '#FFFFFF',
      text: '#1F2937',
      textSecondary: '#6B7280',
      border: '#BBF7D0',
      sidebar: '#F0FDF4',
      sidebarText: '#065F46',
      topbar: '#FFFFFF',
      highlight: '#ECFDF5',
    },
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    colors: {
      primary: '#3B82F6',
      primaryHover: '#2563EB',
      secondary: '#9CA3AF',
      accent: '#06B6D4',
      background: '#111827',
      surface: '#1F2937',
      text: '#F9FAFB',
      textSecondary: '#D1D5DB',
      border: '#374151',
      sidebar: '#1F2937',
      sidebarText: '#F3F4F6',
      topbar: '#1F2937',
      highlight: '#374151',
    },
  },
  {
    id: 'purple-haze',
    name: 'Purple Haze',
    colors: {
      primary: '#7C3AED',
      primaryHover: '#6D28D9',
      secondary: '#8B5CF6',
      accent: '#A855F7',
      background: '#FAF5FF',
      surface: '#FFFFFF',
      text: '#581C87',
      textSecondary: '#7C2D92',
      border: '#DDD6FE',
      sidebar: '#F3E8FF',
      sidebarText: '#6B21A8',
      topbar: '#FFFFFF',
      highlight: '#EDE9FE',
    },
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold',
    colors: {
      primary: '#E11D48',
      primaryHover: '#BE185D',
      secondary: '#9F1239',
      accent: '#F43F5E',
      background: '#FFF1F2',
      surface: '#FFFFFF',
      text: '#881337',
      textSecondary: '#9F1239',
      border: '#FECDD3',
      sidebar: '#FFF1F2',
      sidebarText: '#9F1239',
      topbar: '#FFFFFF',
      highlight: '#FFE4E6',
    },
  },
  {
    id: 'github',
    name: 'GitHub Style',
    colors: {
      primary: '#0969DA',
      primaryHover: '#0550AE',
      secondary: '#656D76',
      accent: '#218BFF',
      background: '#FFFFFF',
      surface: '#F6F8FA',
      text: '#1F2328',
      textSecondary: '#656D76',
      border: '#D1D9E0',
      sidebar: '#F6F8FA',
      sidebarText: '#1F2328',
      topbar: '#FFFFFF',
      highlight: '#DDF4FF',
    },
  },
  {
    id: 'notion',
    name: 'Notion Style',
    colors: {
      primary: '#2383E2',
      primaryHover: '#1B6EC2',
      secondary: '#787774',
      accent: '#2383E2',
      background: '#FFFFFF',
      surface: '#FBFBFA',
      text: '#2F3437',
      textSecondary: '#787774',
      border: '#E9E9E7',
      sidebar: '#F7F6F3',
      sidebarText: '#2F3437',
      topbar: '#FFFFFF',
      highlight: '#2383E20D',
    },
  },
  {
    id: 'slack',
    name: 'Slack Style',
    colors: {
      primary: '#4A154B',
      primaryHover: '#350D36',
      secondary: '#616061',
      accent: '#007A5A',
      background: '#FFFFFF',
      surface: '#F8F8F8',
      text: '#1D1C1D',
      textSecondary: '#616061',
      border: '#DDDDDD',
      sidebar: '#4A154B',
      sidebarText: '#FFFFFF',
      topbar: '#FFFFFF',
      highlight: '#ECE7ED',
    },
  },
  {
    id: 'discord',
    name: 'Discord Style',
    colors: {
      primary: '#5865F2',
      primaryHover: '#4752C4',
      secondary: '#4F545C',
      accent: '#00AFF4',
      background: '#36393F',
      surface: '#2F3136',
      text: '#DCDDDE',
      textSecondary: '#B9BBBE',
      border: '#202225',
      sidebar: '#2F3136',
      sidebarText: '#DCDDDE',
      topbar: '#36393F',
      highlight: '#40444B',
    },
  },
  {
    id: 'spotify',
    name: 'Spotify Style',
    colors: {
      primary: '#1DB954',
      primaryHover: '#1ED760',
      secondary: '#B3B3B3',
      accent: '#1DB954',
      background: '#121212',
      surface: '#181818',
      text: '#FFFFFF',
      textSecondary: '#B3B3B3',
      border: '#282828',
      sidebar: '#000000',
      sidebarText: '#FFFFFF',
      topbar: '#121212',
      highlight: '#1A1A1A',
    },
  },
  {
    id: 'twitter',
    name: 'Twitter Style',
    colors: {
      primary: '#1DA1F2',
      primaryHover: '#1991DA',
      secondary: '#657786',
      accent: '#1DA1F2',
      background: '#FFFFFF',
      surface: '#F7F9FA',
      text: '#14171A',
      textSecondary: '#657786',
      border: '#E1E8ED',
      sidebar: '#FFFFFF',
      sidebarText: '#14171A',
      topbar: '#FFFFFF',
      highlight: '#F7F9FA',
    },
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Style',
    colors: {
      primary: '#0A66C2',
      primaryHover: '#084D94',
      secondary: '#666666',
      accent: '#70B5F9',
      background: '#F3F2EF',
      surface: '#FFFFFF',
      text: '#000000',
      textSecondary: '#666666',
      border: '#E0E0E0',
      sidebar: '#FFFFFF',
      sidebarText: '#000000',
      topbar: '#FFFFFF',
      highlight: '#F5F5F5',
    },
  },
  {
    id: 'youtube',
    name: 'YouTube Style',
    colors: {
      primary: '#FF0000',
      primaryHover: '#CC0000',
      secondary: '#606060',
      accent: '#FF0000',
      background: '#FFFFFF',
      surface: '#F9F9F9',
      text: '#0F0F0F',
      textSecondary: '#606060',
      border: '#E5E5E5',
      sidebar: '#F9F9F9',
      sidebarText: '#0F0F0F',
      topbar: '#FFFFFF',
      highlight: '#F2F2F2',
    },
  },
  {
    id: 'netflix',
    name: 'Netflix Style',
    colors: {
      primary: '#E50914',
      primaryHover: '#B8070F',
      secondary: '#999999',
      accent: '#E50914',
      background: '#000000',
      surface: '#141414',
      text: '#FFFFFF',
      textSecondary: '#999999',
      border: '#333333',
      sidebar: '#141414',
      sidebarText: '#FFFFFF',
      topbar: '#000000',
      highlight: '#1F1F1F',
    },
  },
  {
    id: 'airbnb',
    name: 'Airbnb Style',
    colors: {
      primary: '#FF5A5F',
      primaryHover: '#FF3E43',
      secondary: '#767676',
      accent: '#00A699',
      background: '#FFFFFF',
      surface: '#F7F7F7',
      text: '#484848',
      textSecondary: '#767676',
      border: '#EBEBEB',
      sidebar: '#FFFFFF',
      sidebarText: '#484848',
      topbar: '#FFFFFF',
      highlight: '#F7F7F7',
    },
  },
  {
    id: 'stripe',
    name: 'Stripe Style',
    colors: {
      primary: '#635BFF',
      primaryHover: '#5A51FF',
      secondary: '#6C7E8C',
      accent: '#00D4AA',
      background: '#FFFFFF',
      surface: '#FAFBFC',
      text: '#0A2540',
      textSecondary: '#6C7E8C',
      border: '#E3E8EE',
      sidebar: '#FAFBFC',
      sidebarText: '#0A2540',
      topbar: '#FFFFFF',
      highlight: '#F6F9FC',
    },
  },
  {
    id: 'shopify',
    name: 'Shopify Style',
    colors: {
      primary: '#95BF47',
      primaryHover: '#7BA829',
      secondary: '#6D7175',
      accent: '#95BF47',
      background: '#F6F6F7',
      surface: '#FFFFFF',
      text: '#202223',
      textSecondary: '#6D7175',
      border: '#E1E3E5',
      sidebar: '#FFFFFF',
      sidebarText: '#202223',
      topbar: '#FFFFFF',
      highlight: '#F1F2F3',
    },
  },
];

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeId: string) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0]);

  useEffect(() => {
    // Load theme from localStorage
    const savedThemeId = localStorage.getItem('selectedTheme');
    if (savedThemeId) {
      const savedTheme = themes.find(theme => theme.id === savedThemeId);
      if (savedTheme) {
        setCurrentTheme(savedTheme);
      }
    }
  }, []);

  useEffect(() => {
    // Apply theme colors to CSS variables
    const root = document.documentElement;
    Object.entries(currentTheme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
  }, [currentTheme]);

  const setTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
      localStorage.setItem('selectedTheme', themeId);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}; 