# Shared Session Cookie Across Subdomains

## Current State

Each pankosmia Netlify site runs its own OAuth flow and gets its own
`pankosmia_session` cookie. Users must sign in separately on each site.

This works because the Railway backend already supports multiple
frontends via `PANKOSMIA_ALLOWED_ORIGINS` and resolves the correct
origin from the `X-Forwarded-Host` header.

## Goal

When the platform moves to a custom domain (e.g. `pankosmia.org`),
sites like `app.pankosmia.org` and `obs.pankosmia.org` should share
a single session — sign in once, authenticated everywhere.

## What Needs to Change

### 1. Backend: Set `Domain` on the Session Cookie

File: `pankosmia-docker/src/auth/session.rs`

The cookie is currently built without a `Domain` attribute:

```rust
let cookie = Cookie::build((SESSION_COOKIE_NAME, github_user_id.to_string()))
    .http_only(true)
    .secure(use_secure_cookies())
    .same_site(SameSite::Lax)
    .path("/")
    .build();
```

Add `.domain(".pankosmia.org")` (leading dot = all subdomains):

```rust
let cookie = Cookie::build((SESSION_COOKIE_NAME, github_user_id.to_string()))
    .http_only(true)
    .secure(use_secure_cookies())
    .same_site(SameSite::Lax)
    .path("/")
    .domain(".pankosmia.org")
    .build();
```

To avoid hardcoding, derive the domain from the existing
`PANKOSMIA_PUBLIC_ORIGIN` env var or add a new
`PANKOSMIA_COOKIE_DOMAIN` env var.

The same change is needed for the `pankosmia_oauth_state` cookie in
`set_oauth_state`, so the CSRF state cookie also carries across
subdomains during the OAuth round-trip.

### 2. Backend: Same `ROCKET_SECRET_KEY` Across All Origins

The session cookie is signed using Rocket's private cookie support.
All frontends proxy to the same Railway backend, so this is already
the case — there is only one backend instance. No change needed here
unless the architecture splits into multiple backend instances.

### 3. DNS: Configure Subdomains

Set up DNS records pointing each subdomain to its Netlify site:

| Subdomain | Netlify Site |
|---|---|
| `app.pankosmia.org` | Main pankosmia site |
| `obs.pankosmia.org` | OBS editor (this repo) |

Each Netlify site needs the custom domain configured in its site
settings (Settings > Domain management > Add custom domain).

### 4. Railway: Update Allowed Origins

Update the `PANKOSMIA_ALLOWED_ORIGINS` env var to include the new
subdomain URLs:

```
PANKOSMIA_ALLOWED_ORIGINS=https://app.pankosmia.org,https://obs.pankosmia.org
```

### 5. GitHub OAuth App: Update Callback URL

The GitHub OAuth App's callback URL must accept callbacks from
the new domain. GitHub allows one callback URL but permits
additional ones via the authorization request's `redirect_uri`.

The backend constructs the callback URL from `ResolvedOrigin`
(see `oauth_flow.rs:callback_url_for`), so this works
automatically as long as the GitHub OAuth App's callback URL
is set to one of the allowed origins (e.g.
`https://app.pankosmia.org/auth/callback`) and GitHub's OAuth
settings allow the additional subdomain origin.

## Migration Path

1. Register the custom domain and configure DNS
2. Add `PANKOSMIA_COOKIE_DOMAIN` env var to Railway (e.g. `.pankosmia.org`)
3. Update `set_session` and `set_oauth_state` to use it
4. Update `PANKOSMIA_ALLOWED_ORIGINS` with the new URLs
5. Update the GitHub OAuth App callback URL
6. Deploy backend, then update Netlify site domains
7. Verify: sign in on `app.pankosmia.org`, navigate to
   `obs.pankosmia.org` — should be authenticated without
   signing in again
