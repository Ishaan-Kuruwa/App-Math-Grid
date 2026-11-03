// Tailwind class strings shared across pages. Colors come from the design
// tokens in styles/global.css.

export const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

export const link = `rounded font-medium text-brand underline underline-offset-4 hover:text-brand-strong ${focus}`;

// Hover/focus lift for clickable cards and grid cells. The movement is
// motion-safe only; the shadow still appears with reduced motion.
export const lift = [
  'transition duration-300 ease-soft hover:shadow-lift focus-visible:shadow-lift',
  'motion-safe:hover:-translate-y-0.5 motion-safe:focus-visible:-translate-y-0.5',
].join(' ');

// Fade-and-slide-up on page load. Pass `fadeDelay(i)` as the element's style to
// stagger a list.
export const fadeUp = 'motion-safe:animate-fade-up';
export const fadeDelay = (index: number, stepMs = 35) => `animation-delay: ${Math.min(index * stepMs, 600)}ms`;

// Shared view-transition name for an entry's title, so it morphs from a grid
// cell or card into the entry page heading.
export const entryTitleTransition = (entryId: string) => `entry-title-${entryId}`;

export const heading = 'text-xl font-semibold tracking-tight';
