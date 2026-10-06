import { describe, expect, it } from 'vitest';
import { initialGameState, discoverEvidence, setScene } from '../../src/core/state/gameState';
import { assessHypothesis } from '../../src/systems/reasoning/evaluate';
import type { Evidence } from '../../src/core/types';
import { createHypothesis, updateHypothesis } from '../../src/systems/reasoning/hypotheses';
import { EVIDENCE } from '../../src/data/cases/silver-whistle/evidence';
import { OPENING_DIALOGUE } from '../../src/data/cases/silver-whistle/dialogues';
import { canShowDialogueLine, completeDialogueLine } from '../../src/systems/dialogue/dialogue';
import { loadGame, resetSave, saveGame, SAVE_KEY } from '../../src/core/save/save';
import { canCharacterPassClearance, findLydiaCollision, isWithinGroundFootprint, LYDIA_FURNITURE_GROUPS, LYDIA_PLAYER_COLLISION_VOLUME, LYDIA_RUG_FOOTPRINT, LYDIA_WORLD_ENTITIES, overlapsGround } from '../../src/game/world/lydiaWorldRoom';

function memoryStorage(){const values=new Map<string,string>();return {getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v),removeItem:(k:string)=>values.delete(k)};}

describe('GameState and evidence',()=>{
 it('discovers evidence idempotently',()=>{let s=initialGameState();s=discoverEvidence(s,'E06');s=discoverEvidence(s,'E06');expect(s.discoveredEvidence).toEqual(['E06']);});
 it('unlocks scenes while preserving scene and position',()=>{const s=setScene(initialGameState(),'hall',{x:128,y:160});expect(s.currentScene).toBe('hall');expect(s.playerPosition).toEqual({x:128,y:160});expect(s.unlockedLocations).toContain('hall');});
 it('creates, retains, edits and withdraws hypotheses',()=>{let s=createHypothesis(initialGameState(),'动物穿过通气孔',100);const h=s.hypotheses[0];expect(h.status).toBe('active');s=updateHypothesis(s,h.id,'危险在锁门前带入','retained',200);expect(s.hypotheses[0]).toMatchObject({text:'危险在锁门前带入',status:'retained',updatedAt:200});s=updateHypothesis(s,h.id,'危险在锁门前带入','withdrawn',300);expect(s.hypotheses[0].status).toBe('withdrawn');});
 it('reports discovered evidence contradiction without forcing an answer',()=>{let s=discoverEvidence(initialGameState(),'E08');let result=assessHypothesis('animal-through-vent',s,EVIDENCE);expect(result.assessment).toBe('contradicted');expect(result.contradicting.map(e=>e.id)).toEqual(['E08']);s=discoverEvidence(s,'E09');result=assessHypothesis('animal-through-vent',s,EVIDENCE);expect(result.assessment).toBe('contradicted');});
 it('reports unexplained when discovered evidence both supports and contradicts',()=>{const evidence:Record<string,Evidence>={
  E01:{id:'E01',name:'支持记录',description:'',source:'',observations:[],tags:[],relations:[{kind:'supports',targetId:'model',note:'支持'}],icon:'+'},
  E02:{id:'E02',name:'反证记录',description:'',source:'',observations:[],tags:[],relations:[{kind:'contradicts',targetId:'model',note:'矛盾'}],icon:'!'},
 };let s=discoverEvidence(initialGameState(),'E01');s=discoverEvidence(s,'E02');expect(assessHypothesis('model',s,evidence).assessment).toBe('unexplained');});
 it('reports unknown before related evidence is found',()=>{expect(assessHypothesis('animal-through-vent',initialGameState(),EVIDENCE).assessment).toBe('unknown');});
});

describe('data driven dialogue',()=>{
 it('evaluates conditions and applies per-line evidence effects once',()=>{
  const line=OPENING_DIALOGUE.find(item=>item.id==='opening-decision')!;
  const initial=initialGameState();
  expect(canShowDialogueLine(line,initial)).toBe(true);
  const next=completeDialogueLine(line,initial);
  expect(next.discoveredEvidence).toContain('E01');
  expect(next.dialogueFlags[line.id]).toBe(true);
  expect(completeDialogueLine(line,next).discoveredEvidence).toEqual(['E01']);
 });
});

describe('save system',()=>{
 it('round trips state and hypotheses',()=>{const storage=memoryStorage();let s=createHypothesis(initialGameState(),'可能有人预先带入危险',100);s=discoverEvidence(s,'E09');saveGame(s,storage,500);expect(loadGame(storage)).toEqual(s);});
 it('handles corrupt data and resets save',()=>{const storage=memoryStorage();storage.setItem(SAVE_KEY,'{broken');expect(loadGame(storage)).toBeNull();let s=initialGameState();saveGame(s,storage);resetSave(storage);expect(loadGame(storage)).toBeNull();});
});

describe('Lydia ground footprint geometry',()=>{
 it('supports polygon footprints without blocking empty corners of their bounds',()=>{
  const wedge={id:'wedge',x:1,z:1,width:2,depth:2,polygon:[{x:0,z:0},{x:2,z:0},{x:0,z:2}]};
  expect(overlapsGround({x:2.8,z:2.8,width:.2,depth:.2},wedge)).toBe(false);
  expect(overlapsGround({x:1.2,z:1.5,width:.2,depth:.2},wedge)).toBe(true);
 });
 it('uses group anchors and a separate standing body volume for room geometry',()=>{
  const bed=LYDIA_WORLD_ENTITIES.find(entity=>entity.id==='bed')!;
  const nightstand=LYDIA_WORLD_ENTITIES.find(entity=>entity.id==='nightstand')!;
  const rug=LYDIA_WORLD_ENTITIES.find(entity=>entity.id==='rug')!;
  const sleeping=LYDIA_FURNITURE_GROUPS.find(group=>group.id==='sleeping')!;
  expect(nightstand.position.x).toBeCloseTo(bed.position.x+sleeping.offsets.nightstand.x);
  expect(rug.position.x).toBeCloseTo(bed.position.x+sleeping.offsets.rug.x);
  expect(LYDIA_PLAYER_COLLISION_VOLUME.height).toBeGreaterThan(1.8);
  expect(isWithinGroundFootprint({x:rug.footprint.x+.1,z:rug.footprint.z+.1},LYDIA_RUG_FOOTPRINT)).toBe(true);
 });
 it('blocks the standing character body against desk occupied volumes, not only its floor footprint',()=>{
  const desk=LYDIA_WORLD_ENTITIES.find(entity=>entity.id==='desk')!;
  const hit=findLydiaCollision({x:desk.position.x,z:desk.position.z},false);
  expect(hit).toMatchObject({id:'desk',kind:'furniture'});
  expect(desk.occupiedVolumes.map(volume=>volume.id)).toEqual(['desk-tabletop','desk-drawer-bank','desk-left-support','desk-right-support']);
  expect(desk.clearanceVolumes?.[0].freeHeight).toBeLessThan(LYDIA_PLAYER_COLLISION_VOLUME.height);
  expect(canCharacterPassClearance(LYDIA_PLAYER_COLLISION_VOLUME.height,desk.clearanceVolumes![0].freeHeight)).toBe(false);
  expect(canCharacterPassClearance(.72,desk.clearanceVolumes![0].freeHeight)).toBe(true);
  expect(findLydiaCollision({x:desk.position.x,z:desk.position.z},false,{width:.25,depth:.25,height:.4})).toBeUndefined();
 });
 it('keeps bed, wardrobe, wall, and washstand volumes solid while leaving the center route open',()=>{
  const bed=LYDIA_WORLD_ENTITIES.find(entity=>entity.id==='bed')!;
  const wardrobe=LYDIA_WORLD_ENTITIES.find(entity=>entity.id==='wardrobe')!;
  const washstand=LYDIA_WORLD_ENTITIES.find(entity=>entity.id==='washstand')!;
  expect(findLydiaCollision({x:bed.position.x,z:bed.position.z})?.id).toBe('bed');
  expect(findLydiaCollision({x:wardrobe.position.x,z:wardrobe.position.z})?.id).toBe('wardrobe');
  expect(findLydiaCollision({x:washstand.position.x,z:washstand.position.z})?.id).toBe('washstand');
  expect(findLydiaCollision({x:9.4,z:2.24})?.id).toBe('mirror');
  expect(findLydiaCollision({x:5.1,z:4.9})).toBeUndefined();
  expect(findLydiaCollision({x:7.35,z:4.8})).toBeUndefined();
  expect(findLydiaCollision({x:7.35,z:4.4775})).toBeUndefined();
  expect(findLydiaCollision({x:7.35,z:4.513333333333331})).toBeUndefined();
 });
 it('has a continuous legal route from the lower-left room to the upper-right past the furniture groups',()=>{
  const step=.15,start={x:1.9,z:4.75},goal={x:8.15,z:2.8};
  const key=(x:number,z:number)=>`${Math.round(x/step)},${Math.round(z/step)}`;
  const queue=[start],seen=new Set([key(start.x,start.z)]);let found=false;
  for(let i=0;i<queue.length;i++){
   const current=queue[i];if(Math.hypot(current.x-goal.x,current.z-goal.z)<.23){found=true;break;}
   for(const [dx,dz] of [[step,0],[-step,0],[0,step],[0,-step],[step,step],[step,-step],[-step,step],[-step,-step]]){
    const next={x:current.x+dx,z:current.z+dz},id=key(next.x,next.z);
    if(seen.has(id)||findLydiaCollision(next))continue;
    seen.add(id);queue.push(next);
   }
  }
  expect(found).toBe(true);
 });
});
