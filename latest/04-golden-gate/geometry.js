import {THREE,V} from '../shared/runtime.js';

const UP=V(0,1,0), direction=V(), axis=V();
export const GEO={box:new THREE.BoxGeometry(),sphere:new THREE.SphereGeometry(1,16,12),cylinder:new THREE.CylinderGeometry(1,1,1,10)};

// Author shapes with ordinary transform handles, then draw each geometry/material
// combination in a single instanced call. Dynamic handles include the entire crew.
export class Instances {
 constructor(parent,dynamic=false){this.parent=parent;this.dynamic=dynamic;this.buckets=new Map();this.meshes=[];}
 part(parent,geometry,material,p=[0,0,0],s=[1,1,1],r=null){
  const node=new THREE.Object3D();node.position.set(...p);node.scale.set(...s);if(r)node.rotation.set(...r);parent.add(node);
  const key=geometry.uuid+'/'+material.uuid;
  if(!this.buckets.has(key))this.buckets.set(key,{geometry,material,nodes:[]});
  this.buckets.get(key).nodes.push(node);return node;
 }
 box(parent,material,p,s,r){return this.part(parent,GEO.box,material,p,s,r);}
 ell(parent,material,p,s){return this.part(parent,GEO.sphere,material,p,s);}
 rod(parent,material,a,b,r=.05){const node=this.part(parent,GEO.cylinder,material);placeRod(node,a,b,r);return node;}
 beam(parent,material,a,b,w=.12,d=.12){const node=this.part(parent,GEO.box,material);placeRod(node,a,b,w);node.scale.x=w;node.scale.z=d;return node;}
 build(){
  this.parent.updateWorldMatrix(true,true);this.parent.updateMatrixWorld(true);
  const inv=new THREE.Matrix4().copy(this.parent.matrixWorld).invert();
  for(const bucket of this.buckets.values()){
   const m=new THREE.InstancedMesh(bucket.geometry,bucket.material,bucket.nodes.length);
   m.castShadow=true;m.receiveShadow=true;m.frustumCulled=!this.dynamic;
   if(this.dynamic)m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
   this.parent.add(m);bucket.mesh=m;this.meshes.push(m);
   for(let i=0;i<bucket.nodes.length;i++){
    m.setMatrixAt(i,tempMatrix.multiplyMatrices(inv,bucket.nodes[i].matrixWorld));
    bucket.nodes[i].userData.drawMesh=m;bucket.nodes[i].userData.drawIndex=i;
   }
   m.instanceMatrix.needsUpdate=true;
  }
  // Static authoring handles need not occupy the per-frame scene traversal.
  if(!this.dynamic)for(const bucket of this.buckets.values())for(const node of bucket.nodes)node.removeFromParent();
 }
 sync(){
  this.parent.updateMatrixWorld(true);
  inverse.copy(this.parent.matrixWorld).invert();
  for(const bucket of this.buckets.values()){
   for(let i=0;i<bucket.nodes.length;i++)bucket.mesh.setMatrixAt(i,tempMatrix.multiplyMatrices(inverse,bucket.nodes[i].matrixWorld));
   bucket.mesh.instanceMatrix.needsUpdate=true;
  }
 }
 get instanceCount(){let n=0;for(const b of this.buckets.values())n+=b.nodes.length;return n;}
}
const inverse=new THREE.Matrix4(),tempMatrix=new THREE.Matrix4();
export function placeRod(node,a,b,r=.04){
 node.position.copy(a).add(b).multiplyScalar(.5);
 direction.copy(b).sub(a);node.scale.set(r,direction.length(),r);
 direction.normalize();
 const horizontal=Math.hypot(direction.x,direction.z);
 // Avoid setFromUnitVectors' near-antiparallel approximation on taut hoist falls.
 if(horizontal>1e-14){axis.set(direction.z,0,-direction.x).divideScalar(horizontal);node.quaternion.setFromAxisAngle(axis,Math.atan2(horizontal,direction.y));}
 else node.quaternion.set(direction.y<0?1:0,0,0,direction.y<0?0:1);
 return node;
}
export function anchor(parent,x,y,z){const a=new THREE.Object3D();a.position.set(x,y,z);parent.add(a);return a;}
export function trianglePlate(){
 const s=new THREE.Shape();s.moveTo(-.2,-.2);s.lineTo(.2,-.2);s.lineTo(0,.2);s.closePath();
 return new THREE.ExtrudeGeometry(s,{depth:.055,bevelEnabled:false});
}

// Connected, planted construction figures, with hands explicitly exposed as rig anchors.
export function makeWorker(parent,draw,mats,x,z,side,index){
 const g=new THREE.Group();parent.add(g);g.position.set(x,12.16,z);g.rotation.y=side<0?0:Math.PI;
 const shirt=index%2?mats.shirtB:mats.shirt, trouser=mats.trouser, skin=mats.skin;
 const pelvis=draw.ell(g,trouser,[0,.79,0],[.17,.2,.2]);
 const torso=draw.ell(g,shirt,[.065,1.09,0],[.205,.33,.26]);
 draw.box(g,mats.belt,[.035,.84,0],[.33,.075,.39]);
 const neck=draw.ell(g,skin,[.115,1.42,0],[.09,.13,.09]);
 const head=new THREE.Group();g.add(head);head.position.set(.13,1.56,0);
 draw.ell(head,skin,[0,0,0],[.15,.2,.155]);
 draw.ell(head,skin,[.148,-.015,0],[.06,.05,.049]);
 draw.ell(head,mats.cap,[-.012,.154,0],[.179,.085,.176]);
 draw.box(head,mats.cap,[.116,.13,0],[.23,.035,.33]);
 for(const zz of[-.085,.085])draw.ell(head,mats.belt,[.132,.044,zz],[.017,.012,.016]);
 const feet=[],knees=[],hips=[],legs=[];
 for(const [i,zz]of[-.15,.15].entries()){
  const xx=i===0?.21:-.17;
  const foot=draw.ell(g,mats.boot,[xx,.068,zz],[.22,.068,.105]);feet.push(foot);
  const knee=V(xx-.045,.41,zz),hip=V(-.015,.81,zz*.8);knees.push(knee);hips.push(hip);
  legs.push(draw.rod(g,trouser,hip,knee,.095),draw.rod(g,trouser,knee,V(xx-.075,.15,zz),.08));
 }
 // Suspenders, collar, and rolled cuffs are separate broad construction cues.
 for(const zz of[-.15,.15])draw.beam(g,mats.belt,V(.195,.92,zz),V(.218,1.32,zz),.035,.028);
 draw.ell(g,mats.collar,[.133,1.354,0],[.1,.044,.18]);
 const hands=[],upper=[],fore=[],cuffs=[];
 for(let s=0;s<2;s++){
  hands.push(draw.ell(g,skin,[.5,1.1,s?.045:-.045],[.082,.064,.066]));
  upper.push(draw.rod(g,shirt,V(),V(0,1,0),.085));
  fore.push(draw.rod(g,skin,V(),V(0,1,0),.061));
  cuffs.push(draw.ell(g,mats.collar,[0,0,0],[.079,.065,.083]));
 }
 const tailA=draw.rod(g,mats.rope,V(),V(0,1,0),.022),tailB=draw.rod(g,mats.rope,V(),V(0,1,0),.022);
 const shoulder=V(),elbow=V(),a=V(),b=V();
 function pose(p){
  const strain=1-p.relax, breath=Math.sin(p.t*1.5+index)*.012;
  torso.position.x=.035+.043*strain;torso.rotation.z=-.13*strain;
  head.rotation.z=.13*(1-p.lower)-.06*p.relax;head.position.x=.105+.028*strain;
  neck.position.x=head.position.x;
  hands[0].position.set(.61-.025*p.relax,1.10+.105*(1-p.lower)+breath,-.032);
  hands[1].position.set(.405-.025*p.relax,1.065+.072*(1-p.lower)+breath,.037);
  for(let s=0;s<2;s++){
   const zz=s?.24:-.24;
   shoulder.set(.065,1.30,zz);elbow.set(.285,1.05+.09*(1-p.lower),zz*1.25);
   placeRod(upper[s],shoulder,elbow,.085);placeRod(fore[s],elbow,hands[s].position,.061);cuffs[s].position.copy(elbow);
  }
  placeRod(tailA,hands[0].position,hands[1].position,.022);
  a.copy(hands[1].position);b.set(.27,.78,.15);placeRod(tailB,a,b,.022);
 }
 return {g,feet,hands,pose,side,index};
}

// Low broad geological forms with elevation-related bands, not surface noise alone.
export function headland(parent,material,{x,z,rx,rz,height,phase=0}){
 const vertices=[],colors=[],indices=[],radial=18,around=80;
 const lo=new THREE.Color('#c8b88a'),mid=new THREE.Color('#778e72'),hi=new THREE.Color('#8e9d77'),c=new THREE.Color();
 for(let j=0;j<=radial;j++)for(let i=0;i<=around;i++){
  const u=j/radial,a=i/around*Math.PI*2;
  const edge=1+.105*Math.sin(a*3+phase)+.055*Math.sin(a*7-phase);
  const xx=Math.cos(a)*u*rx*edge,zz=Math.sin(a)*u*rz*edge;
  const h=Math.max(-.8,Math.pow(Math.max(0,1-u*u),1.5)*height+Math.sin(a*3+phase)*u*(1-u)*height*.25-.65);
  vertices.push(xx,h,zz);
  c.copy(h<2.0?lo:h<height*.57?mid:hi);c.multiplyScalar(.94+.06*Math.cos(a+phase));colors.push(c.r,c.g,c.b);
  if(j<radial&&i<around){const k=j*(around+1)+i;indices.push(k,k+1,k+around+1,k+1,k+around+2,k+around+1);}
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();
 const m=new THREE.Mesh(geo,material);m.position.set(x,0,z);m.receiveShadow=true;m.castShadow=true;parent.add(m);return m;
}
