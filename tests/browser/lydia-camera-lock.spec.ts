import { expect, test } from '@playwright/test';

const stateAt=(x:number,z:number)=>({
  currentScene:'lydia-room',playerPosition:{x:240,y:180},playerWorldPosition3D:{x,y:0,z},
  discoveredEvidence:[],investigatedObjects:[],dialogueFlags:{},
  storyFlags:{started:true,openingComplete:true,watsonSpoken:true},dialogueProgress:{opening:9},
  hypotheses:[],hypothesisState:{},unlockedLocations:['221b','hall','lydia-room'],
});

async function continueAt(page:any,x:number,z:number){
  await page.goto('/');
  await page.evaluate((state:any)=>localStorage.setItem('misu.save.v1',JSON.stringify({schemaVersion:1,caseId:'silver-whistle',savedAt:Date.now(),state})),stateAt(x,z));
  await page.reload();await page.getByRole('button',{name:/继续案件/}).click();
  await expect(page.locator('#scene-label')).toContainText('莉迪亚旧房');await page.waitForTimeout(300);
}

test('Lydia camera-locked furniture follows one scene camera and sleeping group is back-set',async({page})=>{
  await page.setViewportSize({width:1440,height:810});
  await page.addInitScript(()=>{
    window.addEventListener('misu:scene-ready',(event:any)=>{if(event.detail.scene==='lydia-room')(window as any).__graph=event.detail.sceneGraphAudit;});
    window.addEventListener('misu:asset-perspective-debug',(event:any)=>((window as any).__perspective=event.detail));
  });
  await continueAt(page,2.1,2.6);
  const graph=await page.evaluate(()=>((window as any).__graph));
  expect(graph.camera).toMatchObject({id:'lydia-bedroom-camera-v1',azimuthDegrees:0,rollDegrees:0});
  expect(graph.groups.find((group:any)=>group.id==='sleeping').origin).toEqual({x:5.72,z:1.4});
  for(const entity of graph.entities.filter((item:any)=>item.id!=='rug')){
    expect(entity.cameraId).toBe(graph.camera.id);expect(entity.authoredYawDegrees).toEqual(expect.any(Number));
    expect(Math.abs(entity.displaySize.width/entity.displaySize.height-entity.sourceSize.width/entity.sourceSize.height)).toBeLessThan(.02);
  }
  for(const entity of graph.wallMounted){
    expect(entity.cameraId).toBe(graph.camera.id);
    expect(Math.abs(entity.displaySize.width/entity.displaySize.height-entity.sourceSize.width/entity.sourceSize.height)).toBeLessThan(.03);
  }
  await page.screenshot({path:'screenshots/phase-1-16/01-bedroom-camera-locked.png'});
  await page.keyboard.press('F8');await page.waitForTimeout(100);
  const perspective=await page.evaluate(()=>((window as any).__perspective));
  expect(perspective.enabled).toBe(true);expect(perspective.entities).toHaveLength(7);
  expect(perspective.wallMounted).toHaveLength(2);
  expect(perspective.wallMounted.every((item:any)=>item.cameraId===graph.camera.id)).toBe(true);
  await page.screenshot({path:'screenshots/phase-1-16/02-asset-perspective-axes-f8.png'});
});
