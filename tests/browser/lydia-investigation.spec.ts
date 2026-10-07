import { expect, test } from '@playwright/test';

async function walkUntil(page:any,key:string,condition:(p:any)=>boolean){
  await page.keyboard.down(key);
  for(let step=0;step<180;step++){
    const position=await currentPosition(page);
    if(condition(position)){await page.keyboard.up(key);return;}
    await page.waitForTimeout(100);
  }
  await page.keyboard.up(key);
  throw new Error(`Player did not reach target while walking ${key.toUpperCase()}; last position ${JSON.stringify(await currentPosition(page))}`);
}

async function currentPosition(page:any){
  return page.evaluate(()=>((window as any).__livePlayerPosition??JSON.parse(localStorage.getItem('misu.save.v1')??'{}').state.playerPosition));
}

async function closeEvidence(page:any){
  await page.locator('.evidence-reveal .close').click();
  await expect(page.locator('.evidence-reveal')).toHaveCount(0);
}

test('New Game → Watson → manor → Lydia: investigate E06, E08 and E09, record, repeat and leave',async({page})=>{
  test.setTimeout(240_000);
  await page.setViewportSize({width:1440,height:810});
  await page.addInitScript(()=>{
    (window as any).__phase113Scenes=[];
    window.addEventListener('misu:player-position',(event:any)=>((window as any).__livePlayerPosition={...event.detail}));
    window.addEventListener('misu:scene-ready',(event:any)=>{
      const detail=event.detail;
      (window as any).__phase113Scenes.push({...detail,foreground:(detail.foreground??[]).map((item:any)=>({...item,bounds:{x:item.bounds.x,y:item.bounds.y,width:item.bounds.width,height:item.bounds.height}}))});
    });
  });
  await page.goto('/');
  await page.getByRole('button',{name:'开始调查'}).click();

  for(let i=0;i<9;i++)await page.locator('.dialogue-hitarea').click();
  await expect(page.locator('.dialogue-wrap')).toHaveCount(0);
  await expect(page.locator('#scene-label')).toContainText('221B');
  await expect(page.locator('.transition-wrap')).toHaveCount(0,{timeout:8000});
  await expect.poll(async()=>page.evaluate(()=>JSON.parse(localStorage.getItem('misu.save.v1')??'{}').state.dialogueProgress.opening)).toBe(9);

  await walkUntil(page,'a',p=>p.x<=225);
  await walkUntil(page,'s',p=>p.y>=157);
  await expect(page.locator('#nearby')).toContainText('华生',{timeout:8000});
  await page.screenshot({path:'screenshots/phase-1-12/01-watson-approach.png'});
  await page.keyboard.press('e');
  await expect(page.locator('.dialogue-box')).toContainText('福尔摩斯');
  for(let i=0;i<3;i++)await page.locator('.dialogue-hitarea').click();
  await expect(page.locator('.dialogue-wrap')).toHaveCount(0);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('misu.save.v1')??'{}').state.storyFlags.watsonSpoken)).toBe(true);

  // Walk the open floor route to the southeast exit and take the authored departure transition.
  await walkUntil(page,'d',p=>p.x>=440);
  await walkUntil(page,'s',p=>(p.feetY??p.y)>=300);
  await expect(page.locator('#nearby')).toContainText('前往庄园',{timeout:8000});
  await page.keyboard.press('e');
  await expect(page.locator('.transition-wrap')).toBeVisible();
  await expect(page.locator('#scene-label')).toContainText('庄园走廊',{timeout:8000});
  await expect(page.locator('.transition-wrap')).toHaveCount(0,{timeout:8000});
  await expect(page.locator('.transition-wrap')).toHaveCount(0,{timeout:8000});

  await page.keyboard.down('d');await expect(page.locator('#scene-label')).toContainText('莉迪亚旧房',{timeout:10000});await page.keyboard.up('d');
  await expect(page.locator('#scene-label')).toContainText('莉迪亚旧房',{timeout:8000});
  await expect(page.locator('.transition-wrap')).toHaveCount(0,{timeout:8000});
  await expect.poll(()=>currentPosition(page)).toMatchObject({scene:'lydia-room',worldPosition3D:{x:1.2,y:0,z:3.75}});
  await expect(page.locator('#nearby')).toContainText('房门与窗锁',{timeout:8000});
  await page.screenshot({path:'screenshots/phase-1-12/02-bedroom-entry-e06-prompt.png'});

  await page.keyboard.press('e');
  await expect(page.locator('.evidence-reveal h2')).toContainText('房门与窗锁');
  await expect(page.locator('.evidence-filed')).toContainText('新证据已记入案件笔记');
  await page.screenshot({path:'screenshots/phase-1-12/03-e06-acquisition.png'});
  await closeEvidence(page);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('misu.save.v1')??'{}').state.discoveredEvidence)).toContain('E06');

  // Go around the bed's east end, then approach the raised wall vent from open north floor.
  await walkUntil(page,'d',p=>p.worldPosition3D?.x>=6.75);
  await walkUntil(page,'w',p=>p.worldPosition3D?.z<=.65);
  await walkUntil(page,'a',p=>p.worldPosition3D?.x<=6.95); // Refine the approach to the vent after rounding the bed.
  await expect(page.locator('#nearby'),`E08 approach at ${JSON.stringify(await currentPosition(page))}`).toContainText('通气孔与细密铁网',{timeout:8000});
  await page.screenshot({path:'screenshots/phase-1-12/04-e08-prompt.png'});
  await page.keyboard.press('e');
  await expect(page.locator('.evidence-reveal h2')).toContainText('通气孔与细密铁网');
  await expect(page.locator('.evidence-filed')).toContainText('新证据已记入案件笔记');
  await page.screenshot({path:'screenshots/phase-1-12/05-e08-acquisition.png'});
  await closeEvidence(page);

  // Circle around the bed's east end and cross its open south side to reach the rope.
  await walkUntil(page,'s',p=>p.worldPosition3D?.z>=3.4);
  await walkUntil(page,'a',p=>p.worldPosition3D?.x<=4.3);
  await walkUntil(page,'d',p=>p.worldPosition3D?.x>=4.75);
  await expect(page.locator('#nearby'),`E09 approach at ${JSON.stringify(await currentPosition(page))}`).toContainText('床头假铃绳',{timeout:8000});
  await page.screenshot({path:'screenshots/phase-1-12/06-e09-prompt.png'});
  await page.keyboard.press('e');
  await expect(page.locator('.evidence-reveal h2')).toContainText('床头假铃绳');
  await expect(page.locator('.evidence-filed')).toContainText('新证据已记入案件笔记');
  await page.screenshot({path:'screenshots/phase-1-12/07-e09-acquisition.png'});
  await closeEvidence(page);

  const afterThree=await page.evaluate(()=>JSON.parse(localStorage.getItem('misu.save.v1')??'{}').state.discoveredEvidence);
  for(const id of ['E06','E08','E09'])expect(afterThree).toContain(id);
  expect(afterThree.filter((id:string)=>['E06','E08','E09'].includes(id))).toHaveLength(3);

  // Repeat investigation is allowed, but the notebook remains deduplicated and feedback says it is filed.
  await page.keyboard.press('e');
  await expect(page.locator('.evidence-reveal h2')).toContainText('床头假铃绳');
  await expect(page.locator('.evidence-filed')).toContainText('已在案件笔记中');
  await closeEvidence(page);
  await page.waitForTimeout(150);
  await page.keyboard.down('j');await page.waitForTimeout(120);await page.keyboard.up('j');
  await expect(page.getByRole('heading',{name:'案件笔记'})).toBeVisible();
  for(const id of ['E06','E08','E09'])await expect(page.locator(`[data-evidence="${id}"]`)).toBeVisible();
  await expect(page.locator('.evidence-card')).toHaveCount(5);
  await page.screenshot({path:'screenshots/phase-1-12/08-notebook-after-three-evidence.png'});
  await page.getByRole('button',{name:'×'}).click();

  // Leave via the existing open west doorway, then re-enter and confirm evidence persists.
  await walkUntil(page,'a',p=>p.scene==='hall');
  await expect(page.locator('#scene-label')).toContainText('庄园走廊',{timeout:8000});
  await expect(page.locator('.transition-wrap')).toHaveCount(0,{timeout:8000});
  const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('misu.save.v1')??'{}').state.discoveredEvidence);
  for(const id of ['E06','E08','E09'])expect(persisted).toContain(id);
  await page.screenshot({path:'screenshots/phase-1-12/09-bedroom-exit-hall.png'});

  await page.keyboard.down('d');await expect(page.locator('#scene-label')).toContainText('莉迪亚旧房',{timeout:10000});await page.keyboard.up('d');
  await expect(page.locator('#scene-label')).toContainText('莉迪亚旧房',{timeout:8000});
  await expect(page.locator('.transition-wrap')).toHaveCount(0,{timeout:8000});
  const returned=await page.evaluate(()=>JSON.parse(localStorage.getItem('misu.save.v1')??'{}').state.discoveredEvidence);
  for(const id of ['E06','E08','E09'])expect(returned).toContain(id);
  await page.screenshot({path:'screenshots/phase-1-13/05-bedroom-first-reentry.png'});

  // Exercise the same exit and entry transitions ten times total; this first return counts as #1.
  for(let reentry=2;reentry<=10;reentry++){
    await page.keyboard.down('a');
    await expect(page.locator('#scene-label')).toContainText('庄园走廊',{timeout:8000});
  await expect(page.locator('.transition-wrap')).toHaveCount(0,{timeout:8000});
    await page.keyboard.up('a');
    await page.keyboard.down('d');
    await expect(page.locator('#scene-label')).toContainText('莉迪亚旧房',{timeout:8000});
  await expect(page.locator('.transition-wrap')).toHaveCount(0,{timeout:8000});
    await page.keyboard.up('d');
    if(reentry===10)await page.screenshot({path:'screenshots/phase-1-13/06-bedroom-tenth-reentry.png'});
  }
  const roomSamples=await page.evaluate(()=>((window as any).__phase113Scenes as any[]).filter(sample=>sample.scene==='lydia-room'));
  expect(roomSamples).toHaveLength(11); // initial New Game entry plus ten re-entries
  const reference=roomSamples[0];
  for(const sample of roomSamples){
    expect(sample.worldBounds).toEqual({width:480,height:320});
    expect(sample.worldRoom.size).toEqual({width:10,depth:5.5,height:3.5});
    expect(sample.worldRoom.floorPlane).toBe('xz');
    expect(sample.worldRoom.floorQuad).toEqual(reference.worldRoom.floorQuad);
    expect(sample.cameraZoom).toBe(reference.cameraZoom);
    expect(sample.sceneChildren).toBe(reference.sceneChildren);
    expect(sample.dynamicBodyCount).toBe(1);
    expect(sample.staticBodyCount).toBe(1); // Closed/open entry-door helper only; furniture uses world footprints.
    expect(sample.foreground).toEqual([]);
  }
  for(const id of ['E06','E08','E09'])expect(await page.evaluate((evidenceId)=>JSON.parse(localStorage.getItem('misu.save.v1')??'{}').state.discoveredEvidence.includes(evidenceId),id)).toBe(true);
});
