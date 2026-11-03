import type { DIFFICULTIES } from '../content.config';

// The one place difficulty labels, descriptions, and colors are defined. DifficultyBadge uses these on the
// server and the search box uses them in the browser, so the colors stay
// consistent across the site.
// Each light and dark pair is about 7:1 contrast or better (WCAG AA).

export type Difficulty = (typeof DIFFICULTIES)[number];

export const difficultyStyles = {
  intro: {
    label: 'Intro',
    description: 'A good first project. The math and the papers are the most approachable.',
    classes: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  },
  intermediate: {
    label: 'Intermediate',
    description: 'Combines a few ideas or takes more setup, like a solver or a simulation.',
    classes: 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200',
  },
  advanced: {
    label: 'Advanced',
    description: 'Harder math and papers. Best after you have done a project before.',
    classes: 'bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200',
  },
} satisfies Record<Difficulty, { label: string; description: string; classes: string }>;

export const badgeBase =
  'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-current/15 ring-inset';
