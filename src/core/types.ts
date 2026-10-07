import { EVIDENCE_IDS, SCENES } from './ids';
import type { WorldPosition3D } from '../game/world/WorldProjection';
export type SceneId = typeof SCENES[keyof typeof SCENES];
export type EvidenceId = typeof EVIDENCE_IDS[keyof typeof EVIDENCE_IDS];
export type HypothesisStatus = 'active' | 'retained' | 'withdrawn';
export interface Point { x: number; y: number }
export interface PlayerHypothesis { id: string; text: string; status: HypothesisStatus; relationTarget?: string; createdAt: number; updatedAt: number }
export interface GameState {
  currentScene: SceneId; playerPosition: Point; discoveredEvidence: EvidenceId[];
  /** Authoritative floor position in each room. playerPosition is retained for old saves and UI projection. */
  playerWorldPosition3D?: WorldPosition3D;
  investigatedObjects: string[]; dialogueFlags: Record<string, boolean>; storyFlags: Record<string, boolean>;
  dialogueProgress: Record<string, number>;
  hypotheses: PlayerHypothesis[]; hypothesisState: Record<string, unknown>; unlockedLocations: SceneId[];
}
export interface SaveData { schemaVersion: 1; caseId: 'silver-whistle'; savedAt: number; state: GameState }
export interface Condition { kind: 'storyFlag' | 'evidence'; id: string }
export interface Interactable {
  /** x/y are retained for rooms that still use 2D coordinates; Lydia runtime reads worldPosition. */
  id: string; scene: SceneId; x: number; y: number; interactionRange: number; priority?: number; title: string;
  worldPosition?:WorldPosition3D; worldInteractionRange?:number;
  description: string; observations: string[]; evidenceId?: EvidenceId; conditions?: Condition[]; repeatable: boolean;
}
export interface EvidenceRelation { kind: 'supports' | 'contradicts' | 'requires' | 'unlocks'; targetId: string; note: string }
export interface Evidence {
  id: EvidenceId; name: string; description: string; source: string; observations: string[];
  tags: string[]; relations: EvidenceRelation[]; icon: string;
}
