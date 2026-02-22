import { useState, useEffect } from 'react';
import type { Post } from '../types/post';
import { fetchPosts } from '../api/posts';

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPosts();
      setPosts(data);
    } catch {
      // If API is unavailable (e.g. GH Pages without backend), show empty list
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return { posts, loading, error, refetch: load };
}
