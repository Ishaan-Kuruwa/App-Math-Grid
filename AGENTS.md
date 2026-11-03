# Applied Math Method Map

A static website for a high school STEM research club. It maps applied math methods
(rows) against research fields (columns). Each filled cell is an entry showing how a
method is used in that field, with a starter research question and real papers.
Audience: high school students starting their first research project, so all
student-facing text should be clear, concrete, and free of unexplained jargon.

## Stack
- Astro (static output only — no backend, no server routes, no database)
- Tailwind CSS for all styling
- TypeScript (strict)
- Pagefind for search (indexed at build time)
- Deployed to Cloudflare Pages from the `main` branch

## Commands
- `npm run dev` — local dev server
- `npm run build` — production build (also validates all content)
- `npm run check` — type-checks Astro and TypeScript files
- `npm run verify` — checks every paper citation against the OpenAlex API

## Content model
All content lives in `src/content/` as Markdown with frontmatter, validated by Zod
schemas in the content config. Three collections:
- `methods` — name, slug, description, prerequisites
- `fields` — name, slug, description
- `entries` — title, method (reference), field (reference), summary, starterQuestion,
  difficulty (intro | intermediate | advanced), prerequisites, papers
  (title, authors, year, url, optional doi, optional lookFor note), optional notebook URL,
  optional dataset URL
- Optional entry-page structure: `bigIdea` (1–2 plain sentences), `keyTerms`
  (term + one-sentence definition, max 5), `steps` (how to tackle the starter
  question, max 7). Write these only from facts already in the entry; `lookFor`
  only when the summary already describes that paper's work.

Entry filenames follow the pattern `{method-slug}--{field-slug}.md`.
There is at most one entry per method × field cell.

## Allowed slugs
Use only these. Never invent new slugs without being asked.

Methods: `regression`, `differential-equations`, `markov-chains`, `optimization`,
`network-analysis`, `monte-carlo`, `bayesian-inference`, `game-theory`

Fields: `ecology`, `epidemiology`, `economics`, `sports`, `public-policy`,
`psychology`, `climate`, `medicine`

## Rules
- NEVER invent, guess, or add paper citations. Use only papers explicitly provided
  in the prompt or already present in the content files. If an entry needs papers
  and none were given, stop and ask.
- NEVER cite a paper from memory. Papers may only come from (a) the prompt,
  (b) existing content files, (c) `npm run find-papers` results, or (d) a direct
  OpenAlex lookup made to check or replace a specific paper, such as finding its
  published version. Every paper must include the DOI or OpenAlex ID returned by
  OpenAlex.
- When selecting papers automatically, avoid papers centered on suicide, self-harm,
  or other sensitive topics unsuitable for a general high school audience.
- Never select papers from publishers widely listed as predatory (such as IISTE).
  Large open-access publishers such as MDPI, Hindawi, and Frontiers are allowed:
  judge their papers individually on relevance and quality, not by publisher.
- Prefer the peer-reviewed published version of a paper over a preprint when both exist.
- List an entry's papers from most accessible to least accessible.
- Never change the content schema without explicitly saying so and explaining why.
- Run `npm run build` and `npm run check` before declaring any task done. If content
  was touched, also run `npm run verify`.
- Keep changes scoped to the task requested; don't refactor unrelated files.

## Design
- Mobile-first. Below 768px, the grid becomes an accordion grouped by field.
- Support light and dark mode; all colors must meet WCAG AA contrast.
- Empty grid cells show a muted "Open — contribute" state linking to /contribute.
- Difficulty badges use consistent colors across every page.

## Routes
- `/` — the method × field grid
- `/entry/[slug]` — single entry
- `/method/[slug]` — all fields a method applies to
- `/field/[slug]` — all methods that apply to a field
- `/contribute` — how to submit an entry (links to a Google Form)
- `/about` — how to use the map