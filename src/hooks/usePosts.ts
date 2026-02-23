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
  const offsetRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    offsetRef.current = 0;
    try {
      const { posts: data, total } = await fetchPostsPaginated(PAGE_SIZE, 0);
      setPosts(data);
      offsetRef.current = data.length;
      const more = data.length < total;
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

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const { posts: data, total } = await fetchPostsPaginated(PAGE_SIZE, offsetRef.current);
      setPosts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newPosts = data.filter(p => !existingIds.has(p.id));
        return [...prev, ...newPosts];
      });
      offsetRef.current += data.length;
      const more = offsetRef.current < total;
      setHasMore(more);
      hasMoreRef.current = more;
    } catch {
      // silently fail on load more
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  return { posts, loading, loadingMore, error, hasMore, loadMore, refetch: loadInitial };
}
