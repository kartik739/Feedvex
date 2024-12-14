# FeedVex Design System

A modern, visually stunning design system with glassmorphism effects, gradients, and smooth animations.

## Structure

- **tokens.css** - Design tokens (colors, spacing, typography, shadows, etc.)
- **reset.css** - Modern CSS reset for consistent cross-browser styling
- **base.css** - Base typography and element styles
- **utilities.css** - Utility classes for rapid development
- **index.css** - Main entry point that imports all styles

## Usage

### Design Tokens

All design tokens are available as CSS custom properties (variables):

```css
/* Colors */
var(--color-primary)
var(--color-secondary)
var(--color-accent)

/* Spacing */
var(--space-1) /* 4px */
var(--space-4) /* 16px */
var(--space-8) /* 32px */

/* Typography */
var(--font-size-base)
var(--font-weight-bold)

/* Shadows */
var(--shadow-md)
var(--shadow-xl)

/* Transitions */
var(--transition-fast)
var(--transition-normal)
```

### Theme Support

The design system supports light and dark themes with automatic system preference detection:

```tsx
import { useTheme } from '../contexts/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  );
}
```

Themes are automatically applied via the `data-theme` attribute on the root element.

### Utility Classes

Use utility classes for rapid development:

```html
<!-- Layout -->
<div class="flex items-center justify-between gap-4">
  
<!-- Glassmorphism -->
<div class="glass-card">
  
<!-- Gradients -->
<h1 class="gradient-text">
  
<!-- Animations -->
<div class="hover-lift transition-fast">
```

### Glassmorphism

Apply glassmorphism effects easily:

```html
<div class="glass">
  <!-- Glassmorphism background with backdrop blur -->
</div>

<div class="glass-card">
  <!-- Pre-styled glassmorphism card -->
</div>
```

### Gradients

Use predefined gradients:

```css
.my-element {
  background: var(--gradient-hero);
  background: var(--gradient-primary);
  background: var(--gradient-button);
}
```

Or use utility classes:

```html
<div class="gradient-bg-hero">
<h1 class="gradient-text">
```

### Responsive Design

Breakpoints:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

Use responsive utilities:

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

### Animations

Built-in animations:

```html
<div class="fade-in">
<div class="slide-in-up">
<div class="pulse">
<div class="shimmer"> <!-- For skeleton loaders -->
```

Hover effects:

```html
<div class="hover-lift">
<div class="hover-scale">
<div class="hover-glow">
```

## Color Palette

### Primary Colors
- Primary: `#6366f1` (Indigo)
- Secondary: `#8b5cf6` (Purple)
- Accent: `#ec4899` (Pink)

### Status Colors
- Success: `#10b981` (Green)
- Warning: `#f59e0b` (Amber)
- Error: `#ef4444` (Red)

### Light Mode
- Background: `#ffffff`, `#f9fafb`, `#f3f4f6`
- Text: `#111827`, `#374151`, `#6b7280`

### Dark Mode
- Background: `#0f172a`, `#1e293b`, `#334155`
- Text: `#f1f5f9`, `#cbd5e1`, `#94a3b8`

## Typography

- Font Family: Inter, system-ui, sans-serif
- Code Font: JetBrains Mono, monospace
- Font Sizes: xs (12px) to 6xl (60px)
- Font Weights: 400, 500, 600, 700

## Best Practices

1. **Use design tokens** instead of hardcoded values
2. **Leverage utility classes** for common patterns
3. **Apply transitions** for smooth interactions
4. **Use glassmorphism** for modern card designs
5. **Test in both themes** (light and dark)
6. **Ensure accessibility** with proper contrast and focus states
7. **Use responsive utilities** for mobile-first design

## Examples

### Glassmorphism Card

```html
<div class="glass-card hover-lift">
  <h3 class="gradient-text">Card Title</h3>
  <p class="text-secondary">Card content</p>
</div>
```

### Button with Gradient

```css
.btn-primary {
  background: var(--gradient-button);
  color: white;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  transition: var(--transition-fast);
}

.btn-primary:hover {
  transform: scale(1.05);
  box-shadow: var(--glow-primary);
}
```

### Responsive Grid

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div class="glass-card">Item 1</div>
  <div class="glass-card">Item 2</div>
  <div class="glass-card">Item 3</div>
</div>
```
