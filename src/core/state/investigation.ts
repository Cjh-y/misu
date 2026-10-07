import type { EvidenceId, GameState } from '../types';
export const DEDUCTIONS:{id:string;title:string;evidence:EvidenceId[];question:string;choices:string[];answer:number;explanation:string}[]=[
  {id:'locked-room',title:'重新解释密室',evidence:['E01','E06'],question:'门窗从内侧锁闭，能证明危险何时进入吗？',choices:['危险只能在死亡那一刻穿墙进入','危险可能在锁门前已存在'],answer:1,explanation:'内侧门闩排除了常规闯入，却不能排除预先带入的物品。调查应转向房内日常用品。'},
  {id:'vent-path',title:'区分声音与通路',evidence:['E08'],question:'完整的细密铁网支持哪种判断？',choices:['孔道能传声，但动物通路缺乏支持','听见哨声就证明动物穿过铁网'],answer:0,explanation:'声音与物体通过孔道需要不同条件。哨声的来源值得追查，但它不是动物进入的证据。'},
  {id:'staged-rope',title:'比对两年前的现场',evidence:['E01','E09'],question:'旧卷宗图中没有铃绳，新钩又有划痕，最稳妥的判断是？',choices:['新铃绳就是两年前的凶器','有人近期布置了引导调查的假线索'],answer:1,explanation:'假铃结构、近期划痕与旧图构成时间上的矛盾。眼前的布置无法直接解释两年前的死亡。'},
];
export function resolveDeduction(state:GameState,id:string,choice:number):GameState {
  const d=DEDUCTIONS.find(d=>d.id===id);
  if(!d||!d.evidence.every(e=>state.discoveredEvidence.includes(e))||!Number.isInteger(choice)||choice<0||choice>=d.choices.length)return state;
  return {...state,hypothesisState:{...state.hypothesisState,[`deduction:${id}`]:choice===d.answer,[`deduction-choice:${id}`]:choice}};
}
export function investigationObjective(state:GameState){
  if(!state.storyFlags.openingComplete)return '听取委托：确认银哨与旧案之间的联系';
  if(!state.storyFlags.watsonSpoken)return '与华生讨论旧案，然后前往庄园';
  if(!['E06','E08','E09'].every(id=>state.discoveredEvidence.includes(id as EvidenceId)))return '勘查旧房：检查门窗、床、通气孔、铃绳与药杯';
  if(!DEDUCTIONS.every(d=>state.hypothesisState[`deduction:${d.id}`]))return '打开推理板：用现场证据检验三条推论';
  return '初步复盘完成：药物来源与哨声发出者仍待调查';
}
