import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface Cache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
}

export function createCache(dir: string, ttlMs: number): Cache {
  const file = (key: string) => join(dir, createHash('sha1').update(key).digest('hex') + '.json');
  return {
    async get<T>(key: string) {
      try {
        const { t, v } = JSON.parse(await readFile(file(key), 'utf8')) as { t: number; v: T };
        return Date.now() - t > ttlMs ? null : v;
      } catch {
        return null;
      }
    },
    async set<T>(key: string, value: T) {
      await mkdir(dir, { recursive: true });
      await writeFile(file(key), JSON.stringify({ t: Date.now(), v: value }));
    },
  };
}
