// Creates the per-post copy file that distribution reads.
//
//   node scripts/social-init.js <slug> [--force]
//   node scripts/social-init.js --all          # every published post missing one
//
// Run by the Prepare workflow when a post merges, and by hand whenever you want
// to redo the copy for something already published.

import { readPosts } from './lib/share.js';
import { hasSocialFile, writeScaffold } from './lib/social.js';
import path from 'node:path';

const args = process.argv.slice(2);
const force = args.includes('--force');
const all = args.includes('--all');
const slugs = args.filter((a) => !a.startsWith('--'));

if (!all && !slugs.length) {
  console.error('usage: node scripts/social-init.js <slug> [--force]  |  --all');
  process.exit(1);
}

// --all --force rewrites every copy file on the repo, hand-written words and
// all, with no diff to review first. The Prepare workflow can reach this by
// accident: dispatching it with force ticked and the slug left blank resolves
// to exactly this pair. Overwriting one post's copy is a decision; overwriting
// every post's is almost never one, so it has to be said out loud.
if (all && force && !args.includes('--yes-overwrite-all')) {
  console.error(
    'Refusing to run --all with --force: that overwrites the copy for every published\n' +
      'post, including anything already written by hand.\n\n' +
      '  For one post:   node scripts/social-init.js <slug> --force\n' +
      '  If you mean it: add --yes-overwrite-all\n'
  );
  process.exit(1);
}

const targets = all ? readPosts().map((p) => p.slug).filter((s) => force || !hasSocialFile(s)) : slugs;

if (!targets.length) {
  console.log('Nothing to do — every published post already has a copy file.');
  process.exit(0);
}

let created = 0;
for (const slug of targets) {
  try {
    const { file, written } = writeScaffold(slug, { force });
    const rel = path.relative(process.cwd(), file);
    console.log(written ? `  created  ${rel}` : `  exists   ${rel}  (--force to overwrite)`);
    if (written) created++;
  } catch (err) {
    console.error(`  failed   ${slug}: ${err.message}`);
    process.exitCode = 1;
  }
}

// The workflow reads this to decide whether a pull request is worth opening.
if (process.env.GITHUB_OUTPUT) {
  const fs = await import('node:fs');
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `created=${created}\n`);
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `slugs=${targets.join(' ')}\n`);
}

console.log(`\n${created} file(s) created. Edit the copy, then run the Distribute workflow.\n`);
