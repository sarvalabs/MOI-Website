import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeStringify from 'rehype-stringify';
import readingTime from 'reading-time';

const POSTS_DIR = path.join(process.cwd(), 'content/posts');

function validateFrontmatter(data, slug) {
  const required = ['title', 'summary', 'date'];
  const missing = required.filter(k => !data[k]);
  if (missing.length) {
    throw new Error(`Post "${slug}" missing required fields: ${missing.join(', ')}`);
  }

  if (typeof data.date === 'string') {
    data.date = new Date(data.date);
  }
  if (data.updated && typeof data.updated === 'string') {
    data.updated = new Date(data.updated);
  }

  if (data.draft === true) return null;
  return data;
}

export async function markdownToHtml(content) {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    // Wrap heading text in a self-link so readers can grab a permalink.
    .use(rehypeAutolinkHeadings, {
      behavior: 'wrap',
      test: (node) => ['h2', 'h3'].includes(node.tagName),
    })
    .use(rehypePrettyCode, {
      theme: 'github-dark',
      // Let the brand surface (MOI Black) show through instead of the theme's.
      keepBackground: false,
    })
    .use(rehypeStringify);

  const result = await processor.process(content);
  return result.toString();
}

export function getPostBySlug(slug) {
  const realSlug = slug.replace(/\.md$/, '');
  const filePath = path.join(POSTS_DIR, `${realSlug}.md`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  const frontmatter = validateFrontmatter(data, realSlug);
  if (!frontmatter) return null;

  const wordCount = content.split(/\s+/).length;
  const { minutes } = readingTime(content);

  return {
    slug: realSlug,
    frontmatter,
    content,
    wordCount,
    readingTime: Math.ceil(minutes),
  };
}

export function getAllPosts() {
  if (!fs.existsSync(POSTS_DIR)) {
    return [];
  }

  const slugs = fs.readdirSync(POSTS_DIR)
    .filter(file => file.endsWith('.md'))
    .map(file => file.replace(/\.md$/, ''));

  const posts = slugs
    .map(slug => getPostBySlug(slug))
    .filter(Boolean)
    .sort((a, b) => b.frontmatter.date - a.frontmatter.date);

  return posts;
}

export function generateSitemap(baseUrl) {
  const posts = getAllPosts();
  const urls = [
    `${baseUrl}/blog`,
    ...posts.map(p => `${baseUrl}/blog/${p.slug}`),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>`;

  return sitemap;
}

export function generateRss(baseUrl) {
  const posts = getAllPosts();
  const buildDate = new Date().toUTCString();

  const items = posts.map(p => `
  <item>
    <title>${escapeXml(p.frontmatter.title)}</title>
    <link>${baseUrl}/blog/${p.slug}</link>
    <guid>${baseUrl}/blog/${p.slug}</guid>
    <description>${escapeXml(p.frontmatter.summary)}</description>
    <pubDate>${p.frontmatter.date.toUTCString()}</pubDate>
    ${p.frontmatter.author ? `<author>${escapeXml(p.frontmatter.author.name)}</author>` : ''}
  </item>`).join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>MOI Blog</title>
    <link>${baseUrl}/blog</link>
    <description>Essays on context infrastructure and the agentic economy.</description>
    <language>en-us</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return rss;
}

export function generateLlmsTxt(baseUrl) {
  const posts = getAllPosts();
  const lines = [
    '# MOI Blog',
    '',
    '> Essays on context infrastructure and the agentic economy, from the team building MOI — the on-chain authority layer for AI agents.',
    '',
    ...posts.map(p => `- [${p.frontmatter.title}](${baseUrl}/blog/${p.slug}) — ${p.frontmatter.summary}`),
  ];

  return lines.join('\n');
}

function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
