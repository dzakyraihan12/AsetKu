'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * iOS PWA Viewport Manager
 * 
 * Handles:
 * - Dynamic viewport height (keyboard open/close)
 * - Visual Viewport API for accurate measurements
 * - Safe area insets
 * - Orientation changes
 * - PWA standalone quirks
 * 
 * Sets CSS variable --app-height on :root for stable layout.
 */
export function useViewport() {
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const initialHeight = useRef<number>(0);
  const rafId = useRef<number>(0);
  const resizeTimeout = useRef<ReturnType<typeof setTimeout>>();

  const updateHeight = useCallback(() => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }

    rafId.current = requestAnimationFrame(() => {
      const vv = window.visualViewport;
      let height: number;

      if (vv) {
        // Use Visual Viewport API - most accurate on iOS
        height = vv.height;
      } else {
        // Fallback: window.innerHeight
        height = window.innerHeight;
      }

      // Store initial height (full viewport without keyboard)
      if (initialHeight.current === 0 || height > initialHeight.current) {
        initialHeight.current = height;
      }

      // Detect keyboard: if current height is significantly less than initial
      const heightDiff = initialHeight.current - height;
      const isKeyboard = heightDiff > 100; // 100px threshold for keyboard detection

      setKeyboardOpen(isKeyboard);

      if (isKeyboard) {
        // When keyboard is open, use the visual viewport height
        document.documentElement.style.setProperty('--app-height', `${height}px`);
        document.documentElement.style.setProperty('--keyboard-offset', `${heightDiff}px`);
      } else {
        // When keyboard is closed, use the full stable height
        // Use the larger of current innerHeight and stored initial height
        // This prevents the "gap at bottom" issue after keyboard close
        const stableHeight = Math.max(height, initialHeight.current);
        document.documentElement.style.setProperty('--app-height', `${stableHeight}px`);
        document.documentElement.style.setProperty('--keyboard-offset', '0px');

        // Update initial height reference
        initialHeight.current = stableHeight;
      }
    });
  }, []);

  const handleResize = useCallback(() => {
    // Debounce resize to prevent rapid updates
    if (resizeTimeout.current) {
      clearTimeout(resizeTimeout.current);
    }
    resizeTimeout.current = setTimeout(updateHeight, 50);
  }, [updateHeight]);

  const handleFocusIn = useCallback((e: FocusEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    ) {
      // Small delay to let iOS finish showing keyboard
      setTimeout(updateHeight, 300);
    }
  }, [updateHeight]);

  const handleFocusOut = useCallback(() => {
    // Delay to let iOS finish hiding keyboard
    setTimeout(() => {
      updateHeight();
      // Force a second update for iOS Safari's delayed viewport restore
      setTimeout(updateHeight, 150);
    }, 100);
  }, [updateHeight]);

  const handleOrientationChange = useCallback(() => {
    // Reset initial height on orientation change
    initialHeight.current = 0;
    setTimeout(updateHeight, 200);
  }, [updateHeight]);

  useEffect(() => {
    // Initial measurement
    updateHeight();

    // Visual Viewport API (best for iOS)
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', updateHeight);
      vv.addEventListener('scroll', updateHeight);
    }

    // Fallback: window resize
    window.addEventListener('resize', handleResize);

    // Focus events for keyboard detection
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    // Orientation change
    window.addEventListener('orientationchange', handleOrientationChange);

    // Handle page visibility (returning from another app)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        initialHeight.current = 0;
        setTimeout(updateHeight, 100);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (vv) {
        vv.removeEventListener('resize', updateHeight);
        vv.removeEventListener('scroll', updateHeight);
      }
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      window.removeEventListener('orientationchange', handleOrientationChange);
      document.removeEventListener('visibilitychange', handleVisibility);

      if (rafId.current) cancelAnimationFrame(rafId.current);
      if (resizeTimeout.current) clearTimeout(resizeTimeout.current);
    };
  }, [updateHeight, handleResize, handleFocusIn, handleFocusOut, handleOrientationChange]);

  return { keyboardOpen };
}
