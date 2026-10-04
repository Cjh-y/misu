import { HYPOTHESIS_IDS } from '../../../core/ids';
export interface HypothesisRule { id: string; title: string; statement: string }
export const HYPOTHESES: HypothesisRule[] = [
  { id:HYPOTHESIS_IDS.ANIMAL_THROUGH_VENT, title:'动物穿过通气孔', statement:'某种动物通过通气孔进入房间，并利用铃绳靠近床铺。' },
  { id:HYPOTHESIS_IDS.PREEXISTING_DANGER, title:'危险预先带入', statement:'危险在房门锁上之前，已经由日常物品带入房间。' },
  { id:HYPOTHESIS_IDS.SOUND_THROUGH_VENT, title:'声音经通气孔传递', statement:'孔道可以传递声音，但不一定是危险进入房间的路径。' },
  { id:HYPOTHESIS_IDS.STAGED_APPARATUS, title:'近期布置假铃绳', statement:'有人近期添加假铃绳，试图把注意力引向通气孔。' },
];
