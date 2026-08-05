import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import LandingFooter from "./LandingFooter";
import "../styles/blog.css";

const SITE = "https://moi.technology";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogIndex() {
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    document.documentElement.classList.add("blog-root");
    return () => document.documentElement.classList.remove("blog-root");
  }, []);

  useEffect(() => {
    let alive = true;
    fetch("/blog-data/index.json")
      .then((res) => res.json())
      .then((data) => {
        if (!alive) return;
        setPosts(data);
        setStatus("ready");
      })
      .catch(() => {
        if (!alive) return;
        setStatus("error");
      });
    return () => {
      alive = false;
    };
  }, []);

  const url = `${SITE}/blog`;

  return (
    <div className="blog-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "MOI Blog",
            description: "Essays on context infrastructure and the agentic economy.",
            url,
            publisher: {
              "@type": "Organization",
              name: "MOI",
              url: SITE,
              logo: `${SITE}/brand/logos/SVG/default-light.svg`,
            },
          }),
        }}
      />

      <meta
        name="description"
        content="Essays on context infrastructure and the agentic economy."
      />
      <meta property="og:title" content="MOI Blog" />
      <meta
        property="og:description"
        content="Essays on context infrastructure and the agentic economy."
      />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <link rel="canonical" href={url} />

      <Navbar activePage="blog" />

      <div className="b-main">
        <header className="b-header">
          <p className="b-eyebrow">Writing</p>
          <h1 className="b-title">Blog</h1>
          <p className="b-summary">
            Essays on context infrastructure and the agentic economy.
          </p>
        </header>

        {status === "loading" && <p className="b-empty">Loading…</p>}

        {status === "ready" && posts.length === 0 && (
          <p className="b-empty">No posts yet.</p>
        )}

        {status === "error" && (
          <p className="b-empty">Posts couldn’t be loaded.</p>
        )}

        {posts.length > 0 && (
          <div className="b-list">
            {posts.map((post) => (
              <article key={post.slug} className="b-entry">
                <Link to={`/blog/${post.slug}`} className="b-entry-title">
                  {post.frontmatter.title}
                </Link>
                <p className="b-entry-summary">{post.frontmatter.summary}</p>
                <div className="b-meta">
                  <time dateTime={post.frontmatter.date.split("T")[0]}>
                    {formatDate(post.frontmatter.date)}
                  </time>
                  <span className="b-meta-sep">·</span>
                  <span>{post.readingTime} min read</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <LandingFooter />
    </div>
  );
}
