# Cloudflare Playwright Fallback — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter Playwright comme fallback quand un site répond 403 avec un challenge Cloudflare, avec un message d'erreur clair si Playwright échoue aussi.

**Architecture:** `fetch()` reste le premier essai. Si la réponse est 403 + header `cf-mitigated: challenge`, on tente un scrape via Playwright. Sur Vercel (`VERCEL=1`), `@sparticuz/chromium` fournit le binaire Linux. En local macOS, on pointe sur Chrome installé. Si Playwright échoue, on retourne une erreur explicite.

**Tech Stack:** `playwright-core`, `@sparticuz/chromium`, Next.js 16 route segment config (`maxDuration`)

---

### Task 1 : Installer les dépendances

**Files:**
- Modify: `package.json`

- [ ] **Step 1 : Installer les packages**

```bash
npm install playwright-core @sparticuz/chromium
```

- [ ] **Step 2 : Vérifier l'installation**

```bash
grep -E '"playwright-core"|"@sparticuz/chromium"' package.json
```

Résultat attendu :
```
    "@sparticuz/chromium": "...",
    "playwright-core": "...",
```

- [ ] **Step 3 : Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add playwright-core and @sparticuz/chromium for Cloudflare fallback"
```

---

### Task 2 : Ajouter le fallback Playwright dans la route scrape

**Files:**
- Modify: `src/app/api/scrape/route.ts`

- [ ] **Step 1 : Lire le fichier actuel**

Lire `src/app/api/scrape/route.ts` en entier avant toute modification.

- [ ] **Step 2 : Ajouter `maxDuration` et les helpers après les imports existants**

Ajouter juste après `export const dynamic = "force-dynamic";` :

```typescript
export const maxDuration = 60;

function isCloudflareBlock(response: Response): boolean {
  return response.status === 403 && response.headers.get("cf-mitigated") === "challenge";
}

async function scrapeWithPlaywright(url: string): Promise<string> {
  const { chromium } = await import("playwright-core");

  let executablePath: string | undefined;
  let args: string[] = [];

  if (process.env.VERCEL === "1") {
    const chromiumLib = await import("@sparticuz/chromium");
    executablePath = await chromiumLib.default.executablePath();
    args = chromiumLib.default.args;
  } else {
    executablePath =
      process.env.CHROMIUM_EXECUTABLE_PATH ??
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  }

  const browser = await chromium.launch({ executablePath, args, headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25_000 });
    return await page.content();
  } finally {
    await browser.close();
  }
}
```

- [ ] **Step 3 : Changer la déclaration de `html` pour éviter l'erreur TypeScript**

Remplacer :
```typescript
  let html: string;
```

Par :
```typescript
  let html!: string;
```

(Le `!` est une assertion d'assignation — TypeScript ne peut pas tracer tous les chemins de retour anticipé, mais on sait que `html` est toujours assignée avant d'être utilisée.)

- [ ] **Step 4 : Remplacer le bloc `!response.ok` par la logique Cloudflare-aware**

Remplacer :
```typescript
    if (!response.ok) {
      return NextResponse.json(
        { error: `Le site a répondu avec le statut ${response.status}.` },
        { status: 502 }
      );
    }

    html = await response.text();
```

Par :
```typescript
    if (isCloudflareBlock(response)) {
      try {
        html = await scrapeWithPlaywright(parsedUrl.toString());
      } catch {
        return NextResponse.json(
          { error: "Ce site est protégé par Cloudflare et n'a pas pu être analysé automatiquement." },
          { status: 502 }
        );
      }
    } else if (!response.ok) {
      return NextResponse.json(
        { error: `Le site a répondu avec le statut ${response.status}.` },
        { status: 502 }
      );
    } else {
      html = await response.text();
    }
```

- [ ] **Step 5 : Vérifier la compilation TypeScript**

```bash
npx tsc --noEmit
```

Résultat attendu : aucune erreur.

- [ ] **Step 6 : Tester en local avec chooseyourboss.com**

Dans un terminal, démarrer le serveur :
```bash
npm run dev
```

Dans un autre terminal :
```bash
curl -s -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.chooseyourboss.com/"}' | jq .
```

**Si Playwright bypass Cloudflare**, résultat attendu :
```json
{
  "url": "https://www.chooseyourboss.com/",
  "title": "...",
  "metaDescription": "...",
  "headings": [...],
  "paragraphs": [...]
}
```

**Si Cloudflare détecte Playwright**, résultat attendu :
```json
{ "error": "Ce site est protégé par Cloudflare et n'a pas pu être analysé automatiquement." }
```

- [ ] **Step 7 : Commit**

```bash
git add src/app/api/scrape/route.ts
git commit -m "feat: Playwright fallback for Cloudflare-protected sites with explicit error"
```
