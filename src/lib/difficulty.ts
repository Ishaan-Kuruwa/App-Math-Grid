import type { DIFFICULTIES } from '../content.config';

// The one place difficulty colors are defined. DifficultyBadge uses these on the
// server and the search box uses them in the browser, so the colors stay
// consistent across the site.
// Each light and dark pair is about 7:1 contrast or better (WCAG AA).

export type Difficulty = (typeof DIFFICULTIES)[number];

export const difficultyStyles = {
  intro: {
    label: 'Intro',
    classes: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  },
  intermediate: {
    label: 'Intermediate',
    classes: 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200',
  },
  advanced: {
    label: 'Advanced',
    classes: 'bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200',
  },
} satisfies Record<Difficulty, { label: string; classes: string }>;

export const badgeBase = 'inline-block rounded-full px-2 py-0.5 text-xs font-semibold';
