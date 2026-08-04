import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/blog-data/${slug}.json`)
      .then(res => res.json())
      .then(data => {
        setPost(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load post:', err);
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!post) return <div className="p-8">Post not found</div>;

  const { frontmatter, html, wordCount, readingTime } = post;
  const canonicalUrl = `https://moi.technology/blog/${slug}`;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Organization',
              name: 'MOI',
              url: 'https://moi.technology',
              logo: 'https://moi.technology/logo-moi-wordmark.svg',
            },
            {
              '@type': 'BlogPosting',
              headline: frontmatter.title,
              description: frontmatter.summary,
              image: frontmatter.cover,
              datePublished: frontmatter.date.split('T')[0],
              dateModified: (frontmatter.updated || frontmatter.date).split('T')[0],
              author: {
                '@type': 'Person',
                name: frontmatter.author?.name || 'MOI',
                url: frontmatter.author?.url,
              },
              wordCount,
              url: canonicalUrl,
              mainEntityOfPage: canonicalUrl,
            },
            ...(frontmatter.faq ? [{
              '@type': 'FAQPage',
              mainEntity: frontmatter.faq.map(item => ({
                '@type': 'Question',
                name: item.q,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: item.a,
                },
              })),
            }] : []),
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'MOI',
                  item: 'https://moi.technology',
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Blog',
                  item: 'https://moi.technology/blog',
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: frontmatter.title,
                  item: canonicalUrl,
                },
              ],
            },
          ],
        })
      }} />

      <meta name="description" content={frontmatter.summary} />
      <meta property="og:title" content={frontmatter.title} />
      <meta property="og:description" content={frontmatter.summary} />
      <meta property="og:image" content={frontmatter.cover} />
      <meta property="og:type" content="article" />
      <meta property="og:url" content={canonicalUrl} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={frontmatter.title} />
      <meta name="twitter:description" content={frontmatter.summary} />
      <meta name="twitter:image" content={frontmatter.cover} />
      <link rel="canonical" href={canonicalUrl} />

      <article className="prose prose-blog mx-auto max-w-prose px-6 py-16 sm:px-8 sm:py-24">
        <header className="mb-8 border-b border-gray-200 pb-8">
          <h1 className="text-4xl font-serif leading-tight text-ink">
            {frontmatter.title}
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            {frontmatter.summary}
          </p>
          <div className="mt-6 flex items-center gap-6 text-sm text-gray-500">
            <time dateTime={frontmatter.date} className="font-mono">
              {new Date(frontmatter.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            <span>·</span>
            <span>{readingTime} min read</span>
            <span>·</span>
            <span>{wordCount} words</span>
          </div>
          {frontmatter.author && (
            <div className="mt-6 flex items-center gap-3">
              <div className="text-sm">
                <p className="font-medium text-ink">{frontmatter.author.name}</p>
                {frontmatter.author.role && (
                  <p className="text-gray-500">{frontmatter.author.role}</p>
                )}
              </div>
            </div>
          )}
        </header>

        {frontmatter.takeaways && frontmatter.takeaways.length > 0 && (
          <div className="my-8 rounded-lg border-l-4 border-indigo bg-indigo-50 p-6">
            <h2 className="text-lg font-serif font-bold text-ink">Key Takeaways</h2>
            <ul className="mt-4 space-y-3">
              {frontmatter.takeaways.map((takeaway, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1 text-indigo">→</span>
                  <span className="text-gray-700">{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {frontmatter.faq && frontmatter.faq.length > 0 && (
          <section className="mt-12 border-t border-gray-200 pt-12">
            <h2 className="text-2xl font-serif font-bold text-ink">Frequently Asked</h2>
            <div className="mt-8 space-y-6">
              {frontmatter.faq.map((item, i) => (
                <details key={i} className="group cursor-pointer">
                  <summary className="flex items-start gap-3 font-medium text-ink">
                    <span className="mt-1 group-open:hidden">▶</span>
                    <span className="hidden group-open:inline mt-1">▼</span>
                    <span className="flex-1">{item.q}</span>
                  </summary>
                  <p className="mt-4 ml-6 text-gray-700 leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-12 border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-500">
            {frontmatter.updated && frontmatter.updated !== frontmatter.date && (
              <>Updated <time dateTime={frontmatter.updated}>
                {new Date(frontmatter.updated).toLocaleDateString()}
              </time></>
            )}
            {frontmatter.tags && frontmatter.tags.length > 0 && (
              <div className="mt-4 flex gap-2">
                {frontmatter.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-mono text-gray-600"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </p>
        </footer>
      </article>
    </>
  );
}
