import type { Evidence, GameState } from '../../core/types';
export type EvidenceAssessment = 'supported' | 'contradicted' | 'unexplained' | 'unknown';
export interface ReasoningResult { assessment: EvidenceAssessment; supporting: Evidence[]; contradicting: Evidence[] }
export function assessHypothesis(targetId: string, state: GameState, evidence: Record<string, Evidence>): ReasoningResult {
  const discovered = state.discoveredEvidence.map(id => evidence[id]).filter((item): item is Evidence => Boolean(item));
  const supporting = discovered.filter(e => e.relations.some(r => r.kind === 'supports' && r.targetId === targetId));
  const contradicting = discovered.filter(e => e.relations.some(r => r.kind === 'contradicts' && r.targetId === targetId));
  let assessment: EvidenceAssessment = 'unknown';
  if (supporting.length && contradicting.length) assessment = 'unexplained';
  else if (contradicting.length) assessment = 'contradicted';
  else if (supporting.length) assessment = 'supported';
  return { assessment, supporting, contradicting };
}
