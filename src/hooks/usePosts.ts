import { useState, useEffect, useCallback, useRef } from 'react';
import type { Post } from '../types/post';
import { fetchLastPosts, fetchPostsPaginated, getCachedPosts } from '../api/posts';

const PAGE_SIZE = 10;

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);
  // Tracks the lowest offset we've fetched — everything below this is "older"
  const oldestOffsetRef = useRef(0);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Show cached posts instantly while fetching fresh data
    const cached = getCachedPosts();
    if (cached && cached.posts.length > 0) {
      setPosts(cached.posts);
      oldestOffsetRef.current = cached.startOffset;
      const more = cached.startOffset > 0;
      setHasMore(more);
      hasMoreRef.current = more;
      setLoading(false);
    }

    try {
      // Single request — no double round-trip
      const { posts: data, startOffset } = await fetchLastPosts(PAGE_SIZE);
      setPosts(data);
      oldestOffsetRef.current = startOffset;
      const more = startOffset > 0;
      setHasMore(more);
      hasMoreRef.current = more;
    } catch {
      // If we have cached data, keep showing it
      if (!cached || cached.posts.length === 0) {
        setPosts([]);
        setHasMore(false);
        hasMoreRef.current = false;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Load older posts (prepend)
  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const newOffset = Math.max(0, oldestOffsetRef.current - PAGE_SIZE);
      const limit = oldestOffsetRef.current - newOffset; // may be < PAGE_SIZE at the top
      if (limit <= 0) {
        hasMoreRef.current = false;
        setHasMore(false);
        return;
      }
      const { posts: data } = await fetchPostsPaginated(limit, newOffset);
      setPosts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newPosts = data.filter(p => !existingIds.has(p.id));
        return [...newPosts, ...prev]; // prepend older posts
      });
      oldestOffsetRef.current = newOffset;
      const more = newOffset > 0;
      setHasMore(more);
      hasMoreRef.current = more;
    } catch {
      // silently fail
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  // Refetch when app becomes visible (e.g. user switches back from Telegram)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadInitial();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [loadInitial]);

  return { posts, loading, loadingMore, error, hasMore, loadMore, refetch: loadInitial };
}
