# Theme System Documentation

## Overview

Your web application now supports **18 different themes** including the requested light orange, light green, light blue, dark mode, and 14 additional popular website themes inspired by major platforms.

## Available Themes

### Requested Themes
- **Light Blue** - Clean and professional blue theme
- **Light Orange** - Warm orange color scheme
- **Light Green** - Fresh green palette
- **Dark Mode** - High contrast dark theme

### Popular Website Themes
- **Purple Haze** - Creative purple gradient
- **Rose Gold** - Elegant pink/rose theme
- **GitHub Style** - Clean development-focused theme
- **Notion Style** - Minimalist productivity theme
- **Slack Style** - Professional communication theme
- **Discord Style** - Gaming/community focused dark theme
- **Spotify Style** - Music streaming inspired theme
- **Twitter Style** - Social media blue theme
- **LinkedIn Style** - Professional networking theme
- **YouTube Style** - Video platform inspired theme
- **Netflix Style** - Entertainment streaming dark theme
- **Airbnb Style** - Travel/hospitality themed
- **Stripe Style** - Payment/fintech inspired theme
- **Shopify Style** - E-commerce platform theme

## How to Use

### Changing Themes
1. Navigate to **Settings** page
2. In the **Appearance** section, use the theme dropdown
3. Click **"Show Theme Previews"** to see visual previews of all themes
4. Click on any theme preview or select from dropdown to apply instantly
5. Your theme preference is automatically saved to localStorage

### Theme Persistence
- Your selected theme is automatically saved and will be restored when you reload the page
- Themes persist across browser sessions

## Technical Implementation

### CSS Variables
Each theme uses CSS variables for consistent styling:
```css
--color-primary: Primary brand color
--color-primaryHover: Primary color hover state
--color-secondary: Secondary color
--color-accent: Accent color for highlights
--color-background: Main background color
--color-surface: Card/surface backgrounds
--color-text: Primary text color
--color-textSecondary: Secondary text color
--color-border: Border colors
--color-sidebar: Sidebar background
--color-sidebarText: Sidebar text color
--color-topbar: Top navigation background
--color-highlight: Highlight/selected states
```

### Tailwind CSS Classes
Custom Tailwind classes are available:
```css
.btn-primary - Theme-aware primary button
.btn-secondary - Theme-aware secondary button
.form-input - Theme-aware form inputs
.form-label - Theme-aware form labels
.text-primary - Primary theme color
.bg-surface - Surface background color
.border-theme - Theme border color
```

### React Components
- `<ThemeProvider>` - Wraps the entire app to provide theme context
- `<ThemeSelector>` - Dropdown + preview component for theme selection
- `<ThemePreview>` - Individual theme preview cards
- `useTheme()` - Hook to access current theme and switching functionality

## Adding New Themes

To add a new theme, edit `client/src/contexts/ThemeContext.tsx` and add to the `themes` array:

```typescript
{
  id: 'your-theme-id',
  name: 'Your Theme Name',
  colors: {
    primary: '#HEX_COLOR',
    primaryHover: '#HEX_COLOR',
    secondary: '#HEX_COLOR',
    accent: '#HEX_COLOR',
    background: '#HEX_COLOR',
    surface: '#HEX_COLOR',
    text: '#HEX_COLOR',
    textSecondary: '#HEX_COLOR',
    border: '#HEX_COLOR',
    sidebar: '#HEX_COLOR',
    sidebarText: '#HEX_COLOR',
    topbar: '#HEX_COLOR',
    highlight: '#HEX_COLOR',
  },
}
```

## Browser Support

The theme system works in all modern browsers that support:
- CSS Custom Properties (CSS Variables)
- React 18+
- ES6+ JavaScript

## Performance

- Themes are applied via CSS variables for instant switching
- No page reload required
- Minimal performance impact
- Theme data is cached in localStorage 