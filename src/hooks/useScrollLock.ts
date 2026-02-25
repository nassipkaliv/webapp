import { useEffect, useRef } from 'react';

/**
 * Blocks background scroll while modal is open on iOS Safari.
 * Temporarily removes data-scroll-allow from elements OUTSIDE
 * the modal so the global touchmove blocker catches them.
 * Pass a ref to the modal container to exclude it.
 */
export function useScrollLock(modalRef: React.RefObject<HTMLElement | null>) {
  const blockedEls = useRef<Element[]>([]);

  useEffect(() => {
    const all = document.querySelectorAll('[data-scroll-allow]');
    const modal = modalRef.current;

    all.forEach(el => {
      // Don't block scroll inside the modal itself
      if (modal && modal.contains(el)) return;
      el.setAttribute('data-scroll-blocked', '');
      el.removeAttribute('data-scroll-allow');
      blockedEls.current.push(el);
    });

    return () => {
      blockedEls.current.forEach(el => {
        el.setAttribute('data-scroll-allow', '');
        el.removeAttribute('data-scroll-blocked');
      });
      blockedEls.current = [];
    };
  }, [modalRef]);
}
