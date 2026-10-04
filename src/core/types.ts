import { EVIDENCE_IDS, SCENES } from './ids';
export type SceneId = typeof SCENES[keyof typeof SCENES];
export type EvidenceId = typeof EVIDENCE_IDS[keyof typeof EVIDENCE_IDS];
export type HypothesisStatus = 'active' | 'retained' | 'withdrawn';
export interface Point { x: number; y: number }
export interface PlayerHypothesis { id: string; text: string; status: HypothesisStatus; relationTarget?: string; createdAt: number; updatedAt: number }
export interface GameState {
  currentScene: SceneId; playerPosition: Point; discoveredEvidence: EvidenceId[];
  investigatedObjects: string[]; dialogueFlags: Record<string, boolean>; storyFlags: Record<string, boolean>;
  dialogueProgress: Record<string, number>;
  hypotheses: PlayerHypothesis[]; hypothesisState: Record<string, unknown>; unlockedLocations: SceneId[];
}
export interface SaveData { schemaVersion: 1; caseId: 'silver-whistle'; savedAt: number; state: GameState }
export interface Condition { kind: 'storyFlag' | 'evidence'; id: string }
export interface Interactable {
  id: string; scene: SceneId; x: number; y: number; interactionRange: number; title: string;
  description: string; observations: string[]; evidenceId?: EvidenceId; conditions?: Condition[]; repeatable: boolean;
}
export interface EvidenceRelation { kind: 'supports' | 'contradicts' | 'requires' | 'unlocks'; targetId: string; note: string }
export interface Evidence {
  id: EvidenceId; name: string; description: string; source: string; observations: string[];
  tags: string[]; relations: EvidenceRelation[]; icon: string;
}
