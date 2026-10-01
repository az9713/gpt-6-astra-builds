// Original, period-inspired staging. All motion is a pure function of absolute time.
export const DECK = Object.freeze({ top:12.16, bottom:10.25, halfLength:3.98, fixedEdge:4.24, width:7.2 });
export const BEATS = Object.freeze({ lower:0.6, alignment:6.6, touchdown:8.8, acknowledge:9.25, reveal:11, wide:19.4 });
const sat=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=sat(x);return x*x*(3-2*x);};
export const ramp=(t,a,b)=>smooth((t-a)/(b-a));
export function bridgePose(time){
 const t=Math.max(0,Math.min(20,time));
 const lower=ramp(t,BEATS.lower,BEATS.alignment), align=ramp(t,BEATS.alignment,BEATS.touchdown);
 const height=4.65*(1-lower)+.22*(1-align);
 const free=1-ramp(t,4.2,7.7), reveal=ramp(t,BEATS.reveal,BEATS.wide);
 return {t,height,roll:Math.sin(t*.82+.35)*.006*free,yaw:Math.sin(t*.61)*.009*free,
  sway:Math.sin(t*.77)*.105*free, lower,align,reveal,
  relax:ramp(t,BEATS.acknowledge,10.7),
  phase:t<BEATS.lower?'hold suspended':t<BEATS.alignment?'controlled descent':t<BEATS.touchdown?'align over bearings':t<BEATS.acknowledge?'seat on bearings':t<BEATS.reveal?'crew confirms seating':t<BEATS.wide?'reveal the bay':'completed bridge hold'};
}
