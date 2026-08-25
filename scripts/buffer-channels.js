// Lists your Buffer channels and their IDs, so BUFFER_CHANNEL_X and
// BUFFER_CHANNEL_LINKEDIN can be copied rather than guessed.
//
//   BUFFER_ACCESS_TOKEN=... node scripts/buffer-channels.js
//
// Run once during setup. The IDs do not change unless a channel is
// disconnected and reconnected.

const token = process.env.BUFFER_ACCESS_TOKEN;
if (!token) {
  console.error('Set BUFFER_ACCESS_TOKEN first. Only a Buffer organisation owner can create one.');
  process.exit(1);
}

const API = 'https://api.buffer.com';

async function gql(query, variables = {}) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 401) throw new Error('401 — the token was rejected.');
  const body = await res.json().catch(() => ({}));
  if (body.errors?.length) throw new Error(body.errors.map((e) => e.message).join('; '));
  return body.data;
}

// The documented channels query takes an organizationId, so find that first.
// Falls back to a bare channels query in case the account exposes one.
async function channels() {
  try {
    const d = await gql('{ account { organizations { id name } } }');
    const orgs = d?.account?.organizations ?? [];
    if (!orgs.length) throw new Error('no organisations on this account');
    const out = [];
    for (const org of orgs) {
      const c = await gql(
        'query($id: String!) { channels(input: { organizationId: $id }) { id name service } }',
        { id: org.id }
      );
      out.push({ org, list: c?.channels ?? [] });
    }
    return out;
  } catch {
    const c = await gql('{ channels { id name service } }');
    return [{ org: { name: '(default)' }, list: c?.channels ?? [] }];
  }
}

const groups = await channels();
const wanted = { twitter: 'BUFFER_CHANNEL_X', x: 'BUFFER_CHANNEL_X', linkedin: 'BUFFER_CHANNEL_LINKEDIN' };

for (const { org, list } of groups) {
  console.log(`\n${org.name}`);
  if (!list.length) {
    console.log('  (no channels connected — connect X and the LinkedIn page first)');
    continue;
  }
  for (const ch of list) {
    const secret = wanted[String(ch.service).toLowerCase()];
    console.log(`  ${String(ch.service).padEnd(10)} ${ch.id}  ${ch.name}${secret ? `   -> ${secret}` : ''}`);
  }
}

console.log(`
Set the two you need:

  gh secret set BUFFER_CHANNEL_X --repo sarvalabs/MOI-Website
  gh secret set BUFFER_CHANNEL_LINKEDIN --repo sarvalabs/MOI-Website
`);
