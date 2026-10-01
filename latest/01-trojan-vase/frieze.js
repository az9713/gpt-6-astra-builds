import { THREE, clamp, ease, mix } from '../shared/runtime.js';

const W=3072,H=1536,TAU=Math.PI*2;
const INK='#070604',RESERVE='#fff';
const BASE=1115;
const ENTRY_END=7.8;

export function storyState(t) {
  t=clamp(t,0,20);
  const horseX=mix(1280,1725,ease(t,0,ENTRY_END));
  const hatch=ease(t,10.7,11.65);
  const warriors=[];
  for(let i=0;i<4;i++) {
    const begin=11.9+i*1.15;
    const descent=ease(t,begin,begin+1.35);
    const walk=ease(t,begin+1.35,18.45+i*.3);
    const x=mix(horseX-108,1160+i*137,walk);
    warriors.push({visible:t>begin,descending:t>begin&&t<begin+1.35,descent,walk,x:descent<1?mix(horseX-6,horseX-108,descent):x,y:mix(BASE-80,BASE,descent)});
  }
  return {
    phase:t<ENTRY_END?'procession':t<10.7?'nightfall':t<11.9?'opening-hatch':t<16.7?'warriors-emerge':t<19.35?'taking-position':'held-tableau',
    phaseIndex:t<ENTRY_END?0:t<10.7?1:t<11.9?2:t<16.7?3:t<19.35?4:5,
    horseX,horseInside:t>=ENTRY_END,wheelAngle:(horseX-1280)/41,
    night:ease(t,7.6,10.7),hatchOpen:hatch,ladderDeployed:ease(t,11.1,11.9),
    warriorsVisible:warriors.filter(w=>w.visible).length,
    warriorsGrounded:warriors.filter(w=>w.visible&&w.descent===1).length,
    warriors,
  };
}

function context(canvas,w,h) {canvas.width=w;canvas.height=h;return canvas.getContext('2d',{alpha:false});}
function makeTexture(canvas) {
  const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.NoColorSpace;
  t.anisotropy=8;t.generateMipmaps=false;t.minFilter=THREE.LinearFilter;
  return t;
}

export function makeFrieze() {
  const staticCanvas=document.createElement('canvas');
  const s=context(staticCanvas,2048,1024);
  s.scale(2048/W,1024/H);s.fillStyle=RESERVE;s.fillRect(0,0,W,H);
  s.fillStyle=s.strokeStyle=INK;s.lineJoin='round';s.lineCap='round';
  function poly(c,pts,fill=true,width=3) {
    c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
    if(fill){c.closePath();c.fill();}else{c.lineWidth=width;c.stroke();}
  }
  function ellipse(c,x,y,rx,ry,rotation=0) {c.beginPath();c.ellipse(x,y,rx,ry,rotation,0,TAU);c.fill();}
  function line(c,pts,width=3){poly(c,pts,false,width);}

  // The original motifs follow the neck, shoulder, belly and foot, leaving
  // a wide reserve for the story. No image assets are used.
  s.fillRect(0,0,W,48);s.fillRect(0,72,W,10);s.fillRect(0,97,W,5);
  for(const y of[137,244,273,383,400,507,526,1140,1155,1240,1260,1405,1430,1492])s.fillRect(0,y,W,y===507||y===1260?10:4);
  for(let x=-20;x<W;x+=88) {
    line(s,[[x,155],[x+69,155],[x+69,226],[x+20,226],[x+20,178],[x+48,178],[x+48,207]],7);
    poly(s,[[x,285],[x+35,366],[x+71,285]]);
    s.save();s.fillStyle=RESERVE;poly(s,[[x+25,287],[x+35,317],[x+45,287]]);s.restore();
  }
  for(let x=-100;x<W;x+=166) {
    const cx=x+83;
    line(s,[[x,419],[x+40,466],[cx,483],[x+125,466],[x+166,419]],3.5);
    for(let i=-3;i<=3;i++) {
      const a=i*.265;
      s.save();s.translate(cx,481);s.rotate(a);
      s.beginPath();s.moveTo(0,0);s.bezierCurveTo(-12,-24,-14,-52,0,-65+Math.abs(i)*5);s.bezierCurveTo(14,-52,12,-24,0,0);s.fill();s.restore();
    }
    ellipse(s,cx,483,8,6);
    s.beginPath();s.arc(x+14,448,11,.1,Math.PI*1.8);s.lineWidth=3;s.stroke();
    s.beginPath();s.arc(x+152,448,11,Math.PI*1.2,Math.PI*2.9);s.stroke();
  }
  for(let x=-60;x<W;x+=81) {
    s.beginPath();s.moveTo(x,1220);s.bezierCurveTo(x+8,1180,x+40,1178,x+46,1200);s.bezierCurveTo(x+56,1228,x+25,1229,x+25,1210);s.bezierCurveTo(x+24,1198,x+41,1198,x+41,1208);s.lineWidth=5;s.stroke();
    line(s,[[x+42,1220],[x+82,1220]],3);
    poly(s,[[x+4,1293],[x+38,1386],[x+72,1293]]);
    line(s,[[x+6,1310],[x+37,1394],[x+69,1310]],2);
  }
  s.fillRect(0,1455,W,15);s.fillRect(0,1520,W,16);
  const staticTexture=makeTexture(staticCanvas);
  const storyCanvas=document.createElement('canvas');
  const c=context(storyCanvas,2048,512);
  const storyTexture=makeTexture(storyCanvas);
  let drawn=-1;

  function architecture() {
    c.fillStyle=c.strokeStyle=INK;
    // A high lintel and two pierced towers make an open gate, not a solid slab.
    const left=1500,right=2050,top=640;
    for(const x of[left,right]) {
      c.fillRect(x,top,65,BASE-top);
      for(let k=0;k<3;k++)c.fillRect(x+k*25-3,top-32,18,35);
      c.save();c.strokeStyle=RESERVE;
      for(let y=top+30,n=0;y<BASE;y+=34,n++) {
        line(c,[[x+6,y],[x+60,y]],2.4);
        line(c,[[x+(n%2?22:42),y],[x+(n%2?22:42),y+30]],2);
      }
      c.fillStyle=RESERVE;
      c.fillRect(x+22,top+69,20,66);
      c.beginPath();c.arc(x+32,top+69,10,Math.PI,TAU);c.fill();
      c.restore();
    }
    c.fillRect(left-10,top+136,right-left+85,16);
    c.fillRect(left+55,top+103,right-left-45,10);
    for(let x=left+61;x<right;x+=40)c.fillRect(x,top+78,20,28);
    line(c,[[left+65,top+213],[left+105,top+168],[right-44,top+168],[right,top+213]],10);
    // A second wall recedes around the far side of the pot.
    line(c,[[right+65,BASE-248],[2340,BASE-248],[2340,BASE]],7);
    for(let x=right+80;x<2370;x+=54)c.fillRect(x,BASE-272,27,26);
    for(let y=BASE-211;y<BASE-15;y+=43)line(c,[[right+82,y],[2321,y]],2.5);
    line(c,[[980,BASE+3],[2390,BASE+3]],7);
    for(let x=975;x<2390;x+=37)line(c,[[x,BASE+16],[x+17,BASE+16]],1.6);
  }

  function shield(x,y,r,emblem=0) {
    c.fillStyle=INK;ellipse(c,x,y,r,r*1.1);
    c.save();c.strokeStyle=RESERVE;c.lineWidth=2;
    c.beginPath();c.ellipse(x,y,r-5,(r-5)*1.1,0,0,TAU);c.stroke();
    if(emblem%2) {
      line(c,[[x-r*.43,y],[x+r*.43,y]],2);line(c,[[x,y-r*.46],[x,y+r*.46]],2);
      c.beginPath();c.arc(x,y,r*.31,0,TAU);c.stroke();
    } else {
      c.beginPath();c.arc(x-2,y,r*.4,-.9,1.8);c.stroke();
      line(c,[[x-2,y-r*.4],[x+8,y-2],[x-5,y+10]],2);
    }
    c.restore();
  }

  function person(x,ground,scale,phase,opts={}) {
    c.save();c.translate(x,ground);c.scale((opts.face||1)*scale,scale);
    const walk=opts.walk===undefined?1:opts.walk;
    const stride=Math.sin(phase)*walk, lift=Math.cos(phase)*walk;
    const lean=opts.pull?-14:opts.push?15:opts.climb?-7:0;
    const bob=opts.climb?0:Math.abs(Math.sin(phase))*3*walk;
    c.translate(0,-bob);c.fillStyle=c.strokeStyle=INK;
    const hip=[lean*.32,-63],kneeA=[-13+stride*21,-31-Math.max(0,lift)*5],footA=[-15-stride*31,-Math.max(0,lift)*9];
    const kneeB=[13-stride*21,-30-Math.max(0,-lift)*5],footB=[17+stride*31,-Math.max(0,-lift)*9];
    line(c,[hip,kneeA,footA,[footA[0]+16,footA[1]]],9);
    line(c,[hip,kneeB,footB,[footB[0]+16,footB[1]]],10);
    // Cuirass, pleated short skirt, neck and a recognizable nose/helmet profile.
    poly(c,[[lean-16,-138],[lean+15,-138],[lean*.3+19,-87],[lean*.3+29,-62],[lean*.3-28,-62],[lean*.3-16,-91]]);
    poly(c,[[lean-6,-149],[lean+8,-149],[lean+10,-132],[lean-8,-132]]);
    c.beginPath();c.moveTo(lean-9,-154);c.bezierCurveTo(lean-17,-178,lean+16,-185,lean+21,-165);c.lineTo(lean+29,-156);c.lineTo(lean+18,-153);c.lineTo(lean+16,-144);c.lineTo(lean-5,-145);c.closePath();c.fill();
    if(opts.helmet!==false) {
      c.beginPath();c.moveTo(lean-17,-164);c.bezierCurveTo(lean-32,-193,lean+8,-211,lean+25,-182);c.lineTo(lean+26,-175);c.bezierCurveTo(lean+1,-191,lean-8,-179,lean-10,-163);c.closePath();c.fill();
      line(c,[[lean-13,-168],[lean-14,-145]],6);
      c.save();c.strokeStyle=RESERVE;line(c,[[lean-16,-185],[lean-2,-190],[lean+12,-185]],2);c.restore();
    } else {
      c.beginPath();c.arc(lean+1,-170,18,Math.PI,TAU);c.fill();
      line(c,[[lean-16,-169],[lean-22,-148]],8);
    }
    const shoulder=[lean+9,-129];
    if(opts.pull) {
      line(c,[shoulder,[lean-24,-107],[lean-52,-109]],9);
      line(c,[[lean-12,-128],[lean-28,-101],[lean-51,-103]],7);
    } else if(opts.push) {
      line(c,[shoulder,[lean+36,-113],[lean+55,-104+bob]],8);
      line(c,[[lean-10,-126],[lean+27,-115],[lean+53,-101+bob]],7);
    } else if(opts.climb) {
      line(c,[shoulder,[lean+32,-146],[lean+26,-163]],7);
      line(c,[[lean-13,-128],[lean-28,-108],[lean-18,-86]],7);
      shield(lean-18,-112,22,opts.emblem||0);
    } else {
      line(c,[shoulder,[lean+34,-109],[lean+43,-132]],8);
      line(c,[[lean+42,-204],[lean+43,-17]],3.3);
      poly(c,[[lean+38,-204],[lean+43,-228],[lean+48,-204]]);
      shield(lean-15,-109,28,opts.emblem||0);
    }
    c.save();c.strokeStyle=RESERVE;
    for(let i=-2;i<=2;i++)line(c,[[lean*.3+i*7,-83],[lean*.3+i*10,-66]],1.8);
    line(c,[[lean-10,-134],[lean+10,-131]],2);
    c.restore();
    c.restore();
  }

  function wheel(x,y,r,angle) {
    c.save();c.translate(x,y);c.rotate(angle);
    c.fillStyle=INK;ellipse(c,0,0,r,r);c.fillStyle=RESERVE;ellipse(c,0,0,r-7,r-7);
    c.strokeStyle=INK;
    for(let i=0;i<4;i++){const a=i*Math.PI/4;line(c,[[Math.cos(a)*(r-8),Math.sin(a)*(r-8)],[-Math.cos(a)*(r-8),-Math.sin(a)*(r-8)]],3.5);}
    c.fillStyle=INK;ellipse(c,0,0,8,8);c.fillStyle=RESERVE;ellipse(c,0,0,2,2);c.restore();
  }

  function horseShape() {
    c.beginPath();c.moveTo(-176,-240);
    c.bezierCurveTo(-126,-263,20,-260,85,-246);
    c.lineTo(116,-330);c.lineTo(137,-393);c.lineTo(147,-423);
    c.lineTo(159,-414);c.lineTo(177,-433);c.lineTo(179,-405);
    c.lineTo(209,-399);c.lineTo(243,-369);c.lineTo(251,-345);
    c.lineTo(236,-330);c.lineTo(214,-336);c.lineTo(198,-352);
    c.lineTo(161,-253);c.lineTo(145,-217);c.lineTo(153,-143);
    c.bezierCurveTo(65,-128,-84,-128,-163,-149);c.closePath();
  }

  function horse(x,y,wheelAngle,hatch) {
    c.save();c.translate(x,y);c.fillStyle=c.strokeStyle=INK;
    // A reserve contour prevents the tower and horse becoming one shape.
    horseShape();c.save();c.strokeStyle=RESERVE;c.lineWidth=11;c.stroke();c.restore();c.fill();
    c.beginPath();c.moveTo(-169,-229);c.bezierCurveTo(-235,-246,-245,-176,-217,-147);c.bezierCurveTo(-196,-126,-197,-156,-211,-163);c.lineWidth=12;c.stroke();
    poly(c,[[-143,-161],[-123,-163],[-110,-81],[-143,-81]]);
    poly(c,[[94,-160],[118,-160],[146,-80],[114,-80]]);
    poly(c,[[-84,-155],[-70,-155],[-106,-77],[-126,-77]]);
    c.fillRect(-177,-88,345,17);
    c.save();c.strokeStyle=RESERVE;
    line(c,[[-154,-229],[87,-231]],3);
    line(c,[[-154,-211],[92,-212]],2.5);
    line(c,[[-151,-158],[124,-156]],3);
    for(let i=0;i<10;i++) {
      const px=-147+i*29;
      line(c,[[px,-220],[px+3,-169]],2.4);
      ellipse(c,px+4,-225,2.1,2.1);
    }
    line(c,[[-149,-169],[85,-221]],3);
    line(c,[[-145,-221],[96,-164]],3);
    line(c,[[119,-268],[149,-358],[172,-377],[206,-369]],3);
    line(c,[[213,-351],[235,-347]],2.5);
    line(c,[[107,-322],[130,-379]],2);
    c.beginPath();c.arc(195,-382,5,0,TAU);c.stroke();
    for(let i=0;i<7;i++)line(c,[[117+i*3.5,-332-i*10],[105+i*3.7,-332-i*10]],2);
    line(c,[[-152,-80],[149,-80]],2);
    c.restore();
    if(hatch>0) {
      c.save();c.globalAlpha=hatch;c.fillStyle=RESERVE;
      c.fillRect(-43,-221,76,91);c.strokeStyle=INK;line(c,[[-43,-133],[-43,-221],[33,-221],[33,-133]],3);
      const flap=53*hatch;
      poly(c,[[-43,-132],[33,-132],[42,-132+flap],[-50,-132+flap]]);
      c.fillStyle=INK;poly(c,[[-39,-128],[29,-128],[35,-129+flap],[-45,-129+flap]]);
      c.strokeStyle=RESERVE;line(c,[[-33,-123],[25,-123]],2);c.restore();
    }
    wheel(-123,-39,39,wheelAngle);wheel(125,-39,39,wheelAngle);
    c.restore();
  }

  function ladder(x,amount) {
    if(amount<=0)return;
    c.save();c.translate(x-4,BASE-137);
    c.rotate(mix(-1.30,0,amount));c.scale(1,amount);
    c.strokeStyle=RESERVE;
    line(c,[[-18,0],[-124,133]],9);line(c,[[17,0],[-89,133]],9);
    c.strokeStyle=INK;
    line(c,[[-18,0],[-124,133]],4);line(c,[[17,0],[-89,133]],4);
    for(let k=0;k<7;k++)line(c,[[-20-k*15,5+k*19],[15-k*15,5+k*19]],3.6);
    c.restore();
  }

  function sky(t,night) {
    c.save();c.fillStyle=c.strokeStyle=INK;
    const day=1-ease(t,7.7,9.6);
    if(day>0) {
      c.save();c.globalAlpha=day;
      const sx=1195,sy=661+ease(t,7.5,9.7)*59;
      ellipse(c,sx,sy,28,28);
      for(let i=0;i<12;i++) {const a=i*TAU/12;line(c,[[sx+Math.cos(a)*36,sy+Math.sin(a)*36],[sx+Math.cos(a)*47,sy+Math.sin(a)*47]],3);}
      c.restore();
    }
    if(night>0) {
      c.save();c.globalAlpha=night;ellipse(c,1214,650,34,38);
      c.fillStyle=RESERVE;ellipse(c,1231,638,32,34);c.fillStyle=INK;
      for(const [x,y,r]of[[1110,712,6],[1330,619,7],[1415,688,5],[1271,747,5],[1810,570,5],[1914,602,4],[1057,614,4]]) {
        poly(c,[[x-r,y],[x-1,y-2],[x,y-r*1.5],[x+2,y-2],[x+r,y],[x+2,y+2],[x,y+r*1.5],[x-1,y+2]]);
      }
      c.restore();
    }
    c.save();c.strokeStyle=INK;line(c,[[948,BASE],[943,927],[965,833]],5);
    for(let i=0;i<6;i++) {const yy=856+i*32;ellipse(c,949+(i%2?14:-8),yy,7,20,i%2?.8:-.8);}
    c.restore();c.restore();
  }

  function draw(t) {
    t=clamp(t,0,20);
    if(t===drawn)return;
    drawn=t;
    const st=storyState(t),hx=st.horseX;
    c.setTransform(1,0,0,1,0,0);c.fillStyle=RESERVE;c.fillRect(0,0,2048,512);
    c.setTransform(2048/W,0,0,512/700,0,-500*512/700);
    c.lineCap='round';c.lineJoin='round';c.fillStyle=c.strokeStyle=INK;
    architecture();sky(t,st.night);
    const attendants=1-ease(t,7.8,9.35);
    if(attendants>0) {
      c.save();c.globalAlpha=attendants;
      const gait=t*5.6+.65,pace=1-ease(t,7,7.8);
      c.strokeStyle=INK;
      const handA=[hx+309-66*.77,BASE-(109+Math.abs(Math.sin(gait))*3*pace)*.77];
      const handB=[hx+395-66*.73,BASE-(109+Math.abs(Math.sin(gait+1.7))*3*pace)*.73];
      line(c,[[hx+229,BASE-342],handA,handB],3);
      person(hx+309,BASE,.77,gait,{pull:true,helmet:false,walk:pace});
      person(hx+395,BASE,.73,gait+1.7,{pull:true,helmet:false,walk:pace});
      person(hx-230,BASE,.78,gait+2.6,{push:true,helmet:false,walk:pace});
      person(hx-349,BASE,.72,gait+.8,{walk:pace,emblem:1});
      c.restore();
    }
    horse(hx,BASE,st.wheelAngle,st.hatchOpen);
    ladder(hx,st.ladderDeployed);
    for(let i=0;i<4;i++) {
      const w=st.warriors[i];if(!w.visible)continue;
      c.save();
      if(w.descent<1) {
        // The shell occludes an emerging figure except at its open hatch.
        c.beginPath();c.rect(hx-48,BASE-225,89,100);c.rect(0,BASE-129,W,170);c.clip();
        person(w.x,w.y,.72,t*7+i,{face:-1,climb:true,walk:.65,emblem:i});
      } else {
        const walking=w.walk<1;
        person(w.x,w.y,.76,walking?t*6.1+i:1.15,{face:-1,walk:walking?1:0,emblem:i});
      }
      c.restore();
    }
    storyTexture.needsUpdate=true;
  }
  return {staticTexture,storyTexture,draw};
}
