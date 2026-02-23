import { useState, useEffect, useCallback, useRef } from 'react';
import type { Post } from '../types/post';
import { fetchPostsPaginated } from '../api/posts';

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
    try {
      // First fetch to get total count, then load the last PAGE_SIZE posts
      const { total } = await fetchPostsPaginated(1, 0);
      const startOffset = Math.max(0, total - PAGE_SIZE);
      const { posts: data } = await fetchPostsPaginated(PAGE_SIZE, startOffset);
      setPosts(data);
      oldestOffsetRef.current = startOffset;
      const more = startOffset > 0;
      setHasMore(more);
      hasMoreRef.current = more;
    } catch {
      setPosts([]);
      setHasMore(false);
      hasMoreRef.current = false;
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

  return { posts, loading, loadingMore, error, hasMore, loadMore, refetch: loadInitial };
}
