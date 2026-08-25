// The four transports. Each takes rendered copy and returns a short status
// string, or throws with a message worth reading in a workflow log.
//
// Nothing here decides what to send or whether to send it — that is planFor()
// in social.js. These only know how to talk to one service each.

const json = { 'Content-Type': 'application/json' };

// --- Discord ---------------------------------------------------------------
// Sent as content rather than an embed: the copy is authored per channel, and
// an embed would override it with its own title/description layout.

export async function sendDiscord(copy) {
  const res = await fetch(process.env.DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: json,
    body: JSON.stringify({ content: copy, allowed_mentions: { parse: [] } }),
  });
  if (!res.ok) throw new Error(`Discord ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return 'posted';
}

// --- Telegram --------------------------------------------------------------

const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function sendTelegram(copy) {
  const res = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: json,
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: escapeHtml(copy),
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      }),
    }
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.ok) throw new Error(`Telegram: ${body.description || res.status}`);
  return 'posted';
}

// --- Buffer ----------------------------------------------------------------
// saveToDraft is what keeps these unpublished, and it is set on the call rather
// than left to Buffer's per-channel approval setting. Relying on that setting
// meant the safeguard lived somewhere this repo cannot see or verify, and one
// toggle in Buffer's UI would have turned every queued post into a scheduled
// one. Now the call itself says draft.
//
// BUFFER_MODE=now opts into publishing immediately (ShareMode.shareNow). It is
// deliberately an environment flag rather than a workflow input: auto-posting
// generated copy is a decision worth making once, on purpose, not something to
// pick from a dropdown while sending.

const BUFFER_API = 'https://api.buffer.com';

const CREATE_POST = `
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      __typename
      ... on PostActionSuccess { post { id } }
      ... on NotFoundError      { message }
      ... on UnauthorizedError  { message }
      ... on InvalidInputError  { message }
      ... on LimitReachedError  { message }
      ... on UnexpectedError    { message }
      ... on RestProxyError     { message code }
    }
  }
`;

export async function sendBuffer(copy, channel) {
  const channelId = process.env[channel.channelEnv];
  const publishNow = process.env.BUFFER_MODE === 'now';
  const res = await fetch(BUFFER_API, {
    method: 'POST',
    headers: { ...json, Authorization: `Bearer ${process.env.BUFFER_ACCESS_TOKEN}` },
    body: JSON.stringify({
      query: CREATE_POST,
      variables: {
        input: publishNow
          ? { text: copy, channelId, schedulingType: 'automatic', mode: 'shareNow' }
          : {
              text: copy,
              channelId,
              schedulingType: 'automatic',
              mode: 'addToQueue',
              saveToDraft: true,
            },
      },
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Buffer ${res.status}`);
  if (body.errors?.length) throw new Error(`Buffer: ${body.errors[0].message}`);

  // createPost returns a union: one success type and six error types, all of
  // which carry a message. Reading __typename rather than sniffing for fields
  // means a new error type shows up as itself instead of as a silent success.
  const result = body.data?.createPost;
  if (!result) throw new Error('Buffer returned no result');
  if (result.__typename !== 'PostActionSuccess') {
    throw new Error(`Buffer ${result.__typename}: ${result.message ?? 'no message'}`);
  }

  const id = result.post?.id ?? 'no id returned';
  return publishNow ? `published (${id})` : `draft (${id})`;
}

export function senderFor(channel) {
  if (channel.id === 'discord') return (copy) => sendDiscord(copy);
  if (channel.id === 'telegram') return (copy) => sendTelegram(copy);
  if (channel.kind === 'buffer') return (copy) => sendBuffer(copy, channel);
  throw new Error(`No sender for channel: ${channel.id}`);
}
