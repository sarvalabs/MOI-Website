// Announces a published post to the owned channels, and queues drafts for the
// ones a human should still write.
//
// The split is deliberate. Discord and Telegram are announcement channels where
// a bot posting is expected, so those go out directly. X and LinkedIn are not:
// an auto-written hook reads auto-written, and that is a negative signal to the
// audience we are writing for. Those two are pushed to Buffer instead, where
// they sit in the queue until someone rewrites the hook and approves them.
//
// Buffer also solves an access problem. X has no per-person roles, so without a
// tool holding the connection, "access to X" means passing a password around.
// And going direct is worse on both counts: X dropped its free API tier in
// February 2026 and charges per post containing a link, while LinkedIn
// company-page posting needs partner-programme approval that runs for months.
// Buffer's free tier carries approved integrations for both.
//
//   node scripts/distribute.js <slug>              # send
//   node scripts/distribute.js <slug> --dry-run    # print, send nothing
//
// Every step is independent: one channel failing does not stop the others, and
// the exit code reflects whether anything failed. Missing credentials skip a
// channel rather than erroring, so this runs usefully before every secret is in
// place.

import { bySource, readPost, shareUrl, isoDay } from './lib/share.js';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const slug = args.find((a) => !a.startsWith('--'));

if (!slug) {
  console.error('usage: node scripts/distribute.js <slug> [--dry-run]');
  process.exit(1);
}

const post = readPost(slug);
if (!post) {
  console.error(`No post found for slug: ${slug}`);
  process.exit(1);
}
if (post.draft) {
  console.log(`${slug} is a draft — nothing to distribute.`);
  process.exit(0);
}

const {
  DISCORD_WEBHOOK_URL,
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID,
  BUFFER_ACCESS_TOKEN,
  BUFFER_CHANNEL_X,
  BUFFER_CHANNEL_LINKEDIN,
} = process.env;

const results = [];
const record = (channel, status, detail) => {
  results.push({ channel, status, detail });
  const mark = { sent: '✓', skipped: '–', failed: '✗' }[status];
  console.log(`${mark} ${channel.padEnd(18)} ${detail}`);
};

async function send(channel, credentialsPresent, fn) {
  if (!credentialsPresent) return record(channel, 'skipped', 'credentials not set');
  if (dryRun) return record(channel, 'skipped', 'dry run');
  try {
    record(channel, 'sent', await fn());
  } catch (err) {
    record(channel, 'failed', err.message);
  }
}

// --- Discord -----------------------------------------------------------------

async function toDiscord() {
  const res = await fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [
        {
          title: post.title,
          description: post.summary,
          url: shareUrl(slug, bySource('discord')),
          color: 0x7b5ea7, // --purple
          footer: { text: `MOI Blog · ${isoDay(post.date)}` },
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Discord ${res.status} ${await res.text()}`);
  return 'posted';
}

// --- Telegram ----------------------------------------------------------------

const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function toTelegram() {
  const url = shareUrl(slug, bySource('telegram'));
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      parse_mode: 'HTML',
      text: `<b>${escapeHtml(post.title)}</b>\n\n${escapeHtml(post.summary)}\n\n${url}`,
    }),
  });
  const body = await res.json();
  if (!res.ok || !body.ok) throw new Error(`Telegram: ${body.description || res.status}`);
  return 'posted';
}

// --- Buffer ------------------------------------------------------------------
//
// createPost with mode `addToQueue` puts the post in the channel's queue rather
// than publishing immediately. Turn on approval for the X and LinkedIn channels
// in Buffer so queued posts land as drafts needing sign-off — that setting, not
// this code, is what guarantees nothing reaches a timeline unreviewed.

const BUFFER_API = 'https://api.buffer.com';

const CREATE_POST = `
  mutation CreatePost($input: PostInput!) {
    createPost(input: $input) {
      ... on PostActionSuccess { post { id } }
      ... on MutationError { message }
    }
  }
`;

async function toBuffer(channelId, source) {
  const res = await fetch(BUFFER_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${BUFFER_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: CREATE_POST,
      variables: {
        input: {
          // Seeded from the summary. The point of the draft is that a person
          // replaces this with a real hook before it goes out.
          text: `${post.title}\n\n${post.summary}\n\n${shareUrl(slug, bySource(source))}`,
          channelId,
          schedulingType: 'automatic',
          mode: 'addToQueue',
        },
      },
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Buffer ${res.status}`);
  if (body.errors?.length) throw new Error(body.errors[0].message);
  const result = body.data?.createPost;
  if (result?.message) throw new Error(result.message);
  return `queued as draft (${result?.post?.id ?? 'no id returned'})`;
}

// --- run ---------------------------------------------------------------------

console.log(`\n${post.title}\n${slug} · ${isoDay(post.date)}${dryRun ? '  [dry run]' : ''}\n`);

await send('discord', !!DISCORD_WEBHOOK_URL, toDiscord);
await send('telegram', !!(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID), toTelegram);
await send('buffer:x', !!(BUFFER_ACCESS_TOKEN && BUFFER_CHANNEL_X), () =>
  toBuffer(BUFFER_CHANNEL_X, 'x')
);
await send('buffer:linkedin', !!(BUFFER_ACCESS_TOKEN && BUFFER_CHANNEL_LINKEDIN), () =>
  toBuffer(BUFFER_CHANNEL_LINKEDIN, 'linkedin')
);

const failed = results.filter((r) => r.status === 'failed');
console.log(
  `\n${results.filter((r) => r.status === 'sent').length} sent, ` +
    `${results.filter((r) => r.status === 'skipped').length} skipped, ${failed.length} failed\n`
);

process.exit(failed.length ? 1 : 0);
