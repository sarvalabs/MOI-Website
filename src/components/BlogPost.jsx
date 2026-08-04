import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "./Navbar";
import LandingFooter from "./LandingFooter";
import "../styles/blog.css";

const SITE = "https://moi.technology";

function useBlogRoot() {
  useEffect(() => {
    document.documentElement.classList.add("blog-root");
    return () => document.documentElement.classList.remove("blog-root");
  }, []);
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Pull headings out of the rendered HTML so the TOC stays in sync with the post.
function extractHeadings(html) {
  const out = [];
  const re = /<h([23])\b[^>]*\bid="([^"]+)"[^>]*>(.*?)<\/h\1>/gis;
  let m;
  while ((m = re.exec(html))) {
    out.push({
      level: Number(m[1]),
      id: m[2],
      text: m[3].replace(/<[^>]*>/g, "").trim(),
    });
  }
  return out;
}

export default function BlogPost() {
  const { slug } = useParams();
  // Keyed by slug so a slug change reads as "loading" without a
  // synchronous setState inside the effect.
  const [loaded, setLoaded] = useState({ slug: null, status: "loading", post: null });

  useBlogRoot();

  useEffect(() => {
    let alive = true;
    fetch(`/blog-data/${slug}.json`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then((data) => {
        if (alive) setLoaded({ slug, status: "ready", post: data });
      })
      .catch(() => {
        if (alive) setLoaded({ slug, status: "error", post: null });
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  const isCurrent = loaded.slug === slug;
  const status = isCurrent ? loaded.status : "loading";
  const post = isCurrent ? loaded.post : null;

  const headings = useMemo(
    () => (post?.html ? extractHeadings(post.html) : []),
    [post]
  );

  if (status === "loading") {
    return (
      <div className="blog-page">
        <Navbar activePage="blog" />
        <p className="b-state">Loading…</p>
      </div>
    );
  }

  if (status === "error" || !post) {
    return (
      <div className="blog-page">
        <Navbar activePage="blog" />
        <div className="b-main">
          <p className="b-eyebrow">404</p>
          <h1 className="b-title">Post not found</h1>
          <p className="b-summary">
            That post doesn’t exist or has been unpublished.
          </p>
          <p style={{ marginTop: "2rem" }}>
            <Link to="/blog" className="b-back">
              ← All posts
            </Link>
          </p>
        </div>
        <LandingFooter />
      </div>
    );
  }

  const { frontmatter: fm, html, wordCount, readingTime } = post;
  const url = `${SITE}/blog/${slug}`;
  const published = fm.date.split("T")[0];
  const modified = (fm.updated || fm.date).split("T")[0];
  const showToc = headings.filter((h) => h.level === 2).length > 2;

  const graph = [
    {
      "@type": "Organization",
      name: "MOI",
      url: SITE,
      logo: `${SITE}/brand/logos/SVG/default-light.svg`,
    },
    {
      "@type": "BlogPosting",
      headline: fm.title,
      description: fm.summary,
      ...(fm.cover ? { image: fm.cover } : {}),
      datePublished: published,
      dateModified: modified,
      wordCount,
      author: {
        "@type": "Person",
        name: fm.author?.name || "MOI",
        ...(fm.author?.url ? { url: fm.author.url } : {}),
        ...(fm.author?.role
          ? { jobTitle: fm.author.role, worksFor: { "@type": "Organization", name: "MOI" } }
          : { worksFor: { "@type": "Organization", name: "MOI" } }),
      },
      url,
      mainEntityOfPage: url,
      publisher: { "@type": "Organization", name: "MOI", url: SITE },
    },
    ...(fm.faq?.length
      ? [
          {
            "@type": "FAQPage",
            mainEntity: fm.faq.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
        ]
      : []),
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "MOI", item: SITE },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
        { "@type": "ListItem", position: 3, name: fm.title, item: url },
      ],
    },
  ];

  return (
    <div className="blog-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }),
        }}
      />

      <meta name="description" content={fm.summary} />
      <meta property="og:title" content={fm.title} />
      <meta property="og:description" content={fm.summary} />
      {fm.cover && <meta property="og:image" content={fm.cover} />}
      <meta property="og:type" content="article" />
      <meta property="og:url" content={url} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fm.title} />
      <meta name="twitter:description" content={fm.summary} />
      {fm.cover && <meta name="twitter:image" content={fm.cover} />}
      <link rel="canonical" href={url} />

      <Navbar activePage="blog" />

      <article className="b-main">
        <Link to="/blog" className="b-back">
          ← All posts
        </Link>

        <header className="b-header">
          <h1 className="b-title">{fm.title}</h1>
          <p className="b-summary">{fm.summary}</p>

          <div className="b-meta">
            <time dateTime={published}>{formatDate(fm.date)}</time>
            <span className="b-meta-sep">·</span>
            <span>{readingTime} min read</span>
            <span className="b-meta-sep">·</span>
            <span>{wordCount.toLocaleString()} words</span>
          </div>

          {fm.author && (
            <div className="b-author">
              <span className="b-author-name">{fm.author.name}</span>
              {fm.author.role && (
                <>
                  {" — "}
                  <span className="b-author-role">{fm.author.role}</span>
                </>
              )}
            </div>
          )}
        </header>

        {fm.takeaways?.length > 0 && (
          <section className="b-takeaways">
            <h2 className="b-takeaways-label">Key takeaways</h2>
            <ul>
              {fm.takeaways.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </section>
        )}

        {showToc && (
          <details className="b-toc">
            <summary>Contents</summary>
            <ol>
              {headings.map((h) => (
                <li key={h.id} className={h.level === 3 ? "is-sub" : undefined}>
                  <a href={`#${h.id}`}>{h.text}</a>
                </li>
              ))}
            </ol>
          </details>
        )}

        <div className="b-prose" dangerouslySetInnerHTML={{ __html: html }} />

        {fm.faq?.length > 0 && (
          <section className="b-faq">
            <h2 className="b-faq-label">Frequently asked</h2>
            {fm.faq.map((f, i) => (
              <details key={i} className="b-faq-item">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </section>
        )}

        <footer className="b-footer">
          {fm.updated && fm.updated !== fm.date && (
            <p className="b-updated">
              Updated <time dateTime={modified}>{formatDate(fm.updated)}</time>
            </p>
          )}
          {fm.tags?.map((tag) => (
            <span key={tag} className="b-tag">
              {tag}
            </span>
          ))}
        </footer>
      </article>

      <LandingFooter />
    </div>
  );
}
