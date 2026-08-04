import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAllPosts, markdownToHtml, generateSitemap, generateRss, generateLlmsTxt } from '../lib/blog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Generated into public/ so Vite copies it to dist/ on build and the dev
// server can serve it too — otherwise /blog has no data outside a prod build.
const DIST_DIR = path.join(__dirname, '../public');
const BLOG_DATA_DIR = path.join(DIST_DIR, 'blog-data');
const BASE_URL = 'https://moi.technology';

async function buildBlog() {
  console.log('🔨 Building blog...');

  // Ensure blog-data and blog directories exist
  if (!fs.existsSync(BLOG_DATA_DIR)) {
    fs.mkdirSync(BLOG_DATA_DIR, { recursive: true });
  }
  const blogDir = path.join(DIST_DIR, 'blog');
  if (!fs.existsSync(blogDir)) {
    fs.mkdirSync(blogDir, { recursive: true });
  }

  const posts = getAllPosts();
  console.log(`📝 Found ${posts.length} posts`);

  // Process each post
  for (const post of posts) {
    const html = await markdownToHtml(post.content);
    const postData = {
      ...post,
      frontmatter: {
        ...post.frontmatter,
        date: post.frontmatter.date.toISOString(),
        updated: post.frontmatter.updated?.toISOString() || post.frontmatter.date.toISOString(),
      },
      html,
    };

    fs.writeFileSync(
      path.join(BLOG_DATA_DIR, `${post.slug}.json`),
      JSON.stringify(postData, null, 2)
    );
    console.log(`  ✓ ${post.slug}`);
  }

  // Generate blog index
  const indexData = posts.map(p => ({
    slug: p.slug,
    frontmatter: {
      ...p.frontmatter,
      date: p.frontmatter.date.toISOString(),
      updated: p.frontmatter.updated?.toISOString() || p.frontmatter.date.toISOString(),
    },
    wordCount: p.wordCount,
    readingTime: p.readingTime,
  }));

  fs.writeFileSync(
    path.join(BLOG_DATA_DIR, 'index.json'),
    JSON.stringify(indexData, null, 2)
  );
  console.log('  ✓ index.json');

  // Generate sitemap
  const sitemap = generateSitemap(BASE_URL);
  fs.writeFileSync(path.join(blogDir, 'sitemap.xml'), sitemap);
  console.log('  ✓ blog/sitemap.xml');

  // Generate RSS
  const rss = generateRss(BASE_URL);
  fs.writeFileSync(path.join(blogDir, 'feed.xml'), rss);
  console.log('  ✓ blog/feed.xml');

  // Generate llms.txt
  const llmsTxt = generateLlmsTxt(BASE_URL);
  fs.writeFileSync(path.join(blogDir, 'llms.txt'), llmsTxt);
  console.log('  ✓ blog/llms.txt');

  console.log('✅ Blog build complete\n');
}

buildBlog().catch(err => {
  console.error('❌ Blog build failed:', err);
  process.exit(1);
});
