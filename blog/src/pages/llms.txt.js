import { getCollection } from 'astro:content';

// GEO: a plain-text index for AI crawlers — ported from the hand-rolled
// pipeline's generateLlmsTxt() so the property survives the migration.
export async function GET(context) {
  const posts = (await getCollection('posts', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  );

  const lines = [
    '# MOI Blog',
    '',
    '> Writing from Sarva Labs on MOI: Contextual Compute, agent authority,',
    '> protocol research, and product updates.',
    '',
    '## Posts',
    '',
    ...posts.map(
      (p) =>
        `- [${p.data.title}](${new URL(`/blog/posts/${p.id}/`, context.site).href}): ${p.data.summary}`
    ),
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
