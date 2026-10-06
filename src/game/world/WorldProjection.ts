/** A position in a room's logical 2.5D coordinate system. y is height above the floor. */
export interface WorldPosition3D { x:number; y:number; z:number }
export interface WorldSize3D { width:number; depth:number; height:number }
export interface GroundPoint { x:number; z:number }
export interface ScreenPoint { x:number; y:number }
export interface FloorQuad { northwest:ScreenPoint; northeast:ScreenPoint; southeast:ScreenPoint; southwest:ScreenPoint }

/**
 * Bilinear floor projection for a perspective room illustration. The four control
 * points describe the floor plane in the room artwork, so world-parallel movement
 * follows the artwork's actual floor rather than a generic isometric transform.
 */
export class WorldProjection {
  constructor(readonly size:WorldSize3D, readonly floor:FloorQuad, readonly heightScale=26) {}

  project(position:WorldPosition3D):ScreenPoint {
    const u=position.x/this.size.width, v=position.z/this.size.depth;
    const p=this.interpolate(u,v);
    return {x:p.x,y:p.y-position.y*this.heightScale};
  }

  projectFloor(position:GroundPoint):ScreenPoint { return this.project({x:position.x,y:0,z:position.z}); }

  unprojectFloor(point:ScreenPoint):GroundPoint {
    let u=.5,v=.5;
    for(let i=0;i<16;i++){
      const projected=this.interpolate(u,v),du=.0001,dv=.0001;
      const pu=this.interpolate(u+du,v),pv=this.interpolate(u,v+dv);
      const ax=(pu.x-projected.x)/du, ay=(pu.y-projected.y)/du;
      const bx=(pv.x-projected.x)/dv, by=(pv.y-projected.y)/dv;
      const dx=point.x-projected.x,dy=point.y-projected.y,det=ax*by-bx*ay;
      if(Math.abs(det)<1e-8)break;
      u+= (dx*by-bx*dy)/det; v+=(ax*dy-dx*ay)/det;
      if(Math.abs(dx)+Math.abs(dy)<1e-5)break;
    }
    return {x:u*this.size.width,z:v*this.size.depth};
  }

  scaleAt(z:number, near=1.035, far=.94):number {
    const t=Math.max(0,Math.min(1,z/this.size.depth));
    return far+(near-far)*t;
  }

  private interpolate(u:number,v:number):ScreenPoint {
    const {northwest:nw,northeast:ne,southeast:se,southwest:sw}=this.floor;
    return {
      x:(1-u)*(1-v)*nw.x+u*(1-v)*ne.x+u*v*se.x+(1-u)*v*sw.x,
      y:(1-u)*(1-v)*nw.y+u*(1-v)*ne.y+u*v*se.y+(1-u)*v*sw.y,
    };
  }
}
