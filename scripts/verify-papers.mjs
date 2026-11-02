#!/usr/bin/env node
// Checks every paper cited in src/content/entries against the OpenAlex API.
// A paper is looked up by DOI when it has one, otherwise by title search.
// Reports papers that can't be found, or whose title, first author, or year
// doesn't match what OpenAlex has. Exits 1 if anything needs attention.
//
// Usage: npm run verify [-- <entries-dir>]
// Set OPENALEX_MAILTO=you@example.com to use OpenAlex's faster "polite pool".

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENTRIES_DIR = path.resolve(process.argv[2] ?? path.join(ROOT, 'src/content/entries'));
const API = 'https://api.openalex.org';
const MAILTO = process.env.OPENALEX_MAILTO;
const TITLE_SIMILARITY = 0.9;

// --- Loading entries ------------------------------------------------------

async function listMarkdown(dir) {
  try {
    const names = await readdir(dir, { recursive: true });
    return names.filter((n) => n.endsWith('.md')).sort().map((n) => path.join(dir, n));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

function readFrontmatter(source, file) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error(`${file}: no frontmatter found`);
  return parseYaml(match[1]) ?? {};
}

// --- Normalising and comparing --------------------------------------------

function normalize(s) {
  return String(s ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/<[^>]+>/g, ' ') // OpenAlex titles sometimes contain <i>…</i>
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function bigrams(s) {
  const out = new Map();
  for (let i = 0; i < s.length - 1; i++) {
    const g = s.slice(i, i + 2);
    out.set(g, (out.get(g) ?? 0) + 1);
  }
  return out;
}

// Sørensen–Dice coefficient on character bigrams: 1 = identical, 0 = nothing shared.
function similarity(a, b) {
  const x = normalize(a).replace(/ /g, '');
  const y = normalize(b).replace(/ /g, '');
  if (x === y) return 1;
  if (x.length < 2 || y.length < 2) return 0;
  const bx = bigrams(x);
  const by = bigrams(y);
  let shared = 0;
  for (const [g, n] of bx) shared += Math.min(n, by.get(g) ?? 0);
  return (2 * shared) / (x.length - 1 + (y.length - 1));
}

// Treat "Main title" and "Main title: subtitle" as the same paper.
function titlesMatch(ours, theirs) {
  if (similarity(ours, theirs) >= TITLE_SIMILARITY) return true;
  const mainTitle = (t) => String(t ?? '').split(/[:?.]\s/)[0];
  return similarity(mainTitle(ours), mainTitle(theirs)) >= TITLE_SIMILARITY
    && normalize(mainTitle(ours)).length >= 20;
}

// "Kermack, W. O." -> "kermack"; "W. O. Kermack" -> "kermack".
function surname(name) {
  const s = String(name ?? '');
  const part = s.includes(',') ? s.split(',')[0] : s.trim().split(/\s+/).at(-1);
  return normalize(part);
}

function firstAuthorMatches(ours, authorship) {
  if (!authorship) return false;
  const want = surname(ours);
  if (!want) return false;
  const names = [authorship.author?.display_name, authorship.raw_author_name].filter(Boolean);
  // Match on surname appearing in the OpenAlex name, so particles and
  // multi-part surnames ("van der Pol", "García Márquez") still line up.
  return names.some((n) => ` ${normalize(n)} `.includes(` ${want} `));
}

// --- OpenAlex -------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function openAlex(pathAndQuery) {
  const url = new URL(API + pathAndQuery);
  if (MAILTO) url.searchParams.set('mailto', MAILTO);
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (res.status === 404) return null;
    if (res.ok) return res.json();
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      await sleep(1000 * 2 ** attempt);
      continue;
    }
    throw new Error(`OpenAlex ${res.status} for ${url}`);
  }
}

async function lookup(paper) {
  if (paper.doi) {
    const work = await openAlex(`/works/doi:${encodeURIComponent(paper.doi)}`);
    return { work, via: 'DOI' };
  }
  const q = new URLSearchParams({ search: String(paper.title), 'per-page': '25' });
  const data = await openAlex(`/works?${q}`);
  // Short titles ("Deep learning") match several works, so among the title
  // matches prefer the one that also agrees on first author and year.
  const best = (data?.results ?? [])
    .filter((w) => titlesMatch(paper.title, w.display_name))
    .map((w) => ({ w, problems: compare(paper, w).length, score: similarity(paper.title, w.display_name) }))
    .sort((a, b) => a.problems - b.problems || b.score - a.score)[0];
  return { work: best?.w ?? null, via: 'title search' };
}

function compare(paper, work) {
  const problems = [];
  if (!titlesMatch(paper.title, work.display_name)) {
    problems.push(`title: ours "${paper.title}" vs OpenAlex "${work.display_name}"`);
  }
  const first = work.authorships?.[0];
  if (!firstAuthorMatches(paper.authors?.[0], first)) {
    const theirs = first?.author?.display_name ?? first?.raw_author_name ?? '(none)';
    problems.push(`first author: ours "${paper.authors?.[0]}" vs OpenAlex "${theirs}"`);
  }
  if (Number(paper.year) !== work.publication_year) {
    problems.push(`year: ours ${paper.year} vs OpenAlex ${work.publication_year}`);
  }
  return problems;
}

// --- Main -----------------------------------------------------------------

const files = await listMarkdown(ENTRIES_DIR);
const relative = (f) => path.relative(ROOT, f);
const reports = [];
let checked = 0;

for (const file of files) {
  const data = readFrontmatter(await readFile(file, 'utf8'), relative(file));
  const papers = Array.isArray(data.papers) ? data.papers : [];
  for (const [i, paper] of papers.entries()) {
    checked++;
    const label = `${relative(file)} › papers[${i}] "${paper.title}"`;
    try {
      const { work, via } = await lookup(paper);
      if (!work) {
        reports.push({ label, problems: [`not found on OpenAlex (${via}${paper.doi ? ` ${paper.doi}` : ''})`] });
        continue;
      }
      const problems = compare(paper, work);
      if (problems.length) reports.push({ label, problems: [...problems, `matched ${work.id} via ${via}`] });
    } catch (err) {
      reports.push({ label, problems: [`lookup failed: ${err.message}`] });
    }
  }
}

if (files.length === 0) {
  console.log(`No entries found in ${relative(ENTRIES_DIR) || ENTRIES_DIR}; nothing to verify.`);
} else if (reports.length === 0) {
  console.log(`✓ All ${checked} paper(s) across ${files.length} entr${files.length === 1 ? 'y' : 'ies'} matched OpenAlex.`);
} else {
  for (const { label, problems } of reports) {
    console.log(`✗ ${label}`);
    for (const p of problems) console.log(`    - ${p}`);
  }
  console.log(`\n${reports.length} of ${checked} paper(s) need attention.`);
  process.exitCode = 1;
}
