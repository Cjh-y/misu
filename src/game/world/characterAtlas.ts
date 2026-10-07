/** Extract complete alpha-connected figures, rather than cutting through unequal sheet rows. */
export function isolateCharacterFrames(pixels:Uint8ClampedArray,width:number,height:number){
  const visited=new Uint8Array(width*height),components:{indices:number[];x:number;y:number;right:number;bottom:number}[]=[];
  for(let start=0;start<visited.length;start++){
    if(visited[start]||pixels[start*4+3]<=8)continue;
    const queue=[start];visited[start]=1;let x=width,y=height,right=0,bottom=0;
    for(let i=0;i<queue.length;i++){
      const p=queue[i],px=p%width,py=Math.floor(p/width);x=Math.min(x,px);y=Math.min(y,py);right=Math.max(right,px);bottom=Math.max(bottom,py);
      for(const n of [px>0?p-1:-1,px<width-1?p+1:-1,py>0?p-width:-1,py<height-1?p+width:-1])if(n>=0&&!visited[n]&&pixels[n*4+3]>8){visited[n]=1;queue.push(n);}
    }
    if(queue.length>1000)components.push({indices:queue,x,y,right,bottom});
  }
  return components.sort((a,b)=>a.y-b.y).slice(0,16).reduce<typeof components[]>((rows,c)=>{let row=rows.find(r=>Math.abs(r[0].y-c.y)<80);if(!row){row=[];rows.push(row);}row.push(c);return rows;},[]).flatMap(row=>row.sort((a,b)=>a.x-b.x));
}
