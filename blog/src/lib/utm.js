// The UTM convention. One definition, imported by both the blog and the
// repo-root scripts, because a convention that exists in two places is not one.
//
// Dependency-free on purpose: Astro pulls this through Vite, and
// scripts/lib/share.js imports it directly in Node with no bundler. Anything
// requiring node:fs or a package would break one of those two.
//
// GA4 treats `linkedin` and `LinkedIn` as separate channels, so the casing
// below is the contract, not a style preference.

// utm_medium is a property of the channel, not a per-post choice.
export const CHANNELS = [
  { source: 'x', medium: 'social', label: 'X' },
  { source: 'linkedin', medium: 'social', label: 'LinkedIn' },
  { source: 'discord', medium: 'community', label: 'Discord' },
  { source: 'telegram', medium: 'community', label: 'Telegram' },
  { source: 'newsletter', medium: 'email', label: 'Newsletter' },
  { source: 'devto', medium: 'syndication', label: 'dev.to' },
  { source: 'reddit', medium: 'social', label: 'Reddit' },
];

export const bySource = (source) => CHANNELS.find((c) => c.source === source);

// utm_campaign is always the post slug — that is what lets one post be compared
// across channels and one channel across posts from the same GA4 report.
// utm_content separates a day-7 push from the day-0 one on the same channel.
export function withUtm(url, { channel, campaign, content }) {
  const u = new URL(url);
  u.searchParams.set('utm_source', channel.source);
  u.searchParams.set('utm_medium', channel.medium);
  u.searchParams.set('utm_campaign', campaign);
  if (content) u.searchParams.set('utm_content', content);
  return u.toString();
}
