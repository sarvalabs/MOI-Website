// The UTM convention, in one place.
//
// Both share-links.js (manual) and distribute.js (CI) build links from here, so
// the convention cannot drift between the two. GA4 treats `linkedin` and
// `LinkedIn` as different channels, so the casing below is the contract.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const POSTS_DIR = path.join(root, 'blog/src/content/posts');
export const ORIGIN = (process.env.BLOG_ORIGIN || 'https://blog.moi.technology').replace(/\/$/, '');

// utm_medium is a property of the channel, not a per-post choice.
export const CHANNELS = [
  { source: 'x', medium: 'social', label: 'X' },
  { source: 'linkedin', medium: 'social', label: 'LinkedIn' },
  { source: 'discord', medium: 'community', label: 'Discord' },
  { source: 'telegram', medium: 'community', label: 'Telegram' },
  { source: 'newsletter', medium: 'email', label: 'Newsletter' },
  { source: 'devto', medium: 'syndication', label: 'dev.to' },
  { source: 'reddit', medium: 'social', label: 'Reddit' },
];

export const bySource = (source) => CHANNELS.find((c) => c.source === source);

// utm_content separates the day-7 push from the day-0 one on the same channel.
export function shareUrl(slug, channel, content) {
  const u = new URL(`${ORIGIN}/article/${slug}/`);
  u.searchParams.set('utm_source', channel.source);
  u.searchParams.set('utm_medium', channel.medium);
  u.searchParams.set('utm_campaign', slug);
  if (content) u.searchParams.set('utm_content', content);
  return u.toString();
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
