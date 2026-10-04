import { SCENES } from '../../../core/ids';
import type { SceneId } from '../../../core/types';

export interface SceneMetadata { id: SceneId; name: string; width: number; height: number; palette: 'interior'|'hall' }
export const SCENES_DATA: Record<SceneId,SceneMetadata> = {
  [SCENES.BAKER_STREET]:{id:SCENES.BAKER_STREET,name:'贝克街 221B',width:480,height:320,palette:'interior'},
  [SCENES.HALL]:{id:SCENES.HALL,name:'庄园走廊',width:720,height:320,palette:'hall'},
  [SCENES.LYDIA_ROOM]:{id:SCENES.LYDIA_ROOM,name:'莉迪亚旧房',width:480,height:320,palette:'interior'},
};
