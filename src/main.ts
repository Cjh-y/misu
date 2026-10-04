import Phaser from 'phaser';
import { WorldScene } from './game/scenes/WorldScene';
import { initialGameState, discoverEvidence, setScene } from './core/state/gameState';
import { HYPOTHESIS_IDS, SCENES } from './core/ids';
import { loadGame, saveGame, resetSave } from './core/save/save';
import { EVIDENCE } from './data/cases/silver-whistle/evidence';
import { INTERACTABLES } from './data/cases/silver-whistle/interactables';
import { OPENING_DIALOGUE } from './data/cases/silver-whistle/dialogues';
import { HYPOTHESES } from './data/cases/silver-whistle/relations';
import { assessHypothesis } from './systems/reasoning/evaluate';
import { createHypothesis, updateHypothesis } from './systems/reasoning/hypotheses';
import { canShowDialogueLine, completeDialogueLine } from './systems/dialogue/dialogue';
import type { EvidenceId, GameState, SceneId } from './core/types';
import './styles.css';

const root = document.querySelector<HTMLDivElement>('#app')!;
let state:GameState=initialGameState();
let game:Phaser.Game;
let openingIndex=0;
let modal:'title'|'dialogue'|'notebook'|'reasoning'|'detail'|'settings'|null='title';
let selectedEvidence:EvidenceId|null=null;
let joystickPointer:number|null=null;
let interactTarget:any=null;
let saveTimer:number|undefined;

root.innerHTML=`<main class="shell"><section class="game-frame"><div id="game"></div><div class="hud"><div class="brand">谜溯 <small id="scene-label">银哨之后</small></div><div class="hud-actions"><button data-action="notebook">案件笔记 <kbd>J</kbd></button><button data-action="reasoning">推理板 <kbd>K</kbd></button><button data-action="settings" aria-label="设置">⚙</button></div></div><div id="nearby" class="nearby"></div><div class="touch-controls"><div class="stick" id="stick"><i></i></div><div class="touch-actions"><button class="touch-door" data-action="door" hidden>开门</button><button class="touch-interact" data-action="interact">调查</button></div></div><div id="overlay"></div></section><footer>WASD / 方向键移动 · E 调查 · J 笔记 · K 推理</footer></main>`;
const overlay=root.querySelector<HTMLDivElement>('#overlay')!;
const render=()=>{
  if(game?.scene.isActive('world'))game.scene.getScene('world').events.emit('ui-blocked',modal!==null);
  if(modal==='title') { overlay.innerHTML=`<div class="scrim title-screen"><article class="title-cover" aria-label="谜溯：银哨之后"><p class="cover-mark">CASE FILE　/　A MANOR MYSTERY</p><p class="title-eyebrow">— 一宗庄园旧案 —</p><h1>谜溯</h1><h2>银哨之后</h2><div class="title-rule" aria-hidden="true"><i></i></div><nav class="title-menu" aria-label="主菜单"><button class="title-link primary-link" data-action="new"><span>开始调查</span></button><button class="title-link secondary-link" data-action="continue" ${loadGame()?'':'disabled'}><span>继续案件</span></button><button class="title-archive" data-action="settings">设置与存档</button></nav></article></div>`; return; }
  if(modal==='dialogue') { const line=OPENING_DIALOGUE[openingIndex]; const portraitIndex=line.speaker==='华生'?1:line.speaker==='福尔摩斯'?0:line.speaker==='艾琳·维尔'?2:-1; const portraitStyle=portraitIndex<0?'':`background-image:url('/assets/art/characters/portraits/cast-contact-sheet.png');background-position:${portraitIndex*33.333}% 0%;`; overlay.innerHTML=`<div class="dialogue-wrap"><article class="dialogue-box"><div class="portrait" style="${portraitStyle}">${portraitIndex<0?line.speaker.slice(0,1):''}</div><div><b>${line.speaker}</b><p>${line.text}</p><button class="primary" data-action="next">继续　›</button></div></article></div>`; return; }
  if(modal==='notebook') { overlay.innerHTML=`<div class="panel-scrim"><article class="panel"><header><div><p class="eyebrow">CASE NOTEBOOK</p><h2>案件笔记</h2></div><button data-action="close" class="close">×</button></header><nav class="tabs"><span class="active">证据 ${state.discoveredEvidence.length}</span><span>调查记录</span></nav><div class="evidence-list">${state.discoveredEvidence.map(id=>{const e=EVIDENCE[id];const art=['E06','E08','E09'].includes(id)?` art-${id.toLowerCase()}`:'';return `<button class="evidence-card" data-evidence="${id}"><span class="icon${art}">${art?'':e.icon}</span><span><b>${e.name}</b><small>${e.source}</small></span><span>›</span></button>`}).join('')||'<p class="muted">尚未发现证据</p>'}</div><footer class="panel-foot">${5-state.discoveredEvidence.length} 项记录尚未发现</footer></article></div>`; return; }
  if(modal==='detail' && selectedEvidence) { const e=EVIDENCE[selectedEvidence]; const art=['E06','E08','E09'].includes(e.id)?`<div class="evidence-detail-art art-${e.id.toLowerCase()}" role="img" aria-label="${e.name}"></div>`:''; overlay.innerHTML=`<div class="panel-scrim"><article class="panel detail"><header><div><p class="eyebrow">EVIDENCE · ${e.id}</p><h2>${e.name}</h2></div><button data-action="notebook" class="close">×</button></header>${art}<p class="detail-desc">${e.description}</p><div class="source">来源　${e.source}</div><h3>福尔摩斯的观察</h3>${e.observations.map(o=>`<blockquote>${o}</blockquote>`).join('')}<button data-action="notebook">返回证据列表</button></article></div>`;return; }
  if(modal==='reasoning') { const current=state.hypotheses.filter(h=>h.status!=='withdrawn'); overlay.innerHTML=`<div class="panel-scrim"><article class="panel reasoning"><header><div><p class="eyebrow">REASONING BOARD</p><h2>建立案件假设</h2></div><button data-action="close" class="close">×</button></header><p class="muted">假设是暂时的解释。证据会显示支持、冲突或仍待解释之处；由你决定是否保留。</p><div class="suggestion"><small>可从这个疑问开始</small><p>${HYPOTHESES[0].statement}</p><button data-action="suggest">采用为我的假设</button></div><form id="hypothesis-form"><label for="hypothesis">写下或修改你的假设</label><textarea id="hypothesis" name="hypothesis" maxlength="280" placeholder="例如：某种动物通过通气孔进入房间，并利用铃绳靠近床铺"></textarea><button class="primary">建立假设</button></form>${current.map(h=>{const relation=h.relationTarget?assessHypothesis(h.relationTarget,state,EVIDENCE):{assessment:'unknown' as const,supporting:[],contradicting:[]};const label=relation.contradicting.length?`有 ${relation.contradicting.length} 项待解释矛盾`:relation.assessment==='unexplained'?'有支持证据和矛盾同时存在':relation.assessment==='supported'?'有证据支持':'尚无关联证据';return `<section class="hypothesis-card"><div class="tag ${relation.assessment}">${label}</div><p>${h.text}</p><button data-action="conflicts" data-id="${h.id}">查看证据关系 (${relation.supporting.length+relation.contradicting.length})</button><button data-action="retain" data-id="${h.id}">保留</button><button data-action="edit" data-id="${h.id}">修改</button><button data-action="withdraw" data-id="${h.id}">撤回</button><div class="relations" id="relations-${h.id}" hidden>${[...relation.supporting.map(e=>({e,kind:'支持'})),...relation.contradicting.map(e=>({e,kind:'矛盾'}))].map(({e,kind})=>`<p><b>${kind} · ${e.name}</b><br>${e.relations.find(r=>r.targetId===h.relationTarget)?.note}</p>`).join('')||'<p class="muted">目前没有已发现且与此假设关联的证据。</p>'}</div></section>`;}).join('')}<footer class="panel-foot">假设可随时修改或撤回，不会因暂时不完整而中断调查。</footer></article></div>`; return; }
  if(modal==='settings') { overlay.innerHTML=`<div class="panel-scrim"><article class="panel"><header><h2>设置</h2><button data-action="close" class="close">×</button></header><p>进度自动保存在本机浏览器。</p><button class="danger" data-action="reset">重置存档</button></article></div>`; return; }
  overlay.innerHTML='';
};
game=new Phaser.Game({type:Phaser.AUTO,parent:'game',width:480,height:320,backgroundColor:'#273039',pixelArt:true,roundPixels:true,physics:{default:'arcade',arcade:{debug:false}},scene:[WorldScene],scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH}});

function changeScene(id:SceneId,position:{x:number;y:number}){state=setScene(state,id,position);game.scene.getScene('world').events.emit('set-scene',id,position);persist();}
function persist(immediate=false){ if(!state.storyFlags.started)return;if(immediate){window.clearTimeout(saveTimer);saveTimer=undefined;saveGame(state);return;}if(saveTimer===undefined){saveTimer=window.setTimeout(()=>{saveTimer=undefined;saveGame(state);},450);} }
function advanceOpening(){const line=OPENING_DIALOGUE[openingIndex];if(line&&canShowDialogueLine(line,state))state=completeDialogueLine(line,state);openingIndex++;state.dialogueProgress.opening=openingIndex;if(openingIndex>=OPENING_DIALOGUE.length){state.storyFlags.openingComplete=true;state.dialogueFlags.openingRead=true;changeScene(SCENES.HALL,{x:100,y:160});modal=null;}else persist(true);render();}
function showObservation(item:any){ const already=state.investigatedObjects.includes(item.id); state={...state,investigatedObjects:already?state.investigatedObjects:[...state.investigatedObjects,item.id]}; if(item.evidenceId) state=discoverEvidence(state,item.evidenceId); modal='detail'; selectedEvidence=item.evidenceId ?? null; persist(true); renderInteractDetail(item); }
function renderInteractDetail(item:any){
 const evidence=item.evidenceId?EVIDENCE[item.evidenceId]:null;
 overlay.innerHTML=`<div class="panel-scrim"><article class="panel detail"><header><div><p class="eyebrow">${evidence?`EVIDENCE · ${evidence.id}`:'OBSERVATION'}</p><h2>${item.title}</h2></div><button data-action="close" class="close">×</button></header><p class="detail-desc">${item.description}</p>${item.observations.map((s:string)=>`<blockquote>${s}</blockquote>`).join('')}${evidence?`<div class="found">已记入案件笔记：${evidence.name}</div>`:''}<button data-action="close" class="primary">继续调查</button></article></div>`;
}
root.addEventListener('click',e=>{
 const target=(e.target as HTMLElement).closest<HTMLElement>('[data-action],[data-evidence]'); if(!target)return;
 if(target.dataset.evidence){selectedEvidence=target.dataset.evidence as EvidenceId;modal='detail';render();return;}
 const action=target.dataset.action;
 if(action==='new'){window.clearTimeout(saveTimer);saveTimer=undefined;resetSave();state=initialGameState();state.storyFlags.started=true;openingIndex=0;modal='dialogue';persist(true);game.scene.start('world');render();}
 else if(action==='continue'){const loaded=loadGame();if(loaded){state=loaded;const restoredScene=loaded.currentScene,restoredPosition={...loaded.playerPosition};openingIndex=loaded.dialogueProgress.opening??0;modal=loaded.storyFlags.openingComplete?null:'dialogue';game.scene.start('world'); setTimeout(()=>game.scene.getScene('world').events.emit('set-scene',restoredScene,restoredPosition),100);render();}}
 else if(action==='next'){advanceOpening();}
 else if(action==='notebook'){modal='notebook';render();}
 else if(action==='reasoning'){modal='reasoning';render();}
 else if(action==='settings'){modal='settings';render();}
 else if(action==='close'){modal=null;render();}
 else if(action==='reset'){window.clearTimeout(saveTimer);saveTimer=undefined;resetSave();state=initialGameState();modal='title';game.scene.start('world');render();}
 else if(action==='suggest'){state=createHypothesis(state,HYPOTHESES[0].statement,Date.now(),HYPOTHESIS_IDS.ANIMAL_THROUGH_VENT);persist(true);render();}
 else if(action==='conflicts'){const el=document.querySelector(`#relations-${target.dataset.id}`);if(el)el.toggleAttribute('hidden');}
 else if(action==='retain'||action==='withdraw'||action==='edit'){const id=target.dataset.id!;const hypothesis=state.hypotheses.find(h=>h.id===id);if(!hypothesis)return;if(action==='edit'){const input=document.querySelector<HTMLTextAreaElement>('#hypothesis');if(input)input.value=hypothesis.text;input?.focus();return;} state=updateHypothesis(state,id,hypothesis.text,action==='retain'?'retained':'withdrawn');persist(true);render();}
 else if(action==='interact')doInteract();
 else if(action==='door')game.scene.getScene('world').events.emit('toggle-door');
});
root.addEventListener('submit',e=>{if((e.target as HTMLElement).id!=='hypothesis-form')return;e.preventDefault();const data=new FormData(e.target as HTMLFormElement);const value=String(data.get('hypothesis')??'');if(value.trim()){const target=HYPOTHESES.find(h=>h.statement.trim()===value.trim())?.id;state=createHypothesis(state,value,Date.now(),target);persist(true);render();}});
root.addEventListener('input',()=>{});
function doInteract(position?:{scene:SceneId;x:number;y:number}){if(modal==='dialogue'){advanceOpening();return;} const scene=position?.scene??state.currentScene;const playerPosition=position?{x:position.x,y:position.y}:state.playerPosition;
 if(scene===SCENES.HALL){const pos=playerPosition;if(pos.x<42&&Math.abs(pos.y-160)<52){changeScene(SCENES.BAKER_STREET,{x:430,y:160});return;}if(pos.x>150&&pos.x<274&&pos.y>104&&pos.y<220){changeScene(SCENES.LYDIA_ROOM,{x:75,y:224});return;} interactTarget={title:'庄园走廊',description:'走廊连接庄园各处。莉迪亚旧房门位于走廊中段。',observations:['靠近走廊中段的房门并按 E 进入莉迪亚旧房；左侧通往贝克街。']};renderInteractDetail(interactTarget);return;}
 if(scene===SCENES.LYDIA_ROOM&&playerPosition.x<28&&playerPosition.y>162&&playerPosition.y<256){changeScene(SCENES.HALL,{x:100,y:160});return;}
 const candidates=INTERACTABLES.filter(i=>i.scene===scene).map(i=>({...i,distance:Math.hypot(i.x-playerPosition.x,i.y-playerPosition.y)})).sort((a,b)=>a.distance-b.distance);
 const item=candidates.find(i=>i.distance<=i.interactionRange); if(item){showObservation(item);return;} if(scene===SCENES.BAKER_STREET){modal='dialogue';render();return;} interactTarget={title:'附近没有可调查的物件',description:'靠近床头、通气孔或房门等物件后，再按 E 调查。',observations:[]};renderInteractDetail(interactTarget);
}
window.addEventListener('misu:action',(event:any)=>{const action=event.detail?.action;if(action==='notebook'){modal='notebook';render();}else if(action==='reasoning'){modal='reasoning';render();}else if(action==='escape'){modal=null;render();}else if(action==='interact')doInteract(event.detail);});
window.addEventListener('misu:player-position',(event:any)=>{const d=event.detail;state={...state,currentScene:d.scene,playerPosition:{x:d.x,y:d.y}};persist();if(d.scene===SCENES.HALL&&d.x>150&&d.x<274&&d.y>104&&d.y<220){changeScene(SCENES.LYDIA_ROOM,{x:75,y:224});return;}if(d.scene===SCENES.LYDIA_ROOM&&d.x<28&&d.y>162&&d.y<256){changeScene(SCENES.HALL,{x:100,y:160});return;}const found=INTERACTABLES.filter(i=>i.scene===d.scene&&Math.hypot(i.x-d.x,i.y-d.y)<i.interactionRange+8).sort((a,b)=>Math.hypot(a.x-d.x,a.y-d.y)-Math.hypot(b.x-d.x,b.y-d.y))[0];const nearby=root.querySelector('#nearby')!;const interactLabel=window.matchMedia('(max-width: 900px)').matches?'点击调查':'E 调查';nearby.textContent=found?`${found.title}　·　${interactLabel}`:d.scene===SCENES.HALL&&d.x<55&&Math.abs(d.y-160)<60?`返回贝克街　·　${interactLabel}`:'';});
window.addEventListener('misu:scene-ready',(event:any)=>{const labels:{[key:string]:string}={'221b':'贝克街 221B',hall:'庄园走廊','lydia-room':'莉迪亚旧房'};const label=root.querySelector<HTMLElement>('#scene-label');if(label)label.textContent=labels[event.detail?.scene]??'银哨之后';if(game?.scene.isActive('world'))game.scene.getScene('world').events.emit('ui-blocked',modal!==null);});
window.addEventListener('misu:door-availability',(event:any)=>{const control=root.querySelector<HTMLButtonElement>('.touch-door');if(!control)return;control.hidden=!event.detail?.available;control.textContent=event.detail?.state==='open'?'关门':'开门';});
// Mobile joystick is independent from the world keyboard and UI action state.
const stick=root.querySelector<HTMLElement>('#stick')!;
stick.addEventListener('pointerdown',e=>{joystickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);moveStick(e);});
stick.addEventListener('pointermove',e=>{if(e.pointerId===joystickPointer)moveStick(e);});
stick.addEventListener('pointerup',stopStick);stick.addEventListener('pointercancel',stopStick);
function moveStick(e:PointerEvent){const r=stick.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),length=Math.hypot(dx,dy)||1,mag=Math.min(1,length/38),x=dx/length*mag,y=dy/length*mag;const knob=stick.querySelector('i')!;knob.style.transform=`translate(${x*27}px,${y*27}px)`;game.scene.getScene('world').events.emit('virtual-input',{x,y});}
function stopStick(e:PointerEvent){if(e.pointerId!==joystickPointer)return;joystickPointer=null;stick.querySelector('i')!.style.transform='';game.scene.getScene('world').events.emit('virtual-input',{x:0,y:0});}
render();
