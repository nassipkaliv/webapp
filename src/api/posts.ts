import type { Post, ApiResponse } from '../types/post';

const API_BASE = import.meta.env.VITE_API_URL || 'https://webapp-omhl.onrender.com';

export async function fetchPosts(): Promise<Post[]> {
  const res = await fetch(`${API_BASE}/api/posts`);
  if (!res.ok) throw new Error(`Failed to fetch posts: ${res.status}`);
  const json: ApiResponse<Post[]> = await res.json();
  if (!json.success) throw new Error(json.error || 'Unknown error');
  return json.data!;
}

export async function likePost(id: number): Promise<Post> {
  const res = await fetch(`${API_BASE}/api/posts/${id}/like`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to like post: ${res.status}`);
  const json: ApiResponse<Post> = await res.json();
  return json.data!;
}

export async function unlikePost(id: number): Promise<Post> {
  const res = await fetch(`${API_BASE}/api/posts/${id}/unlike`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to unlike post: ${res.status}`);
  const json: ApiResponse<Post> = await res.json();
  return json.data!;
}

export function getImageUrl(imageUrl: string): string {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${API_BASE}${imageUrl}`;
}
