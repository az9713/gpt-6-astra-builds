import * as THREE from 'three/webgpu';
import {REST,BONES,boneEnds} from './anatomy.js';
import {ground} from './motion.js';
import {mesh,ell,tube,V,mergeMeshes} from './geometry.js';
export async function createFigure(scene,material,accent){
 const [manifest,buffer]=await Promise.all([fetch('./src/generated/sculpture.json').then(r=>r.json()),fetch('./src/generated/sculpture.bin').then(r=>r.arrayBuffer())]);
 const g=new THREE.BufferGeometry(),types={Float32Array,Uint16Array,Uint32Array};for(const[name,def]of Object.entries(manifest.attributes)){const a=new types[def.type](buffer,def.offset,def.length);if(name==='indices')g.setIndex(new THREE.BufferAttribute(a,1));else g.setAttribute(name==='positions'?'position':name==='normals'?'normal':name,new THREE.BufferAttribute(a,name==='skinIndex'||name==='skinWeight'?4:name==='cavity'?1:3));}
 const skin=new THREE.SkinnedMesh(g,material);skin.castShadow=skin.receiveShadow=true;skin.frustumCulled=false;scene.add(skin);
 const boneGroup=new THREE.Group();skin.add(boneGroup);const bones=BONES.map(def=>{const b=new THREE.Bone();b.position.copy(V(boneEnds(REST,def)[0]));boneGroup.add(b);return b});
 const skeleton=new THREE.Skeleton(bones);skin.bind(skeleton);
 const drapeGeo=new THREE.BufferGeometry(),positions=[],weights=[],ids=[],index=[],N=64,M=12;
 for(let j=0;j<=M;j++)for(let i=0;i<=N;i++){const a=i/N*Math.PI*2,v=j/M,fold=Math.cos(a*11+v*.28)*(.012+.027*v)+Math.cos(a*21-v)*.007;const rr=1+fold;positions.push(-.055+Math.cos(a)*(.27+.13*v)*rr,1.89-v*(.66+.08*Math.sin(a*3)),Math.sin(a)*(.365+.04*v)*rr);ids.push(0,10,11,0);weights.push(1-.22*v,Math.max(0,Math.sin(a))*.22*v,Math.max(0,-Math.sin(a))*.22*v,0);let sum=weights.slice(-4).reduce((a,b)=>a+b);for(let k=weights.length-4;k<weights.length;k++)weights[k]/=sum;if(j<M&&i<N){const k=j*(N+1)+i;index.push(k,k+N+1,k+1,k+1,k+N+1,k+N+2)}}
 for(let i=0;i<index.length;i+=3)[index[i+1],index[i+2]]=[index[i+2],index[i+1]];
 drapeGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));drapeGeo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(ids,4));drapeGeo.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));drapeGeo.setIndex(index);drapeGeo.computeVertexNormals();const cloth=new THREE.SkinnedMesh(drapeGeo,accent);cloth.castShadow=cloth.receiveShadow=true;cloth.frustumCulled=false;scene.add(cloth);cloth.bind(skeleton);
 // Shallow locks and brow details are modeled relief, following the head bone.
 const headDetails=new THREE.Group();bones[3].add(headDetails);headDetails.position.copy(V(REST.neck).multiplyScalar(-1));
 const cap=mesh(headDetails,new THREE.SphereGeometry(1,40,18,0,Math.PI*2,0,1.62),accent,[.025,3.87,0]);cap.scale.set(.253,.253,.253);
 for(let j=0;j<24;j++){const a=j*Math.PI*2/24,pts=[];for(let k=0;k<=9;k++){const th=.25+k/9*1.38,az=a+.17*Math.sin(th*2+j*.4),rr=.259+.006*Math.sin(th*10+j);pts.push([.025+rr*Math.sin(th)*Math.cos(az),3.87+rr*Math.cos(th),rr*Math.sin(th)*Math.sin(az)])}tube(headDetails,accent,pts,.012);}
 for(let side of[-1,1]){
  tube(headDetails,accent,[[.22,3.807,side*.208],[.295,3.822,side*.209],[.339,3.792,side*.191]],.013);
  ell(headDetails,accent,[.298,3.771,side*.195],[.023,.013,.013],12);
  for(let j=0;j<5;j++)tube(headDetails,accent,[[.30-j*.038,3.54,side*(.135+j*.007)],[.31-j*.035,3.43,side*(.132+j*.008)],[.24-j*.024,3.32+j*.012,side*.08]],.011);
 }
 for(let row=0;row<3;row++)for(let j=-2;j<=2;j++){const y=3.51-row*.063,z=j*.045,rr=Math.sqrt(Math.max(.06,1-((y-3.469)/.20)**2-(z/.18)**2)),x=.245+.179*rr;tube(headDetails,accent,[[x-.008,y+.029,z-.018],[x+.009,y,z],[x-.004,y-.025,z+.016]],.012);}
 // Static carved locks share one draw call while retaining their modeled grooves.
 mergeMeshes([...headDetails.children],accent,headDetails);
 const restDirs=BONES.map(def=>{const[a,b]=boneEnds(REST,def);return V(b).sub(V(a)).normalize()}),yaw=new THREE.Quaternion(),align=new THREE.Quaternion(),axis=new THREE.Vector3(0,1,0),tmp=new THREE.Vector3();
 function update(pose){pose.toes=pose.ankles.map(p=>{const x=p[0]+.39*Math.cos(pose.heading);return[x,p[1]+ground(x)-ground(p[0]),p[2]-.39*Math.sin(pose.heading)]});yaw.setFromAxisAngle(axis,pose.heading);for(let i=0;i<bones.length;i++){const[a,b]=boneEnds(pose,BONES[i]);bones[i].position.set(...a);tmp.copy(restDirs[i]).applyQuaternion(yaw);align.setFromUnitVectors(tmp,V(b).sub(V(a)).normalize());bones[i].quaternion.copy(align).multiply(yaw)}boneGroup.updateMatrixWorld(true);}
 return{skin,cloth,bones,update,manifest};
}
