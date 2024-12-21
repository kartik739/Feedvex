# Feedvex Frontend Components Documentation

## Component Library

### Layout Components

#### `Layout`
Main layout wrapper for all pages.

**Props:** None

**Features:**
- Skip to content link for accessibility
- Offline notification
- Header, main content area, and footer
- Responsive layout

**Usage:**
```tsx
<Layout>
  <Outlet /> {/* React Router outlet */}
</Layout>
```

---

#### `Header`
Application header with navigation and theme toggle.

**Features:**
- Logo with gradient text
- Navigation links
- Theme toggle button
- User menu dropdown
- Mobile hamburger menu
- Glassmorphism effect

---

#### `Footer`
Application footer with links and information.

**Features:**
- Gradient background
- Social links
- Copyright information
- Responsive layout

---

### UI Components

#### `LoadingButton`
Button component with loading state.

**Props:**
- `loading?: boolean` - Show loading state
- `loadingText?: string` - Text to show when loading
- `children: ReactNode` - Button content
- All standard button props

**Usage:**
```tsx
<LoadingButton
  loading={isSubmitting}
  loadingText="Saving..."
  onClick={handleSubmit}
>
  Save Changes
</LoadingButton>
```

---

#### `LoadingSpinner`
Animated loading spinner.

**Props:**
- `size?: 'small' | 'medium' | 'large'` - Spinner size
- `color?: string` - Spinner color
- `fullScreen?: boolean` - Show as fullscreen overlay
- `message?: string` - Loading message

**Usage:**
```tsx
<LoadingSpinner size="large" message="Loading data..." />
```

---

#### `LazyImage`
Image component with lazy loading.

**Props:**
- `src: string` - Image source
- `alt: string` - Alt text
- `className?: string` - CSS class
- `placeholder?: string` - Placeholder image
- `width?: number` - Image width
- `height?: number` - Image height

**Features:**
- IntersectionObserver for lazy loading
- Fade-in animation
- Placeholder support

**Usage:**
```tsx
<LazyImage
  src="/images/photo.jpg"
  alt="Description"
  width={800}
  height={600}
/>
```

---

### Error Handling Components

#### `ErrorBoundary`
Catches React errors and displays fallback UI.

**Props:**
- `children: ReactNode` - Components to wrap
- `fallback?: ReactNode` - Custom fallback UI
- `onError?: (error, errorInfo) => void` - Error callback

**Usage:**
```tsx
<ErrorBoundary onError={logError}>
  <App />
</ErrorBoundary>
```

---

#### `OfflineNotification`
Shows notification when offline.

**Features:**
- Automatic detection of online/offline status
- Slide-in animation
- Auto-dismiss when back online
- Accessible with ARIA live region

---

#### `SkipToContent`
Skip link for keyboard navigation.

**Features:**
- Hidden until focused
- Jumps to main content
- Accessible

---

### Search Components

#### `SearchBar`
Search input with autocomplete.

**Features:**
- Glassmorphism design
- Autocomplete dropdown
- Keyboard navigation
- Loading state
- Recent searches

---

#### `SearchResults`
Displays search results.

**Features:**
- Card-based layout
- Stagger animation
- Empty state
- Query term highlighting

---

#### `ResultCard`
Individual search result card.

**Features:**
- Glassmorphism background
- Hover effects
- Metadata display
- Snippet expansion

---

#### `Pagination`
Pagination controls.

**Features:**
- Page numbers
- Previous/Next buttons
- Active page indicator
- Keyboard navigation

---

## Hooks

### `useKeyboardNavigation`
Handle keyboard shortcuts and navigation.

**Options:**
- `onEscape?: () => void`
- `onEnter?: () => void`
- `onArrowUp?: () => void`
- `onArrowDown?: () => void`
- `onArrowLeft?: () => void`
- `onArrowRight?: () => void`
- `onHome?: () => void`
- `onEnd?: () => void`
- `onTab?: (shiftKey: boolean) => void`
- `enabled?: boolean`

**Usage:**
```tsx
useKeyboardNavigation({
  onEscape: closeModal,
  onEnter: submitForm,
  enabled: isModalOpen,
});
```

---

### `useFocusTrap`
Trap focus within a container (for modals).

**Parameters:**
- `containerRef: RefObject<HTMLElement>` - Container element
- `isActive?: boolean` - Enable/disable trap

**Usage:**
```tsx
const modalRef = useRef<HTMLDivElement>(null);
useFocusTrap(modalRef, isOpen);
```

---

### `useNetworkStatus`
Track online/offline status.

**Returns:** `boolean` - Online status

**Usage:**
```tsx
const isOnline = useNetworkStatus();
```

---

### `useOfflineNotification`
Show offline notification.

**Returns:**
- `isOnline: boolean` - Online status
- `showNotification: boolean` - Show notification

---

## Utilities

### Accessibility Utils (`utils/accessibility.ts`)

- `generateId(prefix)` - Generate unique IDs
- `announceToScreenReader(message, priority)` - Announce to screen readers
- `trapFocus(element)` - Trap focus in element
- `getPaginationLabel(current, total)` - Get pagination label
- `getSearchResultsLabel(count, query)` - Get search results label
- `skipToContent()` - Skip to main content
- `handleArrowNavigation(event, items, currentIndex, onSelect)` - Handle arrow key navigation
- `prefersReducedMotion()` - Check if user prefers reduced motion

---

### Network Error Handler (`utils/networkErrorHandler.ts`)

- `parseNetworkError(error)` - Parse and categorize errors
- `retryRequest(requestFn, options)` - Retry with exponential backoff
- `isOnline()` - Check online status
- `onNetworkStatusChange(callback)` - Listen for status changes
- `fetchWithTimeout(url, options)` - Fetch with timeout
- `getUserFriendlyErrorMessage(error)` - Get user-friendly message

---

### Asset Optimization (`utils/assetOptimization.ts`)

- `generateSrcSet(baseUrl, sizes)` - Generate responsive srcset
- `preloadImage(src)` - Preload image
- `supportsWebP()` - Check WebP support
- `getOptimizedImageUrl(baseUrl, width)` - Get optimized URL
- `prefetchResource(url, as)` - Prefetch resource
- `createPlaceholder(width, height, color)` - Create placeholder

---

## Styling

### Design Tokens (`styles/tokens.css`)

All design tokens are defined as CSS variables:

**Colors:**
- `--color-primary`, `--color-secondary`, `--color-accent`
- `--color-success`, `--color-warning`, `--color-error`
- `--color-bg-primary`, `--color-bg-secondary`, `--color-bg-tertiary`
- `--color-text-primary`, `--color-text-secondary`, `--color-text-tertiary`

**Spacing:**
- `--space-1` through `--space-32` (4px to 128px)

**Typography:**
- `--font-size-xs` through `--font-size-6xl`
- `--font-weight-normal`, `--font-weight-medium`, `--font-weight-semibold`, `--font-weight-bold`

**Effects:**
- `--shadow-sm` through `--shadow-2xl`
- `--glow-primary`, `--glow-secondary`, `--glow-accent`
- `--gradient-hero`, `--gradient-card`, `--gradient-button`

---

### Utility Classes (`styles/utilities.css`)

**Layout:**
- `.container`, `.container-sm`, `.container-md`, `.container-lg`
- `.flex`, `.flex-col`, `.grid`, `.grid-cols-{1-4}`
- `.items-center`, `.justify-center`, `.gap-{1-8}`

**Spacing:**
- `.m-{0-8}`, `.mt-{0-8}`, `.mb-{0-8}`, `.p-{0-8}`

**Typography:**
- `.text-{xs-3xl}`, `.font-{normal-bold}`, `.text-{center-left-right}`

**Effects:**
- `.glass`, `.glass-card`, `.gradient-text`
- `.hover-lift`, `.hover-scale`, `.hover-glow`
- `.fade-in`, `.slide-in-up`, `.pulse`, `.shimmer`

---

### Responsive Classes (`styles/responsive.css`)

**Visibility:**
- `.mobile-only`, `.tablet-only`, `.desktop-only`
- `.mobile-hidden`

**Layout:**
- `.mobile-stack`, `.flex-mobile-col`
- `.text-mobile-center`

**Breakpoints:**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

---

## Testing

### Component Tests

Tests are located in `__tests__` folders next to components.

**Example:**
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import LoadingButton from '../LoadingButton';

describe('LoadingButton', () => {
  it('renders button with children', () => {
    render(<LoadingButton>Click me</LoadingButton>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

### Running Tests

```bash
npm test              # Run all tests
npm run test:ui       # Run with UI
npm run test:coverage # Generate coverage
```

---

## Best Practices

### Accessibility
- Always provide alt text for images
- Use semantic HTML elements
- Include ARIA labels for interactive elements
- Ensure keyboard navigation works
- Test with screen readers

### Performance
- Use lazy loading for images and routes
- Implement code splitting
- Minimize bundle size
- Use React.memo for expensive components
- Avoid unnecessary re-renders

### Styling
- Use CSS variables for consistency
- Follow mobile-first approach
- Use utility classes when appropriate
- Keep component styles scoped
- Support dark mode

### Error Handling
- Wrap components with ErrorBoundary
- Handle network errors gracefully
- Show loading states
- Provide user-friendly error messages
- Log errors for debugging
