import type { GameState } from '../../core/types';
import type { EvidenceId } from '../../core/types';
import type { DialogueLine } from '../../data/cases/silver-whistle/dialogues';
import { discoverEvidence } from '../../core/state/gameState';

export function canShowDialogueLine(line:DialogueLine,state:GameState):boolean {
  return (line.conditions??[]).every(condition=>condition.kind==='storyFlag'
    ? Boolean(state.storyFlags[condition.id])
    : state.discoveredEvidence.includes(condition.id as EvidenceId));
}

export function completeDialogueLine(line:DialogueLine,state:GameState):GameState {
  const next={...state,dialogueFlags:{...state.dialogueFlags,[line.id]:true}};
  return line.effect?.kind==='evidence' ? discoverEvidence(next,line.effect.id) : next;
}
