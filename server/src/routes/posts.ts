import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getAllPosts, getPostById, createPost, updatePost, deletePost,
  incrementLike, decrementLike, type PostRow,
} from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

// Multer for image uploads
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads'),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `post-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    cb(null, extOk && mimeOk);
  },
});

// Transform DB row (snake_case) → API response (camelCase)
function transformPost(row: PostRow) {
  return {
    id: row.id,
    description: row.description,
    detailsText: row.details_text,
    imageUrl: row.image_url,
    likeCount: row.like_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET /api/posts
router.get('/', (_req: Request, res: Response) => {
  const posts = getAllPosts();
  res.json({ success: true, data: posts.map(transformPost) });
});

// GET /api/posts/:id
router.get('/:id', (req: Request, res: Response) => {
  const post = getPostById(Number(req.params.id));
  if (!post) {
    res.status(404).json({ success: false, error: 'Post not found' });
    return;
  }
  res.json({ success: true, data: transformPost(post) });
});

// POST /api/posts
router.post('/', (req: Request, res: Response) => {
  const { description, imageUrl } = req.body;

  if (!description) {
    res.status(400).json({ success: false, error: 'description is required' });
    return;
  }

  const post = createPost({
    description,
    imageUrl: imageUrl || '',
  });

  if (!post) {
    res.status(500).json({ success: false, error: 'Failed to create post' });
    return;
  }

  res.status(201).json({ success: true, data: transformPost(post) });
});

// PUT /api/posts/:id
router.put('/:id', (req: Request, res: Response) => {
  const existing = getPostById(Number(req.params.id));
  if (!existing) {
    res.status(404).json({ success: false, error: 'Post not found' });
    return;
  }
  const post = updatePost(Number(req.params.id), req.body);
  if (!post) {
    res.status(500).json({ success: false, error: 'Failed to update post' });
    return;
  }
  res.json({ success: true, data: transformPost(post) });
});

// DELETE /api/posts/:id
router.delete('/:id', (req: Request, res: Response) => {
  const existing = getPostById(Number(req.params.id));
  if (!existing) {
    res.status(404).json({ success: false, error: 'Post not found' });
    return;
  }
  deletePost(Number(req.params.id));
  res.json({ success: true });
});

// POST /api/posts/:id/like
router.post('/:id/like', (req: Request, res: Response) => {
  const post = incrementLike(Number(req.params.id));
  if (!post) {
    res.status(404).json({ success: false, error: 'Post not found' });
    return;
  }
  res.json({ success: true, data: transformPost(post) });
});

// POST /api/posts/:id/unlike
router.post('/:id/unlike', (req: Request, res: Response) => {
  const post = decrementLike(Number(req.params.id));
  if (!post) {
    res.status(404).json({ success: false, error: 'Post not found' });
    return;
  }
  res.json({ success: true, data: transformPost(post) });
});

// POST /api/upload
router.post('/upload', upload.single('image'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No image uploaded' });
    return;
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, data: { imageUrl } });
});

export default router;
