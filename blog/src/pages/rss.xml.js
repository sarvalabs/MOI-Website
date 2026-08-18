import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = (await getCollection('posts', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  );

  return rss({
    title: 'MOI Blog',
    description:
      'Writing from Sarva Labs on MOI: Contextual Compute, agent authority, protocol research, and product updates.',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.summary,
      pubDate: post.data.date,
      link: `/article/${post.id}/`,
      categories: post.data.tags,
    })),
  });
}
