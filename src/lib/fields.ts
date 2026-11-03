import type { FIELD_SLUGS } from '../content.config';

// One accent color per field, used only for small decorative dots next to field
// names (grid headers, mobile accordion). Never used for text, so it carries no
// meaning on its own; the field name is always shown beside it.

type FieldSlug = (typeof FIELD_SLUGS)[number];

export const fieldAccent = {
  ecology: 'bg-emerald-500',
  epidemiology: 'bg-rose-500',
  economics: 'bg-amber-500',
  sports: 'bg-orange-500',
  'public-policy': 'bg-blue-500',
  psychology: 'bg-fuchsia-500',
  climate: 'bg-cyan-500',
  medicine: 'bg-teal-500',
} satisfies Record<FieldSlug, string>;
