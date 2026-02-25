import { useEffect } from 'react';

/**
 * Locks page scroll while active. Works on iOS Safari where
 * overflow:hidden on body is not enough.
 */
export function useScrollLock() {
  useEffect(() => {
    // Save current scroll position
    const scrollY = window.scrollY;

    // Lock body
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';

    // Block touchmove on document level (iOS Safari needs { passive: false })
    const preventTouch = (e: TouchEvent) => {
      // Allow scroll inside modal content (elements with overflow-y-auto)
      const target = e.target as HTMLElement;
      if (target.closest('[data-scroll-allow]')) return;
      e.preventDefault();
    };
    document.addEventListener('touchmove', preventTouch, { passive: false });

    return () => {
      document.removeEventListener('touchmove', preventTouch);
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, []);
}
