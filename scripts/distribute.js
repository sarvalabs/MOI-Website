// Sends a post to the channels whose copy is ready.
//
//   node scripts/distribute.js <slug>
//   node scripts/distribute.js <slug> --dry-run
//   node scripts/distribute.js <slug> --only=x,linkedin
//
// Reads social/<slug>.md. A channel is sent only when it has copy AND every
// credential it needs — anything else is skipped and reported, so a partial
// setup is a useful state rather than a failure. Nothing here runs on its own;
// it is invoked by hand or by the Distribute workflow.

import { channelIds, planFor, socialPath } from './lib/social.js';
import { senderFor } from './lib/senders.js';
import { readPost } from './lib/share.js';
import path from 'node:path';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const onlyArg = args.find((a) => a.startsWith('--only='));
const only = onlyArg ? onlyArg.slice(7).split(',').map((s) => s.trim()).filter(Boolean) : [];
const slug = args.find((a) => !a.startsWith('--'));

if (!slug) {
  console.error('usage: node scripts/distribute.js <slug> [--dry-run] [--only=discord,x]');
  process.exit(1);
}

const unknown = only.filter((id) => !channelIds.includes(id));
if (unknown.length) {
  console.error(`Unknown channel(s): ${unknown.join(', ')}. Known: ${channelIds.join(', ')}`);
  process.exit(1);
}

const post = readPost(slug);
if (!post) {
  console.error(`No post found for slug: ${slug}`);
  process.exit(1);
}
if (post.draft) {
  console.log(`${slug} is still a draft — nothing to distribute.`);
  process.exit(0);
}

let plan;
try {
  plan = planFor(slug, { only });
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

const rel = path.relative(process.cwd(), socialPath(slug));
console.log(`\n${post.title}`);
console.log(`${rel}${dryRun ? '   [dry run — nothing will be sent]' : ''}\n`);

const mark = { sent: '✓', skipped: '–', failed: '✗', blocked: '!' };
const results = [];

for (const step of plan) {
  const { channel, copy, length, over, skip } = step;
  const id = channel.label.padEnd(9);

  if (skip) {
    results.push('skipped');
    console.log(`${mark.skipped} ${id} ${skip}`);
    continue;
  }

  // Over-length is a hard stop rather than a truncation: silently cutting
  // someone's copy is worse than making them shorten it.
  if (over) {
    results.push('blocked');
    console.log(`${mark.blocked} ${id} ${over}/${channel.limit} characters — shorten it`);
    continue;
  }

  if (dryRun) {
    results.push('skipped');
    const preview = copy.split('\n')[0].slice(0, 62);
    console.log(`${mark.skipped} ${id} would send ${length}/${channel.limit}  "${preview}…"`);
    continue;
  }

  try {
    const status = await senderFor(channel)(copy);
    results.push('sent');
    console.log(`${mark.sent} ${id} ${status}`);
  } catch (err) {
    results.push('failed');
    console.log(`${mark.failed} ${id} ${err.message}`);
  }
}

const count = (k) => results.filter((r) => r === k).length;
console.log(
  `\n${count('sent')} sent, ${count('skipped')} skipped, ` +
    `${count('blocked')} blocked, ${count('failed')} failed\n`
);

if (count('sent') && plan.some((s) => s.channel.kind === 'buffer' && !s.skip && !s.over) && !dryRun) {
  console.log('X and LinkedIn are drafts in Buffer — rewrite the hook and approve them there.\n');
}

process.exit(count('failed') || count('blocked') ? 1 : 0);
