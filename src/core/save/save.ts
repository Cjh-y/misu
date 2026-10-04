import type { GameState, SaveData } from '../types';
export const SAVE_KEY = 'misu.save.v1';
export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }
export function saveGame(state: GameState, storage: StorageLike = localStorage, now = Date.now()): void {
  const data: SaveData = { schemaVersion: 1, caseId: 'silver-whistle', savedAt: now, state };
  storage.setItem(SAVE_KEY, JSON.stringify(data));
}
export function loadGame(storage: StorageLike = localStorage): GameState | null {
  try {
    const parsed = JSON.parse(storage.getItem(SAVE_KEY) ?? 'null') as SaveData | null;
    if (!parsed || parsed.schemaVersion !== 1 || parsed.caseId !== 'silver-whistle' || !parsed.state?.currentScene) return null;
    return parsed.state;
  } catch { return null; }
}
export function resetSave(storage: StorageLike = localStorage): void { storage.removeItem(SAVE_KEY); }
