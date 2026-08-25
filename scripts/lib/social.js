// The channel registry, and the per-post copy file that feeds it.
//
// Distribution is deliberately not automatic. A post merging to main opens a
// pull request containing a copy file — one block of text per channel, seeded
// from the post's own frontmatter — and nothing is sent until a human has
// edited that file and triggered the Distribute workflow by hand. The seeded
// text is a starting point, not a draft anyone should ship: a hook generated
// from a summary field reads generated, and that is a negative signal to the
// audience this blog is written for.

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { root, bySource, shareUrl, readPost, isoDay } from './share.js';

export const SOCIAL_DIR = path.join(root, 'social');

// `kind` decides what happens on send:
//   direct — posted immediately; these are announcement channels where a bot is
//            expected rather than tolerated.
//   buffer — queued as a draft for a person to rewrite and approve, so nothing
//            auto-written reaches a timeline.
export const CHANNELS = [
  {
    id: 'discord',
    label: 'Discord',
    kind: 'direct',
    utm: 'discord',
    env: ['DISCORD_WEBHOOK_URL'],
    limit: 2000,
  },
  {
    id: 'telegram',
    label: 'Telegram',
    kind: 'direct',
    utm: 'telegram',
    env: ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'],
    limit: 4096,
  },
  {
    id: 'x',
    label: 'X',
    kind: 'buffer',
    utm: 'x',
    env: ['BUFFER_ACCESS_TOKEN', 'BUFFER_CHANNEL_X'],
    channelEnv: 'BUFFER_CHANNEL_X',
    limit: 280,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    kind: 'buffer',
    utm: 'linkedin',
    env: ['BUFFER_ACCESS_TOKEN', 'BUFFER_CHANNEL_LINKEDIN'],
    channelEnv: 'BUFFER_CHANNEL_LINKEDIN',
    limit: 3000,
  },
];

export const channelById = (id) => CHANNELS.find((c) => c.id === id);
export const channelIds = CHANNELS.map((c) => c.id);

export const socialPath = (slug) => path.join(SOCIAL_DIR, `${slug}.md`);
export const hasSocialFile = (slug) => fs.existsSync(socialPath(slug));

// Where the tagged URL goes in the copy. Explicit rather than appended, so the
// author can put it mid-sentence, or in a thread's last line, or nowhere.
export const LINK_TOKEN = '{{link}}';

export function linkFor(slug, channelId) {
  return shareUrl(slug, bySource(channelById(channelId).utm));
}

// Substitutes the token, or appends the link if the author removed it — a post
// without its link is the one failure mode worth defending against.
export function renderCopy(text, slug, channelId) {
  const link = linkFor(slug, channelId);
  const body = String(text ?? '').trim();
  if (!body) return '';
  if (body.includes(LINK_TOKEN)) return body.split(LINK_TOKEN).join(link).trim();
  return `${body}\n\n${link}`;
}

export function readSocial(slug) {
  const file = socialPath(slug);
  if (!fs.existsSync(file)) return null;
  const { data, content } = matter(fs.readFileSync(file, 'utf8'));
  return { slug, file, data: data || {}, notes: (content || '').trim() };
}

// Seeded from the post itself. Deliberately plain — it is meant to be rewritten,
// and text that already looks finished is text nobody edits.
//
// Written as literal YAML blocks (|) rather than through a dumper: folded style
// mangles the blank lines between paragraphs, and this file's whole purpose is
// being edited by hand.
const block = (key, text) =>
  `${key}: |\n` + String(text).split('\n').map((l) => (l ? `  ${l}` : '')).join('\n');

export function scaffold(slug) {
  const post = readPost(slug);
  if (!post) throw new Error(`No post found for slug: ${slug}`);

  const T = LINK_TOKEN;
  const fields = [
    `slug: ${slug}`,
    `title: ${JSON.stringify(post.title)}`,
    `published: ${isoDay(post.date)}`,
    '',
    '# Discord and Telegram post immediately. X and LinkedIn are queued in',
    '# Buffer as drafts for you to approve. Empty a channel to skip it.',
    '',
    block('discord', `**${post.title}**\n\n${post.summary}\n\n${T}`),
    '',
    block('telegram', `${post.title}\n\n${post.summary}\n\n${T}`),
    '',
    `# X allows 280 characters. The link counts as 23 whatever its length.`,
    block('x', `${post.summary}\n\n${T}`),
    '',
    block('linkedin', `${post.title}\n\n${post.summary}\n\n${T}`),
  ].join('\n');

  return [
    '---',
    fields,
    '---',
    '',
    `<!-- ${T} becomes that channel's tagged URL, so GA4 can tell the channels`,
    '     apart. Move it anywhere in the copy; delete it and the link is',
    '     appended to the end instead.',
    '',
    '     When the copy is ready: Actions -> Distribute a post -> Run workflow.',
    '-->',
    '',
    'Notes: none yet.',
    '',
  ].join('\n');
}

export function writeScaffold(slug, { force = false } = {}) {
  fs.mkdirSync(SOCIAL_DIR, { recursive: true });
  const file = socialPath(slug);
  if (fs.existsSync(file) && !force) return { file, written: false };
  fs.writeFileSync(file, scaffold(slug));
  return { file, written: true };
}

// X bills every URL at 23 characters however long it is, so a naive
// copy.length would reject posts that are actually fine.
const T_CO_LENGTH = 23;
export function measure(copy, channel) {
  if (channel.id !== 'x') return copy.length;
  return copy.replace(/https?:\/\/\S+/g, 'x'.repeat(T_CO_LENGTH)).length;
}

// A channel is sendable when it has copy and every credential it needs. Both
// are reported separately so a dry run can say which of the two is missing.
export function planFor(slug, { only } = {}) {
  const social = readSocial(slug);
  if (!social) throw new Error(`No copy file at social/${slug}.md — run: npm run social:init ${slug}`);

  const wanted = only?.length ? only : channelIds;
  return CHANNELS.filter((c) => wanted.includes(c.id)).map((c) => {
    const copy = renderCopy(social.data[c.id], slug, c.id);
    const missing = c.env.filter((e) => !process.env[e]);
    const length = measure(copy, c);
    const over = c.limit && length > c.limit ? length : 0;
    return {
      channel: c,
      copy,
      length,
      missing,
      over,
      skip: !copy ? 'no copy' : missing.length ? `missing ${missing.join(', ')}` : null,
    };
  });
}
