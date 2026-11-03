import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Allowed slugs (see AGENTS.md). Adding one here is a deliberate schema change.
export const METHOD_SLUGS = [
  'regression',
  'differential-equations',
  'markov-chains',
  'optimization',
  'network-analysis',
  'monte-carlo',
  'bayesian-inference',
  'game-theory',
] as const;

export const FIELD_SLUGS = [
  'ecology',
  'epidemiology',
  'economics',
  'sports',
  'public-policy',
  'psychology',
  'climate',
  'medicine',
] as const;

export const DIFFICULTIES = ['intro', 'intermediate', 'advanced'] as const;

// Only reviewed entries are published; drafts show up in `astro dev` only.
export const STATUSES = ['draft', 'reviewed'] as const;

const text = z.string().trim().min(1);
const httpUrl = z.url({ protocol: /^https?$/ });

const paper = z.object({
  title: text,
  authors: z.array(text).min(1),
  year: z.int().min(1600).max(new Date().getFullYear() + 1),
  url: httpUrl,
  // Bare DOI, e.g. "10.1038/nature14539" — not a https://doi.org/ link.
  doi: z
    .string()
    .trim()
    .regex(/^10\.\d{4,9}\/\S+$/, 'DOI must look like "10.xxxx/..." (no https://doi.org/ prefix)')
    .optional(),
  // Optional, shown on the entry page: what this paper does or what to notice
  // in it. Written only from what the entry already says about the paper.
  lookFor: text.optional(),
});

const methods = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/methods' }),
  schema: z.object({
    name: text,
    slug: z.enum(METHOD_SLUGS),
    description: text,
    prerequisites: z.array(text).default([]),
  }),
});

const fields = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/fields' }),
  schema: z.object({
    name: text,
    slug: z.enum(FIELD_SLUGS),
    description: text,
  }),
});

const entries = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/entries' }),
  schema: z.object({
    title: text,
    method: reference('methods'),
    field: reference('fields'),
    summary: text,
    starterQuestion: text,
    // Optional structure for the entry page. Entries without these fields show
    // the full summary as one section, as before.
    bigIdea: text.optional(), // 1–2 plain sentences: what the method does here
    keyTerms: z.array(z.object({ term: text, definition: text })).max(5).default([]),
    steps: z.array(text).max(7).default([]), // how to tackle the starter question, in order
    difficulty: z.enum(DIFFICULTIES),
    status: z.enum(STATUSES).default('draft'),
    prerequisites: z.array(text).default([]),
    papers: z.array(paper).min(1),
    notebook: httpUrl.optional(),
    dataset: httpUrl.optional(),
  }),
});

export const collections = { methods, fields, entries };
