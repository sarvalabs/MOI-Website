// The same feed as rss.xml, with every link tagged for the newsletter.
//
// Mailchimp's RSS campaign takes each item's <link> verbatim, and the public
// feed's links are bare article URLs — so an email built from rss.xml sends
// every reader to GA4 as direct or referral, which is the one thing the tagging
// convention exists to prevent. Mailchimp's own Google Analytics option does
// tag them, but names utm_campaign after the Mailchimp campaign rather than the
// post, so it breaks the convention instead of serving it.
//
// Two feeds rather than tagging rss.xml directly: feed readers are not the
// newsletter, and labelling their traffic as email would be worse than leaving
// it untagged. Point Mailchimp here and leave rss.xml for readers.

import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { bySource, withUtm } from '../lib/utm.js';

const NEWSLETTER = bySource('newsletter');

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
      link: withUtm(new URL(`/article/${post.id}/`, context.site).href, {
        channel: NEWSLETTER,
        campaign: post.id,
      }),
      categories: post.data.tags,
    })),
  });
}
