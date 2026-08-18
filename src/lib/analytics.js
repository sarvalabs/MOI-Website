// Page views for the marketing site.
//
// GTM loads from index.html and carries the GA4 tag. React Router moves
// without a page load, so GA4 would otherwise only ever record the URL the
// reader entered on. Pushing a custom event lets a GTM trigger fire a GA4
// page_view per route.
//
// No hostname guard here: the GA4 tag's trigger in GTM is conditioned on
// Page Hostname, which keeps previews out of the production property in one
// place rather than two.
export function trackPageView(path) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "spa_page_view",
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}
