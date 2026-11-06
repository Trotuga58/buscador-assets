import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Asset } from '../../shared/types.ts';

export interface Favorites {
  list(): Promise<Asset[]>;
  add(a: Asset): Promise<void>;
  remove(id: string): Promise<void>;
}

export function createFavorites(file: string): Favorites {
  async function list(): Promise<Asset[]> {
    try {
      const data: unknown = JSON.parse(await readFile(file, 'utf8'));
      return Array.isArray(data) ? (data as Asset[]) : [];
    } catch {
      return [];
    }
  }
  async function save(items: Asset[]): Promise<void> {
    await mkdir(dirname(file), { recursive: true });
    const tmp = `${file}.tmp`;
    await writeFile(tmp, JSON.stringify(items, null, 1));
    await rename(tmp, file);
  }
  // Las escrituras se encadenan para que dos peticiones seguidas no se pisen.
  let queue: Promise<unknown> = Promise.resolve();
  const serial = <T>(fn: () => Promise<T>): Promise<T> => {
    const run = queue.then(fn, fn);
    queue = run.catch(() => undefined);
    return run;
  };

  return {
    list,
    add: (a) => serial(async () => {
      const items = await list();
      if (!items.some((x) => x.id === a.id)) await save([...items, a]);
    }),
    remove: (id) => serial(async () => {
      const items = await list();
      if (items.some((x) => x.id === id)) await save(items.filter((x) => x.id !== id));
    }),
  };
}
