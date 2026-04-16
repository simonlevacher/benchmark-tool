"use client";

import { useState } from "react";

const PASSWORD = "benchmark2024";

export default function Home() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState(false);
  const [url, setUrl] = useState("");

  function handleLogin(e: React.SyntheticEvent) {
    e.preventDefault();
    if (password === PASSWORD) {
      setAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setPassword("");
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="border-b border-black px-8 py-5 flex items-center justify-between">
          <span className="text-xs font-medium tracking-[0.2em] uppercase">
            Benchmark Tool
          </span>
          <span className="text-xs text-neutral-400 tracking-widest uppercase">
            Accès restreint
          </span>
        </header>

        <main className="flex-1 flex items-center justify-center px-8">
          <div className="w-full max-w-sm">
            <div className="mb-12">
              <div className="w-8 h-px bg-black mb-8" />
              <h1 className="text-2xl font-medium tracking-tight leading-tight mb-3">
                Connexion
              </h1>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Cet outil est réservé à un usage interne.
                <br />
                Entrez le mot de passe pour continuer.
              </p>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="password"
                  className="text-xs font-medium tracking-[0.15em] uppercase text-neutral-500"
                >
                  Mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(false);
                  }}
                  placeholder="••••••••••••"
                  autoFocus
                  className={`w-full border px-4 py-3 text-sm font-mono bg-white outline-none transition-colors placeholder:text-neutral-300 ${
                    error
                      ? "border-red-500 focus:border-red-500"
                      : "border-black focus:border-black"
                  }`}
                />
                {error && (
                  <p className="text-xs text-red-500 tracking-wide">
                    Mot de passe incorrect.
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-black text-white text-xs font-medium tracking-[0.2em] uppercase py-3.5 hover:bg-neutral-800 transition-colors"
              >
                Accéder
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-black px-8 py-5 flex items-center justify-between">
        <span className="text-xs font-medium tracking-[0.2em] uppercase">
          Benchmark Tool
        </span>
        <button
          onClick={() => setAuthenticated(false)}
          className="text-xs text-neutral-400 tracking-widest uppercase hover:text-black transition-colors"
        >
          Déconnexion
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-8 py-24">
        <div className="w-full max-w-2xl">
          <div className="mb-16">
            <div className="w-8 h-px bg-black mb-8" />
            <h1 className="text-4xl font-medium tracking-tight leading-tight mb-5">
              Analyse concurrentielle
            </h1>
            <p className="text-base text-neutral-500 leading-relaxed max-w-lg">
              Analysez et comparez les performances d'un site web face à ses
              concurrents. Collez une URL pour démarrer l'analyse.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <label
              htmlFor="url"
              className="text-xs font-medium tracking-[0.15em] uppercase text-neutral-500"
            >
              URL à analyser
            </label>
            <div className="flex gap-0">
              <input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://exemple.com"
                className="flex-1 border border-r-0 border-black px-4 py-3.5 text-sm font-mono bg-white outline-none placeholder:text-neutral-300 focus:bg-neutral-50 transition-colors"
              />
              <button
                type="button"
                disabled={!url.trim()}
                className="bg-black text-white text-xs font-medium tracking-[0.2em] uppercase px-7 py-3.5 hover:bg-neutral-800 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Analyser
              </button>
            </div>
            <p className="text-xs text-neutral-400">
              Formats acceptés — https://domaine.com · https://www.domaine.com
            </p>
          </div>
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
