import type { GameState, PlayerHypothesis, HypothesisStatus } from '../../core/types';
export function createHypothesis(state: GameState, text: string, now = Date.now(), relationTarget?: string): GameState {
  const clean = text.trim(); if (!clean) return state;
  const hypothesis: PlayerHypothesis = { id: crypto.randomUUID(), text: clean, status:'active', relationTarget, createdAt:now, updatedAt:now };
  return { ...state, hypotheses:[...state.hypotheses, hypothesis] };
}
export function updateHypothesis(state: GameState, id: string, text: string, status: HypothesisStatus, now = Date.now()): GameState {
  return { ...state, hypotheses:state.hypotheses.map(h => h.id === id ? {...h, text:text.trim() || h.text, status, updatedAt:now} : h) };
}
