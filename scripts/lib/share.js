// Post metadata plus the tagged share links, for the repo-root scripts.
//
// The UTM convention itself lives in blog/src/lib/utm.js, shared with the blog
// so the two cannot drift. That file is dependency-free precisely so it can be
// imported here in plain Node as well as through Vite in the Astro build.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

export { CHANNELS, bySource } from '../../blog/src/lib/utm.js';
import { withUtm } from '../../blog/src/lib/utm.js';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const POSTS_DIR = path.join(root, 'blog/src/content/posts');
export const ORIGIN = (process.env.BLOG_ORIGIN || 'https://blog.moi.technology').replace(/\/$/, '');

export function shareUrl(slug, channel, content) {
  return withUtm(`${ORIGIN}/article/${slug}/`, { channel, campaign: slug, content });
}

export function readPost(slug) {
  const file = path.join(POSTS_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const { data } = matter(fs.readFileSync(file, 'utf8'));
  return {
    slug,
    title: data.title,
    summary: data.summary,
    date: data.date,
    tags: data.tags || [],
    draft: !!data.draft,
  };
}

export function readPosts() {
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => readPost(f.replace(/\.md$/, '')))
    .filter((p) => p && !p.draft)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

export const isoDay = (d) => new Date(d).toISOString().slice(0, 10);
