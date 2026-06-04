'use client';

import { useEffect, useRef } from 'react';

/**
 * iOS PWA Viewport Manager (2025-2026 Best Practice)
 * 
 * Solves:
 * 1. Dynamic viewport height inconsistency on iOS Safari
 * 2. Keyboard appearing/disappearing causing layout jump
 * 3. PWA standalone mode height issues
 * 4. Post-keyboard ghost gap at bottom
 * 
 * Strategy:
 * - Uses visualViewport API to get TRUE visible area
 * - Updates CSS custom property --app-height in real-time
 * - Detects keyboard open/close state
 * - Forces layout recalculation after keyboard dismiss
 */
export function useViewport() {
  const isKeyboardOpen = useRef(false);
  const previousHeight = useRef(0);

  useEffect(() => {
    // Skip on SSR
    if (typeof window === 'undefined') return;

    const root = document.documentElement;

    function updateViewportHeight() {
      // Use visualViewport if available (all modern iOS browsers support this)
      const vv = window.visualViewport;
      let height: number;

      if (vv) {
        height = vv.height;
      } else {
        // Fallback: use innerHeight
        height = window.innerHeight;
      }

      // Detect keyboard state
      const windowHeight = window.screen.height;
      const heightDiff = windowHeight - height;
      const keyboardThreshold = windowHeight * 0.25; // If >25% of screen is missing, keyboard is likely open
      
      const wasKeyboardOpen = isKeyboardOpen.current;
      isKeyboardOpen.current = heightDiff > keyboardThreshold;

      // Only update --app-height when keyboard is NOT open
      // This prevents the app container from shrinking when keyboard appears
      if (!isKeyboardOpen.current) {
        root.style.setProperty('--app-height', `${height}px`);
        previousHeight.current = height;
      }

      // When keyboard just closed, force a proper height restoration
      if (wasKeyboardOpen && !isKeyboardOpen.current) {
        // Small delay to let iOS finish its animation
        setTimeout(() => {
          const currentHeight = vv ? vv.height : window.innerHeight;
          root.style.setProperty('--app-height', `${currentHeight}px`);
          previousHeight.current = currentHeight;
          // Force repaint
          document.body.style.display = 'none';
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          document.body.offsetHeight;
          document.body.style.display = '';
        }, 100);
      }

      // Update keyboard offset for elements that need to know
      if (isKeyboardOpen.current && previousHeight.current > 0) {
        const keyboardHeight = previousHeight.current - height;
        root.style.setProperty('--keyboard-offset', `${keyboardHeight}px`);
      } else {
        root.style.setProperty('--keyboard-offset', '0px');
      }
    }

    // Initial measurement
    updateViewportHeight();

    // Also set on first load after a small delay (iOS sometimes reports wrong height initially)
    const initTimer = setTimeout(updateViewportHeight, 100);
    const secondTimer = setTimeout(updateViewportHeight, 300);

    // Listen to visualViewport resize (fires when keyboard opens/closes, orientation changes)
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', updateViewportHeight);
      vv.addEventListener('scroll', updateViewportHeight);
    }

    // Fallback resize listener
    window.addEventListener('resize', updateViewportHeight);

    // Listen for orientation change
    window.addEventListener('orientationchange', () => {
      // iOS needs time to settle after orientation change
      setTimeout(updateViewportHeight, 100);
      setTimeout(updateViewportHeight, 300);
      setTimeout(updateViewportHeight, 500);
    });

    // Handle focus/blur on inputs to detect keyboard
    function handleFocusIn(e: FocusEvent) {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        // Mark that keyboard should be opening
        setTimeout(() => {
          if (vv) {
            // If height shrunk significantly, keyboard is open
            if (vv.height < previousHeight.current * 0.75) {
              isKeyboardOpen.current = true;
              root.style.setProperty('--keyboard-offset', `${previousHeight.current - vv.height}px`);
            }
          }
        }, 300);
      }
    }

    function handleFocusOut() {
      // Keyboard might be closing
      setTimeout(() => {
        updateViewportHeight();
      }, 100);
      setTimeout(() => {
        updateViewportHeight();
      }, 350);
    }

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      clearTimeout(initTimer);
      clearTimeout(secondTimer);
      if (vv) {
        vv.removeEventListener('resize', updateViewportHeight);
        vv.removeEventListener('scroll', updateViewportHeight);
      }
      window.removeEventListener('resize', updateViewportHeight);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);
}
