// All positions are functions of absolute time. Contacts are authored in world space.
export const FINISH_X = 3.4;
export const DURATION = 20;
export const clamp = (x, a=0, b=1) => Math.max(a, Math.min(b, x));
export const smooth = x => { x=clamp(x); return x*x*(3-2*x); };
export const ease = (t,a,b) => smooth((t-a)/(b-a));
export const mix = (a,b,t) => a+(b-a)*t;
export const TORTOISE_NOSE = 1.59;
export const HARE_NOSE = .77;

export function tortoiseX(t) {
  if(t<=18.4) return -2.85+.33*t;
  const q=clamp((t-18.4)/1.1);
  return -2.85+.33*18.4+.33*1.1*(q-q*q*.5);
}
// Cubic Hermite segments preserve velocity through the acceleration and braking beats.
function hermite(t,a,b,x0,x1,v0,v1) {
  const q=clamp((t-a)/(b-a)), q2=q*q,q3=q2*q,d=b-a;
  return (2*q3-3*q2+1)*x0+(q3-2*q2+q)*d*v0+(-2*q3+3*q2)*x1+(q3-q2)*d*v1;
}
export function hareX(t) {
  if(t<=8.4) return -4.5;
  if(t<9.45) return hermite(t,8.4,9.45,-4.5,-3.891,0,1.18);
  if(t<14.4) return -3.891+(t-9.45)*1.18;
  return hermite(t,14.4,16.05,1.95,2.85,1.18,0);
}

export function tortoiseFoot(t,index) {
  const restX=index<2 ? -.67 : .65, side=index%2?1:-1;
  const period=1.5, stance=.72, offset=[0,.5,.5,0][index];
  const stop=19.5, gaitT=Math.min(t,stop), cycle=gaitT/period+offset;
  const k=Math.floor(cycle), f=cycle-k, td=(k-offset)*period;
  const anchor=tortoiseX(td)+restX+.18;
  if(f<stance || t>=stop) {
    // Final settling feet use the pose at stop, without resuming the cycle.
    if(t>=stop && f>=stance) {
      const u=(f-stance)/(1-stance), next=tortoiseX(td+period)+restX+.18;
      return {x:mix(anchor,next,smooth(u)),y:.11+Math.sin(Math.PI*u)*.12*(1-ease(t,stop,20)),z:.9+side*.65,stance:t>=20,anchor:mix(anchor,next,smooth(u))};
    }
    return {x:anchor,y:.11,z:.9+side*.65,stance:true,anchor};
  }
  const u=(f-stance)/(1-stance), next=tortoiseX(td+period)+restX+.18;
  return {x:mix(anchor,next,smooth(u)),y:.11+Math.sin(Math.PI*u)*.12,z:.9+side*.65,stance:false,anchor};
}

const hareContacts=[0,1].map(side=> {
  const contacts=[{time:-100,x:-4.5+(side?.05:-.34),end:8.4+side*.28}];
  for(let k=0;k<14;k++) {
    const time=8.68+side*.28+k*.56;
    if(time>16) break;
    const final=time+.56>16;
    contacts.push({time,x:final?2.85+(side?.17:-.25):hareX(time)+.18,end:final?100:time+.195});
  }
  return contacts;
});
export function hareFoot(t,side) {
  const list=hareContacts[side],z=-1.55+(side?.24:-.24);
  for(let i=0;i<list.length;i++) {
    const c=list[i], next=list[i+1];
    if(t<=c.end) return {x:c.x,y:.105,z,stance:true,anchor:c.x};
    if(next && t<next.time) {
      const u=(t-c.end)/(next.time-c.end);
      return {x:mix(c.x,next.x,smooth(u)),y:.105+Math.sin(Math.PI*u)*(.31+.045*Math.sin(u*Math.PI)),z,stance:false,anchor:c.x};
    }
  }
  const c=list.at(-1);return{x:c.x,y:.105,z,stance:true,anchor:c.x};
}

export function pose(t) {
  t=clamp(t,0,20);
  const wake=ease(t,5.3,6.6), rise=ease(t,6.45,7.65), launch=ease(t,8.15,9.4), brake=ease(t,14.05,16.15);
  const running=launch*(1-brake), shocked=ease(t,5.55,6.05)*(1-ease(t,7,8));
  const exhausted=ease(t,15.8,17.4), smile=ease(t,17,18.8);
  const bob=running*(.08+.07*Math.cos((t-8.68)*Math.PI*2/.28));
  return {t,tx:tortoiseX(t),hx:hareX(t),wake,rise,running,shocked,brake,exhausted,smile,
    hipY:mix(.43,.76,rise)-running*.13+bob,
    lean:mix(-1.10,0,rise)-running*.36-exhausted*.19,
    phase:t<5.3?'passing the sleeping hare':t<6.6?'ears hear the footsteps':t<7.65?'wide-eyed surprise':t<8.4?'determined crouch':t<14.18?'desperate sprint':t<14.7?'tortoise wins':t<16.15?'too late, braking':t<18.5?'catching breath and accepting it':'quiet satisfaction — held ending'};
}

function findCrossing(nose) {
  let lo=0,hi=20;for(let i=0;i<55;i++){const m=(lo+hi)/2;if(nose(m)>=FINISH_X)hi=m;else lo=m;}return hi;
}
export const TORTOISE_CROSSING = findCrossing(t=>tortoiseX(t)+TORTOISE_NOSE);
// Running head's forward tilt adds a measured offset; scene state also reports actual mesh noses.
export function hareNoseX(t) {
  const p=pose(t),headTurn=.98*(1-p.rise)-.14*p.exhausted;
  const localX=.10+Math.cos(headTurn)*HARE_NOSE,localY=.96+Math.sin(headTurn)*HARE_NOSE;
  return p.hx+Math.cos(p.lean)*localX-Math.sin(p.lean)*localY;
}
export const HARE_CROSSING = findCrossing(hareNoseX);

export function state(t) {
  const p=pose(t), tortoiseFeet=[0,1,2,3].map(i=>tortoiseFoot(t,i)),hareFeet=[0,1].map(i=>hareFoot(t,i));
  return {...p,finishX:FINISH_X,tortoiseNoseX:p.tx+TORTOISE_NOSE,hareNoseX:hareNoseX(t),
    tortoiseCrossing:TORTOISE_CROSSING,hareCrossing:HARE_CROSSING,finishLeadSeconds:HARE_CROSSING-TORTOISE_CROSSING,
    tortoiseAcross:p.tx+TORTOISE_NOSE>=FINISH_X,hareAcross:hareNoseX(t)>=FINISH_X,
    winner:'tortoise',tortoiseFeet,hareFeet,lowestFootSurface:Math.min(...tortoiseFeet.map(f=>f.y-.1),...hareFeet.map(f=>f.y-.095)),
    maxPlantedFootAnchorError:Math.max(...[...tortoiseFeet,...hareFeet].filter(f=>f.stance).map(f=>Math.abs(f.x-f.anchor))),
    heldEnding:t>=20};
}
