import {TAU,clamp,lerp,smooth,smoother,ease,add,sub,mul,dot,len,norm,mix3,rotZ,rotY,twoBone} from './math.js';
export const DURATION=20,SLOPE=.285,RADIUS=2.05,LOW=-5.5,HIGH=5.05;
export const ground=x=>1.32+SLOPE*(x+7.8);
export const PERIOD={release:3.8,handsFree:4.25,sideStart:4.25,clear:6.95,follow:9.1,stop:10.65,downhill:13.9,arrive:16.6,rejoin:17.3};
export const ASIDE=3.90;
const UP=norm([-SLOPE,1,0]),DEPTH=.72,ROCK_Z=.90,ROOT_Z=.97;
const facets=[[.30,.20,.932,.968],[-.46,.64,.615,.971],[.60,-.30,.742,.975],[-.13,-.64,.758,.965]];
export function rockRadius(v){const n=norm(v);let radius=RADIUS*(1+.027*Math.sin(n[0]*5.3+n[1]*2.2)*Math.sin(n[2]*4.1-n[1]*2.4)+.013*Math.sin(n[0]*11+n[2]*6)*Math.sin(n[1]*9));for(const f of facets){const d=n[0]*f[0]+n[1]*f[1]+n[2]*f[2];if(d>.8)radius=Math.min(radius,RADIUS*f[3]/d)}return radius;}
export function rockVertex(n){return mul(n,rockRadius(n));}
const supportSamples=[];for(let i=0;i<1024;i++){const a=i*TAU/1024;supportSamples.push(rockVertex([Math.cos(a),Math.sin(a),0]))}
function support(theta){let v=Infinity;for(const p of supportSamples)v=Math.min(v,dot(UP,rotZ(p,theta)));return v;}
function travel(t){if(t<PERIOD.release||t>=PERIOD.rejoin){const tt=t<PERIOD.release?t+20:t;return lerp(LOW,HIGH,smoother((tt-PERIOD.rejoin)/(20+PERIOD.release-PERIOD.rejoin)))}if(t<PERIOD.stop)return lerp(HIGH,LOW,ease(t,PERIOD.release,PERIOD.stop));return LOW;}
export function boulderAt(t){
 t=((t%20)+20)%20;const x=travel(t),theta=-(x-LOW)*Math.sqrt(1+SLOPE*SLOPE)/RADIUS;
 const rolling=t>PERIOD.release&&t<PERIOD.stop;
 // Very low hops at authored impacts: clear of the slope, never penetrating it.
 let lift=0;if(rolling)for(const [a,b,h]of[[7.30,7.65,.055],[8.45,8.83,.085],[9.65,10.00,.045]]){if(t>a&&t<b)lift+=Math.sin(Math.PI*(t-a)/(b-a))**2*h;}
 const y=ground(x)-support(theta)*Math.sqrt(1+SLOPE*SLOPE)+lift;
 return {x,y,z:ROCK_Z,theta,lift,rolling,center:[x,y,ROCK_Z],supportGap:lift/Math.sqrt(1+SLOPE*SLOPE)};
}
function contact(rock,side){
 const direction=norm([-1,-.045,side===0?.36:-.08]);
 const local=rotZ(direction,-rock.theta),p=rotZ(rockVertex(local),rock.theta);p[2]*=DEPTH;
 return add(rock.center,p);
}
// A stance foot has a constant world-space anchor. Only the swing portion travels.
function gaitFoot(distance,start,direction,side,stride=1.055){
 const phase=side*.5,c=distance/stride+phase,k=Math.floor(c+1e-9),u=c-k,stance=.66;
 const swing=u>stance?smoother((u-stance)/(1-stance)):0;
 const x=start+direction*((k-phase+.30+swing)*stride),lift=u>stance?.24*Math.sin(Math.PI*(u-stance)/(1-stance))**2:0;
 return {position:[x,ground(x)+.12+lift,ROOT_Z+(side===0?.31:-.31)],stance:u<=stance,lift,cycle:k,side};
}
function pushBase(t){const b=boulderAt(t),hipX=b.x-3.7,dist=b.x-LOW;return{hipX,heading:0,push:1,hipHeight:1.77,feet:[0,1].map(s=>gaitFoot(dist,LOW-3.7,1,s)),rock:b};}
const summit=pushBase(PERIOD.release-1e-8),bottom=pushBase(PERIOD.rejoin);
const summitFeet=summit.feet.map(f=>f.position.slice());
const sideFeet=summitFeet.map(p=>add(p,[0,0,ASIDE]));
const bottomSideFeet=bottom.feet.map(f=>add(f.position,[0,0,ASIDE]));
// Smooth acceleration to a steady walking speed, then smooth deceleration.
function cruise(u){u=clamp(u);const a=.2,v=1/(1-a),integral=x=>x**3-.5*x**4;if(u<a)return v*a*integral(u/a);if(u>1-a)return 1-v*a*integral((1-u)/a);return v*(u-a*.5);}
// Alternating planted steps. Feet remain fixed between swing windows, including pauses.
function steppedFeet(t,a,b,from,to,count,lift=.18){
 const slot=(b-a)/count;
 return from.map((start,side)=>{
  let p=start.slice(),swing=0,stance=true;
  for(let k=side;k<count;k+=2){const u=clamp((t-(a+k*slot))/(slot*.88)),n=(k-side)/2+1,total=count/2,end=mix3(start,to[side],cruise(n/total));if(u===0)break;const next=mix3(p,end,smoother(u));swing=lift*Math.sin(Math.PI*u)**2;next[1]=ground(next[0])+.12+swing;p=next;if(u<1){stance=false;break}}
  return{position:p,stance,lift:swing,side};
 });
}
const returnHeading=-Math.PI;
function recoveryBase(t){
 let feet=t<PERIOD.follow?steppedFeet(t,PERIOD.sideStart,PERIOD.clear,summitFeet,sideFeet,6):t<PERIOD.downhill?steppedFeet(t,PERIOD.follow,PERIOD.downhill,sideFeet,bottomSideFeet,14,.21):steppedFeet(t,PERIOD.downhill,PERIOD.arrive,bottomSideFeet,bottom.feet.map(f=>f.position),6);
 // Smooth center follows the route; stance anchors are independent, preventing sliding.
 const aside=cruise((t-PERIOD.sideStart)/(PERIOD.clear-PERIOD.sideStart)),down=cruise((t-PERIOD.follow)/(PERIOD.downhill-PERIOD.follow)),back=cruise((t-PERIOD.downhill)/(PERIOD.arrive-PERIOD.downhill));
 const hipX=lerp(summit.hipX,bottom.hipX,down),hipZ=ROOT_Z+ASIDE*aside*(1-back);
 let heading=-Math.PI/2*ease(t,3.9,4.65);
 heading=lerp(heading,returnHeading,ease(t,7.05,8.65));
 heading=lerp(heading,-Math.PI*1.5,ease(t,13.4,14.35));
 heading=lerp(heading,-TAU,ease(t,PERIOD.arrive,PERIOD.rejoin));
 const push=1-ease(t,PERIOD.release,PERIOD.handsFree)+ease(t,PERIOD.arrive,PERIOD.rejoin);
 return{hipX,hipZ,heading,push,hipHeight:lerp(1.88,1.77,push),feet,rock:boulderAt(t)};
}
export function poseAt(time){
 const t=((time%20)+20)%20;let q;
 if(t<PERIOD.release||t>=PERIOD.rejoin)q=pushBase(t);
 else q=recoveryBase(t);
 const groundY=ground(q.hipX),breath=.009*Math.sin(TAU*t*.5)*q.push;
 const pelvis=[q.hipX,groundY+q.hipHeight+breath,q.hipZ??ROOT_Z];
 // Lower the pelvis during a wide sidestep rather than stretching either shin.
 for(let i=0;i<2;i++){const o=rotY([0,-.01,i===0?.26:-.26],q.heading),f=q.feet[i].position,horizontal=(pelvis[0]+o[0]-f[0])**2+(pelvis[2]+o[2]-f[2])**2,limit=f[1]-o[1]+Math.sqrt(Math.max(.01,1.99**2-horizontal)),k=.055,h=Math.max(k-Math.abs(pelvis[1]-limit),0)/k;pelvis[1]=Math.min(pelvis[1],limit)-h*h*k*.25;}
 const lean=lerp(.055,.53,q.push);
 const basis=v=>rotY(rotZ(v,-lean),q.heading);
 const spine=add(pelvis,basis([.03,.62,0]));
 const chest=add(pelvis,basis([.025,1.25,0]));
 const neck=add(pelvis,basis([.03,1.54,0]));
 const head=add(neck,rotY([.10,.33,0],q.heading));
 const shoulders=[0,1].map(i=>add(chest,rotY([0,-.02,i===0?.39:-.39],q.heading)));
 const hips=[0,1].map(i=>add(pelvis,rotY([0,-.01,i===0?.26:-.26],q.heading)));
 const hands=[],wrists=[],elbows=[],knees=[],ankles=[],contacts=[];
 const weight=t<PERIOD.release||t>=PERIOD.rejoin?1:t<PERIOD.handsFree?1-ease(t,PERIOD.release,PERIOD.handsFree):ease(t,PERIOD.arrive,PERIOD.rejoin);
 // During release, hands withdraw from the original summit contact; the falling rock is free.
 const holdRock=t<PERIOD.handsFree?boulderAt(PERIOD.release):q.rock;
 for(let i=0;i<2;i++){
  const c=contact((t<PERIOD.release||t>=PERIOD.rejoin)?q.rock:holdRock,i);contacts.push(c);
  const swing=Math.sin((q.hipX-LOW)*5+i*Math.PI)*.24;
  const free=add(pelvis,rotY([swing+.16,-.02,i===0?.47:-.47],q.heading));
  const hand=mix3(free,c,weight);hands.push(hand);
  const wrist=sub(hand,rotY([.35,.045,0],q.heading));wrists.push(wrist);
  elbows.push(twoBone(shoulders[i],wrist,.76,.74,rotY([-.7,-.6,i===0?.25:-.15],q.heading)));
  const ankle=q.feet[i].position;ankles.push(ankle);
  knees.push(twoBone(hips[i],ankle,1.02,1.03,rotY([1,.1,0],q.heading)));
 }
 return{t,...q,pelvis,spine,chest,neck,head,shoulders,hips,hands,wrists,elbows,knees,ankles,contacts,contactWeight:weight,phase:t<PERIOD.release?'pushing near summit':t<PERIOD.handsFree?'release and withdraw hands':t<PERIOD.clear?'step clear of the rolling lane':t<PERIOD.follow?'wait safely while the boulder passes':t<PERIOD.arrive?'follow behind the boulder':t<PERIOD.rejoin?'turn and take the weight':'pushing again'};
}
