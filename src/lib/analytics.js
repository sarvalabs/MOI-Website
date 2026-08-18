// Google Analytics 4 for the marketing site.
//
// Loads only when VITE_GA_ID is set AND the page is served from a production
// host. The hostname allowlist is the important half: PR previews build from
// the same CI as production, so gating on the env var alone would file preview
// traffic as real traffic.
const GA_ID = import.meta.env.VITE_GA_ID;
const HOSTS = ["moi.technology", "www.moi.technology", "blog.moi.technology"];

let loaded = false;

function enabled() {
  return Boolean(GA_ID) && HOSTS.includes(window.location.hostname);
}

export function initAnalytics() {
  if (loaded || !enabled()) return;
  loaded = true;

  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  // The app renders client-side and React Router moves without a page load, so
  // send page_view manually per route rather than letting the config call fire
  // one for the entry URL only. cookie_domain lets a single property stitch a
  // session that continues onto blog.moi.technology.
  window.gtag("config", GA_ID, {
    send_page_view: false,
    cookie_domain: ".moi.technology",
  });
}

export function trackPageView(path) {
  if (!enabled() || typeof window.gtag !== "function") return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}
