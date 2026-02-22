import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'readPostIds';

function getReadIds(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<number>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export function useReadPosts() {
  const [readIds, setReadIds] = useState<Set<number>>(() => getReadIds());

  const markAsRead = useCallback((id: number) => {
    setReadIds(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      saveReadIds(next);
      return next;
    });
  }, []);

  const isRead = useCallback((id: number) => readIds.has(id), [readIds]);

  const unreadCount = useCallback((postIds: number[]) => {
    return postIds.filter(id => !readIds.has(id)).length;
  }, [readIds]);

  return { readIds, markAsRead, isRead, unreadCount };
}

/**
 * Hook that creates an IntersectionObserver ref callback.
 * When a post card scrolls into view (50%+ visible for 1s), it marks as read.
 */
export function usePostVisibilityTracker(markAsRead: (id: number) => void) {
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const postId = Number(entry.target.getAttribute('data-post-id'));
          if (isNaN(postId)) return;

          if (entry.isIntersecting) {
            // Start a 1s timer — if still visible after 1s, mark as read
            if (!timers.current.has(postId)) {
              const timer = setTimeout(() => {
                markAsRead(postId);
                timers.current.delete(postId);
              }, 1000);
              timers.current.set(postId, timer);
            }
          } else {
            // Scrolled away before 1s — cancel
            const timer = timers.current.get(postId);
            if (timer) {
              clearTimeout(timer);
              timers.current.delete(postId);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    return () => {
      observerRef.current?.disconnect();
      timers.current.forEach(t => clearTimeout(t));
      timers.current.clear();
    };
  }, [markAsRead]);

  /** Attach this ref callback to each PostCard wrapper */
  const observeRef = useCallback((el: HTMLDivElement | null) => {
    if (!el || !observerRef.current) return;
    observerRef.current.observe(el);
  }, []);

  return observeRef;
}
