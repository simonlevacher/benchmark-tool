# Design : Recherche d'entreprises par mots-clés

## Contexte

L'outil demande aujourd'hui à l'utilisateur de coller une URL directement. L'objectif est d'ajouter une page de recherche où l'on tape des mots-clés, on obtient une liste d'entreprises candidates, et on clique pour lancer l'analyse sur l'une d'elles.

## Architecture

```
Page /recherche
  └─ POST /api/search { query }
       ├─ Gemini (knowledge)     → suggestions depuis base de connaissance
       └─ Gemini (search grounding) → résultats web actuels
       → merge + dédup par domaine
       → { results[], sources: { knowledge, search } }
  └─ Clic résultat → router.push("/?url=<url>") → analyse auto-démarrée
```

## Nouveaux fichiers

- `src/app/recherche/page.tsx` — page de recherche (client component)
- `src/app/api/search/route.ts` — route API orchestratrice

## Fichiers modifiés

- `src/app/page.tsx` — lire le param `?url=` au chargement et auto-démarrer l'analyse
- `src/app/layout.tsx` — ajouter "Recherche" dans la nav

## API `/api/search`

### Requête
```ts
POST /api/search
{ "query": "job board SaaS France" }
```

### Implémentation
Deux appels `Promise.allSettled` en parallèle :

1. **Gemini knowledge** — prompt demande une liste de 5 entreprises (nom + URL officielle) correspondant aux mots-clés
2. **Gemini search grounding** — même prompt avec `tools: [{ googleSearch: {} }]` pour ancrer les résultats dans une vraie recherche web

### Réponse
```ts
{
  results: {
    name: string;
    url: string;
    source: "ia" | "web";
  }[];
  sources: {
    knowledge: "ok" | "error";
    search: "ok" | "error";
  };
}
```

Déduplication : si un domaine apparaît dans les deux sources, on garde l'entrée `"web"` et on supprime le doublon `"ia"`.

### Erreurs
- Une source échoue → on retourne les résultats de l'autre + `sources` indique laquelle a échoué → HTTP 200
- Les deux échouent → HTTP 502 `{ error: "Recherche indisponible." }`
- Query vide/manquante → HTTP 400

## Page `/recherche`

### Layout
- Même structure que la homepage (header sticky, nav, main centré max-w-2xl)
- Champ texte "Mots-clés" + bouton "Rechercher"
- Enter déclenche la recherche

### États

| État | Affichage |
|------|-----------|
| Initial | Champ vide, pas de résultats |
| Loading | Indicateur pulse pendant la recherche |
| Résultats OK | Liste avec badge IA / Web par résultat |
| Résultats partiels | Warning banner + liste partielle |
| 0 résultats | "Aucun résultat pour ces mots-clés" |
| Erreur totale | Message d'erreur rouge |

### Warning banner (résultats partiels)
- `sources.knowledge === "error"` → "Suggestions IA indisponibles — résultats web uniquement"
- `sources.search === "error"` → "Recherche web indisponible — suggestions IA uniquement"

### Résultats
Chaque item :
- Nom de l'entreprise
- URL en monospace
- Badge `IA` (fond gris) ou `Web` (fond bleu nuit)
- Flèche `›` à droite

Clic → `router.push("/?url=<url>")`

## Auto-démarrage sur la homepage

`page.tsx` lit `searchParams.get("url")` au montage. Si présent :
1. Pré-remplit le champ URL
2. Déclenche automatiquement `handleAnalyze()`

## Navigation

Ajout d'un onglet "Recherche" entre "Nouveau benchmark" et "Précédents benchmarks" dans le header.

## Prompts Gemini

### Knowledge (sans grounding)
```
Liste 5 entreprises réelles correspondant à : "<query>".
Pour chaque entreprise, donne exactement :
- name: nom officiel de l'entreprise
- url: URL du site officiel (https://...)
Réponds uniquement en JSON valide : [{"name":"...","url":"..."},...]
```

### Search grounding
Même prompt, avec `tools: [{ googleSearch: {} }]` dans la config du modèle.
