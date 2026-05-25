# Frostbalance — A Cold Ledger

You're an accountant stranded in a post-apocalyptic, frozen world. Each day you pick what to forage for — **food, fuel, shelter, or medicine** — and reconcile a prepaid expense schedule against the trial balance to bring supplies home. The trial balance and your schedule disagree by exactly $0.01, $0.02, $0.11, $0.20, or $1.50. Find the wrong row. Pick the right fix. Beat dusk.

A puzzle-survival game about prepaid amortization, designed to feel like a printed document recovered from a cold place.

---

## Play / Controls

**The loop**

1. **Briefing.** Pick a resource to forage for. Read today's journal entry. See which sites are scavengable.
2. **Reconcile.** A 90–180s timer starts (longer at higher tiers). On the left, a schedule of monthly amortization entries; on the right, the multiple-choice fix options. The trial balance is the source of truth — your schedule total doesn't match it. Click the row that's off, pick the right fix, submit before time runs out.
3. **Receipt.** A correct solve returns 1–5 units of your foraged resource (faster = more). A wrong submission costs 10 seconds; a timeout returns empty-handed.
4. **Sleep.** Every resource decays by 1 each night. Any resource at zero ends the run.

**Per-resource math on a successful day:** `ending = beginning + earned − 1`.

**Hints.** Tiers 2+ let you spend 1 fuel to mark a clean row as ruled-out. Tier 4 grants up to 3 hints.

**Bosses.** Day 13+ unlocks tier 5: a "Final Audit" with **two errors** in one consolidated schedule. The discrepancy is the sum of both — solve them sequentially, the timer never stops.

**Controls.** Pointer / touch only. Everything is clickable; nothing is hidden behind a hotkey. Preferences include sound toggle + volume, a dyslexia-friendly font, high-contrast row highlights, and reduced motion.

**Sites unlock with time.** Day 1: Abandoned CPA Office. Day 4: Frozen Warehouse. Day 8: IRS Bunker. Each site has its own scenario flavors (insurance, federal lease, cold storage, etc.).

---

## Build

```bash
npm install
npm run dev          # http://localhost:5173 — full sound, hot reload
npm run build        # production build, no music shipped (license-safe public build)
npm run preview      # serve the built dist/ locally
npm run lint         # eslint
```

**Environment variables**

| Name | Default | Effect |
|---|---|---|
| `VITE_SHIP_MUSIC` | unset | When `=true`, bundles the soundtrack mp3s into `dist/music/`. Default (unset / any other value) strips them — the Vite plugin in `vite.config.ts` deletes `dist/music/` and `audio/config.ts` sets every track URL to `null`. The deployed Cloudflare Pages build leaves this unset. |

**Deploy** (Cloudflare Pages settings used for the live build)

| Setting | Value |
|---|---|
| Framework preset | Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `frostbalance` |
| Build watch paths | `frostbalance/*` |
| `NODE_VERSION` | `22` |

---

## Tech

- **React 18 + TypeScript** via **Vite**
- **No backend, no database.** Resources, personal best, and preferences persist in `localStorage`.
- **Web Audio API** for synthesized SFX (ice-tap, wrong thunk, eureka chime, timeout horn, countdown tick, hint burn, sleep whoosh). One master `DynamicsCompressor` + makeup gain so cues are audible on phone speakers. Music (when bundled) is a thin `HTMLAudioElement` wrapper with crossfade + ducking.
- **Canvas** for the weather-driven snow particle layer. Per-weather density and speed scale with the puzzle timer.
- **SVG** for the chrome and registration marks. No raster art shipped in the page itself; the favicon and OG card are rasterized from SVG.
- **Typography:** Archivo Black (display), Archivo (body), JetBrains Mono (numbers + labels), Atkinson Hyperlegible (accessibility toggle). All via Google Fonts.
- **Design system:** "Cold Paper" — bone-blue paper, 1px hairline rules, no `border-radius` outside radio circles, no drop shadows, one ice-blue accent used sparingly, one rusted warn red used only for danger.

```
src/
  engine/        puzzle generator, types, survival math, journal, locations
  components/    chrome, inventory strip, dusk meter, snow particles, modals
    puzzles/     per-kind puzzle views (PrepaidPuzzleView, …)
  audio/         sfx synthesis, music manager, config (URL gating)
  App.tsx        orchestrator
  App.css        cold-paper design system
public/
  music/         soundtrack (excluded from public builds; see VITE_SHIP_MUSIC)
  favicon.svg, og-image.png, apple-touch-icon.png
```

The puzzle engine is polymorphic on a `PuzzleKind` discriminated union. Today the union has one variant (`prepaid`); each Location declares which kinds it can serve via `puzzleKinds: PuzzleKind[]`. New puzzle types (bank reconciliation, inventory variance, sales tax calc) add a variant + a generator + a view component without touching the surrounding game shell.

---

## License

**Code:** All rights reserved by the author (Woolichooks). Open an issue or PR before reusing.

**Soundtrack — *not* bundled in the public build.** The four mp3s in `public/music/` (Ian Post — "Breaking Point", Mac A DeMia — "Smoothie Moody", Out of Flux — "Cinnamon", sero — "End of the Road") carry an **Artlist Social License** that covers personal social-network uploads only, not hosted web/app distribution. The default `npm run build` strips them from `dist/`. Do not flip `VITE_SHIP_MUSIC=true` on a public deploy without an upgraded Artlist tier that covers interactive media.

**Fonts:** Archivo Black, Archivo, JetBrains Mono, Atkinson Hyperlegible — all SIL Open Font License via Google Fonts. No bundling required.

Built by **[Woolichooks](https://woolichooks.com/)**. Software: **Claude Code**.
