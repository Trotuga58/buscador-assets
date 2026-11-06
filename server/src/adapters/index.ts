import type { Adapter } from '../../../shared/types.ts';
import { createOpenverseAdapter } from './openverse.ts';
import { createPolyPizzaAdapter } from './polypizza.ts';
import { createSketchfabAdapter } from './sketchfab.ts';
import { createFreesoundAdapter } from './freesound.ts';

export const allAdapters: Adapter[] = [createOpenverseAdapter(), createPolyPizzaAdapter(), createSketchfabAdapter(), createFreesoundAdapter()];
