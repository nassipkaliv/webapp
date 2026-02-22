import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'posts.db');

let db: SqlJsDatabase;

export async function initDb() {
  const SQL = await initSqlJs();

  // Ensure data directory exists
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // Load existing DB or create new one
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      why_title TEXT NOT NULL DEFAULT 'Why Choose Us',
      why_items TEXT NOT NULL DEFAULT '[]',
      image_url TEXT NOT NULL DEFAULT '',
      telegram_link TEXT NOT NULL DEFAULT '',
      whatsapp_link TEXT NOT NULL DEFAULT '',
      instagram_link TEXT NOT NULL DEFAULT '',
      details_text TEXT NOT NULL DEFAULT '',
      like_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  saveDb();
  return db;
}

export function saveDb() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

export function getDb() {
  return db;
}

// --- CRUD helpers ---

export interface PostRow {
  id: number;
  title: string;
  description: string;
  why_title: string;
  why_items: string;
  image_url: string;
  telegram_link: string;
  whatsapp_link: string;
  instagram_link: string;
  details_text: string;
  like_count: number;
  created_at: string;
  updated_at: string;
}

function rowsToObjects(result: initSqlJs.QueryExecResult[]): PostRow[] {
  if (!result.length) return [];
  const { columns, values } = result[0]!;
  return values.map(row => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj as unknown as PostRow;
  });
}

export function getAllPosts(): PostRow[] {
  const result = db.exec('SELECT * FROM posts ORDER BY created_at DESC');
  return rowsToObjects(result);
}

export function getPostById(id: number): PostRow | undefined {
  const stmt = db.prepare('SELECT * FROM posts WHERE id = ?');
  stmt.bind([id]);
  if (!stmt.step()) {
    stmt.free();
    return undefined;
  }
  const obj = stmt.getAsObject() as unknown as PostRow;
  stmt.free();
  return obj;
}

export function createPost(post: {
  title: string;
  description: string;
  whyTitle: string;
  whyItems: string[];
  imageUrl: string;
  telegramLink: string;
  whatsappLink: string;
  instagramLink: string;
  detailsText: string;
}): PostRow | undefined {
  db.run(
    `INSERT INTO posts (title, description, why_title, why_items, image_url,
      telegram_link, whatsapp_link, instagram_link, details_text)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      post.title,
      post.description,
      post.whyTitle,
      JSON.stringify(post.whyItems),
      post.imageUrl,
      post.telegramLink,
      post.whatsappLink,
      post.instagramLink,
      post.detailsText,
    ]
  );
  saveDb();

  // sql.js: get all posts and return the last one (most reliable)
  const allPosts = getAllPosts();
  return allPosts[0]; // sorted DESC by created_at, so first is newest
}

export function updatePost(id: number, fields: Partial<{
  title: string;
  description: string;
  whyTitle: string;
  whyItems: string[];
  imageUrl: string;
  telegramLink: string;
  whatsappLink: string;
  instagramLink: string;
  detailsText: string;
}>): PostRow | undefined {
  const columnMap: Record<string, string> = {
    title: 'title',
    description: 'description',
    whyTitle: 'why_title',
    whyItems: 'why_items',
    imageUrl: 'image_url',
    telegramLink: 'telegram_link',
    whatsappLink: 'whatsapp_link',
    instagramLink: 'instagram_link',
    detailsText: 'details_text',
  };

  const sets: string[] = [];
  const values: (string | number)[] = [];

  for (const [key, value] of Object.entries(fields)) {
    const col = columnMap[key];
    if (col) {
      sets.push(`${col} = ?`);
      values.push(key === 'whyItems' ? JSON.stringify(value) : value as string);
    }
  }

  if (sets.length === 0) return getPostById(id);

  sets.push("updated_at = datetime('now')");
  values.push(id);

  db.run(`UPDATE posts SET ${sets.join(', ')} WHERE id = ?`, values);
  saveDb();
  return getPostById(id);
}

export function deletePost(id: number) {
  db.run('DELETE FROM posts WHERE id = ?', [id]);
  saveDb();
}

export function incrementLike(id: number): PostRow | undefined {
  db.run('UPDATE posts SET like_count = like_count + 1 WHERE id = ?', [id]);
  saveDb();
  return getPostById(id);
}

export function decrementLike(id: number): PostRow | undefined {
  db.run('UPDATE posts SET like_count = CASE WHEN like_count > 0 THEN like_count - 1 ELSE 0 END WHERE id = ?', [id]);
  saveDb();
  return getPostById(id);
}
