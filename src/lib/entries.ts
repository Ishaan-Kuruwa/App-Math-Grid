import { getCollection, type CollectionEntry } from 'astro:content';

export type Entry = CollectionEntry<'entries'>;

export const isDraft = (entry: Entry) => entry.data.status === 'draft';

// Production builds get reviewed entries only; `astro dev` also gets drafts so
// contributors can preview them. Use this anywhere entries are listed or routed.
export function getVisibleEntries(): Promise<Entry[]> {
  return getCollection('entries', (entry) => import.meta.env.DEV || !isDraft(entry));
}
