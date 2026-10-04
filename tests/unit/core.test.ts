import { describe, expect, it } from 'vitest';
import { initialGameState, discoverEvidence, setScene } from '../../src/core/state/gameState';
import { assessHypothesis } from '../../src/systems/reasoning/evaluate';
import type { Evidence } from '../../src/core/types';
import { createHypothesis, updateHypothesis } from '../../src/systems/reasoning/hypotheses';
import { EVIDENCE } from '../../src/data/cases/silver-whistle/evidence';
import { OPENING_DIALOGUE } from '../../src/data/cases/silver-whistle/dialogues';
import { canShowDialogueLine, completeDialogueLine } from '../../src/systems/dialogue/dialogue';
import { loadGame, resetSave, saveGame, SAVE_KEY } from '../../src/core/save/save';

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
