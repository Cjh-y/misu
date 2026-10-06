import type { GameState, SaveData } from '../types';
export const SAVE_KEY = 'misu.save.v1';
export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }
const volatileValues = new Map<string, string>();
const volatileStorage: StorageLike = {
  getItem: key => volatileValues.get(key) ?? null,
  setItem: (key, value) => { volatileValues.set(key, value); },
  removeItem: key => { volatileValues.delete(key); },
};
function defaultStorage(): StorageLike {
  try { return globalThis.localStorage; }
  catch { return volatileStorage; }
}
export function saveGame(state: GameState, storage?: StorageLike, now = Date.now()): void {
  const data: SaveData = { schemaVersion: 1, caseId: 'silver-whistle', savedAt: now, state };
  try { (storage ?? defaultStorage()).setItem(SAVE_KEY, JSON.stringify(data)); }
  catch { volatileStorage.setItem(SAVE_KEY, JSON.stringify(data)); }
}
export function loadGame(storage?: StorageLike): GameState | null {
  try {
    const parsed = JSON.parse((storage ?? defaultStorage()).getItem(SAVE_KEY) ?? 'null') as SaveData | null;
    if (!parsed || parsed.schemaVersion !== 1 || parsed.caseId !== 'silver-whistle' || !parsed.state?.currentScene) return null;
    return parsed.state;
  } catch { return null; }
}
export function resetSave(storage?: StorageLike): void {
  try { (storage ?? defaultStorage()).removeItem(SAVE_KEY); }
  catch { volatileStorage.removeItem(SAVE_KEY); }
}
