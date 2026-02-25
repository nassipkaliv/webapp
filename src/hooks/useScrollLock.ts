import { useEffect } from 'react';

/**
 * Blocks scroll in data-scroll-allow containers while modal is open.
 * Global page scroll is already blocked by main.tsx touchmove handler.
 */
export function useScrollLock() {
  useEffect(() => {
    // Temporarily remove data-scroll-allow from all elements
    // so the global touchmove blocker catches everything
    const scrollables = document.querySelectorAll('[data-scroll-allow]');
    scrollables.forEach(el => el.setAttribute('data-scroll-blocked', ''));
    scrollables.forEach(el => el.removeAttribute('data-scroll-allow'));

    return () => {
      const blocked = document.querySelectorAll('[data-scroll-blocked]');
      blocked.forEach(el => el.setAttribute('data-scroll-allow', ''));
      blocked.forEach(el => el.removeAttribute('data-scroll-blocked'));
    };
  }, []);
}
