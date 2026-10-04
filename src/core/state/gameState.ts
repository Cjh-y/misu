import type { EvidenceId, GameState, SceneId } from '../types';
import { SCENES } from '../ids';

export const initialGameState = (): GameState => ({
  currentScene: SCENES.BAKER_STREET, playerPosition: { x: 160, y: 176 }, discoveredEvidence: [], investigatedObjects: [],
  dialogueFlags: {}, storyFlags: {}, dialogueProgress: {}, hypotheses: [], hypothesisState: {}, unlockedLocations: [SCENES.BAKER_STREET],
});

export function discoverEvidence(state: GameState, evidenceId: EvidenceId): GameState {
  if (state.discoveredEvidence.includes(evidenceId)) return state;
  return { ...state, discoveredEvidence: [...state.discoveredEvidence, evidenceId] };
}

export function setScene(state: GameState, scene: SceneId, position: { x: number; y: number }): GameState {
  return { ...state, currentScene: scene, playerPosition: position,
    unlockedLocations: state.unlockedLocations.includes(scene) ? state.unlockedLocations : [...state.unlockedLocations, scene] };
}
