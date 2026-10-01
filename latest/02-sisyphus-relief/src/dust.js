import * as THREE from 'three/webgpu';import * as TSL from 'three/tsl';
import {rng} from './math.js';import {boulderAt,ground} from './motion.js';
export function createDust(scene){
 const r=rng(5927),events=[{t:4.3,n:9},{t:7.65,n:20},{t:8.83,n:24},{t:10.00,n:20},{t:10.65,n:25}],seeds=[];
 for(const e of events){const b=boulderAt(e.t);for(let i=0;i<e.n;i++)seeds.push({birth:e.t+r()*.13,life:.75+r()*.85,x:b.x+(r()-.5)*.55,z:1.0+r()*1.3,vx:-.45-r()*.7,vy:.12+r()*.55,size:.075+r()*.16,spin:r()*6.28,alpha:.055+r()*.09});}
 const geo=new THREE.PlaneGeometry(1,1),opacity=new THREE.InstancedBufferAttribute(new Float32Array(seeds.length),1);geo.setAttribute('dustOpacity',opacity);
 const m=new THREE.MeshBasicNodeMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide});m.colorNode=TSL.color('#c9bda3');const d=TSL.length(TSL.uv().sub(.5));m.opacityNode=TSL.attribute('dustOpacity','float').mul(TSL.oneMinus(TSL.smoothstep(.08,.5,d)).pow(2));
 const dust=new THREE.InstancedMesh(geo,m,seeds.length);dust.frustumCulled=false;scene.add(dust);const o=new THREE.Object3D();
 const gritSeeds=seeds.filter((_,i)=>i%5===0),grit=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),new THREE.MeshStandardNodeMaterial({color:'#baac8e',roughness:.98}),gritSeeds.length);grit.castShadow=false;grit.receiveShadow=true;grit.frustumCulled=false;scene.add(grit);
 return{update(t,camera){for(let i=0;i<seeds.length;i++){const q=seeds[i],age=t-q.birth,u=age/q.life;if(u>0&&u<1){const x=q.x+q.vx*age;o.position.set(x,ground(q.x)+.04+q.vy*age+.09*age*age,q.z);o.scale.setScalar(q.size*(1+age*2.1));o.quaternion.copy(camera.quaternion);opacity.setX(i,q.alpha*Math.sin(Math.PI*u)*(1-u));}else{o.scale.setScalar(0);opacity.setX(i,0)}o.updateMatrix();dust.setMatrixAt(i,o.matrix);}dust.instanceMatrix.needsUpdate=true;opacity.needsUpdate=true;
 for(let i=0;i<gritSeeds.length;i++){const q=gritSeeds[i],a=t-q.birth;const x=q.x+q.vx*a*.5,y=ground(q.x)+.04+.9*a-2.5*a*a;if(a>0&&a<.5&&y>ground(x)){o.position.set(x,y,q.z);o.scale.setScalar(.018+q.size*.07);o.rotation.set(a*5,q.spin+a*4,a*3)}else o.scale.setScalar(0);o.updateMatrix();grit.setMatrixAt(i,o.matrix);}grit.instanceMatrix.needsUpdate=true;}};
}
