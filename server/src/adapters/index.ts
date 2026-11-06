import type { Adapter } from '../../../shared/types.ts';
import { createOpenverseAdapter } from './openverse.ts';
import { createPolyPizzaAdapter } from './polypizza.ts';
import { createSketchfabAdapter } from './sketchfab.ts';
import { createFreesoundAdapter } from './freesound.ts';
import { createGoogleFontsAdapter } from './googlefonts.ts';
import { createCuratedAdapter, type CuratedEntry } from './curated.ts';
import { readFileSync } from 'node:fs';

const curated = JSON.parse(readFileSync(new URL('../../data/curated.json', import.meta.url), 'utf8')) as CuratedEntry[];

export const allAdapters: Adapter[] = [createOpenverseAdapter(), createPolyPizzaAdapter(), createSketchfabAdapter(), createFreesoundAdapter(), createGoogleFontsAdapter(), createCuratedAdapter(curated)];
