# Company Search — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une page de recherche d'entreprises par mots-clés qui appelle Gemini (knowledge + search grounding) et permet de lancer l'analyse en un clic.

**Architecture:** Une route `/api/search` orchestre deux appels Gemini en parallèle (`Promise.allSettled`), merge et déduplique les résultats par domaine. La page `/recherche` affiche les résultats avec badge source IA/Web et erreurs remontées. Un clic navigue vers `/?url=<url>` où l'analyse démarre automatiquement.

**Tech Stack:** Next.js 16, `@google/generative-ai` (déjà installé), `gemini-2.5-flash`, Google Search grounding

---

### Task 1 : Route `/api/search`

**Files:**
- Create: `src/app/api/search/route.ts`

- [ ] **Step 1 : Créer le fichier**

Créer `src/app/api/search/route.ts` avec le contenu suivant :

```typescript
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

type SearchResult = {
  name: string;
  url: string;
  source: "ia" | "web";
};

type SearchResponse = {
  results: SearchResult[];
  sources: {
    knowledge: "ok" | "error";
    search: "ok" | "error";
  };
};

function buildSearchPrompt(query: string): string {
  return `Liste 5 entreprises réelles correspondant à : "${query}".
Pour chaque entreprise, donne le nom officiel et l'URL du site officiel.
Réponds UNIQUEMENT avec un tableau JSON valide, sans markdown, sans explication :
[{"name":"Nom Entreprise","url":"https://site-officiel.com"},...]`;
}

async function callGemini(query: string, withGrounding: boolean): Promise<SearchResult[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY non définie.");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(withGrounding ? { tools: [{ googleSearch: {} } as any] } : {}),
  });

  const result = await model.generateContent(buildSearchPrompt(query));
  const text = result.response.text().trim();
  const clean = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
  const parsed = JSON.parse(clean) as { name: string; url: string }[];
  const source: "ia" | "web" = withGrounding ? "web" : "ia";
  return parsed.map((item) => ({ ...item, source }));
}

function dedup(results: SearchResult[]): SearchResult[] {
  const seen = new Map<string, SearchResult>();
  for (const item of results) {
    try {
      const hostname = new URL(item.url).hostname.replace(/^www\./, "");
      if (!seen.has(hostname) || item.source === "web") {
        seen.set(hostname, item);
      }
    } catch {
      // URL invalide — on ignore
    }
  }
  return Array.from(seen.values());
}

export async function POST(req: NextRequest) {
  let body: { query?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide." }, { status: 400 });
  }

  const { query } = body;
  if (!query || typeof query !== "string" || !query.trim()) {
    return NextResponse.json({ error: "Champ 'query' manquant." }, { status: 400 });
  }

  const [knowledgeResult, searchResult] = await Promise.allSettled([
    callGemini(query.trim(), false),
    callGemini(query.trim(), true),
  ]);

  const knowledgeOk = knowledgeResult.status === "fulfilled";
  const searchOk = searchResult.status === "fulfilled";

  if (!knowledgeOk && !searchOk) {
    return NextResponse.json(
      { error: "Recherche indisponible. Veuillez réessayer." },
      { status: 502 }
    );
  }

  const combined: SearchResult[] = [
    ...(knowledgeOk ? knowledgeResult.value : []),
    ...(searchOk ? searchResult.value : []),
  ];

  const response: SearchResponse = {
    results: dedup(combined),
    sources: {
      knowledge: knowledgeOk ? "ok" : "error",
      search: searchOk ? "ok" : "error",
    },
  };

  return NextResponse.json(response);
}
```

- [ ] **Step 2 : Vérifier la compilation TypeScript**

```bash
npx tsc --noEmit
```

Résultat attendu : seule l'erreur pré-existante sur `seed/route.js` (stale Next.js types), aucune erreur dans le nouveau fichier.

- [ ] **Step 3 : Tester la route**

Démarrer le serveur si pas déjà démarré :
```bash
npm run dev
```

Dans un autre terminal (après authentification dans le browser) :
```bash
curl -s -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"job board SaaS France"}' | jq .
```

Résultat attendu (forme) :
```json
{
  "results": [
    { "name": "Welcome to the Jungle", "url": "https://welcometothejungle.com", "source": "ia" },
    { "name": "Indeed France", "url": "https://indeed.fr", "source": "web" }
  ],
  "sources": { "knowledge": "ok", "search": "ok" }
}
```

- [ ] **Step 4 : Tester le cas 400 (query vide)**

```bash
curl -s -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
```

Résultat attendu :
```json
{ "error": "Champ 'query' manquant." }
```

- [ ] **Step 5 : Commit**

```bash
git add src/app/api/search/route.ts
git commit -m "feat: add /api/search route with Gemini knowledge + search grounding"
```

---

### Task 2 : Ajout de l'onglet "Recherche" dans la navigation

**Files:**
- Modify: `src/app/page.tsx:177-190`
- Modify: `src/app/history/page.tsx:90-103`

- [ ] **Step 1 : Lire les deux fichiers**

Lire `src/app/page.tsx` et `src/app/history/page.tsx` avant toute modification.

- [ ] **Step 2 : Ajouter l'onglet dans `page.tsx`**

Dans `src/app/page.tsx`, remplacer le bloc `<nav className="flex">` (qui contient 2 `<a>`) par :

```tsx
        <nav className="flex">
          <a
            href="/"
            className="flex-1 py-4 px-8 text-xs font-semibold tracking-[0.15em] uppercase border-b-2 border-black bg-black text-white transition-colors text-center"
          >
            Nouveau benchmark
          </a>
          <a
            href="/recherche"
            className="flex-1 py-4 px-8 text-xs font-medium tracking-[0.15em] uppercase border-b-2 border-transparent text-neutral-500 hover:text-black hover:border-neutral-300 transition-colors text-center"
          >
            Recherche
          </a>
          <a
            href="/history"
            className="flex-1 py-4 px-8 text-xs font-medium tracking-[0.15em] uppercase border-b-2 border-transparent text-neutral-500 hover:text-black hover:border-neutral-300 transition-colors text-center"
          >
            Précédents benchmarks
          </a>
        </nav>
```

- [ ] **Step 3 : Ajouter l'onglet dans `history/page.tsx`**

Dans `src/app/history/page.tsx`, remplacer le bloc `<nav className="flex">` par :

```tsx
        <nav className="flex">
          <a
            href="/"
            className="flex-1 py-4 px-8 text-xs font-medium tracking-[0.15em] uppercase border-b-2 border-transparent text-neutral-500 hover:text-black hover:border-neutral-300 transition-colors text-center"
          >
            Nouveau benchmark
          </a>
          <a
            href="/recherche"
            className="flex-1 py-4 px-8 text-xs font-medium tracking-[0.15em] uppercase border-b-2 border-transparent text-neutral-500 hover:text-black hover:border-neutral-300 transition-colors text-center"
          >
            Recherche
          </a>
          <a
            href="/history"
            className="flex-1 py-4 px-8 text-xs font-semibold tracking-[0.15em] uppercase border-b-2 border-black bg-black text-white transition-colors text-center"
          >
            Précédents benchmarks
          </a>
        </nav>
```

- [ ] **Step 4 : Vérifier dans le browser**

Ouvrir http://localhost:3000 — vérifier que 3 onglets apparaissent dans la nav : "Nouveau benchmark" (actif/noir), "Recherche" (gris), "Précédents benchmarks" (gris).

- [ ] **Step 5 : Commit**

```bash
git add src/app/page.tsx src/app/history/page.tsx
git commit -m "feat: add Recherche nav tab to homepage and history"
```

---

### Task 3 : Auto-démarrage de l'analyse depuis le paramètre `?url=`

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1 : Lire `src/app/page.tsx`**

Lire le fichier complet avant modification.

- [ ] **Step 2 : Modifier `handleAnalyze` pour accepter une URL en paramètre**

Remplacer :
```typescript
  async function handleAnalyze() {
    if (!url.trim() || loading) return;

    const trimmedUrl = url.trim();
```

Par :
```typescript
  async function handleAnalyze(overrideUrl?: string) {
    const trimmedUrl = (overrideUrl ?? url).trim();
    if (!trimmedUrl || loading) return;
```

Le reste de la fonction est inchangé — elle utilise déjà `trimmedUrl` partout.

Concrètement, chercher dans le corps de la fonction toutes les occurrences de `url.trim()` et les remplacer par `trimmedUrl`, et `const trimmedUrl = url.trim();` si elle existe déjà.

- [ ] **Step 3 : Ajouter le `useEffect` d'auto-démarrage**

Juste après la déclaration des états (après les lignes `const [existingReport, ...] = useState(...)`), ajouter :

```typescript
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get("url");
    if (urlParam) {
      setUrl(urlParam);
      handleAnalyze(urlParam);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
```

- [ ] **Step 4 : Vérifier la compilation TypeScript**

```bash
npx tsc --noEmit
```

Résultat attendu : seule l'erreur pré-existante sur `seed/route.js`.

- [ ] **Step 5 : Tester manuellement**

Dans le browser, naviguer vers `http://localhost:3000/?url=https://example.com`. L'analyse doit démarrer automatiquement sans cliquer sur "Analyser".

- [ ] **Step 6 : Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: auto-start analysis from ?url= query param"
```

---

### Task 4 : Page `/recherche`

**Files:**
- Create: `src/app/recherche/page.tsx`

- [ ] **Step 1 : Créer le fichier**

Créer `src/app/recherche/page.tsx` avec le contenu suivant :

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SearchResult = {
  name: string;
  url: string;
  source: "ia" | "web";
};

type SearchResponse = {
  results: SearchResult[];
  sources: {
    knowledge: "ok" | "error";
    search: "ok" | "error";
  };
};

export default function RecherchePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [sources, setSources] = useState<SearchResponse["sources"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    if (!query.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResults(null);
    setSources(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Recherche indisponible.");
        return;
      }
      setResults(data.results);
      setSources(data.sources);
    } catch {
      setError("Impossible de joindre le serveur.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch();
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="sticky top-0 z-50 border-b border-black bg-white">
        <div className="px-8 py-5 border-b border-neutral-200">
          <span className="text-xs font-medium tracking-[0.2em] uppercase">
            Benchmark Tool by Hellowork
          </span>
        </div>
        <nav className="flex">
          <a
            href="/"
            className="flex-1 py-4 px-8 text-xs font-medium tracking-[0.15em] uppercase border-b-2 border-transparent text-neutral-500 hover:text-black hover:border-neutral-300 transition-colors text-center"
          >
            Nouveau benchmark
          </a>
          <a
            href="/recherche"
            className="flex-1 py-4 px-8 text-xs font-semibold tracking-[0.15em] uppercase border-b-2 border-black bg-black text-white transition-colors text-center"
          >
            Recherche
          </a>
          <a
            href="/history"
            className="flex-1 py-4 px-8 text-xs font-medium tracking-[0.15em] uppercase border-b-2 border-transparent text-neutral-500 hover:text-black hover:border-neutral-300 transition-colors text-center"
          >
            Précédents benchmarks
          </a>
        </nav>
      </header>

      <main className="flex-1 px-8 py-24">
        <div className="w-full max-w-2xl mx-auto">
          <div className="mb-16">
            <div className="w-8 h-px bg-black mb-8" />
            <h1 className="text-4xl font-medium tracking-tight leading-tight mb-5">
              Recherche d'entreprises
            </h1>
            <p className="text-base text-neutral-500 leading-relaxed max-w-lg">
              Tapez des mots-clés pour trouver des entreprises à analyser.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <label
              htmlFor="query"
              className="text-xs font-medium tracking-[0.15em] uppercase text-neutral-500"
            >
              Mots-clés
            </label>
            <div className="flex">
              <input
                id="query"
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setError(null); }}
                onKeyDown={handleKeyDown}
                placeholder="ex: job board SaaS France"
                disabled={loading}
                className="flex-1 border border-r-0 border-black px-4 py-3.5 text-sm bg-white outline-none placeholder:text-neutral-300 focus:bg-neutral-50 transition-colors disabled:text-neutral-400"
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={!query.trim() || loading}
                className="bg-black text-white text-xs font-medium tracking-[0.2em] uppercase px-7 py-3.5 hover:bg-neutral-800 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {loading ? "Recherche…" : "Rechercher"}
              </button>
            </div>
            {error && (
              <p className="text-xs text-red-500 tracking-wide">{error}</p>
            )}
          </div>

          {loading && (
            <div className="mt-12 flex items-center gap-4">
              <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
              <p className="text-sm text-black tracking-wide">Recherche en cours…</p>
            </div>
          )}

          {results !== null && !loading && (
            <div className="mt-12">
              {sources?.knowledge === "error" && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-4 py-3 mb-4 tracking-wide">
                  Suggestions IA indisponibles — résultats web uniquement
                </p>
              )}
              {sources?.search === "error" && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-4 py-3 mb-4 tracking-wide">
                  Recherche web indisponible — suggestions IA uniquement
                </p>
              )}

              {results.length === 0 ? (
                <p className="text-sm text-neutral-400 mt-4">
                  Aucun résultat pour ces mots-clés.
                </p>
              ) : (
                <div className="border-t border-black">
                  {results.map((item, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => router.push(`/?url=${encodeURIComponent(item.url)}`)}
                      className="w-full flex items-center gap-4 py-5 border-b border-neutral-200 hover:bg-neutral-50 text-left transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium mb-1">{item.name}</p>
                        <p className="text-xs font-mono text-neutral-500 truncate">{item.url}</p>
                      </div>
                      <span
                        className={`text-[10px] font-medium tracking-[0.12em] uppercase px-2 py-0.5 flex-shrink-0 ${
                          item.source === "web"
                            ? "bg-neutral-800 text-white"
                            : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {item.source === "web" ? "Web" : "IA"}
                      </span>
                      <svg
                        className="text-neutral-300 group-hover:text-black transition-colors flex-shrink-0"
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M2 6h8M6 2l4 4-4 4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-neutral-200 px-8 py-4">
        <p className="text-xs text-neutral-400 tracking-wide">
          Usage interne uniquement — {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
```

- [ ] **Step 2 : Vérifier la compilation TypeScript**

```bash
npx tsc --noEmit
```

Résultat attendu : seule l'erreur pré-existante sur `seed/route.js`.

- [ ] **Step 3 : Tester dans le browser**

Ouvrir http://localhost:3000/recherche. Vérifier :
- L'onglet "Recherche" est actif (noir)
- Le champ et le bouton sont présents
- Taper "job board SaaS France" + Enter → liste de résultats avec badges IA/Web
- Cliquer un résultat → redirige vers `/` avec l'URL pré-remplie et l'analyse démarre

- [ ] **Step 4 : Commit**

```bash
git add src/app/recherche/page.tsx
git commit -m "feat: add /recherche page with keyword search and company results"
```
