import type { Adapter } from '../../../shared/types.ts';
import { createOpenverseAdapter } from './openverse.ts';
import { createPolyPizzaAdapter } from './polypizza.ts';
import { createFreesoundAdapter } from './freesound.ts';
import { createCuratedAdapter, type CuratedEntry } from './curated.ts';
import curatedData from '../../data/curated.json' with { type: 'json' };

const curated = curatedData as CuratedEntry[];

export const allAdapters: Adapter[] = [createOpenverseAdapter(), createPolyPizzaAdapter(), createFreesoundAdapter(), createCuratedAdapter(curated)];
