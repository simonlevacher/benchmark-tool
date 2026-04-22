# Design : Playwright fallback pour sites protégés Cloudflare

## Contexte

`chooseyourboss.com` (et potentiellement d'autres sites) répond 403 avec le header `cf-mitigated: challenge`. Le scraper actuel (`fetch()` + cheerio) ne peut pas résoudre ce challenge JavaScript. L'objectif est d'ajouter Playwright comme fallback, avec une erreur explicite si le bypass échoue.

## Architecture

La route `/api/scrape` conserve son comportement actuel (`fetch()` en premier). Si une réponse 403 avec `cf-mitigated: challenge` est détectée, un second essai via Playwright est tenté. Si Playwright échoue aussi, une erreur claire est renvoyée.

```
POST /api/scrape
  └─ fetch() → 200 ✓ → parse cheerio → return data
  └─ fetch() → 403 + cf-mitigated ─→ Playwright fallback
       └─ browser.launch → page.goto → page.content() → parse cheerio → return data
       └─ erreur/timeout/toujours bloqué → return 502 "Site protégé Cloudflare"
```

## Dépendances

- **`playwright-core`** — Playwright sans browser bundlé (évite +200MB en dev)
- **`@sparticuz/chromium`** — Chromium compressé (~40MB) optimisé Lambda/Vercel

En développement local, on pointe sur le Chromium système (via `which chromium` ou le Chromium installé par playwright CLI). Sur Vercel (`process.env.VERCEL === '1'`), on utilise `@sparticuz/chromium`.

## Détails d'implémentation

### Détection Cloudflare

```ts
function isCloudflareBlock(response: Response): boolean {
  return response.status === 403 && response.headers.get('cf-mitigated') === 'challenge';
}
```

### Lancement browser selon l'environnement

```ts
async function launchBrowser() {
  if (process.env.VERCEL === '1') {
    const chromium = await import('@sparticuz/chromium');
    return playwright.launch({
      args: chromium.default.args,
      executablePath: await chromium.default.executablePath(),
      headless: true,
    });
  }
  // Dev local : Chromium installé via `npx playwright install chromium`
  return playwright.launch({ headless: true });
}
```

### Timeout

- `fetch()` : 10s (inchangé)
- Playwright : 30s total (launch + navigation + content)
- La route Vercel doit déclarer `export const maxDuration = 60` (Pro requis)

### Message d'erreur Cloudflare

Si Playwright échoue aussi :

```json
{ "error": "Ce site est protégé par Cloudflare et n'a pas pu être analysé automatiquement." }
```

## Fichiers modifiés

- `src/app/api/scrape/route.ts` — ajout du fallback Playwright
- `package.json` — ajout `playwright-core` et `@sparticuz/chromium`

## Limites connues

- **Vercel Hobby** : limite 50MB par fonction — `@sparticuz/chromium` fait ~40MB, risque de dépasser
- **Bot Fight Mode avancé** : Cloudflare peut détecter Playwright même en headless — comportement non garanti
- **Cold start** : +3-5s au premier appel après inactivité
- **Pas de test automatisé** : le bypass Cloudflare ne peut pas être testé en CI
