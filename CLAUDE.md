# CLAUDE.md

Guidance for working in this repo. See [README.md](README.md) for first-time setup and the
exact local-dev commands; this file covers architecture, conventions, and gotchas that aren't
obvious from reading individual files.

## What this is

A FIFA World Cup 2026 prediction competition site (Swedish UI, "Trivseltipset"). Users predict
group-stage scorelines and a knockout bracket; the admin enters real results and the app scores
everyone automatically. Tournament kicks off **11 June 2026**, so during development most point
totals are 0.

## Architecture

Two independently deployed apps:

- **`frontend/`** — React 19 + Vite 8 SPA, React Router 7. Plain inline-style objects per
  component (no CSS framework); shared/structural CSS lives in [frontend/src/index.css](frontend/src/index.css).
  Flag images via `flag-icons` (`<span className="fi fi-se" />`).
- **`api/`** — Azure Functions v4 programming model (`@azure/functions` ^4, CommonJS).
  Each endpoint is a file in [api/src/functions/](api/src/functions/) that calls `app.http(...)`;
  [api/index.js](api/index.js) just `require`s every function file to register them. Shared logic
  lives in [api/src/shared/](api/src/shared/).

Data store is **Azure Table Storage** (Azurite locally). Tables are created in
[api/src/shared/tableClient.js](api/src/shared/tableClient.js): `users`, `magicTokens`, `matches`,
`predictions`, `playoffPredictions`, `results`.

In production the frontend is an Azure Static Web App with a **linked backend** Function App;
SWA routes `/api/*` to it transparently. Locally, Vite proxies `/api/*` → `localhost:7071` so the
HttpOnly auth cookie works across ports. The frontend always calls relative `/api/...`
(see [frontend/src/api.js](frontend/src/api.js) — the single API client; add new endpoints there).

## Auth

Magic-link → JWT in an **HttpOnly `auth` cookie**. All `fetch`es use `credentials: 'include'`.
Server side, [api/src/shared/authMiddleware.js](api/src/shared/authMiddleware.js) provides
`verifyAuth` (401 if missing), `tryAuth` (returns null instead of throwing — used by endpoints
that work logged-out, e.g. `getMatches`), and `verifyAdmin`. Admin is whoever matches the
`ADMIN_EMAIL` env var (single admin, by email).

## The bracket — keep two files in sync

Knockout logic is duplicated so each app can compute brackets without a round-trip:

- [api/src/shared/bracket.js](api/src/shared/bracket.js) (CommonJS)
- [frontend/src/lib/bracket.js](frontend/src/lib/bracket.js) (ESM)

**These are mirrors — when you change one, change the other.** Same goes for the
`thirdPlaceMatrix.json` copy in each tree. `buildBracket(matches, predictions, picks)` derives
group standings from predicted scores, resolves the 8 best third-place teams via the Annex C
matrix, then walks `KO_MATCHES` (matches 73–104) applying the user's winner picks. It returns
`{ matches, champion, allComplete }`. `BRACKET_LAYOUT` defines top-to-bottom match order per round
so the CSS flex tree draws connected feeder lines — don't reorder it casually.

## Scoring (server-side only)

[api/src/shared/scoring.js](api/src/shared/scoring.js):
- **Group**, per match, max 5: +2 correct outcome (1/X/2), +1 home goals, +1 away goals,
  +1 exact-score bonus.
- **Playoff**: points per team correctly predicted to *reach* a round —
  R32=1, R16=3, QF=7, SF=11, F=15, CHAMP=25.

Results are admin-curated (`results` table, partitions `group` / `ko` / `meta:thirdOrder`),
loaded via [api/src/shared/results.js](api/src/shared/results.js). The leaderboard
([api/src/functions/getLeaderboard.js](api/src/functions/getLeaderboard.js)) recomputes every
user's `groupPoints` + `playoffPoints` on each request.

## Locking

There is no global "tournament locked" flag. **Each match locks individually at its own
kickoff** (`locked: now >= kickoffUtc`, computed in `getMatches`). The aggregate `locked` returned
to the client is true only when *every* match has kicked off. Honor per-match `match.locked`
before accepting edits.

## Predictions page (combined Tippa)

[frontend/src/pages/Matches.jsx](frontend/src/pages/Matches.jsx) is one page serving both
`/matches` (group) and `/slutspel` (playoff) via a `view` prop driven by the route, with an
in-page segmented toggle that `navigate()`s between the two routes (keeps navbar + toggle in sync;
no data reload between tabs). It owns the group `predictions` map and passes it down to a
**controlled** [GroupTabs](frontend/src/components/GroupTabs.jsx) (which still self-manages its
state when used read-only, e.g. in [UserPredictions.jsx](frontend/src/pages/UserPredictions.jsx)),
so group score edits flow live into the bracket. Group scores autosave from
[ScoreInput.jsx](frontend/src/components/ScoreInput.jsx) (debounced); playoff picks save on click.

## Conventions & gotchas

- **Shell is PowerShell on Windows.** Use PowerShell syntax (`$env:VAR`, `$null`), not bash-isms.
- **UI text is Swedish.** Keep new user-facing strings Swedish to match.
- Commits: this repo's working branch is `feature/claude-design`; `main` is the deploy target.
  Pushes to either branch trigger the Azure deploy
  ([.github/workflows/azure-static-web-apps-deploy.yml](.github/workflows/azure-static-web-apps-deploy.yml)).
- After frontend changes, sanity-check with `cd frontend; npm run build` (and `npm run lint`).
- `api/dbg-out.txt` and `api/dbg2.txt` are stray debug artifacts that ended up tracked in git —
  ignore them; they're not part of the app.
- Match seed data is in [api/src/shared/matchData.js](api/src/shared/matchData.js); seed the
  `matches` table once with `node scripts/seedMatches.js`. `scripts/wipePredictions.js` clears
  predictions for testing.
