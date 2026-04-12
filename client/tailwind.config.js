/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Theme-aware custom colors using CSS variables
        'theme-primary': 'var(--color-primary)',
        'theme-primaryHover': 'var(--color-primaryHover)',
        'theme-secondary': 'var(--color-secondary)',
        'theme-accent': 'var(--color-accent)',
        'theme-background': 'var(--color-background)',
        'theme-surface': 'var(--color-surface)',
        'theme-text': 'var(--color-text)',
        'theme-textSecondary': 'var(--color-textSecondary)',
        'theme-border': 'var(--color-border)',
        'theme-sidebar': 'var(--color-sidebar)',
        'theme-sidebarText': 'var(--color-sidebarText)',
        'theme-topbar': 'var(--color-topbar)',
        'theme-highlight': 'var(--color-highlight)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 