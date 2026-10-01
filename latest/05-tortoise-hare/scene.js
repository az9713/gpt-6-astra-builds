import {THREE,start,V} from '../shared/runtime.js';
import {makeTortoise,makeHare,placeBone,kneePoint} from './anatomy.js';
import {makeWoodland} from './woodland.js';
import {pose,tortoiseFoot,hareFoot,state,ease,mix,clamp,FINISH_X} from './motion.js';

await start({title:'Slowly Wins the Day — A Woodland Race',background:'#b8c29a',loop:false,setup(app){
  const {scene,camera,sun,ambient,fill}=app;
  const environment=makeWoodland(scene,{mobile:app.mobile});
  sun.position.set(-5,10,7);sun.color.set('#ffe4b8');sun.intensity=2.65;
  ambient.color.set('#eee6d3');ambient.groundColor.set('#64735c');ambient.intensity=.70;
  fill.position.set(5,7,-4);fill.color.set('#b7d0bc');fill.intensity=.65;
  if(app.renderer)app.renderer.toneMappingExposure=1.03;
  Object.assign(sun.shadow.camera,{left:-11,right:11,top:9,bottom:-8,near:.5,far:45});sun.shadow.normalBias=.016;sun.shadow.bias=-.00025;
  const tort=makeTortoise(scene),hare=makeHare(scene);
  camera.fov=39;camera.updateProjectionMatrix();
  const tortProbe=V(),hareProbe=V(),feetProbe=V();
  let current=pose(0);
  function bodyPoint(x,y,z,p) {return [Math.cos(p.lean)*x-Math.sin(p.lean)*y,p.hipY+Math.sin(p.lean)*x+Math.cos(p.lean)*y,z];}
  function update(t) {
    const p=pose(t);current=p;
    tort.root.position.x=p.tx;
    const satisfaction=ease(t,15.25,17.4),settled=1-ease(t,18.4,19.15);
    tort.head.position.y=.82+Math.sin(t*3.2)*.012*settled+satisfaction*.018;
    tort.head.rotation.set(0,satisfaction*(.25-.14*ease(t,18,19.1)),satisfaction*.028);
    tort.eyes.forEach(({eye,pupil})=>{eye.scale.y=.112*(1-satisfaction*.16);pupil.scale.y=.064*(1-satisfaction*.14);});
    tort.legs.forEach((leg,i)=>{
      const foot=tortoiseFoot(t,i),side=i%2?1:-1,fx=foot.x-p.tx;
      const hip=[i<2?-.66:.64,.53,side*.54],knee=[mix(hip[0],fx,.4)-.035,.26+Math.max(0,foot.y-.11)*.35,side*.67],ankle=[fx-.055,foot.y+.045,side*.65];
      placeBone(leg.upper,hip,knee);placeBone(leg.lower,knee,ankle);leg.foot.position.set(fx,foot.y,side*.65);
    });
    hare.root.position.x=p.hx;
    hare.body.position.set(0,p.hipY,0);hare.body.rotation.z=p.lean;
    hare.head.rotation.z=.98*(1-p.rise)-.14*p.exhausted;
    hare.head.rotation.y=-.04*p.shocked+.08*p.smile;
    const eyeOpen=mix(.015,1,p.wake)+p.shocked*.28-p.running*.18-p.exhausted*.20;
    hare.eyes.forEach(({eye,pupil,glint,brow,lid},i)=>{
      eye.scale.y=.155*eyeOpen;pupil.scale.y=.10*eyeOpen;glint.visible=p.wake>.45;
      pupil.position.x=.123+.023*p.shocked+.012*p.running;
      glint.position.x=pupil.position.x+.009;
      brow.position.y=.318+.066*p.shocked-.052*p.running-.005*p.exhausted;
      brow.rotation.z=-.27*p.running+.22*p.exhausted;
      lid.visible=p.wake<.30;lid.scale.y=1;
    });
    hare.mouth.scale.set(1,mix(.22,1,p.wake)+p.shocked*2.6+p.exhausted*.65,1);
    hare.ears.forEach(({pivot,tip},i)=>{
      const twitch=Math.sin((t-4.7)*19)*ease(t,4.75,5.05)*(1-ease(t,5.2,5.6));
      pivot.rotation.z=mix(i?1.27:.92,i?-.20:.12,p.wake)+p.running*(.53+Math.sin(t*13+i*.8)*.11)+p.exhausted*(i?.88:.36)+twitch*.12;
      pivot.rotation.x=(i?1:-1)*(.14+.09*p.shocked);
      tip.rotation.z=mix(.50,-.08,p.wake)+p.running*(.19+Math.sin(t*13+i*.8-.7)*.13)+p.exhausted*(i?.42:.19);
    });
    hare.legs.forEach((leg,i)=>{
      const foot=hareFoot(t,i),z=i?.24:-.24,fx=foot.x-p.hx;
      const hip=[-.085,p.hipY-.015,z],ankle=[fx-.12,foot.y+.065,z],knee=kneePoint(hip,ankle,.47);
      placeBone(leg.upper,hip,knee);placeBone(leg.lower,knee,ankle);leg.foot.position.set(fx,foot.y,z);
      leg.foot.rotation.z=0;
    });
    hare.arms.forEach((arm,i)=>{
      const z=i?.28:-.28,shoulder=bodyPoint(.07,.65,z,p),a=Math.sin((t-8.68)*Math.PI*2/.56+i*Math.PI);
      const napElbow=[.61,.44,z*1.15],napHand=[.91,.57,z*.62];
      const standingElbow=[.15-a*.18*p.running,1.12+Math.abs(a)*.04*p.running,z*1.28];
      const standingHand=[.32+a*.29*p.running,1.10+a*.09*p.running,z*1.28];
      const elbow=napElbow.map((v,k)=>mix(v,standingElbow[k],p.rise));
      const hand=napHand.map((v,k)=>mix(v,standingHand[k],p.rise));
      elbow[0]=mix(elbow[0],.38,p.shocked);elbow[1]=mix(elbow[1],1.23,p.shocked);
      hand[0]=mix(hand[0],.51,p.shocked);hand[1]=mix(hand[1],1.53,p.shocked);
      elbow[0]=mix(elbow[0],.37,p.exhausted);elbow[1]=mix(elbow[1],1.01,p.exhausted);
      hand[0]=mix(hand[0],.20,p.exhausted);hand[1]=mix(hand[1],.76,p.exhausted);
      placeBone(arm.upper,shoulder,elbow);placeBone(arm.lower,elbow,hand);arm.hand.position.set(...hand);arm.hand.rotation.z=-.35*p.running;
    });
    const pan=ease(t,7.5,16.5);
    camera.position.set(mix(-6.5,-3.1,pan),mix(6.8,6.1,pan),mix(12.6,11.4,pan));
    camera.lookAt(mix(-.65,2.0,pan),mix(1.05,1.2,pan),-.05);
  }
  return {update,state(t){
    const s=state(t);tort.nose.getWorldPosition(tortProbe);hare.nose.getWorldPosition(hareProbe);
    const actualFeet=[...tort.legs.map(l=>({mesh:l.foot,halfHeight:.10})),...hare.legs.map(l=>({mesh:l.foot,halfHeight:.095}))].map(({mesh,halfHeight})=>{mesh.getWorldPosition(feetProbe);return{x:feetProbe.x,y:feetProbe.y,z:feetProbe.z,soleY:feetProbe.y-halfHeight};});
    return {...s,phase:current.phase,actualTortoiseNose:tortProbe.toArray(),actualHareNose:hareProbe.toArray(),
      actualTortoiseAcross:tortProbe.x>=FINISH_X,actualHareAcross:hareProbe.x>=FINISH_X,
      actualFeet,actualLowestSoleY:Math.min(...actualFeet.map(f=>f.soleY)),
      contactMethod:'fixed world-space foot anchors during stance; curved swing trajectories',
      scutes:{vertebral:5,costal:8,marginal:24},environment};
  }};
}});
