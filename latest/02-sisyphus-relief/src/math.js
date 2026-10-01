export const TAU=Math.PI*2;
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const lerp=(a,b,t)=>a+(b-a)*t;
export const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
export const smoother=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10)};
export const ease=(t,a,b)=>smoother((t-a)/(b-a));
export const add=(a,b)=>a.map((x,i)=>x+b[i]);
export const sub=(a,b)=>a.map((x,i)=>x-b[i]);
export const mul=(a,s)=>a.map(x=>x*s);
export const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
export const len=a=>Math.hypot(...a);
export const norm=a=>mul(a,1/(len(a)||1));
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const mix3=(a,b,t)=>a.map((x,i)=>lerp(x,b[i],t));
export const rotZ=(p,a)=>[p[0]*Math.cos(a)-p[1]*Math.sin(a),p[0]*Math.sin(a)+p[1]*Math.cos(a),p[2]];
export const rotY=(p,a)=>[p[0]*Math.cos(a)+p[2]*Math.sin(a),p[1],-p[0]*Math.sin(a)+p[2]*Math.cos(a)];
export function rng(s){return()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296)}
export function twoBone(a,b,l1,l2,pole){
 const v=sub(b,a),d=clamp(len(v),.02,l1+l2-.001),axis=norm(v);
 let bend=norm(sub(pole,mul(axis,dot(pole,axis))));
 if(len(bend)<.1)bend=[0,0,1];
 const along=(l1*l1-l2*l2+d*d)/(2*d),height=Math.sqrt(Math.max(0,l1*l1-along*along));
 return add(add(a,mul(axis,along)),mul(bend,height));
}
