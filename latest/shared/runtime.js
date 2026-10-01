import * as THREE from 'three/webgpu';
import * as TSL from 'three/tsl';
export {THREE,TSL};
export const TAU=Math.PI*2,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
export const smooth=t=>{t=clamp(t);return t*t*(3-2*t)},ease=(t,a,b)=>smooth((t-a)/(b-a));
export const rng=s=>()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);
export const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
export const clock=TSL.uniform(0);
const materials=new Map();
export function paint(hex,{kind='paint',roughness=.84,metalness=0,bump=.012}={}){
 const key=[hex,kind,roughness,metalness,bump].join('/');if(materials.has(key))return materials.get(key);
 const p=TSL.positionLocal;
 const fine=TSL.sin(p.x.mul(117).add(TSL.sin(p.z.mul(31)))).mul(TSL.sin(p.y.mul(103).add(p.z.mul(87))));
 const broad=TSL.sin(p.x.mul(3.7).add(TSL.sin(p.z.mul(4.1)))).mul(TSL.sin(p.y.mul(5.3).add(p.z.mul(2.3))));
 let variation=broad.mul(.06).add(fine.mul(.025)).add(.96);
 if(kind==='stone')variation=broad.mul(.09).add(fine.mul(.055)).add(.91);
 if(kind==='wood')variation=TSL.sin(p.y.mul(4).add(TSL.sin(p.x.mul(21)).mul(3)).add(p.z.mul(32))).mul(.065).add(fine.mul(.03)).add(.92);
 if(kind==='clay')variation=TSL.sin(p.y.mul(190)).mul(.017).add(fine.mul(.02)).add(broad.mul(.06)).add(.94);
 if(kind==='fur')variation=TSL.sin(p.y.mul(170).add(TSL.sin(p.x.mul(43)).mul(3))).mul(.018).add(broad.mul(.05)).add(.98);
 const m=new THREE.MeshStandardNodeMaterial({roughness,metalness});m.colorNode=TSL.color(hex).mul(variation);m.roughnessNode=TSL.float(roughness).add(fine.mul(.025));
 if(bump)m.normalNode=TSL.bumpMap(fine.mul(.018).add(broad.mul(.08)),TSL.float(bump));
 m.userData={tsl:true,role:kind};materials.set(key,m);return m;
}
export function flat(hex,opacity=1){const m=new THREE.MeshBasicNodeMaterial({transparent:opacity<1,opacity,depthWrite:opacity===1});m.colorNode=TSL.color(hex);m.userData.tsl=true;return m;}
export function mesh(parent,geo,mat,x=0,y=0,z=0){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
const sphereGeo=new THREE.SphereGeometry(1,24,16),boxGeo=new THREE.BoxGeometry(1,1,1),cylGeo=new THREE.CylinderGeometry(1,1,1,12);
export function ell(parent,mat,x,y,z,sx,sy,sz){const m=mesh(parent,sphereGeo,mat,x,y,z);m.scale.set(sx,sy,sz);return m;}
export function box(parent,mat,x,y,z,sx,sy,sz){const m=mesh(parent,boxGeo,mat,x,y,z);m.scale.set(sx,sy,sz);return m;}
export function cylinder(parent,mat,x,y,z,r,h,segments=16,top=r){return mesh(parent,new THREE.CylinderGeometry(top,r,h,segments),mat,x,y,z);}
export function segment(parent,mat,a,b,r=.04,r2=r){const aa=Array.isArray(a)?V(...a):a,bb=Array.isArray(b)?V(...b):b;const m=mesh(parent,r===r2?cylGeo:new THREE.CylinderGeometry(r2/r,1,1,12),mat);m.position.copy(aa).add(bb).multiplyScalar(.5);m.quaternion.setFromUnitVectors(V(0,1,0),bb.clone().sub(aa).normalize());m.scale.set(r,aa.distanceTo(bb),r);return m;}
export function moveSegment(m,a,b,r){a=Array.isArray(a)?V(...a):a;b=Array.isArray(b)?V(...b):b;m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize());m.scale.set(r,a.distanceTo(b),r);}
export function tube(parent,mat,points,r=.035,closed=false){const curve=new THREE.CatmullRomCurve3(points.map(p=>Array.isArray(p)?V(...p):p),closed);return mesh(parent,new THREE.TubeGeometry(curve,Math.max(12,points.length*5),r,6,closed),mat);}
export function ring(parent,mat,r,thickness,x,y,z,rx=Math.PI/2){let m=mesh(parent,new THREE.TorusGeometry(r,thickness,8,72),mat,x,y,z);m.rotation.x=rx;return m;}
export function shapeMesh(parent,mat,pts,depth=.15,z=0){let s=new THREE.Shape();pts.forEach((p,i)=>i?s.lineTo(...p):s.moveTo(...p));s.closePath();return mesh(parent,new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false}),mat,0,0,z);}
export function batch(parent,geo,mat,transforms,shadow=true){const m=new THREE.InstancedMesh(geo,mat,transforms.length),o=new THREE.Object3D();for(let i=0;i<transforms.length;i++){const t=transforms[i];o.position.set(...t.p);o.scale.set(...(t.s||[1,1,1]));o.rotation.set(...(t.r||[0,0,0]));o.updateMatrix();m.setMatrixAt(i,o.matrix);if(t.c)m.setColorAt(i,new THREE.Color(t.c))}m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m;}
export function sky(scene,low='#f6d9a0',high='#839f9b'){
 const m=new THREE.MeshBasicNodeMaterial({side:THREE.BackSide,depthWrite:false,fog:false});m.colorNode=TSL.mix(TSL.color(low),TSL.color(high),TSL.smoothstep(-.2,.35,TSL.positionLocal.y.div(500)));const s=mesh(scene,new THREE.SphereGeometry(500,24,16),m);s.castShadow=s.receiveShadow=false;return s;
}
export function water(parent,w=160,h=160,y=0){
 const p=TSL.positionLocal,t=clock;
 const wave=TSL.sin(p.x.mul(1.2).add(p.y.mul(.45)).add(t.mul(1.2))).mul(.12).add(TSL.sin(p.y.mul(3.4).sub(t.mul(1.8))).mul(.045));
 const glint=TSL.pow(TSL.sin(p.x.mul(4.8).add(p.y.mul(7.8)).add(t.mul(1.4))).mul(TSL.sin(p.y.mul(3.2).sub(p.x.mul(2.7)))).mul(.5).add(.5),38);
 const m=new THREE.MeshStandardNodeMaterial({metalness:.15,roughness:.38});m.colorNode=TSL.mix(TSL.color('#1c687b'),TSL.color('#94c0ad'),wave.add(.2).mul(.35)).add(TSL.color('#edca88').mul(glint.mul(.35)));m.normalNode=TSL.bumpMap(wave,TSL.float(.06));m.positionNode=p.add(TSL.vec3(0,0,wave.mul(.14)));m.userData={tsl:true,role:'animated wave displacement, normals and glints'};
 const s=mesh(parent,new THREE.PlaneGeometry(w,h,70,70),m,0,y,0);s.rotation.x=-Math.PI/2;s.castShadow=false;return s;
}
export function human(parent,{skin='#d9a67d',cloth='#c9d2bb',scale=1,stone=false}={}){
 const g=new THREE.Group();parent.add(g);g.scale.setScalar(scale);const skinMat=paint(skin,{kind:stone?'stone':'paint'}),coat=paint(cloth,{kind:stone?'stone':'paint'}),dark=stone?coat:paint('#3d4543');
 const pelvis=ell(g,coat,0,.92,0,.23,.2,.17),torso=ell(g,coat,0,1.28,0,.29,.38,.17),head=ell(g,skinMat,.02,1.82,0,.17,.22,.18);ell(g,skinMat,.14,1.81,.14,.055,.065,.07);
 const limbs=[];for(let i=0;i<8;i++)limbs.push(segment(g,i<4?dark:skinMat,[0,0,0],[0,1,0],i<4?.085:.065));
 const hands=[ell(g,skinMat,0,0,0,.08,.1,.07),ell(g,skinMat,0,0,0,.08,.1,.07)];
 const feet=[ell(g,dark,0,0,0,.17,.075,.12),ell(g,dark,0,0,0,.17,.075,.12)];
 function pose(phase=0,push=0){
  torso.rotation.z=-.28*push;head.position.x=.02+.18*push;
  for(let s=0;s<2;s++){let k=s?1:-1,z=k*.13,a=Math.sin(phase+s*Math.PI),hip=[k*.13,.94,z],knee=[k*.12+a*.19,.48+Math.max(0,-a)*.1,z],foot=[k*.14-a*.22,.09+Math.max(0,a)*.1,z];moveSegment(limbs[s*2],hip,knee,.085);moveSegment(limbs[s*2+1],knee,foot,.07);feet[s].position.set(...foot);
   const shoulder=[.08*push,1.52,z*1.6],elbow=[mix(-a*.24,.5,push),mix(1.12,1.42,push),z*2],hand=[mix(a*.14,.92,push),mix(.95,1.65,push),z*1.8];moveSegment(limbs[4+s*2],shoulder,elbow,.065);moveSegment(limbs[5+s*2],elbow,hand,.055);hands[s].position.set(...hand);
  }
 }
 pose();return {g,pose,head,torso,pelvis,limbs,hands,feet,skinMat,coat};
}
export async function start({title,background='#cdbb92',loop=false,shadows=true,setup}){
 const params=new URLSearchParams(location.search),forced=params.get('backend')==='webgl',mobile=params.get('quality')==='mobile'||innerWidth<700;
 const renderer=new THREE.WebGPURenderer({antialias:true,forceWebGL:forced,alpha:false,trackTimestamp:params.has('profile')});renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1:1.5));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;renderer.shadowMap.enabled=shadows;renderer.shadowMap.type=THREE.PCFShadowMap;
 document.body.appendChild(renderer.domElement);renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label',title+' - twenty-second procedural Three.js and TSL animation');
 await renderer.init();const scene=new THREE.Scene();scene.background=new THREE.Color(background);
 const camera=new THREE.PerspectiveCamera(40,16/9,.1,800);
 const ambient=new THREE.HemisphereLight('#fff0cf','#5d6a70',2);scene.add(ambient);
 const sun=new THREE.DirectionalLight('#ffe4b4',3.1);sun.position.set(-8,15,10);sun.castShadow=shadows;sun.shadow.mapSize.set(mobile?1024:2048,mobile?1024:2048);Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:.5,far:180});sun.shadow.bias=-.0004;sun.shadow.normalBias=.035;scene.add(sun);scene.add(sun.target);
 const fill=new THREE.DirectionalLight('#b8dfe6',1);fill.position.set(8,8,-12);scene.add(fill);
 const app={scene,camera,renderer,sun,ambient,fill,clock,quality:mobile?'mobile':'desktop',mobile};const spec=await setup(app);
 let time=0,manual=params.has('manual')?0:null,origin=null,paused=null,lastDraw=-Infinity,lastStats={},frameTimes=[],drawSamples=[],rafTimes=[],rafLast=null,nextDraw=0,ended=false;
 const boundedPush=(a,value)=>{a.push(value);if(a.length>5000)a.shift()};
 function resize(){let w=innerWidth,h=innerHeight;if(w/h>16/9)w=h*16/9;else h=w*9/16;const cap=mobile?900000:2100000,dpr=Math.min(devicePixelRatio,mobile?1:1.5,Math.sqrt(cap/(w*h)));renderer.setPixelRatio(dpr);renderer.setSize(Math.round(w),Math.round(h));camera.aspect=w/h;camera.updateProjectionMatrix();}
 function update(t){time=loop?((t%20)+20)%20:clamp(t,0,20);clock.value=time;spec.update(time);scene.updateMatrixWorld(true);}
 function draw(t){const begin=performance.now();update(t);renderer.info.reset();renderer.render(scene,camera);lastStats={cpuSubmitMs:performance.now()-begin,render:JSON.parse(JSON.stringify(renderer.info.render)),memory:JSON.parse(JSON.stringify(renderer.info.memory))};boundedPush(drawSamples,{time,cpuMs:lastStats.cpuSubmitMs});}
 resize();update(0);await renderer.compileAsync(scene,camera);draw(0);
 let meshes=0,triangles=0,nodeMaterials=new Set();scene.traverse(o=>{if(o.isMesh){meshes++;const n=o.geometry.index?.count||o.geometry.attributes.position.count;triangles+=n/3*(o.count||1);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.isNodeMaterial)nodeMaterials.add(m)}});
 window.__sceneInfo={title,generation:4,modelRequested:'gpt-6-astra',reasoningEffortRequested:'xhigh',threeVersion:'0.186.1',threeRevision:THREE.REVISION,renderer:'WebGPURenderer',backend:renderer.backend.isWebGPUBackend?'WebGPU':'WebGL 2',forcedWebGL:forced,loop,duration:20,meshes,triangles:Math.round(triangles),nodeMaterials:nodeMaterials.size,artwork:'original procedural geometry and TSL',externalAssets:0,quality:mobile?'mobile':'desktop',targetFps:mobile?30:60};
 window.__renderAt=async t=>{manual=t;draw(t);if(renderer.backend.isWebGPUBackend)await renderer.backend.device.queue.onSubmittedWorkDone()};
 window.__resume=()=>{manual=null;origin=null;ended=false;lastDraw=-Infinity;frameTimes=[];drawSamples=[];rafTimes=[];rafLast=null;nextDraw=0};
 window.__state=()=>({time,...spec.state?.(time),cpuSubmitMs:lastStats.cpuSubmitMs,render:lastStats.render,memory:lastStats.memory,calls:lastStats.render?.drawCalls,triangles:lastStats.render?.triangles});
 window.__renderer=renderer;window.__scene=scene;window.__camera=camera;window.__frameTimes=()=>frameTimes;window.__drawSamples=()=>drawSamples;window.__rafTimes=()=>rafTimes;
 renderer.setAnimationLoop(now=>{if(manual!==null||document.hidden||ended)return;if(rafLast!==null)boundedPush(rafTimes,now-rafLast);rafLast=now;if(origin===null){origin=now;nextDraw=now}const interval=1000/(mobile?30:60);if(now+.4<nextDraw)return;if(lastDraw!==-Infinity)boundedPush(frameTimes,now-lastDraw);lastDraw=now;nextDraw+=interval;if(nextDraw<now-interval)nextDraw=now+interval;const t=(now-origin)/1000;draw(t);if(!loop&&t>=20)ended=true;});
 addEventListener('resize',()=>{resize();draw(time)});document.addEventListener('visibilitychange',()=>{if(document.hidden)paused=performance.now();else if(paused!==null){if(origin!==null)origin+=performance.now()-paused;paused=null;lastDraw=-Infinity;nextDraw=performance.now();rafLast=null}});
 window.__ready=true;return app;
}
