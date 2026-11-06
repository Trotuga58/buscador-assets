import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export const KEY_NAMES = ['FREESOUND_API_KEY', 'GOOGLE_FONTS_API_KEY', 'POLYPIZZA_API_KEY', 'SKETCHFAB_API_KEY'] as const;
export type KeyName = (typeof KEY_NAMES)[number];
type Env = Record<string, string | undefined>;

export function createSettings(file: string, env: Env) {
  let stored: Partial<Record<KeyName, string>> = {};

  async function save(): Promise<void> {
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, JSON.stringify(stored, null, 1));
  }

  return {
    /** Lee el archivo y vuelca las claves en env (las del archivo mandan sobre .env). */
    async load(): Promise<void> {
      try {
        const data = JSON.parse(await readFile(file, 'utf8')) as Record<string, unknown>;
        for (const k of KEY_NAMES) {
          const v = data[k];
          if (typeof v === 'string' && v.trim()) { stored[k] = v.trim(); env[k] = v.trim(); }
        }
      } catch { stored = {}; }
    },
    /** Solo dice si cada clave está configurada; nunca devuelve su valor. */
    status(): Record<KeyName, boolean> {
      return Object.fromEntries(KEY_NAMES.map((k) => [k, Boolean(env[k])])) as Record<KeyName, boolean>;
    },
    async update(partial: Partial<Record<string, unknown>>): Promise<void> {
      for (const k of KEY_NAMES) {
        const v = partial[k];
        if (typeof v !== 'string') continue;
        const t = v.trim();
        if (t) { stored[k] = t; env[k] = t; } else { delete stored[k]; delete env[k]; }
      }
      await save();
    },
  };
}
