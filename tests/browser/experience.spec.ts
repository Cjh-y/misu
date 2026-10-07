import { expect, test, type Page } from '@playwright/test';

async function resume(page:Page,scene='221b',x=263,y=160){
 await page.addInitScript(()=>window.addEventListener('misu:player-position',(e:any)=>((window as any).__live=e.detail)));
 await page.goto('/');
 await page.evaluate(({scene,x,y})=>localStorage.setItem('misu.save.v1',JSON.stringify({schemaVersion:1,caseId:'silver-whistle',savedAt:Date.now(),state:{currentScene:scene,playerPosition:{x,y},discoveredEvidence:['E01','E02'],investigatedObjects:[],dialogueFlags:{},storyFlags:{started:true,openingComplete:true,watsonSpoken:true},dialogueProgress:{opening:9},hypotheses:[],hypothesisState:{},unlockedLocations:['221b','hall','lydia-room']}})),{scene,x,y});
 await page.reload();await page.getByRole('button',{name:'继续案件'}).click();
 await expect(page.locator('#scene-label')).toContainText(scene==='hall'?'庄园走廊':'221B');
 await expect.poll(()=>page.evaluate(()=>(window as any).__live?.scene)).toBe(scene);await page.waitForTimeout(350);
}
const live=(page:Page)=>page.evaluate(()=>(window as any).__live);

test('large touch landscape preserves joystick, closes every surface and rotates safely',async({browser})=>{
 const context=await browser.newContext({viewport:{width:1194,height:834},hasTouch:true,isMobile:true});
 const page=await context.newPage();
 await page.addInitScript(()=>window.addEventListener('misu:player-position',(e:any)=>((window as any).__live=e.detail)));
 await resume(page);
 await expect(page.locator('.touch-controls')).toBeVisible();await expect(page.locator('.hud kbd').first()).toBeHidden();
 const r=await page.locator('#stick').boundingBox();if(!r)throw new Error('stick missing');
 const before=(await live(page)).x;
 await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await page.mouse.move(r.x+r.width/2+30,r.y+r.height/2);await expect.poll(async()=>(await live(page)).x,{timeout:10000}).toBeGreaterThan(before+10);await page.mouse.up();
 for(const name of [/案件笔记/,/推理板/,'设置']){
  await page.getByRole('button',{name}).click();await expect(page.locator('.touch-controls')).toBeHidden();
  await page.locator('#overlay .close').click();await expect(page.locator('.touch-controls')).toBeVisible();
 }
 await page.setViewportSize({width:834,height:1194});await expect(page.locator('.touch-controls')).toBeVisible();
 await page.setViewportSize({width:1194,height:834});await expect(page.locator('.touch-controls')).toBeVisible();
 await page.screenshot({path:'test-results/experience-touch-landscape.png'});await context.close();
});

test('221B wall blocks sustained and diagonal movement; old wall saves recover to the floor',async({page})=>{
 test.setTimeout(90000);
 await page.addInitScript(()=>window.addEventListener('misu:player-position',(e:any)=>((window as any).__live=e.detail)));
 for(const x of [54,263,385]){
  await resume(page,'221b',x,145);
  await page.keyboard.down('w');await expect.poll(async()=>(await live(page)).feetY,{timeout:10000}).toBeLessThan(124.05);await page.waitForTimeout(400);await page.keyboard.up('w');
  const at=await live(page);expect(at.feetY).toBeGreaterThanOrEqual(121.9);
  await page.keyboard.down('w');await page.keyboard.down('d');await page.waitForTimeout(400);await page.keyboard.up('w');await page.keyboard.up('d');
  expect((await live(page)).feetY).toBeGreaterThanOrEqual(121.9);
 }
 await resume(page,'221b',263,45);expect((await live(page)).feetY).toBeGreaterThanOrEqual(121.9);
 await page.screenshot({path:'test-results/experience-wall-stop.png'});
});

test('observations freeze motion and Escape or a visible close restores play; title settings return to title',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'设置与存档'}).click();await page.locator('#overlay .close').click();await expect(page.getByRole('button',{name:'开始调查'})).toBeVisible();
 await page.addInitScript(()=>window.addEventListener('misu:player-position',(e:any)=>((window as any).__live=e.detail)));
 await resume(page,'hall',100,160);await page.keyboard.press('e');await expect(page.locator('.observation-note')).toBeVisible();
 const before=await live(page);await page.keyboard.down('d');await page.waitForTimeout(400);await page.keyboard.up('d');
 expect((await live(page)).x).toBe(before.x);
 await page.locator('.observation-note .close').click();await expect(page.locator('.observation-note')).toHaveCount(0);
 await page.keyboard.press('j');await expect(page.locator('.notebook-panel')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('.notebook-panel')).toHaveCount(0);
 await page.keyboard.down('d');await expect.poll(async()=>(await live(page)).x).toBeGreaterThan(before.x);await page.keyboard.up('d');
});

test('corridor approach does not teleport, and only the narrow west threshold offers return',async({page})=>{
 await resume(page,'hall',155,160);await page.waitForTimeout(900);await expect(page.locator('#scene-label')).toContainText('庄园走廊');
 await page.keyboard.press('e');await expect(page.locator('#scene-label')).toContainText('庄园走廊');await page.locator('.observation-note .close').click();
 await resume(page,'hall',40,134);await expect(page.locator('#nearby')).not.toContainText('返回贝克街');
 await resume(page,'hall',28,134);await expect(page.locator('#nearby')).toContainText('返回贝克街');await page.keyboard.press('e');
 await expect(page.locator('.transition-wrap')).toHaveCount(1);await page.keyboard.press('Escape');await expect(page.locator('.transition-wrap')).toHaveCount(1);
 await expect(page.locator('#scene-label')).toContainText('221B');await expect(page.locator('.transition-wrap')).toHaveCount(0);
});

test('dialogue skip applies evidence safely and audio is unlocked and can be muted',async({page})=>{
 await page.addInitScript(()=>window.addEventListener('misu:audio-state',(e:any)=>((window as any).__audio=e.detail)));
 await page.goto('/');await page.getByRole('button',{name:'开始调查'}).click();await page.getByRole('button',{name:'跳过对话'}).click();
 await expect(page.locator('.dialogue-wrap')).toHaveCount(0);
 await expect.poll(()=>page.evaluate(()=>(window as any).__audio?.state)).toBe('running');
 const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('misu.save.v1')!).state);expect(state.discoveredEvidence).toEqual(['E01','E02']);expect(state.storyFlags.openingComplete).toBe(true);
 await page.getByRole('button',{name:'设置',exact:true}).click();await page.getByRole('button',{name:'声音：开启'}).click();
 await expect(page.getByRole('button',{name:'声音：关闭'})).toHaveAttribute('aria-pressed','false');await page.locator('#overlay .close').click();
});

test('221B closed door must open before departure and cannot close through the actor',async({page})=>{
 await page.addInitScript(()=>window.addEventListener('misu:door-state',(e:any)=>((window as any).__doorState=e.detail.state)));

 await resume(page,'221b',449,280);
 await page.keyboard.press('o');await page.waitForTimeout(400);expect((await live(page)).doorOpen).toBe(true);
 await resume(page,'221b',449,260);await page.keyboard.press('o');
 await expect.poll(()=>page.evaluate(()=>(window as any).__doorState)).toBe('closed');
 await page.keyboard.press('e');await expect.poll(()=>page.evaluate(()=>(window as any).__doorState)).toBe('open');
 await expect(page.locator('#scene-label')).toContainText('221B');await expect(page.locator('.transition-wrap')).toHaveCount(0);
 await page.keyboard.press('e');await expect(page.locator('#scene-label')).toContainText('庄园走廊');
 await expect(page.locator('.transition-wrap')).toHaveCount(0);
});

test('hypothesis editing preserves its identity and closing an edit cancels the edit state',async({page})=>{
 await resume(page);await page.getByRole('button',{name:/推理板/}).click();
 await page.getByRole('button',{name:'采用为我的假设'}).click();
 await page.getByRole('button',{name:'修改',exact:true}).click();await page.locator('#hypothesis').fill('<b>门外存在未知线索</b>');
 await page.getByRole('button',{name:'建立假设',exact:true}).click();
 await expect(page.locator('.hypothesis-card')).toHaveCount(1);await expect(page.locator('.hypothesis-card>p')).toHaveText('<b>门外存在未知线索</b>');await expect(page.locator('.hypothesis-card>p b')).toHaveCount(0);
 await page.getByRole('button',{name:'修改',exact:true}).click();await page.locator('#overlay .close').click();
 await page.getByRole('button',{name:/推理板/}).click();await page.locator('#hypothesis').fill('另一个独立假设');await page.getByRole('button',{name:'建立假设',exact:true}).click();await expect(page.locator('.hypothesis-card')).toHaveCount(2);
 await page.locator('#overlay .close').click();await page.getByRole('button',{name:/案件笔记/}).click();await page.locator('.evidence-card').first().click();await page.locator('#overlay .close').click();await expect(page.locator('.notebook-panel')).toBeVisible();
 await page.locator('#overlay .close').click();await expect(page.locator('#overlay')).toBeEmpty();
});
