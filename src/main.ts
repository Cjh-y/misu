import Phaser from 'phaser';
import { usesTouchControls, syncInputMode } from './systems/input/device';
import { GameAudio } from './systems/audio/audio';
import { WorldScene } from './game/scenes/WorldScene';
import { initialGameState, discoverEvidence, setScene } from './core/state/gameState';
import { HYPOTHESIS_IDS, SCENES } from './core/ids';
import { loadGame, saveGame, resetSave } from './core/save/save';
import { EVIDENCE } from './data/cases/silver-whistle/evidence';
import { INTERACTABLES } from './data/cases/silver-whistle/interactables';
import { OPENING_DIALOGUE } from './data/cases/silver-whistle/dialogues';
import { WATSON_DIALOGUE } from './data/cases/silver-whistle/roomNarrative';
import { HYPOTHESES } from './data/cases/silver-whistle/relations';
import { assessHypothesis } from './systems/reasoning/evaluate';
import { createHypothesis, updateHypothesis } from './systems/reasoning/hypotheses';
import { canShowDialogueLine, completeDialogueLine } from './systems/dialogue/dialogue';
import { findRoomInteraction } from './systems/interactions/roomNarrative';
import type { EvidenceId, GameState, SceneId } from './core/types';
import './styles.css';
import { LYDIA_ENTRY_WORLD, LYDIA_WORLD_INTERACTABLES, isLydiaExitPosition, lydiaDistanceXZ } from './game/world/lydiaWorldRoom';
import type { WorldPosition3D } from './game/world/WorldProjection';

syncInputMode();
window.addEventListener('resize',syncInputMode);
const audio=new GameAudio();
document.addEventListener('pointerdown',()=>void audio.unlock(),{capture:true});
const root = document.querySelector<HTMLDivElement>('#app')!;
let state:GameState=initialGameState();
let game:Phaser.Game;
let openingIndex=0;
let activeDialogue=OPENING_DIALOGUE;
let activeDialogueKind:'opening'|'watson'='opening';
let dialogueIndex=0;
let transitionStage:'out'|'card'|'in'='out';
let modal:'title'|'dialogue'|'notebook'|'reasoning'|'detail'|'settings'|'transition'|null='title';
let selectedEvidence:EvidenceId|null=null;
let joystickPointer:number|null=null;
let interactTarget:any=null;
let saveTimer:number|undefined;
let returnModal:'title'|'dialogue'|'notebook'|null=null;
let editingHypothesisId:string|undefined;
let lastTravelAt=0;
const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const sceneLabels:Record<SceneId,string>={'221b':'贝克街 221B',hall:'庄园走廊','lydia-room':'莉迪亚旧房'};
let transitionTitle='庄园走廊';
let transitionDescription='前往莉迪亚旧房';
function openPanel(next:'notebook'|'reasoning'|'settings'){
 if(modal==='transition')return;
 if(modal==='title'||modal==='dialogue')returnModal=modal;
 else if(modal!==next)returnModal=null;
 if(next==='reasoning'&&modal!=='reasoning')editingHypothesisId=undefined;
 modal=next;audio.play('paper');render();
}
function closePanel(){
 if(modal==='transition'||modal==='title')return;
 if(modal==='dialogue'){skipDialogue();return;}
 editingHypothesisId=undefined;modal=returnModal;returnModal=null;selectedEvidence=null;render();
}
function skipDialogue(){while(modal==='dialogue')advanceDialogue();}
function hallPortal(x:number,feetY:number):'baker'|'lydia'|undefined {
 if(x<34&&Math.abs(feetY-160)<18)return 'baker';
 if(x>=198&&x<=226&&feetY>=156&&feetY<=194)return 'lydia';
 return undefined;
}
function travelTo(id:SceneId,position:{x:number;y:number},worldPosition?:WorldPosition3D){
 if(modal!==null||performance.now()-lastTravelAt<700)return;
 lastTravelAt=performance.now();transitionTitle=sceneLabels[id];transitionDescription=id===SCENES.LYDIA_ROOM?'门后，是两年前留下的房间。':id===SCENES.HALL?'脚步声在走廊里渐渐消散。':'回到贝克街';
 transitionStage='out';modal='transition';audio.play('travel');render();
 requestAnimationFrame(()=>overlay.querySelector('.transition-wrap')?.classList.add('active'));
 window.setTimeout(()=>{changeScene(id,position,worldPosition);transitionStage='card';render();
  window.setTimeout(()=>{transitionStage='in';const transition=overlay.querySelector<HTMLElement>('.transition-wrap');transition?.classList.remove('active');if(transition)transition.dataset.stage='in';
   window.setTimeout(()=>{modal=null;render();},440);},250);},440);
}

root.innerHTML=`<main class="shell"><section class="game-frame"><div id="game"></div><div class="hud"><div class="brand">谜溯 <small id="scene-label">银哨之后</small></div><div class="hud-actions"><button data-action="notebook">案件笔记 <kbd>J</kbd></button><button data-action="reasoning">推理板 <kbd>K</kbd></button><button data-action="settings" aria-label="设置">⚙</button></div></div><div id="nearby" class="nearby"></div><div class="touch-controls"><div class="stick" id="stick"><i></i></div><div class="touch-actions"><button class="touch-door" data-action="door" hidden>开门</button><button class="touch-interact" data-action="interact">调查</button></div></div><div id="overlay"></div></section><footer>WASD / 方向键移动 · E 调查 · J 笔记 · K 推理</footer></main>`;
const overlay=root.querySelector<HTMLDivElement>('#overlay')!;
const render=()=>{
  root.dataset.blocked=String(modal!==null);
  if(modal!==null){joystickPointer=null;root.querySelector<HTMLElement>('#stick i')!.style.transform='';}
  audio.setActive(!!state.storyFlags.started);
  if(game?.scene.isActive('world'))game.scene.getScene('world').events.emit('ui-blocked',modal!==null);
  if(modal==='title') { overlay.innerHTML=`<div class="scrim title-screen"><article class="title-cover" aria-label="谜溯：银哨之后"><p class="cover-mark">CASE FILE　/　A MANOR MYSTERY</p><p class="title-eyebrow">— 一宗庄园旧案 —</p><h1>谜溯</h1><h2>银哨之后</h2><div class="title-rule" aria-hidden="true"><i></i></div><nav class="title-menu" aria-label="主菜单"><button class="title-link primary-link" data-action="new"><span>开始调查</span></button><button class="title-link secondary-link" data-action="continue" ${loadGame()?'':'disabled'}><span>继续案件</span></button><button class="title-archive" data-action="settings">设置与存档</button></nav></article></div>`; return; }
  if(modal==='dialogue') { const line=activeDialogue[dialogueIndex]; const portraitIndex=line.speaker==='华生'?1:line.speaker==='福尔摩斯'?0:line.speaker==='艾琳·维尔'?2:-1; const portraitStyle=portraitIndex<0?'':`background-image:url('/assets/art/characters/portraits/cast-contact-sheet.png');background-position:${portraitIndex*33.333}% 0%;`; overlay.innerHTML=`<div class="dialogue-wrap"><article class="dialogue-box" data-dialogue="${activeDialogueKind}"><button class="dialogue-hitarea" data-action="next" aria-label="继续对话"></button><div class="portrait" style="${portraitStyle}">${portraitIndex<0?line.speaker.slice(0,1):''}</div><div class="dialogue-copy"><b>${line.speaker}</b><p>${line.text}</p></div><span class="dialogue-progress" aria-hidden="true">›</span><button class="dialogue-skip" data-action="skip-dialogue" aria-label="跳过对话">略过 ×</button></article></div>`; return; }
  if(modal==='transition') { overlay.innerHTML=`<div class="transition-wrap ${transitionStage==='card'?'active':''}" data-stage="${transitionStage}"><article class="location-card"><p class="eyebrow">CASE FILE　/　SILVER WHISTLE</p><h2>${transitionTitle}</h2><p>${transitionDescription}</p></article></div>`; return; }
  if(modal==='notebook') { overlay.innerHTML=`<div class="panel-scrim notebook-scrim"><article class="panel notebook-panel"><header><div><p class="eyebrow">CASE NOTEBOOK</p><h2>案件笔记</h2></div><button data-action="close" class="close">×</button></header><nav class="tabs"><span class="active">证据 ${state.discoveredEvidence.length}</span><span>调查记录</span></nav><div class="evidence-list">${state.discoveredEvidence.map(id=>{const e=EVIDENCE[id];const art=['E06','E08','E09'].includes(id)?` art-${id.toLowerCase()}`:'';return `<button class="evidence-card" data-evidence="${id}"><span class="icon${art}">${art?'':e.icon}</span><span><b>${e.name}</b><small>${e.source}</small></span><span>›</span></button>`}).join('')||'<p class="muted">尚未发现证据</p>'}</div><footer class="panel-foot">${5-state.discoveredEvidence.length} 项记录尚未发现</footer></article></div>`; return; }
  if(modal==='detail' && selectedEvidence) { const e=EVIDENCE[selectedEvidence]; const art=['E06','E08','E09'].includes(e.id)?`<div class="evidence-detail-art art-${e.id.toLowerCase()}" role="img" aria-label="${e.name}"></div>`:''; overlay.innerHTML=`<div class="evidence-scrim"><article class="evidence-reveal"><header><p class="eyebrow">EVIDENCE · ${e.id}</p><button data-action="close" class="close" aria-label="关闭">×</button></header><div class="evidence-heading"><span class="evidence-mark">${e.icon}</span><h2>${e.name}</h2></div>${art}<p class="detail-desc">${e.description}</p><div class="evidence-source">来源　${e.source}</div><h3>福尔摩斯的观察</h3><div class="evidence-observations">${e.observations.map(o=>`<blockquote>${o}</blockquote>`).join('')}</div><p class="evidence-filed">已记入案件笔记</p><button class="evidence-notebook-link" data-action="notebook">查看案件笔记　›</button></article></div>`;return; }
  if(modal==='reasoning') { const current=state.hypotheses.filter(h=>h.status!=='withdrawn'); overlay.innerHTML=`<div class="panel-scrim"><article class="panel reasoning"><header><div><p class="eyebrow">REASONING BOARD</p><h2>建立案件假设</h2></div><button data-action="close" class="close">×</button></header><p class="muted">假设是暂时的解释。证据会显示支持、冲突或仍待解释之处；由你决定是否保留。</p><div class="suggestion"><small>可从这个疑问开始</small><p>${HYPOTHESES[0].statement}</p><button data-action="suggest">采用为我的假设</button></div><form id="hypothesis-form"><label for="hypothesis">写下或修改你的假设</label><textarea id="hypothesis" name="hypothesis" maxlength="280" placeholder="例如：某种动物通过通气孔进入房间，并利用铃绳靠近床铺"></textarea><button class="primary">建立假设</button></form>${current.map(h=>{const relation=h.relationTarget?assessHypothesis(h.relationTarget,state,EVIDENCE):{assessment:'unknown' as const,supporting:[],contradicting:[]};const label=relation.contradicting.length?`有 ${relation.contradicting.length} 项待解释矛盾`:relation.assessment==='unexplained'?'有支持证据和矛盾同时存在':relation.assessment==='supported'?'有证据支持':'尚无关联证据';return `<section class="hypothesis-card"><div class="tag ${relation.assessment}">${label}</div><p>${escapeHtml(h.text)}</p><button data-action="conflicts" data-id="${h.id}">查看证据关系 (${relation.supporting.length+relation.contradicting.length})</button><button data-action="retain" data-id="${h.id}">保留</button><button data-action="edit" data-id="${h.id}">修改</button><button data-action="withdraw" data-id="${h.id}">撤回</button><div class="relations" id="relations-${h.id}" hidden>${[...relation.supporting.map(e=>({e,kind:'支持'})),...relation.contradicting.map(e=>({e,kind:'矛盾'}))].map(({e,kind})=>`<p><b>${kind} · ${e.name}</b><br>${e.relations.find(r=>r.targetId===h.relationTarget)?.note}</p>`).join('')||'<p class="muted">目前没有已发现且与此假设关联的证据。</p>'}</div></section>`;}).join('')}<footer class="panel-foot">假设可随时修改或撤回，不会因暂时不完整而中断调查。</footer></article></div>`; return; }
  if(modal==='settings') { overlay.innerHTML=`<div class="panel-scrim"><article class="panel"><header><h2>设置</h2><button data-action="close" class="close">×</button></header><p>进度自动保存在本机浏览器。</p><button data-action="audio" aria-pressed="${audio.isEnabled()}">声音：${audio.isEnabled()?'开启':'关闭'}</button><button class="danger" data-action="reset">重置存档</button></article></div>`; return; }
  overlay.innerHTML='';
};
game=new Phaser.Game({type:Phaser.AUTO,parent:'game',width:480,height:320,backgroundColor:'#273039',pixelArt:false,roundPixels:false,antialias:true,antialiasGL:false,physics:{default:'arcade',arcade:{debug:false}},scene:[WorldScene],scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH}});

function changeScene(id:SceneId,position:{x:number;y:number},worldPosition?:WorldPosition3D){state=setScene(state,id,position);state={...state,playerWorldPosition3D:id===SCENES.LYDIA_ROOM?worldPosition:undefined};game.scene.getScene('world').events.emit('set-scene',id,position,worldPosition);audio.setScene(id);persist(true);}
function persist(immediate=false){ if(!state.storyFlags.started)return;if(immediate){window.clearTimeout(saveTimer);saveTimer=undefined;saveGame(state);return;}if(saveTimer===undefined){saveTimer=window.setTimeout(()=>{saveTimer=undefined;saveGame(state);},450);} }
function startDialogue(lines:typeof WATSON_DIALOGUE,kind:'opening'|'watson'){
 activeDialogue=lines;activeDialogueKind=kind;dialogueIndex=kind==='opening'?openingIndex:0;modal='dialogue';render();
}
function advanceDialogue(){
 const line=activeDialogue[dialogueIndex];
 if(activeDialogueKind==='opening'){
  if(line&&canShowDialogueLine(line,state))state=completeDialogueLine(line,state);
  openingIndex++;dialogueIndex=openingIndex;state.dialogueProgress.opening=openingIndex;
  if(openingIndex>=OPENING_DIALOGUE.length){state.storyFlags.openingComplete=true;state.dialogueFlags.openingRead=true;modal=null;}
 }else{
  if(line)state.dialogueProgress.watson=dialogueIndex+1;
  dialogueIndex++;
  if(dialogueIndex>=activeDialogue.length){state.storyFlags.watsonSpoken=true;state.dialogueFlags.watson221bRead=true;state.investigatedObjects=[...new Set([...state.investigatedObjects,'watson-221b'])];modal=null;}
 }
 persist(true);render();
}
function beginDeparture(){
 if(modal==='transition'||!state.storyFlags.watsonSpoken)return;
 transitionTitle='庄园走廊';transitionDescription='前往莉迪亚旧房';audio.play('travel');state.storyFlags.departureStarted=true;persist(true);transitionStage='out';modal='transition';render();
 window.requestAnimationFrame(()=>overlay.querySelector('.transition-wrap')?.classList.add('active'));
 window.setTimeout(()=>{
  state.storyFlags.departureComplete=true;changeScene(SCENES.HALL,{x:100,y:160});transitionStage='card';render();
   window.setTimeout(()=>{
    transitionStage='in';const transition=overlay.querySelector<HTMLElement>('.transition-wrap');transition?.classList.remove('active');if(transition)transition.dataset.stage='in';
    window.setTimeout(()=>{modal=null;render();},440);
  },950);
 },440);
}
function showRoomObservation(item:{id:string;title:string;description:string;observations:string[];once?:boolean}){
 state={...state,investigatedObjects:item.once?[...new Set([...state.investigatedObjects,item.id])]:state.investigatedObjects};
 selectedEvidence=null;modal='detail';persist(true);renderInteractDetail(item);
}
function showObservation(item:any){ const already=state.investigatedObjects.includes(item.id),alreadyFiled=!!item.evidenceId&&state.discoveredEvidence.includes(item.evidenceId); state={...state,investigatedObjects:already?state.investigatedObjects:[...state.investigatedObjects,item.id]}; if(item.evidenceId) state=discoverEvidence(state,item.evidenceId); modal='detail'; selectedEvidence=item.evidenceId ?? null; persist(true); renderInteractDetail(item,alreadyFiled); }
function renderInteractDetail(item:any,alreadyFiled=false){
 modal='detail';returnModal=null;root.dataset.blocked='true';joystickPointer=null;root.querySelector<HTMLElement>('#stick i')!.style.transform='';game.scene.getScene('world').events.emit('ui-blocked',true);audio.play(item.evidenceId&&!alreadyFiled?'evidence':'paper');
 const evidence=item.evidenceId?EVIDENCE[item.evidenceId]:null;
 if(evidence){overlay.innerHTML=`<div class="evidence-scrim"><article class="evidence-reveal"><header><p class="eyebrow">${alreadyFiled?'CASE NOTE':'EVIDENCE'} · ${evidence.id}</p><button data-action="close" class="close" aria-label="关闭">×</button></header><div class="evidence-heading"><span class="evidence-mark">${evidence.icon}</span><h2>${item.title}</h2></div><p class="detail-desc">${item.description}</p><div class="evidence-observations">${item.observations.map((s:string)=>`<blockquote>${s}</blockquote>`).join('')}</div><p class="evidence-filed">${alreadyFiled?'已在案件笔记中':'新证据已记入案件笔记'} · ${evidence.name}</p><button class="evidence-notebook-link" data-action="notebook">查看案件笔记　›</button></article></div>`;return;}
 overlay.innerHTML=`<div class="observation-wrap" data-action="close" role="button" tabindex="0" aria-label="点击继续调查"><article class="observation-note"><header><span class="observation-kicker">观察</span><button data-action="close" class="close" aria-label="关闭">×</button></header><h2>${item.title}</h2><p class="observation-description">${item.description}</p>${item.observations.map((s:string)=>`<blockquote>${s}</blockquote>`).join('')}<span class="observation-progress" aria-hidden="true">›</span></article></div>`;
}
root.addEventListener('click',e=>{
 const target=(e.target as HTMLElement).closest<HTMLElement>('[data-action],[data-evidence]'); if(!target)return;
 if(target.dataset.evidence){returnModal='notebook';selectedEvidence=target.dataset.evidence as EvidenceId;modal='detail';render();return;}
 const action=target.dataset.action;
 if(action==='new'){window.clearTimeout(saveTimer);saveTimer=undefined;resetSave();state=initialGameState();returnModal=null;audio.setScene(SCENES.BAKER_STREET);state.storyFlags.started=true;openingIndex=0;activeDialogue=OPENING_DIALOGUE;activeDialogueKind='opening';dialogueIndex=0;modal='dialogue';persist(true);game.scene.start('world',{scene:state.currentScene,position:state.playerPosition,worldPosition:state.playerWorldPosition3D});render();}
 else if(action==='continue'){const loaded=loadGame();if(loaded){state=loaded;openingIndex=loaded.dialogueProgress.opening??0;activeDialogue=OPENING_DIALOGUE;activeDialogueKind='opening';dialogueIndex=openingIndex;modal=loaded.storyFlags.openingComplete?null:'dialogue';audio.setScene(loaded.currentScene);game.scene.start('world',{scene:loaded.currentScene,position:{...loaded.playerPosition},worldPosition:loaded.playerWorldPosition3D});render();}}
 else if(action==='next'){advanceDialogue();}
 else if(action==='notebook'){openPanel('notebook');}
 else if(action==='reasoning'){openPanel('reasoning');}
 else if(action==='settings'){openPanel('settings');}
 else if(action==='close'){closePanel();}
 else if(action==='skip-dialogue'){skipDialogue();}
 else if(action==='audio'){audio.toggle();render();}
 else if(action==='reset'){window.clearTimeout(saveTimer);saveTimer=undefined;resetSave();state=initialGameState();returnModal=null;modal='title';game.scene.start('world');render();}
 else if(action==='suggest'){state=createHypothesis(state,HYPOTHESES[0].statement,Date.now(),HYPOTHESIS_IDS.ANIMAL_THROUGH_VENT);persist(true);render();}
 else if(action==='conflicts'){const el=document.querySelector(`#relations-${target.dataset.id}`);if(el)el.toggleAttribute('hidden');}
 else if(action==='retain'||action==='withdraw'||action==='edit'){const id=target.dataset.id!;const hypothesis=state.hypotheses.find(h=>h.id===id);if(!hypothesis)return;if(action==='edit'){editingHypothesisId=id;const input=document.querySelector<HTMLTextAreaElement>('#hypothesis');if(input)input.value=hypothesis.text;input?.focus();return;} state=updateHypothesis(state,id,hypothesis.text,action==='retain'?'retained':'withdrawn');persist(true);render();}
 else if(action==='interact')game.scene.getScene('world').events.emit('interact');
 else if(action==='door')game.scene.getScene('world').events.emit('toggle-door');
});
root.addEventListener('keydown',e=>{const key=e as KeyboardEvent;if((key.key==='Enter'||key.key===' ')&&(key.target as HTMLElement).closest('.observation-wrap')){key.preventDefault();modal=null;render();}});
root.addEventListener('submit',e=>{if((e.target as HTMLElement).id!=='hypothesis-form')return;e.preventDefault();const data=new FormData(e.target as HTMLFormElement);const value=String(data.get('hypothesis')??'');if(value.trim()){if(editingHypothesisId){state=updateHypothesis(state,editingHypothesisId,value,'active');editingHypothesisId=undefined;persist(true);render();return;}const target=HYPOTHESES.find(h=>h.statement.trim()===value.trim())?.id;state=createHypothesis(state,value,Date.now(),target);persist(true);render();}});
root.addEventListener('input',()=>{});
function doInteract(position?:{scene:SceneId;x:number;y:number;feetY?:number;worldPosition3D?:WorldPosition3D;doorOpen?:boolean}){if(modal==='dialogue'){advanceDialogue();return;}if(modal!==null)return; const scene=position?.scene??state.currentScene;const playerPosition=position?{x:position.x,y:position.y}:state.playerPosition;
 if(scene===SCENES.BAKER_STREET){
  const target=findRoomInteraction(scene,playerPosition.x,playerPosition.y,state);
  if(target?.kind==='npc'){startDialogue(WATSON_DIALOGUE,'watson');return;}
  if(target?.kind==='observation'){showRoomObservation(target);return;}
  if(target?.kind==='departure'){
   if(target.requiresFlag&&!state.storyFlags[target.requiresFlag]){const nearby=root.querySelector<HTMLElement>('#nearby');if(nearby)nearby.textContent='也许该先和 Watson 谈谈。';return;}
   if(position?.doorOpen===false){game.scene.getScene('world').events.emit('toggle-door','221b-entry');return;}
   beginDeparture();return;
  }
  return;
 }
 if(scene===SCENES.HALL){const pos=playerPosition;const portal=hallPortal(pos.x,position?.feetY??pos.y+25.8);if(portal==='baker'){travelTo(SCENES.BAKER_STREET,{x:449,y:260});return;}if(portal==='lydia'){travelTo(SCENES.LYDIA_ROOM,{x:75,y:224},LYDIA_ENTRY_WORLD);return;} interactTarget={title:'庄园走廊',description:'走廊连接庄园各处。莉迪亚旧房门位于走廊中段。',observations:['靠近走廊中段的房门并按 E 进入莉迪亚旧房；左侧通往贝克街。']};renderInteractDetail(interactTarget);return;}
 if(scene===SCENES.LYDIA_ROOM&&position?.worldPosition3D&&position.doorOpen&&isLydiaExitPosition(position.worldPosition3D)){travelTo(SCENES.HALL,{x:100,y:160});return;}
 if(scene===SCENES.LYDIA_ROOM&&position?.worldPosition3D){
  const candidate=LYDIA_WORLD_INTERACTABLES.map(worldItem=>({worldItem,distance:lydiaDistanceXZ(position.worldPosition3D!,worldItem)}))
    .filter(candidate=>candidate.distance<=candidate.worldItem.interactionRange)
    .sort((a,b)=>{const aa=INTERACTABLES.find(i=>i.id===a.worldItem.id)?.priority??0,bb=INTERACTABLES.find(i=>i.id===b.worldItem.id)?.priority??0;return bb-aa||a.distance-b.distance;})[0];
  const item=candidate&&INTERACTABLES.find(i=>i.id===candidate.worldItem.id);if(item){showObservation(item);return;}
  interactTarget={title:'附近没有可调查的物件',description:'靠近门闩、通气孔或床头绳后，再按 E 调查。',observations:[]};renderInteractDetail(interactTarget);return;
 }
 if(scene===SCENES.LYDIA_ROOM){interactTarget={title:'附近没有可调查的物件',description:'靠近门闩、通气孔或床头绳后，再按 E 调查。',observations:[]};renderInteractDetail(interactTarget);return;}
 const candidates=INTERACTABLES.filter(i=>i.scene===scene).map(i=>({...i,distance:Math.hypot(i.x-playerPosition.x,i.y-playerPosition.y)})).sort((a,b)=>(b.priority??0)-(a.priority??0)||a.distance-b.distance);
 const item=candidates.find(i=>i.distance<=i.interactionRange); if(item){showObservation(item);return;} interactTarget={title:'附近没有可调查的物件',description:'靠近床头、通气孔或房门等物件后，再按 E 调查。',observations:[]};renderInteractDetail(interactTarget);
}
window.addEventListener('misu:action',(event:any)=>{const action=event.detail?.action;if(action==='notebook'){openPanel('notebook');}else if(action==='reasoning'){openPanel('reasoning');}else if(action==='escape'){closePanel();}else if(action==='interact')event.detail?.scene?doInteract(event.detail):game.scene.getScene('world').events.emit('interact');});
window.addEventListener('misu:player-position',(event:any)=>{
 const d=event.detail;state={...state,currentScene:d.scene,playerPosition:{x:d.x,y:d.y},playerWorldPosition3D:d.scene===SCENES.LYDIA_ROOM?d.worldPosition3D:undefined};persist();
 if(d.scene===SCENES.HALL&&hallPortal(d.x,d.feetY??d.y+25.8)==='lydia'&&modal===null){travelTo(SCENES.LYDIA_ROOM,{x:75,y:224},LYDIA_ENTRY_WORLD);return;}
 if(d.scene===SCENES.LYDIA_ROOM&&d.worldPosition3D&&d.doorOpen&&isLydiaExitPosition(d.worldPosition3D)){travelTo(SCENES.HALL,{x:100,y:160});return;}
 const mobile=usesTouchControls();
 const nearby=root.querySelector<HTMLElement>('#nearby')!,touchAction=root.querySelector<HTMLButtonElement>('.touch-interact')!;
 if(d.scene===SCENES.BAKER_STREET&&state.storyFlags.openingComplete){
  const target=findRoomInteraction(d.scene,d.x,d.y,state);
  const label=target?.kind==='departure'&&!state.storyFlags.watsonSpoken?'也许该先和 Watson 谈谈 · E':target?.kind==='departure'&&!d.doorOpen?'房门已关闭 · E 开门':target?.label;
  nearby.textContent=label?label.replace('E ',mobile?'点击':'E '):mobile?'靠近物件点击调查 · 案件笔记已开放':'靠近物件按 E 调查 · J 查看案件笔记';
  touchAction.textContent=target?.kind==='npc'?'交谈':target?.kind==='departure'?(state.storyFlags.watsonSpoken?(d.doorOpen?'出发':'开门'):'提示'):target?.kind==='observation'?'调查':'调查';
  return;
 }
 const found=d.scene===SCENES.LYDIA_ROOM&&d.worldPosition3D
  ?LYDIA_WORLD_INTERACTABLES.map(worldItem=>({worldItem,distance:lydiaDistanceXZ(d.worldPosition3D,worldItem)})).filter(v=>v.distance<=v.worldItem.interactionRange).sort((a,b)=>(INTERACTABLES.find(i=>i.id===b.worldItem.id)?.priority??0)-(INTERACTABLES.find(i=>i.id===a.worldItem.id)?.priority??0)||a.distance-b.distance).map(v=>INTERACTABLES.find(i=>i.id===v.worldItem.id)).find(Boolean)
  :INTERACTABLES.filter(i=>i.scene===d.scene&&Math.hypot(i.x-d.x,i.y-d.y)<=i.interactionRange).sort((a,b)=>(b.priority??0)-(a.priority??0)||Math.hypot(a.x-d.x,a.y-d.y)-Math.hypot(b.x-d.x,b.y-d.y))[0];
 const interactLabel=mobile?'点击调查':'E 调查';
 nearby.textContent=found?`${found.title}　·　${interactLabel}`:d.scene===SCENES.HALL&&hallPortal(d.x,d.feetY??d.y+25.8)==='baker'?`返回贝克街　·　${interactLabel}`:'';
 touchAction.textContent='调查';
});
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

window.addEventListener('misu:footstep',(event:any)=>audio.play('step',event.detail.surface==='RUG'));
window.addEventListener('misu:door-state',(event:any)=>{if(['opening','closing'].includes(event.detail.state))audio.play('door');});
window.addEventListener('pagehide',()=>persist(true));
window.addEventListener('blur',()=>{joystickPointer=null;game.scene.getScene('world').events.emit('input-reset');});
