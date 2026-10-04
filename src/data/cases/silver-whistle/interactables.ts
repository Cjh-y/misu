import type { Interactable } from '../../../core/types';
import { EVIDENCE_IDS, INTERACTABLE_IDS, SCENES } from '../../../core/ids';
export const INTERACTABLES: Interactable[] = [
 {id:INTERACTABLE_IDS.DOOR_WINDOW_LOCK,scene:SCENES.LYDIA_ROOM,x:48,y:216,interactionRange:30,title:'房门与窗锁',description:'门闩和窗锁只能在室内扣上；窗框没有撬痕。旧调查记录显示，案发前门窗关闭，莉迪亚发作后才自己打开房门。',observations:['福尔摩斯：凶手不一定要在死亡那一刻进入房间。'],evidenceId:EVIDENCE_IDS.DOOR_WINDOW_LOCK,repeatable:true},
 {id:INTERACTABLE_IDS.VENT_MESH,scene:SCENES.LYDIA_ROOM,x:309,y:30,interactionRange:26,title:'通气孔与细密铁网',description:'孔道通向医生房。两侧铁网完整，安装漆已经老化；放大观察，网孔远小于绳子的粗细。',observations:['福尔摩斯：声音可以过去；以这条绳子为路径的动物过不去。假设必须容得下这张网。'],evidenceId:EVIDENCE_IDS.VENT_MESH,repeatable:true},
 {id:INTERACTABLE_IDS.FALSE_BELL_ROPE,scene:SCENES.LYDIA_ROOM,x:309,y:60,interactionRange:25,title:'床头假铃绳',description:'新编织绳悬在孔旁，没有连着拉铃机构，末端靠近枕头。绳身夹着花斑织带，固定钩旁有新鲜划痕。',observations:['比较旧调查记录附图：两年前房间的床、孔都在，床头却没有这条绳。','福尔摩斯：一件新物品，正在假扮两年前的凶器。'],evidenceId:EVIDENCE_IDS.FALSE_BELL_ROPE,repeatable:true},
];
