import { getAllPosts, getDb, saveDb } from './db.js';

interface BoostRecord {
  post_id: number;
  target_likes: number;
  boosted_likes: number;
  start_time: string;
  end_time: string;
}

const BOOST_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MIN_TARGET = 500;
const MAX_TARGET = 1100;
const TICK_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes

export function initLikeBoost() {
  const db = getDb();

  db.run(`
    CREATE TABLE IF NOT EXISTS like_boosts (
      post_id INTEGER PRIMARY KEY,
      target_likes INTEGER NOT NULL,
      boosted_likes INTEGER NOT NULL DEFAULT 0,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL
    )
  `);
  saveDb();

  // Run immediately, then on interval
  tickBoost();
  setInterval(tickBoost, TICK_INTERVAL_MS);
  console.log('Like boost system started (5-min interval)');
}

function getBoostRecords(): BoostRecord[] {
  const db = getDb();
  const result = db.exec('SELECT * FROM like_boosts');
  if (!result.length) return [];
  const { columns, values } = result[0]!;
  return values.map(row => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj as unknown as BoostRecord;
  });
}

function tickBoost() {
  const db = getDb();
  const now = Date.now();

  // Auto-register new posts that don't have a boost record yet
  const posts = getAllPosts();
  const existingBoosts = new Set(getBoostRecords().map(b => b.post_id));

  for (const post of posts) {
    if (!existingBoosts.has(post.id)) {
      const target = MIN_TARGET + Math.floor(Math.random() * (MAX_TARGET - MIN_TARGET + 1));
      const startTime = new Date(post.created_at).getTime() || now;
      const endTime = startTime + BOOST_DURATION_MS;
      db.run(
        'INSERT INTO like_boosts (post_id, target_likes, boosted_likes, start_time, end_time) VALUES (?, ?, 0, ?, ?)',
        [post.id, target, new Date(startTime).toISOString(), new Date(endTime).toISOString()]
      );
    }
  }

  // Process active boosts
  const boosts = getBoostRecords();
  let changed = false;

  for (const boost of boosts) {
    const remaining = boost.target_likes - boost.boosted_likes;
    if (remaining <= 0) continue;

    const endTime = new Date(boost.end_time).getTime();
    const startTime = new Date(boost.start_time).getTime();

    if (now >= endTime) {
      // Past deadline — add all remaining at once
      db.run('UPDATE posts SET like_count = like_count + ? WHERE id = ?', [remaining, boost.post_id]);
      db.run('UPDATE like_boosts SET boosted_likes = target_likes WHERE post_id = ?', [boost.post_id]);
      changed = true;
      continue;
    }

    // Calculate expected progress based on elapsed time
    const elapsed = now - startTime;
    const totalDuration = endTime - startTime;
    const progress = Math.min(elapsed / totalDuration, 1);
    const expectedBoosted = Math.floor(boost.target_likes * progress);
    const toAdd = expectedBoosted - boost.boosted_likes;

    if (toAdd <= 0) continue;

    // Add some randomness: ±30% of the calculated increment
    const jitter = Math.max(1, Math.round(toAdd * (0.7 + Math.random() * 0.6)));
    const actualAdd = Math.min(jitter, remaining);

    db.run('UPDATE posts SET like_count = like_count + ? WHERE id = ?', [actualAdd, boost.post_id]);
    db.run('UPDATE like_boosts SET boosted_likes = boosted_likes + ? WHERE post_id = ?', [actualAdd, boost.post_id]);
    changed = true;
  }

  if (changed) {
    saveDb();
  }
}
