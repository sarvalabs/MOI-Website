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
// createPost with mode addToQueue places the post in the channel's queue. What
// stops it publishing on its own is the channel's approval setting in Buffer,
// not this call — that setting is the safeguard, and it belongs there because
// it survives anyone changing this code.

const BUFFER_API = 'https://api.buffer.com';

const CREATE_POST = `
  mutation CreatePost($input: PostInput!) {
    createPost(input: $input) {
      ... on PostActionSuccess { post { id } }
      ... on MutationError { message }
    }
  }
`;

export async function sendBuffer(copy, channel) {
  const channelId = process.env[channel.channelEnv];
  const res = await fetch(BUFFER_API, {
    method: 'POST',
    headers: { ...json, Authorization: `Bearer ${process.env.BUFFER_ACCESS_TOKEN}` },
    body: JSON.stringify({
      query: CREATE_POST,
      variables: {
        input: { text: copy, channelId, schedulingType: 'automatic', mode: 'addToQueue' },
      },
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Buffer ${res.status}`);
  if (body.errors?.length) throw new Error(`Buffer: ${body.errors[0].message}`);
  const result = body.data?.createPost;
  if (result?.message) throw new Error(`Buffer: ${result.message}`);
  return `queued (${result?.post?.id ?? 'no id returned'})`;
}

export function senderFor(channel) {
  if (channel.id === 'discord') return (copy) => sendDiscord(copy);
  if (channel.id === 'telegram') return (copy) => sendTelegram(copy);
  if (channel.kind === 'buffer') return (copy) => sendBuffer(copy, channel);
  throw new Error(`No sender for channel: ${channel.id}`);
}
