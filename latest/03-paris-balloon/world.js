import { THREE, TSL, V, paint, flat, mesh, ell, sky, batch } from '../shared/runtime.js';
import { buildBalloon } from './balloon.js';
import { buildCity, buildCrowd } from './city.js';
import { flightAt } from './flight.js';
import { signedBoxClearance } from './geometry.js';

const rounded = value => Number(value.toFixed(6));

export function buildParisFlight({scene,camera,sun,ambient,fill}) {
  sky(scene,'#f4dbae','#8faeb9');
  scene.fog=new THREE.FogExp2('#d7d3b8',.0044);
  sun.position.set(-42,60,32);sun.intensity=3.1;
  ambient.intensity=1.75;if(fill)fill.intensity=.7;
  Object.assign(sun.shadow.camera,{left:-43,right:43,top:47,bottom:-35,near:.5,far:170});
  sun.shadow.normalBias=.025;
  const city=buildCity(scene),crowd=buildCrowd(scene),hero=buildBalloon(scene);
  const {assembly,attachments}=hero;

  // Thin, matte cloudbanks sit behind the skyline rather than in front of the hero.
  const cloudMat=flat('#e8debf');
  const clouds=[];
  for(let i=0;i<10;i++)clouds.push({p:[-130+i*28,32+(i%3)*4,-135-(i%2)*20],s:[20+(i%3)*4,1.8+(i%2),4.5]});
  batch(scene,new THREE.SphereGeometry(1,16,8),cloudMat,clouds,false);

  const assemblyBounds=new THREE.Box3(),anchorA=V(),anchorB=V(),ropeA=V(),ropeB=V();
  const ndc=V(),target=V(),sunTarget=V();
  let current=flightAt(0);
  function update(t) {
    current=flightAt(t);
    assembly.position.set(current.x,current.y,current.z);
    assembly.rotation.set(current.pitch,current.yaw,current.roll);
    hero.animate(current.t);crowd.animate(current.t);
    const a=current.cameraAngle,d=current.cameraDistance;
    camera.position.set(current.x+Math.sin(a)*d,current.y+7.35+8.2*current.reveal,current.z+Math.cos(a)*d);
    target.set(current.x,current.y+5.6,current.z-1.05*current.reveal);
    camera.lookAt(target);camera.updateMatrixWorld(true);
    // Keep the launch shadows and airborne rig in one continuous light frustum.
    sunTarget.set(current.x*.5,current.y*.48,10);
    sun.target.position.copy(sunTarget);
    sun.position.set(sunTarget.x-42,sunTarget.y+60,sunTarget.z+32);
  }

  function state() {
    assembly.updateWorldMatrix(true,true);
    assemblyBounds.setFromObject(assembly);
    let anchorMismatch=0;
    for(const {rope,basketAnchor,neckAnchor} of attachments) {
      rope.geometry.computeBoundingBox();
      const bound=rope.geometry.boundingBox;
      ropeA.set(0,bound.min.y,0).applyMatrix4(rope.matrixWorld);
      ropeB.set(0,bound.max.y,0).applyMatrix4(rope.matrixWorld);
      basketAnchor.getWorldPosition(anchorA);neckAnchor.getWorldPosition(anchorB);
      anchorMismatch=Math.max(anchorMismatch,ropeA.distanceTo(anchorA),ropeB.distanceTo(anchorB));
    }
    let clearance=Infinity,nearest='';
    for(const collider of city.colliders) {
      const distance=signedBoxClearance(assemblyBounds,collider.box);
      if(distance<clearance){clearance=distance;nearest=collider.label;}
    }
    const projected={left:Infinity,right:-Infinity,bottom:Infinity,top:-Infinity};
    for(const x of[assemblyBounds.min.x,assemblyBounds.max.x])
      for(const y of[assemblyBounds.min.y,assemblyBounds.max.y])
        for(const z of[assemblyBounds.min.z,assemblyBounds.max.z]) {
          ndc.set(x,y,z).project(camera);
          projected.left=Math.min(projected.left,ndc.x);projected.right=Math.max(projected.right,ndc.x);
          projected.bottom=Math.min(projected.bottom,ndc.y);projected.top=Math.max(projected.top,ndc.y);
        }
    return {
      phase:current.phase,height:rounded(current.y),cityReveal:rounded(current.reveal),
      assemblyPosition:assembly.position.toArray().map(rounded),
      anchorMismatch,attachmentCount:attachments.length,
      minimumObstacleClearance:rounded(clearance),nearestObstacle:nearest,
      assemblyGroundClearance:rounded(assemblyBounds.min.y),
      conservativeHeroScreenBounds:Object.fromEntries(Object.entries(projected).map(([k,v])=>[k,rounded(v)])),
      heroFullyInFrame:projected.left>=-1&&projected.right<=1&&projected.bottom>=-1&&projected.top<=1,
      buildingCount:city.buildingCount,crowdCount:crowd.count,
      cameraPosition:camera.position.toArray().map(rounded),cameraTarget:target.toArray().map(rounded),
      clearanceMethod:'transformed rendered-geometry AABBs, including roofs, cornices, dormers, chimneys, bridge and trees',
    };
  }
  update(0);
  return {update,state};
}
