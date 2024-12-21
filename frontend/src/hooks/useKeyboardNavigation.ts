import { useEffect, useCallback, useRef } from 'react';

interface KeyboardNavigationOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onHome?: () => void;
  onEnd?: () => void;
  onTab?: (shiftKey: boolean) => void;
  enabled?: boolean;
}

/**
 * Hook for handling keyboard navigation
 */
export function useKeyboardNavigation(options: KeyboardNavigationOptions) {
  const {
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onHome,
    onEnd,
    onTab,
    enabled = true,
  } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;
        case 'Enter':
          if (onEnter) {
            event.preventDefault();
            onEnter();
          }
          break;
        case 'ArrowUp':
          if (onArrowUp) {
            event.preventDefault();
            onArrowUp();
          }
          break;
        case 'ArrowDown':
          if (onArrowDown) {
            event.preventDefault();
            onArrowDown();
          }
          break;
        case 'ArrowLeft':
          if (onArrowLeft) {
            event.preventDefault();
            onArrowLeft();
          }
          break;
        case 'ArrowRight':
          if (onArrowRight) {
            event.preventDefault();
            onArrowRight();
          }
          break;
        case 'Home':
          if (onHome) {
            event.preventDefault();
            onHome();
          }
          break;
        case 'End':
          if (onEnd) {
            event.preventDefault();
            onEnd();
          }
          break;
        case 'Tab':
          if (onTab) {
            onTab(event.shiftKey);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onHome, onEnd, onTab]);
}

/**
 * Hook for managing focus trap (for modals, dialogs)
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>, isActive: boolean = true) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element on mount
    firstElement?.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    return () => container.removeEventListener('keydown', handleTabKey);
  }, [containerRef, isActive]);
}

/**
 * Hook for list navigation with arrow keys
 */
export function useListNavigation<T extends HTMLElement>(
  itemsRef: React.RefObject<T[]>,
  onSelect?: (index: number) => void
) {
  const currentIndexRef = useRef(0);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!itemsRef.current) return;

      const items = itemsRef.current;
      let newIndex = currentIndexRef.current;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          newIndex = Math.min(currentIndexRef.current + 1, items.length - 1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          newIndex = Math.max(currentIndexRef.current - 1, 0);
          break;
        case 'Home':
          event.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          newIndex = items.length - 1;
          break;
        case 'Enter':
          event.preventDefault();
          if (onSelect) onSelect(currentIndexRef.current);
          return;
        default:
          return;
      }

      currentIndexRef.current = newIndex;
      items[newIndex]?.focus();
    },
    [itemsRef, onSelect]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return currentIndexRef;
}

/**
 * Hook for keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Build shortcut key (e.g., "ctrl+k", "cmd+shift+p")
      const parts: string[] = [];
      if (event.ctrlKey || event.metaKey) parts.push(event.ctrlKey ? 'ctrl' : 'cmd');
      if (event.shiftKey) parts.push('shift');
      if (event.altKey) parts.push('alt');
      parts.push(event.key.toLowerCase());

      const shortcutKey = parts.join('+');

      if (shortcuts[shortcutKey]) {
        event.preventDefault();
        shortcuts[shortcutKey]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}

/**
 * Hook for roving tabindex (for toolbars, menus)
 */
export function useRovingTabIndex(
  itemsRef: React.RefObject<HTMLElement[]>,
  orientation: 'horizontal' | 'vertical' = 'horizontal'
) {
  const currentIndexRef = useRef(0);

  useEffect(() => {
    if (!itemsRef.current) return;

    const items = itemsRef.current;

    // Set initial tabindex
    items.forEach((item, index) => {
      item.setAttribute('tabindex', index === 0 ? '0' : '-1');
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const currentIndex = items.indexOf(target);
      if (currentIndex === -1) return;

      let newIndex = currentIndex;
      const isHorizontal = orientation === 'horizontal';

      switch (event.key) {
        case isHorizontal ? 'ArrowRight' : 'ArrowDown':
          event.preventDefault();
          newIndex = (currentIndex + 1) % items.length;
          break;
        case isHorizontal ? 'ArrowLeft' : 'ArrowUp':
          event.preventDefault();
          newIndex = (currentIndex - 1 + items.length) % items.length;
          break;
        case 'Home':
          event.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          newIndex = items.length - 1;
          break;
        default:
          return;
      }

      // Update tabindex
      items[currentIndex].setAttribute('tabindex', '-1');
      items[newIndex].setAttribute('tabindex', '0');
      items[newIndex].focus();
      currentIndexRef.current = newIndex;
    };

    items.forEach((item) => item.addEventListener('keydown', handleKeyDown));
    return () => items.forEach((item) => item.removeEventListener('keydown', handleKeyDown));
  }, [itemsRef, orientation]);

  return currentIndexRef;
}
