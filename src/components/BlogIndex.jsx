import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function BlogIndex() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/blog-data/index.json')
      .then(res => res.json())
      .then(data => {
        setPosts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load posts:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  const canonicalUrl = 'https://moi.technology/blog';

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'MOI Blog',
          description: 'Essays on context infrastructure and AI agents',
          url: canonicalUrl,
          publisher: {
            '@type': 'Organization',
            name: 'MOI',
            url: 'https://moi.technology',
            logo: 'https://moi.technology/logo-moi-wordmark.svg',
          },
        })
      }} />

      <meta name="description" content="Essays on context infrastructure and AI agents" />
      <meta property="og:title" content="MOI Blog" />
      <meta property="og:description" content="Essays on context infrastructure and AI agents" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <link rel="canonical" href={canonicalUrl} />

      <div className="mx-auto max-w-prose px-6 py-16 sm:px-8 sm:py-24">
        <header className="mb-12">
          <h1 className="text-4xl font-serif font-bold text-ink">
            Blog
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Essays on context infrastructure and trustworthy AI systems.
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="text-gray-500">No posts yet.</p>
        ) : (
          <div className="space-y-8 divide-y divide-gray-200">
            {posts.map(post => (
              <article key={post.slug} className="pt-8 first:pt-0">
                <Link
                  to={`/blog/${post.slug}`}
                  className="group"
                >
                  <h2 className="text-2xl font-serif font-bold text-ink group-hover:text-indigo transition-colors">
                    {post.frontmatter.title}
                  </h2>
                </Link>
                <p className="mt-3 text-gray-600 leading-relaxed">
                  {post.frontmatter.summary}
                </p>
                <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                  <time dateTime={post.frontmatter.date}>
                    {new Date(post.frontmatter.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                  <span>·</span>
                  <span>{post.readingTime} min</span>
                  <span>·</span>
                  <Link
                    to={`/blog/${post.slug}`}
                    className="font-medium text-indigo hover:text-indigo-700"
                  >
                    Read →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
