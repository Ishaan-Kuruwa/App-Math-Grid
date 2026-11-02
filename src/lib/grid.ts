import { getCollection, type CollectionEntry } from 'astro:content';
import { FIELD_SLUGS, METHOD_SLUGS } from '../content.config';
import { getVisibleEntries, type Entry } from './entries';

export type Method = CollectionEntry<'methods'>;
export type Field = CollectionEntry<'fields'>;

export interface GridData {
  methods: Method[];
  fields: Field[];
  // Looks up the entry for one method × field cell, or undefined if the cell is open.
  cellFor: (methodSlug: string, fieldSlug: string) => Entry | undefined;
}

const cellKey = (methodSlug: string, fieldSlug: string) => `${methodSlug}--${fieldSlug}`;

// Rows and columns follow the order of the slug lists in the content config,
// not the alphabetical file order the glob loader returns.
export async function getGridData(): Promise<GridData> {
  const [methods, fields, entries] = await Promise.all([
    getCollection('methods'),
    getCollection('fields'),
    getVisibleEntries(),
  ]);

  methods.sort((a, b) => METHOD_SLUGS.indexOf(a.data.slug) - METHOD_SLUGS.indexOf(b.data.slug));
  fields.sort((a, b) => FIELD_SLUGS.indexOf(a.data.slug) - FIELD_SLUGS.indexOf(b.data.slug));

  const cells = new Map<string, Entry>();
  for (const entry of entries) {
    cells.set(cellKey(entry.data.method.id, entry.data.field.id), entry);
  }

  return {
    methods,
    fields,
    cellFor: (methodSlug, fieldSlug) => cells.get(cellKey(methodSlug, fieldSlug)),
  };
}
