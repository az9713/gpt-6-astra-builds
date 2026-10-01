import * as THREE from 'three/webgpu';
import {ground,rockRadius,RADIUS} from './motion.js';
import {rng,TAU} from './math.js';
import {mesh,bevelBox,extrude,tube,ell,mergeMeshes} from './geometry.js';
export function createRelief(scene,stone,light,dark){
 mesh(scene,bevelBox(23.4,12.2,.9,.20),stone,[0,5.02,-.65]);
 const trim=[];
 for(const y of[-1.13,11.18]){trim.push(mesh(scene,bevelBox(23.8,.38,.7,.08),light,[0,y,-.17]));trim.push(mesh(scene,bevelBox(23.0,.09,.42,.025),dark,[0,y+(y<0?.36:-.36),-.06]));}
 for(const x of[-11.58,11.58])trim.push(mesh(scene,bevelBox(.38,12.0,.7,.065),light,[x,5.02,-.17]));
 // Low rounded ridgelines recede into the same carved slab. Their edges have thickness.
 const r=rng(936);for(let layer=0;layer<3;layer++){
  const points=[[-11,-.85]];for(let x=-11;x<=11.01;x+=.22){const h=4.0+layer*1.0+1.0*Math.sin(x*.27+layer*1.3)+.46*Math.sin(x*.63+layer*.5)+.19*Math.cos(x*1.38-layer)+.10*Math.sin(x*2.65+layer*2)+.035*Math.cos(x*5.8+layer);points.push([x,h])}points.push([11,-.85]);
  mesh(scene,extrude(points,.055,.085),layer===2?stone:light,[0,0,.015+(2-layer)*.085]);
 }
 const ledge=mesh(scene,extrude([[-11,-.83],[-11,ground(-11)-.12],[11,ground(11)-.12],[11,-.83]],5.48,.095),light,[0,0,.20]);
 // A shaped top, wide enough for the figure's two feet and the stone's contact.
 const geo=new THREE.BufferGeometry(),p=[],ix=[],N=100;for(let i=0;i<=N;i++){const x=-11+i*22/N;for(const z of[.14,5.80])p.push(x,ground(x),z)}for(let i=0;i<N;i++){const a=i*2;ix.push(a,a+1,a+2,a+1,a+3,a+2)}geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setIndex(ix);geo.computeVertexNormals();mesh(scene,geo,stone);
 // Fine interrupted tooling on the broad top. Shallow geometry, not a decal or imported map.
 const toolMarks=[];
 for(let i=0;i<105;i++){const x=-10.6+r()*21.2,z=.35+r()*5.15;if(z<2.5&&r()<.65)continue;const length=.055+r()*.20;const mark=mesh(scene,new THREE.BoxGeometry(length,.008,.011),dark,[x,ground(x)+.001,z]);mark.rotation.z=Math.atan(.285);mark.rotation.y=(r()-.5)*.35;mark.castShadow=false;toolMarks.push(mark)}
 mergeMeshes(toolMarks,dark,scene).castShadow=false;
 // Sparse incised strata leave broad, quiet areas around the action.
 for(let row=0;row<8;row++){const x=-9.6+r()*17,y=ground(x)-.45-r()*2.1;const pts=[];for(let k=0;k<6;k++)pts.push([x+k*.23,y+.035*Math.sin(k*.8+row),5.775]);tube(scene,dark,pts,.008)}
 for(let x=-10.9;x<11;x+=.56){trim.push(mesh(scene,bevelBox(.24,.17,.1,.022),light,[x,10.74,.14]));}
 mergeMeshes(trim,light,scene);
 const boulderGeo=new THREE.SphereGeometry(1,96,64),a=boulderGeo.attributes.position,v=new THREE.Vector3();for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i).normalize();const radius=rockRadius([v.x,v.y,v.z]);a.setXYZ(i,v.x*radius,v.y*radius,v.z*radius)}boulderGeo.computeVertexNormals();const boulder=mesh(scene,boulderGeo,stone);boulder.scale.z=.72;
 return{boulder,update(q){boulder.position.set(...q.rock.center);boulder.rotation.z=q.rock.theta;}};
}
