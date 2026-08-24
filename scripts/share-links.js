// Prints the tagged share links for a published post.
//
// GA4 attributes a click to a channel only when the link carries UTM
// parameters, so an untagged post is indistinguishable from direct traffic
// however the property is configured. The convention itself lives in
// lib/share.js, shared with distribute.js so the two cannot drift.
//
//   node scripts/share-links.js                     # every published post
//   node scripts/share-links.js moi-august-2026-release
//   node scripts/share-links.js <slug> --md          # markdown, for the log
//
// Slugs are filenames in blog/src/content/posts, minus the .md.

import { CHANNELS, POSTS_DIR, readPosts, shareUrl, isoDay } from './lib/share.js';

const args = process.argv.slice(2);
const asMarkdown = args.includes('--md');
const wanted = args.filter((a) => !a.startsWith('--'));

const posts = readPosts().filter((p) => (wanted.length ? wanted.includes(p.slug) : true));

if (!posts.length) {
  console.error(
    wanted.length
      ? `No published post matching: ${wanted.join(', ')}`
      : `No published posts found in ${POSTS_DIR}`
  );
  process.exit(1);
}

const X = CHANNELS[0];

for (const post of posts) {
  if (asMarkdown) {
    console.log(`## ${post.title}\n`);
    console.log(`\`${post.slug}\` — published ${isoDay(post.date)}\n`);
    console.log('| Channel | Sent | Link |');
    console.log('| --- | --- | --- |');
    for (const ch of CHANNELS) {
      console.log(`| ${ch.label} | ☐ | \`${shareUrl(post.slug, ch)}\` |`);
    }
    console.log(`| X — day 7 | ☐ | \`${shareUrl(post.slug, X, 'day7')}\` |`);
    console.log('');
  } else {
    console.log(`\n\x1b[1m${post.title}\x1b[0m`);
    console.log(`\x1b[2m${post.slug} · ${isoDay(post.date)}\x1b[0m\n`);
    for (const ch of CHANNELS) {
      console.log(`  ${ch.label.padEnd(11)} ${shareUrl(post.slug, ch)}`);
    }
    console.log(`  ${'X (day 7)'.padEnd(11)} ${shareUrl(post.slug, X, 'day7')}`);
  }
}

if (!asMarkdown) {
  console.log(`\n\x1b[2m${posts.length} post(s). Re-run with --md for a checklist to commit.\x1b[0m\n`);
}
