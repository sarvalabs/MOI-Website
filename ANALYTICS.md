# Analytics and Search Console

What is wired into the code, and the account-side steps that have to be done
by a human in a browser.

## What the code does

| Where | File | Behaviour |
|---|---|---|
| Marketing site | `src/lib/analytics.js`, wired in `src/App.jsx` | Loads GA4 when `VITE_GA_ID` is set, and sends one `page_view` per React Router route change |
| Blog | `blog/src/components/Analytics.astro`, included by `Base.astro` | Loads GA4 when `PUBLIC_GA_ID` is set; each article is a real page load, so no extra work |
| Blog | `Base.astro` | Emits a `google-site-verification` meta tag when `PUBLIC_GSC_VERIFICATION` is set |

Two guards apply in both places:

1. **The measurement ID must be set.** No ID, no script — so local development
   and any environment that does not set the variable stay clean.
2. **The hostname must be a production one** — `moi.technology`,
   `www.moi.technology` or `blog.moi.technology`. This matters because PR
   previews build from the same CI as production: without the allowlist,
   preview traffic would land in the same property as real traffic.

The marketing site sets `send_page_view: false` and sends views itself. The app
renders client-side and React Router navigates without a page load, so the
default single view would record only the URL a reader entered on and nothing
after it.

Both hosts use **one** measurement ID with `cookie_domain: '.moi.technology'`,
so a visit that starts on the marketing site and continues into an article is
one session rather than two.

## Setting up GA4

1. In [Google Analytics](https://analytics.google.com) create a property named
   **MOI** (or reuse an existing one).
2. Add a **Web** data stream for `https://moi.technology`. One stream covers the
   subdomain too — do not create a second stream for the blog.
3. Copy the **Measurement ID** (`G-XXXXXXXXXX`).
4. Add it as **two GitHub repository secrets**, `VITE_GA_ID` and
   `PUBLIC_GA_ID`, both set to the same value (Settings → Secrets and
   variables → Actions). `deploy.yml` already passes both through to the VM.
5. **Devops step:** `~/scripts/deploy-moi-website.sh` lives on the VM, not in
   this repo, so someone with VM access has to forward the two variables into
   the build commands there. Until that happens the IDs reach the VM and stop.
   Nothing breaks — the snippet simply no-ops — but no data is collected.
6. Deploy, open both hosts, and confirm traffic appears under **Reports →
   Realtime**. Navigate between two pages on the marketing site and check that
   *both* show up — that is the SPA page-view path working.

In the stream's **Enhanced measurement** settings, turn **off** "Page changes
based on browser history events". The app already sends its own page views and
leaving both on double-counts every navigation.

## Setting up Search Console

Use a **Domain property**, not a URL-prefix property. A domain property covers
`moi.technology` and every subdomain including `blog.moi.technology` in one
place, and it survives http/https and www changes.

1. In [Search Console](https://search.google.com/search-console) choose
   **Add property → Domain** and enter `moi.technology`.
2. Add the TXT record it gives you to the domain's DNS, then verify.
3. Submit both sitemaps under **Sitemaps**:
   - `https://moi.technology/sitemap.xml`
   - `https://blog.moi.technology/sitemap-index.xml`

   Both are already generated and cross-referenced from each host's
   `robots.txt`, so this is only telling Google where to look first.

If DNS is not available, verify each host separately instead:

- **Blog** — set `PUBLIC_GSC_VERIFICATION` to the token from the "HTML tag"
  method and redeploy. The blog is static HTML, so the tag is in the served
  page.
- **Marketing site** — use the **HTML file** method: drop the file Google gives
  you into `public/` and it ships at the site root. The meta-tag method will not
  work here, because Search Console does not run JavaScript and the app's
  markup is generated at runtime.

## Linking them

In GA4: **Admin → Product links → Search Console links**. This puts query and
landing-page data from Search Console into GA4 reports, which is the only way
to see which searches lead to which articles in one view.

## Still open

- **Consent.** GA4 sets cookies. There is no consent banner on either host, so
  before promoting the blog in the EU/UK, decide between a consent banner,
  cookieless configuration (`client_storage: 'none'`), or a privacy-first
  analytics tool. Worth settling before traffic arrives rather than after.
- **Bing Webmaster Tools** takes the same sitemaps and can import the Search
  Console property directly; five minutes if organic reach matters.
