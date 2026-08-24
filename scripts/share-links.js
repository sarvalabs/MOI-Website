// Generates the tagged share links for a published post.
//
// GA4 attributes a click to a channel only if the link carries UTM parameters,
// so an untagged post is indistinguishable from direct traffic no matter how
// the property is configured. Hand-writing them does not survive contact with
// a Monday morning: `LinkedIn` and `linkedin` are two different channels to
// GA4, and a campaign named after the post's title rather than its slug cannot
// be compared against the next post's.
//
// So the links come from the slug, which is already the campaign name, and the
// channel list lives here rather than in someone's memory.
//
//   node scripts/share-links.js                     # every published post
//   node scripts/share-links.js moi-august-2026-release
//   node scripts/share-links.js <slug> --md          # markdown, for the log
//
// Slugs are filenames in blog/src/content/posts, minus the .md.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const POSTS_DIR = path.join(root, 'blog/src/content/posts');
const ORIGIN = (process.env.BLOG_ORIGIN || 'https://blog.moi.technology').replace(/\/$/, '');

// utm_medium is a fixed property of the channel, not a per-post choice.
const CHANNELS = [
  { source: 'x', medium: 'social', label: 'X' },
  { source: 'linkedin', medium: 'social', label: 'LinkedIn' },
  { source: 'discord', medium: 'community', label: 'Discord' },
  { source: 'telegram', medium: 'community', label: 'Telegram' },
  { source: 'newsletter', medium: 'email', label: 'Newsletter' },
  { source: 'devto', medium: 'syndication', label: 'dev.to' },
  { source: 'reddit', medium: 'social', label: 'Reddit' },
];

// Day 7 reuses a channel with a different utm_content so the second push is
// separable from the first in reporting.
const VARIANTS = ['', 'day7'];

const args = process.argv.slice(2);
const asMarkdown = args.includes('--md');
const wanted = args.filter((a) => !a.startsWith('--'));

const shareUrl = (slug, { source, medium }, content) => {
  const u = new URL(`${ORIGIN}/article/${slug}/`);
  u.searchParams.set('utm_source', source);
  u.searchParams.set('utm_medium', medium);
  u.searchParams.set('utm_campaign', slug);
  if (content) u.searchParams.set('utm_content', content);
  return u.toString();
};

const posts = fs
  .readdirSync(POSTS_DIR)
  .filter((f) => f.endsWith('.md'))
  .map((f) => {
    const slug = f.replace(/\.md$/, '');
    const { data } = matter(fs.readFileSync(path.join(POSTS_DIR, f), 'utf8'));
    return { slug, title: data.title, summary: data.summary, date: data.date, draft: !!data.draft };
  })
  .filter((p) => !p.draft)
  .filter((p) => (wanted.length ? wanted.includes(p.slug) : true))
  .sort((a, b) => new Date(b.date) - new Date(a.date));

if (!posts.length) {
  console.error(
    wanted.length
      ? `No published post matching: ${wanted.join(', ')}`
      : `No published posts found in ${POSTS_DIR}`
  );
  process.exit(1);
}

for (const post of posts) {
  if (asMarkdown) {
    console.log(`## ${post.title}\n`);
    console.log(`\`${post.slug}\` — published ${new Date(post.date).toISOString().slice(0, 10)}\n`);
    console.log('| Channel | Sent | Link |');
    console.log('| --- | --- | --- |');
    for (const ch of CHANNELS) {
      console.log(`| ${ch.label} | ☐ | \`${shareUrl(post.slug, ch)}\` |`);
    }
    console.log(`| X — day 7 | ☐ | \`${shareUrl(post.slug, CHANNELS[0], 'day7')}\` |`);
    console.log('');
  } else {
    console.log(`\n\x1b[1m${post.title}\x1b[0m`);
    console.log(`\x1b[2m${post.slug} · ${new Date(post.date).toISOString().slice(0, 10)}\x1b[0m\n`);
    for (const ch of CHANNELS) {
      console.log(`  ${ch.label.padEnd(11)} ${shareUrl(post.slug, ch)}`);
    }
    console.log(`  ${'X (day 7)'.padEnd(11)} ${shareUrl(post.slug, CHANNELS[0], 'day7')}`);
  }
}

if (!asMarkdown) {
  console.log(`\n\x1b[2m${posts.length} post(s). Re-run with --md for a checklist to commit.\x1b[0m\n`);
}
