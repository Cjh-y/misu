import { SCENES } from '../../../core/ids';
import type { DialogueLine } from './dialogues';

export interface RoomNarrativeInteraction {
  id: string;
  scene: typeof SCENES.BAKER_STREET;
  kind: 'npc' | 'observation' | 'departure';
  x: number;
  y: number;
  range: number;
  label: string;
  title: string;
  description: string;
  observations: string[];
  once?: boolean;
  requiresFlag?: string;
}

export interface WorldActorDefinition {
  id: string;
  scene: typeof SCENES.BAKER_STREET;
  texture: string;
  idleFrame: string;
  x: number;
  feetY: number;
  width: number;
  height: number;
  collisionWidth: number;
  collisionHeight: number;
  lightResponse: boolean;
  presenceFlag: string;
}

export const WATSON_ACTOR: WorldActorDefinition = {
  id: 'watson', scene: SCENES.BAKER_STREET, texture: 'watson-sheet', idleFrame: 'watson-south-0',
  x: 209, feetY: 166, width: 43.2, height: 64.8, collisionWidth: 10, collisionHeight: 8,
  lightResponse: true, presenceFlag: 'openingComplete',
};

export const WATSON_INTERACTION: RoomNarrativeInteraction = {
  id:'watson-221b',scene:SCENES.BAKER_STREET,kind:'npc',x:WATSON_ACTOR.x,y:WATSON_ACTOR.feetY,range:34,
  label:'华生 · E 交谈',title:'华生',description:'华生正等着与你一同前往庄园。',observations:[],once:true,requiresFlag:'openingComplete',
};

export const WATSON_DIALOGUE: DialogueLine[] = [
  {id:'watson-221b-holmes',speaker:'福尔摩斯',text:'那声银哨与两年前的旧案相连。药瓶和卷宗都带上了。'},
  {id:'watson-221b-watson',speaker:'华生',text:'我记下了医生的地址。到了庄园，我们先听完每个人的说法，再看现场。'},
  {id:'watson-221b-holmes-close',speaker:'福尔摩斯',text:'很好，华生。准备妥当后，我们就出发。'},
];

export const ROOM_NARRATIVE_INTERACTIONS: RoomNarrativeInteraction[] = [
  {
    id:'221b-fireplace',scene:SCENES.BAKER_STREET,kind:'observation',x:104,y:119,range:31,label:'壁炉 · E 调查',
    title:'壁炉余烬',description:'炉火安静地映着木地板。',observations:['华生把报纸挪离了炉边；至少这回，提醒没有白费。'],once:true,requiresFlag:'openingComplete',
  },
  {
    id:'221b-violin-case',scene:SCENES.BAKER_STREET,kind:'observation',x:211,y:132,range:31,label:'小提琴盒 · E 调查',
    title:'小提琴盒',description:'深色琴盒靠在会客区地毯边。',observations:['扣带已经磨亮，琴弦却许久没有调过。习惯留下的痕迹，比灰尘更难掩饰。'],once:true,requiresFlag:'openingComplete',
  },
  {
    id:'221b-desk',scene:SCENES.BAKER_STREET,kind:'observation',x:122,y:223,range:37,label:'书桌 · E 调查',
    title:'书桌上的卷宗',description:'旧案卷宗与今晚的口供放在一起。',observations:['先核对记录，再判断证词与现场是否相合。'],once:true,requiresFlag:'openingComplete',
  },
  {
    id:'221b-rain-window',scene:SCENES.BAKER_STREET,kind:'observation',x:263,y:79,range:34,label:'雨窗 · E 调查',
    title:'雨夜窗光',description:'雨水沿窗格滑落，街灯在玻璃上散开。',observations:['冷光落在木地板上。出门前，最好确认随身带着需要的东西。'],once:true,requiresFlag:'openingComplete',
  },
  {
    id:'221b-departure',scene:SCENES.BAKER_STREET,kind:'departure',x:449,y:286,range:68,label:'离开 221B / 前往庄园 · E 出发',
    title:'前往庄园',description:'东南出口通向庄园走廊。',observations:[],requiresFlag:'watsonSpoken',
  },
];
