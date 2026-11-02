#!/usr/bin/env node
// Finds candidate papers for one method × field cell by searching OpenAlex.
// Runs several query variations (plain, plus "introduction", "tutorial" and
// "review" phrasings, plus named models for cells listed in CELL_KEYWORDS),
// keeps open-access works only, merges duplicates, and ranks them by a mix of
// search relevance and citation count. Writes the top candidates to
// scripts/candidates/{method}--{field}.json.
//
// These are candidates for a human to read, not citations to paste in: check
// that each one really applies the method in the field before using it.
// Candidates with needsHumanReview: true (no abstract on OpenAlex, or a
// sensitive topic; see reviewReason) must never be picked automatically;
// someone has to read the paper itself first.
//
// Usage: npm run find-papers -- <method-slug> <field-slug>
// Set OPENALEX_MAILTO=you@example.com to use OpenAlex's faster "polite pool".

import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'scripts/candidates');
const API = 'https://api.openalex.org';
const MAILTO = process.env.OPENALEX_MAILTO;
const PER_QUERY = 50;
const TOP_N = 15;
// Each query's best papers that make the list no matter how the other queries score.
const GUARANTEED_PER_QUERY = 2;
// Weights for the final score; both parts are scaled to 0–1 first.
const RELEVANCE_WEIGHT = 0.6;
const CITATION_WEIGHT = 0.4;
// Subtracted from the score of papers that need human review, so they rank
// below comparable papers that don't without being dropped.
const REVIEW_PENALTY = 0.15;

// For each slug: the phrase to search for, and patterns a paper's title or
// abstract must match to count as on-topic. OpenAlex search also matches
// papers that only share the word "tutorial" or "review", so this check keeps
// those out. Slug lists match src/content.config.ts.
const METHODS = {
  regression: { query: 'regression', match: [/\bregression/] },
  'differential-equations': { query: 'differential equations', match: [/differential equation/, /\bodes?\b/, /\bpdes?\b/] },
  'markov-chains': { query: 'Markov chain', match: [/\bmarkov/] },
  optimization: { query: 'optimization', match: [/optimi[sz]/, /linear programming/] },
  'network-analysis': { query: 'network analysis', match: [/network/] },
  'monte-carlo': { query: 'Monte Carlo simulation', match: [/monte carlo/] },
  'bayesian-inference': { query: 'Bayesian inference', match: [/\bbayes/] },
  'game-theory': { query: 'game theory', match: [/game[- ]theor/, /nash equilibri/, /strategic interaction/] },
};

const FIELDS = {
  ecology: { query: 'ecology', match: [/ecolog/, /conservation/, /\bpopulations?\b/, /\bspecies\b/] },
  epidemiology: { query: 'epidemiology', match: [/epidemi/, /infecti/, /disease/, /public health/] },
  economics: { query: 'economics', match: [/econom/, /financ/, /market/, /portfolio/] },
  sports: { query: 'sports', match: [/\bsports?\b/, /athlet/, /football|soccer|basketball|baseball|tennis|cricket|hockey/] },
  // Not a bare /polic/: machine-learning papers use "policy" for a decision rule.
  'public-policy': {
    query: 'public policy',
    match: [/public polic/, /government polic/, /policy maker/, /policymak/, /urban/, /government/, /public services?/],
  },
  psychology: { query: 'psychology', match: [/psycholog/, /behavio/, /cogniti/, /decision making/] },
  climate: { query: 'climate', match: [/climat/, /environment/, /temperature/, /precipitation/] },
  medicine: { query: 'medicine', match: [/medic/, /clinical/, /patients?\b/, /\bdrugs?\b/, /pharmaco/] },
};

// More ways a paper can show it belongs to a field, added to FIELDS[field].match
// for every method in that field (an ambulance-location paper may never say
// "policy" or "government").
const FIELD_SYNONYMS = {
  ecology: [/fisher(y|ies)/, /wildlife/, /habitat/, /biodiversity/, /ecosystem/, /predator|prey/],
  epidemiology: [/pandemic/, /outbreak/, /vaccin/, /disease transmission/, /covid|influenza|measles|malaria|\bhiv\b/],
  economics: [/stock market|stock pric|stock return/, /asset pric/, /option pric/, /inflation/, /monetary/, /consumer/, /investment/, /retirement/],
  sports: [/\b(nba|nfl|mlb|nhl)\b/, /olympic/, /league/, /tournament/, /rugby|golf|volleyball/],
  'public-policy': [/emergency medical services?/, /\bems\b/, /ambulance/, /public transportation|transportation planning/, /transit/, /municipal/, /urban planning/, /school district/, /program evaluation/, /fire station/],
  psychology: [/mental health/, /psychiatr/, /emotion/, /social influence/, /neuroscien/],
  climate: [/global warming/, /sea level/, /rainfall/, /drought/, /flood/, /greenhouse|carbon dioxide|\bco2\b/, /weather/],
  medicine: [/diagnos/, /hospital/, /therap/, /surg(ery|ical|eon)/, /cancer|tumou?r/],
};

const QUERY_SUFFIXES = ['', 'introduction', 'tutorial', 'review'];

// Papers on these topics are flagged for a person to judge, never picked
// automatically (see the sensitive-topics rule in AGENTS.md).
const SENSITIVE_PATTERNS = [
  // Suicide and self-harm
  /suicid/, // suicide, suicidal, parasuicide
  /self[- ]?harm/,
  /self[- ]?injur/, // self-injury, self-injurious
  // Sexual violence and abuse
  /sexual (violence|assault|abuse|exploitation|harassment)/,
  /\brap(e|ed|ist)\b/,
  /child (sexual )?abuse|child maltreatment/,
  /domestic (violence|abuse)|intimate partner violence/,
  /(sex|human) trafficking/,
  // Sex work
  /sex work/, // sex work, sex worker(s)
  /prostitut/,
  /commercial sex/,
  /brothel|red[- ]light district/,
  // Eating disorders
  /eating disorder/,
  /anorexia nervosa|\banorexic\b/,
  /bulimi/,
  /binge[- ]eating/,
];

// Extra searches for specific cells, built around the model names students
// actually meet (papers about "the SIR model" often never say "differential
// equation"). `match` patterns also count as mentioning the method, so those
// papers pass the on-topic check. Cells not listed here use only the generic
// queries above. Keyed by "{method}--{field}".
const CELL_KEYWORDS = {
  'differential-equations--epidemiology': {
    queries: ['SIR model introduction', 'compartmental model epidemic'],
    match: [/\bsir\b/, /\bseir\b/, /compartmental model/],
  },
  'differential-equations--ecology': {
    queries: ['Lotka-Volterra predator prey model', 'logistic growth population model'],
    match: [/lotka/, /predator.prey/, /logistic growth/],
  },
  'differential-equations--medicine': {
    queries: ['pharmacokinetic compartment model introduction'],
    match: [/pharmacokinetic/, /compartment(al)? model/],
  },
  'game-theory--ecology': {
    queries: ['evolutionary game theory hawk dove'],
    match: [/evolutionar(il)?y stable/, /hawk.dove/],
  },
  'markov-chains--sports': {
    queries: ['Markov chain baseball run expectancy', 'Markov model tennis win probability', 'Markov chain basketball possession'],
    match: [/run expectancy/, /transition matri/, /absorbing state/],
  },
  'markov-chains--medicine': {
    queries: ['Markov model cost-effectiveness analysis', 'Markov model disease progression introduction', 'multi-state model disease progression'],
    match: [/multi-?state model/, /state.transition model/],
  },
  'optimization--ecology': {
    queries: ['optimal harvesting fisheries model', 'reserve selection conservation planning', 'maximum sustainable yield model'],
    match: [/optimal harvest/, /reserve selection/, /systematic conservation planning/, /maximum sustainable yield/],
  },
  'optimization--public-policy': {
    queries: ['facility location problem public services', 'ambulance location model', 'school bus routing problem'],
    match: [/facility location/, /location.allocation/, /vehicle routing/, /p-median/],
  },
  'optimization--economics': {
    queries: ['mean-variance portfolio optimization introduction', 'linear programming economics introduction', 'utility maximization consumer choice'],
    match: [/mean.variance/, /markowitz/, /efficient frontier/, /utility maximi[sz]/],
  },
  'network-analysis--epidemiology': {
    queries: ['contact network disease transmission', 'epidemics on networks introduction', 'superspreading network model'],
    match: [/centrality/, /degree distribution/],
  },
  'network-analysis--ecology': {
    queries: ['food web network structure', 'plant pollinator network', 'habitat connectivity graph theory'],
    match: [/food webs?/, /graph theor/, /habitat connectivity/],
  },
  'monte-carlo--climate': {
    queries: ['Monte Carlo uncertainty climate projection', 'stochastic weather generator', 'Latin hypercube sampling climate model'],
    match: [/latin hypercube/, /weather generator/, /stochastic simulation/],
  },
  'monte-carlo--economics': {
    queries: ['Monte Carlo option pricing introduction', 'Monte Carlo value at risk', 'retirement savings Monte Carlo simulation'],
    match: [/stochastic simulation/],
  },
  'bayesian-inference--medicine': {
    queries: ["Bayes' theorem diagnostic test interpretation", 'positive predictive value sensitivity specificity', 'Bayesian clinical trial introduction'],
    match: [/predictive value/, /pre-?test probabilit/, /post-?test probabilit/],
  },
  'bayesian-inference--sports': {
    queries: ['Bayesian hierarchical model player performance', 'Glicko rating system', 'Bayesian prediction football match outcomes'],
    match: [/glicko/, /trueskill/, /posterior distribution/, /prior distribution/],
  },
  'regression--public-policy': {
    queries: ['difference-in-differences policy evaluation introduction', 'regression discontinuity design policy', 'program evaluation regression introduction'],
    match: [/difference.in.difference/, /instrumental variables?/],
  },
};

// --- Arguments ------------------------------------------------------------

async function contentSlugs(collection) {
  try {
    const names = await readdir(path.join(ROOT, 'src/content', collection));
    return new Set(names.filter((n) => n.endsWith('.md')).map((n) => n.slice(0, -3)));
  } catch (err) {
    if (err.code === 'ENOENT') return new Set();
    throw err;
  }
}

async function parseArgs([method, field]) {
  const usage = 'Usage: npm run find-papers -- <method-slug> <field-slug>';
  if (!method || !field) throw new Error(usage);
  const methods = await contentSlugs('methods');
  const fields = await contentSlugs('fields');
  if (!METHODS[method] || !methods.has(method)) {
    throw new Error(`Unknown method "${method}". Choose one of: ${Object.keys(METHODS).join(', ')}\n${usage}`);
  }
  if (!FIELDS[field] || !fields.has(field)) {
    throw new Error(`Unknown field "${field}". Choose one of: ${Object.keys(FIELDS).join(', ')}\n${usage}`);
  }
  return { method, field };
}

// Patterns are written in lowercase, but a pattern like /SIR/ shouldn't
// silently miss "sir", so every pattern is matched case-insensitively.
const caseInsensitive = (re) => (re.flags.includes('i') ? re : new RegExp(re.source, `${re.flags}i`));

function isOnTopic(work, method, field) {
  const text = `${work.display_name ?? ''} ${reconstructAbstract(work.abstract_inverted_index) ?? ''}`;
  const mentions = (patterns) => patterns.some((re) => caseInsensitive(re).test(text));
  const methodPatterns = [...METHODS[method].match, ...(CELL_KEYWORDS[`${method}--${field}`]?.match ?? [])];
  const fieldPatterns = [...FIELDS[field].match, ...(FIELD_SYNONYMS[field] ?? [])];
  return mentions(methodPatterns) && mentions(fieldPatterns);
}

// --- OpenAlex -------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function openAlex(pathAndQuery) {
  const url = new URL(API + pathAndQuery);
  if (MAILTO) url.searchParams.set('mailto', MAILTO);
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (res.ok) return res.json();
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      await sleep(1000 * 2 ** attempt);
      continue;
    }
    throw new Error(`OpenAlex ${res.status} for ${url}`);
  }
}

async function search(query) {
  const q = new URLSearchParams({
    search: query,
    filter: 'is_oa:true,is_retracted:false,is_paratext:false',
    'per-page': String(PER_QUERY),
  });
  const data = await openAlex(`/works?${q}`);
  return data?.results ?? [];
}

// --- Shaping results ------------------------------------------------------

// OpenAlex stores abstracts as { word: [positions] }; put the words back in order.
function reconstructAbstract(index) {
  if (!index) return null;
  const words = [];
  for (const [word, positions] of Object.entries(index)) {
    for (const p of positions) words[p] = word;
  }
  return words.filter((w) => w !== undefined).join(' ') || null;
}

// Bare DOI, matching the entries schema: "10.xxxx/..." with no https://doi.org/ prefix.
function bareDoi(doi) {
  return doi ? doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '') : null;
}

function normalizeTitle(s) {
  return String(s ?? '')
    .normalize('NFKD')
    .replace(/<[^>]+>/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function toCandidate(work) {
  const abstract = reconstructAbstract(work.abstract_inverted_index);
  const text = `${work.display_name ?? ''} ${abstract ?? ''}`;
  const reasons = [
    // A person decides whether these suit a high school audience.
    ...(SENSITIVE_PATTERNS.some((re) => caseInsensitive(re).test(text)) ? ['sensitive topic'] : []),
    // Without an abstract nobody can judge fit from this file alone.
    ...(abstract ? [] : ['no abstract on OpenAlex; read the paper before using it']),
  ];
  return {
    needsHumanReview: reasons.length > 0,
    ...(reasons.length ? { reviewReason: reasons.join('; ') } : {}),
    title: work.display_name,
    authors: (work.authorships ?? []).map((a) => a.author?.display_name ?? a.raw_author_name).filter(Boolean),
    year: work.publication_year,
    doi: bareDoi(work.doi),
    openAlexId: work.id?.replace('https://openalex.org/', '') ?? null,
    openAccessUrl:
      work.open_access?.oa_url ?? work.best_oa_location?.pdf_url ?? work.best_oa_location?.landing_page_url ?? null,
    citationCount: work.cited_by_count ?? 0,
    abstract,
  };
}

// --- Ranking --------------------------------------------------------------

// Relevance scores aren't comparable across queries, so each work's score is
// scaled against the best on-topic hit of its own query, and a work found by several
// queries keeps its best scaled score. The same paper can appear twice (e.g. a
// preprint and the published version) with different IDs, so works are also
// merged by normalized title, keeping the more-cited copy.
//
// For cells with CELL_KEYWORDS, papers found by any of the cell's own queries
// rank above papers found only by the generic ones, whatever their scores; the
// score (and so citation weight) only orders papers within each group.
function rank(resultsByQuery, cellQueries = []) {
  const byTitle = new Map();
  for (const { query, results } of resultsByQuery) {
    const top = Math.max(...results.map((w) => w.relevance_score ?? 0), 0);
    for (const work of results) {
      const key = normalizeTitle(work.display_name);
      if (!key) continue;
      const relevance = top > 0 ? (work.relevance_score ?? 0) / top : 0;
      const seen = byTitle.get(key);
      if (!seen) {
        byTitle.set(key, { work, relevance, queries: [query] });
        continue;
      }
      seen.relevance = Math.max(seen.relevance, relevance);
      if (!seen.queries.includes(query)) seen.queries.push(query);
      if ((work.cited_by_count ?? 0) > (seen.work.cited_by_count ?? 0)) seen.work = work;
    }
  }

  const pool = [...byTitle.values()];
  // log scale so one 50,000-citation classic doesn't flatten everything else.
  const maxCites = Math.max(...pool.map((p) => Math.log1p(p.work.cited_by_count ?? 0)), 0);
  const scored = pool
    .map((p) => {
      const candidate = toCandidate(p.work);
      const citations = maxCites > 0 ? Math.log1p(p.work.cited_by_count ?? 0) / maxCites : 0;
      let score = RELEVANCE_WEIGHT * p.relevance + CITATION_WEIGHT * citations;
      if (candidate.needsHumanReview) score -= REVIEW_PENALTY;
      const fromCellQuery = p.queries.some((q) => cellQueries.includes(q));
      return { ...candidate, score: Number(score.toFixed(3)), fromCellQuery, matchedQueries: p.queries };
    })
    .sort((a, b) => b.fromCellQuery - a.fromCellQuery || b.score - a.score);

  // First give every query its best GUARANTEED_PER_QUERY papers (by final
  // score, among the papers that query found and that aren't already picked),
  // so one strong query can't crowd out the rest. Then fill by overall score.
  // (With more than TOP_N / GUARANTEED_PER_QUERY queries the list runs long.)
  const picked = new Set();
  for (const { query } of resultsByQuery) {
    scored
      .filter((c) => c.matchedQueries.includes(query) && !picked.has(c))
      .slice(0, GUARANTEED_PER_QUERY)
      .forEach((c) => picked.add(c));
  }
  for (const c of scored) {
    if (picked.size >= TOP_N) break;
    picked.add(c);
  }
  return scored.filter((c) => picked.has(c));
}

// --- Main -----------------------------------------------------------------

try {
  const { method, field } = await parseArgs(process.argv.slice(2));
  if (!MAILTO) console.warn('Note: OPENALEX_MAILTO is not set, so requests use the slower common pool.');

  const base = `${METHODS[method].query} ${FIELDS[field].query}`;
  const cellQueries = CELL_KEYWORDS[`${method}--${field}`]?.queries ?? [];
  const queries = [...QUERY_SUFFIXES.map((s) => (s ? `${base} ${s}` : base)), ...cellQueries];
  const resultsByQuery = [];
  for (const query of queries) {
    const found = await search(query);
    const results = found.filter((w) => isOnTopic(w, method, field));
    console.log(`  "${query}": ${found.length} open-access result(s), ${results.length} on topic`);
    resultsByQuery.push({ query, results });
  }

  const candidates = rank(resultsByQuery, cellQueries);
  const outFile = path.join(OUT_DIR, `${method}--${field}.json`);
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(
    outFile,
    JSON.stringify({ method, field, generatedAt: new Date().toISOString(), queries, candidates }, null, 2) + '\n',
  );

  console.log(`\nTop ${candidates.length} candidate(s) for ${method} × ${field}:`);
  for (const [i, c] of candidates.entries()) {
    const flag = c.needsHumanReview ? `  [needs human review: ${c.reviewReason.split(';')[0].replace(' on OpenAlex', '')}]` : '';
    console.log(`${String(i + 1).padStart(2)}. ${c.title} (${c.year ?? 'n.d.'}) — ${c.citationCount} citations, score ${c.score}${flag}`);
  }
  const flagged = candidates.filter((c) => c.needsHumanReview).length;
  if (flagged) console.log(`\n${flagged} candidate(s) need human review before use (see reviewReason).`);
  console.log(`\nSaved to ${path.relative(ROOT, outFile)}`);
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
}
