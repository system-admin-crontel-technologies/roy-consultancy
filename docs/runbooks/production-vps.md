# Production on the shared VPS

- Host: `hostinger_vps_200_141_1_62` (SSH alias), path `/srv/www/royconsultancy.in` (git clone of this repo).
- Domain: `royconsultancy.in` (www redirects to the apex), served by the host's Caddy from
  `/etc/caddy/Caddyfile`, proxying to the web container on `127.0.0.1:8160`.
- Secrets live only in `/srv/www/royconsultancy.in/.env` on the server (mode 600), never in git.

## Deploy an update

```sh
ssh hostinger_vps_200_141_1_62
cd /srv/www/royconsultancy.in
git pull
docker compose -f infra/docker/compose.yml -f infra/docker/compose.prod.yml --env-file .env up -d --build
```

Migrations run automatically when the API container starts.

## Caddy changes

Back up first (`cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.bak-$(date +%Y%m%d-%H%M%S)-<reason>`),
then `caddy validate --config /etc/caddy/Caddyfile` before `systemctl reload caddy`. Other sites share this file.

## Known gaps

- Email goes to the Mailpit container until real SMTP is set in `.env` (`SMTP_*` and the compose
  `api` service). Read captured mail with `ssh -L 8035:127.0.0.1:8035 hostinger_vps_200_141_1_62`.
- Public-site contact details (`NEXT_PUBLIC_*` other than the site URL) are not yet passed into the
  web image build, so the site shows the design placeholders.
