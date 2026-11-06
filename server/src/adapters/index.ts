import type { Adapter } from '../../../shared/types.ts';
import { createOpenverseAdapter } from './openverse.ts';

export const allAdapters: Adapter[] = [createOpenverseAdapter()];
