import {expect,test} from '@playwright/test';
test('clean animation atlas, metre-based room collisions, evidence deductions and persisted review',async({page})=>{
 test.setTimeout(90000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>window.addEventListener('misu:player-position',(e:any)=>(window as any).__world=e.detail));
 await page.goto('/');
 await page.evaluate(()=>localStorage.setItem('misu.save.v1',JSON.stringify({schemaVersion:1,caseId:'silver-whistle',savedAt:Date.now(),state:{currentScene:'221b',playerPosition:{x:263,y:145},discoveredEvidence:['E01','E02','E06','E08','E09'],investigatedObjects:[],dialogueFlags:{},storyFlags:{started:true,openingComplete:true,watsonSpoken:true},dialogueProgress:{opening:9},hypotheses:[],hypothesisState:{},unlockedLocations:['221b','hall','lydia-room']}})));
 await page.reload();await page.getByRole('button',{name:'继续案件'}).click();
 await expect.poll(()=>page.evaluate(()=>(window as any).__world?.worldPosition3D?.x)).toBeCloseTo(263/40,2);
 await page.keyboard.down('w');await expect.poll(()=>page.evaluate(()=>(window as any).__world?.feetY),{timeout:15000}).toBeLessThan(124);await page.keyboard.up('w');
 const position=await page.evaluate(()=>(window as any).__world);expect(position.worldPosition3D.z).toBeGreaterThanOrEqual(122/40);expect(position.collisionAtPosition).toBeUndefined();expect(position.roomWorld3D.volumes.length).toBeGreaterThan(10);
 await page.getByRole('button',{name:/推理板/}).click();
 await page.getByRole('button',{name:'危险只能在死亡那一刻穿墙进入'}).click();await expect(page.getByRole('status')).toContainText('没有覆盖');
 for(const name of ['危险可能在锁门前已存在','孔道能传声，但动物通路缺乏支持','有人近期布置了引导调查的假线索'])await page.getByRole('button',{name}).click();
 await expect(page.locator('.case-conclusion')).toContainText('还没有找到凶手');await page.locator('#overlay .close').click();
 await page.reload();await page.getByRole('button',{name:'继续案件'}).click();await page.getByRole('button',{name:/案件笔记/}).click();await expect(page.locator('.case-review')).toContainText('近期划痕');
 expect(errors).toEqual([]);
});

test('scripted old bed and bedside samples can be investigated without invented laboratory results',async({page})=>{
 test.setTimeout(90000);
 await page.addInitScript(()=>window.addEventListener('misu:player-position',(e:any)=>(window as any).__world=e.detail));
 for(const sample of [{x:6.05,z:2.96,title:'固定的床',id:'E07',text:'早六年'},{x:4.05,z:.9,title:'床头药杯与旧照片',id:'E10',text:'没有检验结果'}]){
  await page.goto('/');
  await page.evaluate(sample=>localStorage.setItem('misu.save.v1',JSON.stringify({schemaVersion:1,caseId:'silver-whistle',savedAt:Date.now(),state:{currentScene:'lydia-room',playerPosition:{x:200,y:200},playerWorldPosition3D:{x:sample.x,y:0,z:sample.z},discoveredEvidence:['E01','E02'],investigatedObjects:[],dialogueFlags:{},storyFlags:{started:true,openingComplete:true,watsonSpoken:true},dialogueProgress:{opening:9},hypotheses:[],hypothesisState:{},unlockedLocations:['221b','hall','lydia-room']}})),sample);
  await page.reload();await page.getByRole('button',{name:'继续案件'}).click();
  await expect.poll(()=>page.evaluate(()=>(window as any).__world?.scene)).toBe('lydia-room');
  await page.keyboard.press('e');await expect(page.locator('.evidence-reveal h2')).toHaveText(sample.title);await expect(page.locator('.evidence-reveal')).toContainText(sample.text);
  await page.locator('#overlay .close').click();await page.getByRole('button',{name:/案件笔记/}).click();await expect(page.locator(`[data-evidence="${sample.id}"]`)).toBeVisible();await page.locator('#overlay .close').click();
 }
});

test('an elevated saved position cannot restore Holmes inside the rain-window wall',async({page})=>{
 await page.addInitScript(()=>window.addEventListener('misu:player-position',(e:any)=>(window as any).__world=e.detail));
 await page.goto('/');
 await page.evaluate(()=>localStorage.setItem('misu.save.v1',JSON.stringify({schemaVersion:1,caseId:'silver-whistle',savedAt:Date.now(),state:{currentScene:'221b',playerPosition:{x:263,y:145},playerWorldPosition3D:{x:263/40,y:99,z:45/40},discoveredEvidence:[],investigatedObjects:[],dialogueFlags:{},storyFlags:{started:true,openingComplete:true},dialogueProgress:{opening:9},hypotheses:[],hypothesisState:{},unlockedLocations:['221b']}})));
 await page.reload();await page.getByRole('button',{name:'继续案件'}).click();
 await expect.poll(()=>page.evaluate(()=>(window as any).__world?.worldPosition3D?.y)).toBe(0);
 const actor=await page.evaluate(()=>(window as any).__world);expect(actor.feetY).toBeGreaterThanOrEqual(122);expect(actor.collisionAtPosition).toBeUndefined();
});
