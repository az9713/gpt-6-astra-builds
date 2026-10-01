import {THREE,TSL,start,sky,tube,mesh,flat,V,rng,mix} from '../shared/runtime.js';
import {Instances,GEO,placeRod,anchor,trianglePlate,makeWorker,headland} from './geometry.js';
import {bridgeMaterials,bayWater} from './materials.js';
import {DECK,BEATS,bridgePose} from './motion.js';

await start({title:'The Golden Gate — Joining the Bay',background:'#d9ccab',setup({scene,camera,sun,ambient,fill,mobile}){
 sky(scene,'#eed6a4','#8fbbb5');scene.fog=new THREE.FogExp2('#b5c8b1',.0015);
 sun.position.set(-60,42,-78);sun.intensity=3.35;ambient.intensity=1.6;
 fill.position.set(15,22,30);fill.intensity=1.1;
 Object.assign(sun.shadow.camera,{left:-77,right:77,top:65,bottom:-65,near:1,far:240});
 sun.shadow.bias=-.0002;sun.shadow.normalBias=.035;
 const M=bridgeMaterials(),fixed=new Instances(scene),live=new Instances(scene,true);
 const plate=trianglePlate();
 const eyeGeometry=new THREE.TorusGeometry(.11,.025,6,18);
 const hookGeometry=new THREE.TorusGeometry(.235,.07,7,22,Math.PI*1.65);
 const saddleGeometry=new THREE.CylinderGeometry(.45,.45,.7,16,1,false,0,Math.PI);
 bayWater(scene);

 // This painted sun disc occupies the same directional axis as the real light.
 const disc=mesh(scene,new THREE.SphereGeometry(9,24,12),flat('#ffe7ad'),-180,126,-234);
 disc.castShadow=disc.receiveShadow=false;
 const landMaterial=new THREE.MeshStandardNodeMaterial({vertexColors:true,roughness:1});
 landMaterial.userData={tsl:true,role:'elevation-banded headlands'};
 const nearLand=[headland(scene,landMaterial,{x:-114,z:-15,rx:54,rz:71,height:23,phase:.1}),
  headland(scene,landMaterial,{x:106,z:-13,rx:56,rz:66,height:20,phase:2.1})];
 headland(scene,landMaterial,{x:-130,z:-131,rx:88,rz:54,height:29,phase:1.2});
 headland(scene,landMaterial,{x:50,z:-163,rx:111,rz:43,height:17,phase:3.4});
 const rnd=rng(7704),buildings=new Instances(scene);
 const homeMat=flat('#c9bb95'),roofMat=flat('#737e68');
 for(let i=0;i<75;i++){
  const x=83+rnd()*38,z=-32-rnd()*30,h=.65+rnd()*1.75,y=7+Math.sin((x-80)/45)*4;
  buildings.box(scene,homeMat,[x,y+h*.5,z],[.8+rnd()*.6,h,1.1]);
  buildings.box(scene,roofMat,[x,y+h,z],[1.2,.15,1.25]);
 }
 buildings.build();

 function bolt(x,y,z,draw=fixed,parent=scene,r=.052){return draw.ell(parent,M.bolt,[x,y,z],[r,r,.024]);}
 function steelI(parent,draw,center,length,height,z,width=.28){
  draw.box(parent,M.steel,[center,height,z],[length,.18,width]);
  draw.box(parent,M.flange,[center,height+.10,z],[length,.055,width+.09]);
 }
 function crossbeam(parent,draw,x,zwidth=7.35){
  draw.box(parent,M.steel,[x,11.39,0],[.14,.65,zwidth]);
  draw.box(parent,M.flange,[x,11.74,0],[.31,.07,zwidth]);
  draw.box(parent,M.darkSteel,[x,11.06,0],[.31,.07,zwidth]);
 }
 function makeDeck(parent,draw,a,b,lifting=false){
  const len=b-a,c=(a+b)/2,n=Math.max(2,Math.round(len/2.3));
  draw.box(parent,M.road,[c,11.99,0],[len,.34,7.05]);
  for(const z of[-2.98,2.98])draw.box(parent,M.walk,[c,12.19,z],[len,.06,1.0]);
  for(const z of[-3.59,3.59]){
   steelI(parent,draw,c,len,10.34,z,.22);steelI(parent,draw,c,len,11.75,z,.28);
   draw.box(parent,M.flange,[c,13.04,z],[len,.09,.09]);
   draw.box(parent,M.steel,[c,12.62,z],[len,.045,.055]);
   for(let i=0;i<=n;i++){
    const x=a+len*i/n;
    draw.box(parent,M.steel,[x,12.39,z],[.085,1.32,.095]);
    if(i<n){
     const q=a+len*(i+1)/n;
     draw.beam(parent,M.steel,V(x,10.42,z),V(q,11.67,z),.14,.13);
     draw.beam(parent,M.darkSteel,V(x,11.67,z),V(q,10.42,z),.105,.11);
    }
    // Joint plates and rivet heads remain inside each section's end planes.
    const jx=Math.max(a+.22,Math.min(b-.22,x));
    draw.part(parent,plate,M.flange,[jx,10.49,z+(z>0?.1:-.15)],[1,1,1]);
    for(const dx of[-.105,.105])bolt(jx+dx,10.38,z+(z>0?.172:-.177),draw,parent,.038);
   }
  }
  for(let i=0;i<=n;i++)crossbeam(parent,draw,a+.16+(len-.32)*i/n);
  // Plate joints on the roadway are visible during the lift, but broad enough not to shimmer.
  for(let i=1;i<n;i++)draw.box(parent,M.seam,[a+len*i/n,12.165,0],[.035,.01,4.86]);
  if(!lifting)for(let x=Math.ceil(a/6)*6;x<b-.7;x+=6)draw.box(parent,M.walk,[x,12.17,0],[2.3,.018,.045]);
 }
 makeDeck(scene,fixed,-72,-DECK.fixedEdge);makeDeck(scene,fixed,DECK.fixedEdge,72);
 // Supported abutments and approach roads continue over each headland crest.
 // Their far ends turn away from the camera and disappear behind the ridge.
 scene.updateMatrixWorld(true);
 const ray=new THREE.Raycaster(),down=V(0,-1,0);
 function groundAt(x,z){ray.set(V(x,100,z),down);return ray.intersectObjects(nearLand,false)[0]?.point.y??0;}
 for(const side of[-1,1]){
  const ground=groundAt(side*71.6,0),base=Math.max(.15,ground-.8);
  fixed.box(scene,M.concrete,[side*71.7,(base+11.82)*.5,0],[2.2,11.82-base,8.55]);
  fixed.box(scene,M.concrete,[side*71.7,11.72,0],[2.65,.4,8.95]);
  for(const z of[-4.18,4.18]){
   fixed.box(scene,M.concrete,[side*71.5,12.51,z],[2.3,3.34,1.13]);
   fixed.box(scene,M.darkSteel,[side*71.5,14.24,z],[1.25,.19,.58]);
  }
  const path=[],n=44;
  for(let i=0;i<=n;i++){
   const u=i/n,x=side*(72+43*u),z=-45*u*u;
   const h=groundAt(x,z)+.13;
   path.push(V(x,u<.55?Math.max(DECK.top,h):h,z));
  }
  function ribbon(inner,outer,offset,material){
   const p=[],indices=[];
   for(let i=0;i<=n;i++){
    const a=path[Math.max(0,i-1)],b=path[Math.min(n,i+1)],dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz);
    for(const width of[inner,outer])p.push(path[i].x-dz/l*width,path[i].y+offset,path[i].z+dx/l*width);
    if(i<n){const k=i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3);}
   }
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(indices);g.computeVertexNormals();
   const road=mesh(scene,g,material);road.material.side=THREE.DoubleSide;return road;
  }
  ribbon(-3.52,3.52,0,M.road);ribbon(-4.01,-3.03,.045,M.walk);ribbon(3.03,4.01,.045,M.walk);
  // Fill beneath the first elevated approach, sampled from the actual landscape.
  for(let i=0;i<13;i++){
   const p=path[i],q=path[i+1],g=groundAt(p.x,p.z);
   if(p.y-g>.30)fixed.box(scene,M.concrete,[p.x,(p.y+g)*.5-.12,p.z],[1.16,p.y-g,7.74],[0,-Math.atan2(q.z-p.z,q.x-p.x),0]);
  }
 }
 const section=new THREE.Group(),structure=new THREE.Group();scene.add(section);section.add(structure);
 const moving=new Instances(structure);makeDeck(structure,moving,-DECK.halfLength,DECK.halfLength,true);
 moving.build();
 const sectionBounds=new THREE.Box3().setFromObject(structure);

 // Bearings and their cantilever seats exist before the lowering begins.
 const bearingContacts=[];
 for(const side of[-1,1])for(const z of[-3.59,3.59]){
  fixed.box(scene,M.darkSteel,[side*4.37,10.04,z],[.99,.28,.62]);
  fixed.box(scene,M.brass,[side*3.89,10.20,z],[.22,.1,.32]);
  fixed.beam(scene,M.steel,V(side*4.65,9.48,z),V(side*3.99,10.02,z),.13,.16);
  bearingContacts.push({moving:anchor(section,side*3.89,DECK.bottom,z),fixed:anchor(scene,side*3.89,10.25,z)});
 }

 // Stepped shafts, flange edges, riveted portal beams and cable saddles.
 for(const x of[-25,25]){
  for(const z of[-4.55,4.55]){
   fixed.box(scene,M.concrete,[x,1.25,z],[4.8,3.0,4.8]);
   fixed.box(scene,M.concrete,[x,2.96,z],[3.7,.44,3.75]);
   fixed.box(scene,M.darkSteel,[x,3.32,z],[2.36,.28,2.12]);
   fixed.box(scene,M.steel,[x,20.5,z],[1.63,34.1,1.5]);
   for(const dx of[-.86,.86])fixed.box(scene,M.flange,[x+dx,20.5,z],[.15,34.1,1.7]);
   for(const zz of[-.79,.79])fixed.box(scene,M.darkSteel,[x,20.5,z+zz],[1.48,34.1,.10]);
   for(let y=6.2;y<38;y+=3.85){
    fixed.box(scene,M.flange,[x,y,z],[1.93,.22,1.82]);
    for(const dx of[-.53,.53])for(const yy of[-.42,.42])bolt(x+dx,y+yy,z+.84);
   }
   fixed.box(scene,M.steel,[x,38.16,z],[2.08,1.09,1.89]);
   fixed.box(scene,M.flange,[x,38.83,z],[2.52,.24,2.13]);
   fixed.box(scene,M.brass,[x,39.04,z*.919],[1.75,.18,.67]);
   fixed.part(scene,saddleGeometry,M.darkSteel,[x,39.15,z*.919],[1,1,1],[0,0,Math.PI/2]);
  }
  for(const y of[14.8,22.6,30.4,37.15]){
   fixed.box(scene,M.steel,[x,y,0],[1.72,1.04,9.1]);
   for(const dx of[-.91,.91])fixed.box(scene,M.flange,[x+dx,y,0],[.10,.96,9.05]);
   fixed.box(scene,M.flange,[x,y+.54,0],[1.93,.12,9.1]);
   for(const z of[-3.53,3.53])fixed.beam(scene,M.steel,V(x,y-.15,z*.78),V(x,y-1.8,z),.48,.48);
   for(let z=-3.3;z<=3.3;z+=1.1)for(const yy of[-.29,.29]){
    // Portal rivets face the hero camera on the tower's longitudinal face.
    const n=fixed.ell(scene,M.bolt,[x+.976,y+yy,z],[.028,.054,.054]);
   }
  }
 }
 function cableY(x){const a=Math.abs(x);return a<=25?19.5+19.6*(a/25)**2:39.1-1.047*(a-25)+.0106*(a-25)**2;}
 const cableZ=4.18;
 for(const z of[-cableZ,cableZ]){
  const pts=[];for(let i=0;i<=180;i++){const x=-72+144*i/180;pts.push([x,cableY(x),z]);}
  tube(scene,M.steel,pts,.14);
  tube(scene,M.flange,pts.map(([x,y,z])=>[x,y+.10,z+.047]),.045);
  for(let x=-69;x<=69;x+=2.3){
   if(Math.abs(x)<4.9)continue;
   fixed.rod(scene,M.flange,V(x,12.0,z),V(x,cableY(x)-.1,z),.042);
   fixed.box(scene,M.darkSteel,[x,cableY(x)-.05,z],[.22,.23,.33]);
   fixed.box(scene,M.steel,[x,11.8,z*.91],[.22,.17,.89]);
  }
 }

 // Two temporary stiff-leg derricks. Their winches, sheaves and boom heads
 // form a continuous load path from the existing deck to the lifting tackle.
 const hoistHeads=[];
 for(const side of[-1,1]){
  const footX=side*7.45,mastX=side*6.15,headX=side*2.58;
  for(const z of[-3.13,3.13]){
   fixed.box(scene,M.rig,[footX,12.37,z],[1.25,.3,1.00]);
   fixed.beam(scene,M.rig,V(footX,12.53,z),V(mastX,24.25,z*.77),.25,.25);
   fixed.beam(scene,M.brass,V(footX+.13,12.53,z),V(mastX+.13,24.25,z*.77),.035,.28);
   fixed.beam(scene,M.rig,V(side*10.2,12.5,z),V(mastX,24.25,z*.77),.13,.13);
   fixed.box(scene,M.darkSteel,[side*10.2,12.36,z],[.65,.31,.7]);
  }
  fixed.beam(scene,M.rig,V(mastX,24.25,-2.5),V(mastX,24.25,2.5),.3,.3);
  fixed.beam(scene,M.rig,V(mastX,24.2,-2.38),V(headX,23.35,0),.19,.19);
  fixed.beam(scene,M.rig,V(mastX,24.2,2.38),V(headX,23.35,0),.19,.19);
  fixed.beam(scene,M.rig,V(side*7.05,15.5,0),V(headX,23.35,0),.23,.23);
  fixed.rod(scene,M.wire,V(mastX,24.42,0),V(headX,23.58,0),.032);
  fixed.box(scene,M.rig,[headX,23.41,0],[.47,.49,.54]);
  for(const z of[-.28,.28]){
   fixed.part(scene,GEO.cylinder,M.brass,[headX,23.43,z],[.23,.055,.23],[Math.PI/2,0,0]);
   hoistHeads.push(anchor(scene,headX,23.38,z*.65));
  }
  fixed.box(scene,M.rig,[side*8.1,12.58,0],[1.25,.6,1.2]);
  fixed.part(scene,GEO.cylinder,M.wire,[side*8.1,13.03,0],[.38,1.4,.38],[Math.PI/2,0,0]);
  for(const z of[-.8,.8])fixed.box(scene,M.brass,[side*8.1,13.04,z],[.72,.74,.09]);
  fixed.rod(scene,M.wire,V(side*8.1,13.29,.13),V(mastX,24.35,.13),.029);
  fixed.rod(scene,M.wire,V(mastX,24.35,.13),V(headX,23.55,.13),.029);
 }

 const tackle=new Instances(section),hoistEnds=[],slingRecords=[],guideAnchors=[];
 function eye(parent,draw,x,y,z,rotateY=0){
  const e=draw.part(parent,eyeGeometry,M.brass,[x,y,z],[1,1,1],[0,rotateY,0]);return e;
 }
 // Lift eyes are welded to the roadway; equalizer beams, hooks and blocks
 // travel with it, while the hoist falls run up to the fixed derrick sheaves.
 for(const x of[-2.58,2.58]){
  tackle.box(section,M.rig,[x,15.26,0],[.22,.3,5.04]);
  tackle.box(section,M.brass,[x,15.43,0],[.31,.07,5.15]);
  eye(section,tackle,x,15.64,0);
  tackle.part(section,hookGeometry,M.wire,[x+.08,15.93,0],[1,1,1],[0,0,.37]);
  tackle.box(section,M.wire,[x,16.20,0],[.13,.42,.15]);
  tackle.box(section,M.rig,[x,16.46,0],[.47,.5,.3]);
  for(const z of[-.18,.18]){
   tackle.part(section,GEO.cylinder,M.brass,[x,16.47,z],[.19,.065,.19],[Math.PI/2,0,0]);
   hoistEnds.push(anchor(section,x,16.60,z));
  }
  for(const z of[-2.55,2.55]){
   tackle.box(section,M.darkSteel,[x,12.23,z],[.38,.13,.35]);eye(section,tackle,x,12.42,z,Math.PI/2);
   eye(section,tackle,x,15.12,z*.942,Math.PI/2);
   const bottom=anchor(section,x,12.5,z),top=anchor(section,x,15.02,z*.942);
   const line=live.rod(scene,M.wire,V(),V(0,1,0),.036);slingRecords.push({a:bottom,b:top,line});
  }
 }
 for(const side of[-1,1])for(const z of[-2.10,2.10]){
  tackle.box(section,M.steel,[side*3.92,12.21,z],[.12,.18,.28]);
  eye(section,tackle,side*4.005,12.41,z);
  guideAnchors.push(anchor(section,side*4.095,12.41,z));
 }
 tackle.build();
 const hoistRecords=hoistHeads.map((a,i)=>({a,b:hoistEnds[i],line:live.rod(scene,M.wire,V(),V(0,1,0),.034)}));
 const workers=[],guideRecords=[];
 let workerIndex=0;
 for(const side of[-1,1])for(const z of[-2.10,2.10]){
  const worker=makeWorker(scene,live,M,side*5.33,z,side,workerIndex);
  workers.push(worker);guideRecords.push({a:guideAnchors[workerIndex],b:worker.hands[0],line:live.rod(scene,M.rope,V(),V(0,1,0),.025)});workerIndex++;
 }
 fixed.build();live.build();

 // An original low-poly workboat supplies bay scale without becoming a second story.
 const boat=new THREE.Group();scene.add(boat);const boatDraw=new Instances(boat);
 boatDraw.ell(boat,M.darkSteel,[0,.30,0],[2.18,.40,.76]);
 boatDraw.box(boat,M.walk,[-.28,.70,0],[2.4,.28,1.18]);
 boatDraw.box(boat,M.concrete,[-.37,1.18,0],[1.15,.75,.89]);
 boatDraw.box(boat,M.darkSteel,[-.37,1.62,0],[1.39,.13,1.1]);
 boatDraw.box(boat,M.rig,[-.79,1.94,0],[.22,.59,.26]);
 for(const z of[-.454,.454])boatDraw.box(boat,M.shirt,[-.23,1.23,z],[.64,.32,.018]);
 boatDraw.rod(boat,M.wire,V(.82,.77,0),V(.82,2.18,0),.032);boatDraw.build();
 const wakeMaterial=flat('#a5c9b6',.36);
 for(const side of[-1,1]){const w=tube(boat,wakeMaterial,[[-1.9,.03,side*.52],[-3.9,.04,side*.98],[-6.9,.02,side*1.7]],.075);w.castShadow=w.receiveShadow=false;}

 const allLines=[...hoistRecords,...slingRecords,...guideRecords];
 const a=V(),b=V(),origin=V(10.9,18.4,23.5),finish=V(84,55,115),target=V();
 const framePoint=V(),scratch=V(),endA=V(),endB=V(),renderedMatrix=new THREE.Matrix4();
 let pose=bridgePose(0);
 function update(time){
  pose=bridgePose(time);
  section.position.set(0,pose.height,pose.sway);section.rotation.set(0,pose.yaw,pose.roll);
  workers.forEach(w=>w.pose(pose));
  scene.updateMatrixWorld(true);
  for(const line of allLines){line.a.getWorldPosition(a);line.b.getWorldPosition(b);placeRod(line.line,a,b,line.line.scale.x);}
  live.sync();
  const pre=Math.sin(Math.min(pose.t,11)/11*Math.PI)*.3;
  camera.position.lerpVectors(origin,finish,pose.reveal);camera.position.x+=pre*(1-pose.reveal);
  target.set(mix(.15,0,pose.reveal),mix(14.5,17,pose.reveal),mix(0,-10,pose.reveal));
  camera.fov=mix(43,42,pose.reveal)+(mobile?1.5:0);camera.updateProjectionMatrix();camera.lookAt(target);
  boat.position.set(22-pose.t*.24,-.05,26);boat.rotation.y=-.08;
 }
 function tuple(node){node.getWorldPosition(framePoint);return [framePoint.x,framePoint.y,framePoint.z].map(n=>+n.toFixed(6));}
 function endpointError(rec){
  // Read back the rendered float32 instance matrices, including their tiny quantization error.
  const {drawMesh,drawIndex}=rec.line.userData;drawMesh.getMatrixAt(drawIndex,renderedMatrix);
  renderedMatrix.premultiply(drawMesh.matrixWorld);
  endA.set(0,-.5,0).applyMatrix4(renderedMatrix);endB.set(0,.5,0).applyMatrix4(renderedMatrix);
  rec.a.getWorldPosition(a);rec.b.getWorldPosition(b);
  return Math.max(endA.distanceTo(a),endB.distanceTo(b));
 }
 function state(){
  const box=sectionBounds.clone().applyMatrix4(section.matrixWorld);
  let footGap=0,footEdgeClearance=Infinity;
  const feet=[];
  for(const worker of workers)for(const foot of worker.feet){
   scratch.set(0,-1,0).applyMatrix4(foot.matrixWorld);footGap=Math.max(footGap,Math.abs(scratch.y-DECK.top));
   footEdgeClearance=Math.min(footEdgeClearance,Math.abs(scratch.x)-foot.scale.x-DECK.fixedEdge);feet.push([scratch.x,scratch.y,scratch.z]);
  }
  const bearingGaps=bearingContacts.map(r=>{r.moving.getWorldPosition(a);r.fixed.getWorldPosition(b);return a.y-b.y;});
  const attachmentError=Math.max(...allLines.map(endpointError));
  return {
   phase:pose.phase,sectionSeated:pose.t>=BEATS.touchdown,cameraReveal:pose.reveal,sectionHeight:pose.height,
   leftDeckClearance:box.min.x+DECK.fixedEdge,rightDeckClearance:DECK.fixedEdge-box.max.x,
   bearingGaps,bearingPenetration:Math.max(0,-Math.min(...bearingGaps)),
   guideAttachmentError:Math.max(...guideRecords.map(endpointError)),rigAttachmentError:attachmentError,
   maxFootSurfaceError:footGap,minFootEdgeClearance:footEdgeClearance,
   sectionBounds:{min:box.min.toArray(),max:box.max.toArray()},
   anchors:{guideRoadway:guideRecords.map(r=>tuple(r.a)),guideHands:guideRecords.map(r=>tuple(r.b)),
    slingRoadway:slingRecords.map(r=>tuple(r.a)),slingSpreader:slingRecords.map(r=>tuple(r.b)),
    hoistHeads:hoistRecords.map(r=>tuple(r.a)),hoistBlocks:hoistRecords.map(r=>tuple(r.b)),
    bearingRoadway:bearingContacts.map(r=>tuple(r.moving)),bearingSeats:bearingContacts.map(r=>tuple(r.fixed)),feet},
   structuralInstances:fixed.instanceCount+moving.instanceCount+tackle.instanceCount,
   workerAndRigInstances:live.instanceCount,
   instancedDrawGroups:fixed.meshes.length+moving.meshes.length+tackle.meshes.length+live.meshes.length+buildings.meshes.length+boatDraw.meshes.length,
   sunDirection:sun.position.toArray(),waterHighlights:'actual directional light BRDF; no painted glitter',
   historicalTreatment:'original period-inspired illustration; construction equipment and sequence are not an archival reconstruction',
  };
 }
 update(0);return {update,state};
}});
