# Option B demo — Ghost 6 (what Logos runs)

This folder is the deployable shape of **Option B** from the blog platform
decision: self-hosted Ghost on the VM the CI pipeline already deploys the
website to. Ghost is MIT-licensed, so this path is $0 in hosting and
licenses — the real costs are **ops** (updates, backups, TLS) and **theming**
(the front-end ships as default Casper, not MOI's design).

## Deploy on the VM

```bash
cd demo/ghost
cat > .env <<'EOF'
GHOST_DB_PASSWORD=<generate one>
MYSQL_ROOT_PASSWORD=<generate one>
EOF
docker compose up -d
```

Nginx virtual host for `blog.moi.technology`:

```nginx
server {
    listen 80;
    server_name blog.moi.technology;

    location / {
        proxy_pass http://127.0.0.1:2368;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

TLS: `certbot --nginx -d blog.moi.technology` after DNS points at the VM.
First visit `https://blog.moi.technology/ghost` to create the owner account.

## Backups (nightly cron)

```cron
0 3 * * * docker compose -f /path/to/demo/ghost/docker-compose.yml exec -T db \
  mysqldump -u ghost -p"$GHOST_DB_PASSWORD" ghost | gzip > /backups/ghost-$(date +\%F).sql.gz
15 3 * * * docker run --rm -v ghost_ghost-content:/content -v /backups:/out alpine \
  tar czf /out/ghost-content-$(date +\%F).tgz -C /content .
```

## Honest caveats (why this is Option B, not A)

- **Posts live in the database**, edited in Ghost's admin UI. The PR-per-post
  review flow is gone; "backup" replaces "version control".
- **Default look is Casper** (see the demo screenshots) — matching MOI's
  cream/ink design means building a custom Handlebars theme, or going
  headless with a custom frontend (which is the entire Logos Press Engine
  project).
- **You own the service**: Ghost updates, MySQL, disk, TLS renewals.

## How the sandbox demo was produced

The comparison screenshots were taken against a real Ghost 6.57 instance.
Docker Hub image pulls were blocked in the sandbox, so it was run from the
npm tarball instead (same code): extract `npm pack ghost`, install its deps
with `corepack pnpm install --prod` (Ghost 6 pins pnpm via `packageManager`;
a plain `npm install ghost` fails on its vendored `file:` tarballs), then
`NODE_ENV=development node index.js` (SQLite, port 2368). Note Ghost enforces
its configured origin — visit it at `localhost:2368`, not `127.0.0.1:2368`.
