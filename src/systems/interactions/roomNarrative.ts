import type { GameState, SceneId } from '../../core/types';
import { WATSON_INTERACTION, ROOM_NARRATIVE_INTERACTIONS, type RoomNarrativeInteraction } from '../../data/cases/silver-whistle/roomNarrative';

export type ActiveRoomInteraction = RoomNarrativeInteraction;

/** Pick the closest reachable authored interaction for the current physical room. */
export function findRoomInteraction(scene: SceneId, x: number, y: number, state: GameState): ActiveRoomInteraction | undefined {
  const definitions = scene === WATSON_INTERACTION.scene
    ? [WATSON_INTERACTION, ...ROOM_NARRATIVE_INTERACTIONS]
    : [];
  return definitions
    .filter(item => item.kind === 'departure' || !item.requiresFlag || state.storyFlags[item.requiresFlag] === true)
    .filter(item => !item.once || !state.investigatedObjects.includes(item.id))
    .map(item => ({item, distance: Math.hypot(item.x-x,item.y-y)}))
    .filter(candidate => candidate.distance <= candidate.item.range)
    .sort((a,b) => a.distance-b.distance)[0]?.item;
}
