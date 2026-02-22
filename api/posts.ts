import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getAllPosts, getPostById, createPost, updatePost, deletePost,
  incrementLike, decrementLike, transformPost,
} from './_db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Parse path: /api/posts, /api/posts/123, /api/posts/123/like, etc.
  const url = new URL(req.url!, `https://${req.headers.host}`);
  const parts = url.pathname.replace('/api/posts', '').split('/').filter(Boolean);
  // parts: [] = list/create, [id] = get/update/delete, [id, 'like'|'unlike'] = like/unlike

  try {
    // GET /api/posts
    if (req.method === 'GET' && parts.length === 0) {
      const posts = await getAllPosts();
      return res.json({ success: true, data: posts.map(transformPost) });
    }

    // GET /api/posts/:id
    if (req.method === 'GET' && parts.length === 1) {
      const post = await getPostById(Number(parts[0]));
      if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
      return res.json({ success: true, data: transformPost(post) });
    }

    // POST /api/posts (create)
    if (req.method === 'POST' && parts.length === 0) {
      const { title, description, whyTitle, whyItems, imageUrl,
        telegramLink, whatsappLink, instagramLink, detailsText } = req.body;
      if (!title || !description) {
        return res.status(400).json({ success: false, error: 'title and description are required' });
      }
      const post = await createPost({
        title, description,
        whyTitle: whyTitle || 'Why Choose Us',
        whyItems: whyItems || [],
        imageUrl: imageUrl || '',
        telegramLink: telegramLink || '',
        whatsappLink: whatsappLink || '',
        instagramLink: instagramLink || '',
        detailsText: detailsText || '',
      });
      if (!post) return res.status(500).json({ success: false, error: 'Failed to create post' });
      return res.status(201).json({ success: true, data: transformPost(post) });
    }

    // POST /api/posts/:id/like
    if (req.method === 'POST' && parts.length === 2 && parts[1] === 'like') {
      const post = await incrementLike(Number(parts[0]));
      if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
      return res.json({ success: true, data: transformPost(post) });
    }

    // POST /api/posts/:id/unlike
    if (req.method === 'POST' && parts.length === 2 && parts[1] === 'unlike') {
      const post = await decrementLike(Number(parts[0]));
      if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
      return res.json({ success: true, data: transformPost(post) });
    }

    // PUT /api/posts/:id
    if (req.method === 'PUT' && parts.length === 1) {
      const existing = await getPostById(Number(parts[0]));
      if (!existing) return res.status(404).json({ success: false, error: 'Post not found' });
      const post = await updatePost(Number(parts[0]), req.body);
      if (!post) return res.status(500).json({ success: false, error: 'Failed to update post' });
      return res.json({ success: true, data: transformPost(post) });
    }

    // DELETE /api/posts/:id
    if (req.method === 'DELETE' && parts.length === 1) {
      const existing = await getPostById(Number(parts[0]));
      if (!existing) return res.status(404).json({ success: false, error: 'Post not found' });
      await deletePost(Number(parts[0]));
      return res.json({ success: true });
    }

    return res.status(404).json({ success: false, error: 'Not found' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
