// Lists your Buffer channels and their IDs, so BUFFER_CHANNEL_X and
// BUFFER_CHANNEL_LINKEDIN can be copied rather than guessed. Buffer surfaces
// these nowhere in its web UI — the API is the only route.
//
//   BUFFER_ACCESS_TOKEN=... node scripts/buffer-channels.js
//
// Two shapes here are easy to get wrong and were, first time round:
// organizations hangs off `account` rather than being a root field, and
// channels(input:) types organizationId as OrganizationId!, not String!.

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

const SECRET_FOR = {
  twitter: 'BUFFER_CHANNEL_X',
  x: 'BUFFER_CHANNEL_X',
  linkedin: 'BUFFER_CHANNEL_LINKEDIN',
};

try {
  const { account } = await gql('{ account { organizations { id name } } }');
  const orgs = account?.organizations ?? [];

  if (!orgs.length) {
    console.error('\nNo organisations on this account.\n');
    process.exit(1);
  }

  let found = 0;

  for (const org of orgs) {
    const { channels } = await gql(
      `query($id: OrganizationId!) {
         channels(input: { organizationId: $id }) { id name service displayName isDisconnected }
       }`,
      { id: org.id }
    );

    console.log(`\n${org.name || org.id}`);
    const list = channels ?? [];

    if (!list.length) {
      console.log('  (nothing connected — connect X and the LinkedIn page in Buffer first)');
      continue;
    }

    for (const ch of list) {
      const secret = SECRET_FOR[String(ch.service).toLowerCase()];
      const label = ch.displayName || ch.name || '';
      const warn = ch.isDisconnected ? '  [disconnected]' : '';
      if (secret) found++;
      console.log(
        `  ${String(ch.service).padEnd(10)} ${ch.id}  ${label}${secret ? `   -> ${secret}` : ''}${warn}`
      );
    }
  }

  console.log(
    found
      ? `
Set them:

  gh secret set BUFFER_CHANNEL_X --repo sarvalabs/MOI-Website
  gh secret set BUFFER_CHANNEL_LINKEDIN --repo sarvalabs/MOI-Website
`
      : '\nNo X or LinkedIn channel found. Connect them in Buffer, then re-run.\n'
  );
} catch (err) {
  console.error(`\nBuffer: ${err.message}\n`);
  process.exit(1);
}
