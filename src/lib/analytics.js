// Google Analytics 4 for the marketing site.
//
// The hostname allowlist is the load-bearing guard: PR previews and local
// dev would otherwise file traffic into the production property. The SPA
// also has to send page_view itself — React Router moves without a load,
// so a single config call would only record the URL the reader entered on.
const GA_ID = "G-NRC43H4SZF";
const HOSTS = ["moi.technology", "www.moi.technology", "blog.moi.technology"];

let loaded = false;

function enabled() {
  return HOSTS.includes(window.location.hostname);
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
