import type { Condition, EvidenceId } from '../../../core/types';
import { EVIDENCE_IDS } from '../../../core/ids';
export interface DialogueLine { id:string; speaker: string; text: string; conditions?: Condition[]; effect?: { kind:'evidence'; id:EvidenceId } }
export const OPENING_DIALOGUE: DialogueLine[] = [
 {id:'opening-watson',speaker:'华生',text:'伦敦的雨敲着窗玻璃。华生收起报纸，一位神色不安的年轻女子走进客厅。'},
 {id:'opening-testimony',speaker:'艾琳·维尔',text:'两年前，姐姐莉迪亚在婚礼前死了。昨夜，我又听见了她死前那声银哨。'},
 {id:'opening-inheritance',speaker:'艾琳·维尔',text:'我们的母亲留下了信托财产。玛莎说，女儿出嫁后，继父就会失去大半收入。他脾气很坏，还收藏过来自印度的动物标本。'},
 {id:'opening-last-words',speaker:'艾琳·维尔',text:'那晚姐姐十点半喝完睡前药，进房间锁了门。十一点，我听见尖锐的哨声，接着是金属落下的响声。她开门扶着门框，只说：“带子……不对……”便倒下了。'},
 {id:'opening-police',speaker:'艾琳·维尔',text:'警方没发现明显伤口，判作原因不明的急病。后来那间屋子一直空着。'},
 {id:'opening-medicine-question',speaker:'福尔摩斯',text:'昨夜你也喝了同样的药？'},
 {id:'opening-tonight',speaker:'艾琳·维尔',text:'我喝了一半，便被窗外的声音吓醒了。玛莎说我只是太紧张。现在我也订婚了，明天律师会来核对庄园账目。'},
 {id:'opening-decision',speaker:'福尔摩斯',text:'先不要再喝那瓶药。带上它。我们今天去庄园。',effect:{kind:'evidence',id:EVIDENCE_IDS.CASE_TESTIMONY}},
 {id:'opening-evidence-handover',speaker:'系统',text:'艾琳交出了姐姐的婚书与警方旧调查卷宗。获得 E01【委托证言与旧案卷宗】、E02【半瓶睡前药】。庄园走廊已开放。',effect:{kind:'evidence',id:EVIDENCE_IDS.HALF_BOTTLE}},
];
