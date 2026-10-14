import { getCollection, type CollectionEntry } from 'astro:content';

const byOrder = (a: { data: { order: number } }, b: { data: { order: number } }) =>
  a.data.order - b.data.order;

export async function getPublishedWork(): Promise<CollectionEntry<'work'>[]> {
  const entries = await getCollection('work', ({ data }) => !data.draft);
  return entries.sort(byOrder);
}

export async function getPublishedDashboards(): Promise<CollectionEntry<'dashboards'>[]> {
  const entries = await getCollection('dashboards', ({ data }) => !data.draft);
  return entries.sort(byOrder);
}

export async function getPublishedOwnProjects(): Promise<CollectionEntry<'ownProjects'>[]> {
  const entries = await getCollection('ownProjects', ({ data }) => !data.draft);
  return entries.sort(byOrder);
}

export const categoryLabels: Record<CollectionEntry<'work'>['data']['category'], string> = {
  ecommerce: 'E-commerce',
  finance: 'Finance',
  engineering: 'Analytics engineering',
  research: 'Research',
};
