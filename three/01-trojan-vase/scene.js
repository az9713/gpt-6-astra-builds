import{THREE,TSL,start,paint,mesh,cylinder,ring,tube,ell,V,ease,mix,clock}from'../shared/runtime.js';
await start({title:'Troy, Written in Clay — Living Black Figure Pottery',background:'#10181b',setup({scene,camera,sun,ambient,fill}){
 ambient.intensity=1.15;sun.position.set(-5,11,7);sun.intensity=4.2;fill.intensity=.65;camera.position.set(.8,4.7,14.4);camera.lookAt(0,3.8,0);
 const clay=paint('#bd7442',{kind:'clay',roughness:.6,bump:.02}),dark=paint('#292b25',{roughness:.8}),gold=paint('#c38952',{kind:'clay'});
 cylinder(scene,dark,0,-.35,0,3.35,.5,96);cylinder(scene,paint('#182124'),0,-.75,0,4,.3,96);const floor=mesh(scene,new THREE.PlaneGeometry(200,200),paint('#152024'),0,-.92,0);floor.rotation.x=-Math.PI/2;
 const vase=new THREE.Group();scene.add(vase);
 const points=[[1.12,0],[1.35,.1],[1.28,.32],[.97,.53],[1.13,.92],[1.7,1.5],[2.28,2.4],[2.62,3.35],[2.64,4.25],[2.41,5.25],[1.9,5.95],[1.25,6.35],[1.22,7.1],[1.65,7.45],[1.67,7.62]].map(p=>new THREE.Vector2(...p));
 const profile=new THREE.SplineCurve(points).getPoints(140),geo=new THREE.LatheGeometry(profile,160);for(let i=0;i<geo.attributes.uv.count;i++)geo.attributes.uv.setY(i,geo.attributes.position.getY(i)/7.62);
 const c=document.createElement('canvas');c.width=2048;c.height=1024;const ctx=c.getContext('2d');const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.NoColorSpace;tex.anisotropy=8;
 const p=TSL.positionLocal,grain=TSL.sin(p.x.mul(126).add(p.z.mul(89))).mul(TSL.sin(p.y.mul(134))),turning=TSL.sin(p.y.mul(165));
 const material=new THREE.MeshStandardNodeMaterial({roughness:.57});const pigment=TSL.texture(tex).r;
 material.colorNode=TSL.color('#c2834e').mul(TSL.mix(TSL.float(.052),TSL.float(1),pigment)).mul(grain.mul(.03).add(turning.mul(.015)).add(.95));material.roughnessNode=TSL.mix(TSL.float(.41),TSL.float(.7),pigment);material.normalNode=TSL.bumpMap(turning.mul(.016).add(grain.mul(.018)),TSL.float(.025));material.userData={tsl:true,role:'dynamic black-figure pigment, clay grain, thrown rings and glaze roughness'};
 mesh(vase,geo,material);const inner=mesh(vase,new THREE.LatheGeometry(profile.slice(115).map(v=>new THREE.Vector2(v.x-.075,v.y-.015)),96),clay);inner.material=clay.clone();inner.material.side=THREE.BackSide;
 const mouth=cylinder(vase,paint('#412c20'),0,6.93,0,1.2,.03,64);mouth.castShadow=false;
 for(const[y,r]of[[.1,1.3],[.35,1.19],[.65,1.04],[6.35,1.26],[7.1,1.24],[7.57,1.68]])ring(vase,gold,r,.055,0,y,0);
 for(const side of[-1,1])tube(vase,clay,[[side*1.25,6.9,0],[side*2.7,7.15,0],[side*3.25,6.5,0],[side*3.25,5.3,0],[side*2.45,4.5,0]],.15);
 function path(points,stroke=false,width=5){ctx.beginPath();points.forEach((v,i)=>i?ctx.lineTo(...v):ctx.moveTo(...v));if(stroke){ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke()}else{ctx.closePath();ctx.fill()}}
 function oval(x,y,rx,ry){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()}
 function warrior(x,y,s,phase=0){ctx.save();ctx.translate(x,y);ctx.scale(s,s);oval(0,-60,9,11);path([[-10,-55],[7,-55],[14,-22],[-13,-22]]);path([[-6,-24],[-14+Math.sin(phase)*8,2],[-25,21]],true,7);path([[8,-24],[12-Math.sin(phase)*8,3],[24,21]],true,7);path([[0,-46],[25,-36],[37,-57]],true,6);path([[32,-75],[33,18]],true,3);oval(-11,-32,13,18);path([[-10,-67],[-13,-76],[7,-78],[14,-64]]);ctx.restore()}
 function horse(x,y){ctx.save();ctx.translate(x,y);path([[-80,-80],[51,-85],[78,-169],[101,-179],[128,-161],[146,-116],[112,-121],[89,-77],[100,-30],[-69,-30]]);for(const a of[-58,59]){path([[a,-36],[a-5,25],[a+8,25],[a+12,-37]]);oval(a,40,28,28);ctx.save();ctx.fillStyle='white';oval(a,40,21,21);ctx.restore();path([[a-20,40],[a+20,40]],true,3);path([[a,19],[a,60]],true,3)}path([[-76,-76],[-113,-70],[-116,-23]],true,10);ctx.save();ctx.strokeStyle='white';ctx.lineWidth=2;for(let a=-63;a<71;a+=13)path([[a,-74],[a+4,-37]],true,2);path([[82,-146],[112,-138]],true,3);ctx.restore();oval(109,-149,4,4);ctx.restore()}
 function draw(t){ctx.fillStyle='white';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle=ctx.strokeStyle='#000';
  for(const y of[52,90,235,278,810,851,930,973])ctx.fillRect(0,y,2048,y===278||y===810?12:5);
  for(let x=0;x<2048;x+=56){path([[x,113],[x+45,113],[x+45,168],[x+12,168],[x+12,137],[x+31,137]],true,6);path([[x,217],[x+27,181],[x+52,217]]);path([[x,874],[x+24,905],[x+48,874]],true,5)}
  for(let x=0;x<2048;x+=90){path([[x,314],[x+30,372],[x+62,314]],true,4);for(let j=0;j<5;j++)oval(x+30+Math.sin(j*.7-1.4)*19,350-Math.cos(j*.7-1.4)*27,5,16)}
  ctx.fillRect(0,742,2048,7);for(let x=0;x<2048;x+=55){path([[x,782],[x+26,758],[x+50,782]],true,4)}
  // The frieze is a freshly drawn pigment mask, wrapped around the 3D clay surface.
  ctx.fillRect(1160,452,470,22);for(const x of[1160,1360,1600]){ctx.fillRect(x,452,28,270);for(let y=480;y<710;y+=28){ctx.save();ctx.fillStyle='white';ctx.fillRect(x+2,y,24,2);ctx.restore()}}for(let x=1160;x<1650;x+=65)ctx.fillRect(x,430,30,25);path([[1188,704],[1188,548],[1215,509],[1299,509],[1332,548],[1332,704]],true,12);
  const hx=mix(850,1300,ease(t,0,8));horse(hx,655);if(t<9){for(let i=0;i<2;i++)warrior(hx+170+i*58,704,.82,t*4+i);path([[hx+135,570],[hx+248,674]],true,3)}
  const night=ease(t,7,10);if(night>.2){oval(990,430,25,25);ctx.save();ctx.fillStyle='white';oval(1001,421,23,23);ctx.restore();for(const[x,y]of[[910,444],[1090,452],[1060,408],[865,400]]){path([[x-6,y],[x+6,y]],true,2);path([[x,y-6],[x,y+6]],true,2)}}else{oval(990,430,22,22);for(let j=0;j<12;j++){let a=j*Math.PI/6;path([[990+Math.cos(a)*27,430+Math.sin(a)*27],[990+Math.cos(a)*36,430+Math.sin(a)*36]],true,2)}}
  if(t>10){path([[hx-12,621],[hx-42,731]],true,4);path([[hx+7,621],[hx-23,731]],true,4);for(let j=0;j<6;j++)path([[hx-12-j*5,625+j*18],[hx+7-j*5,625+j*18]],true,3);for(let i=0;i<4;i++){const u=ease(t,10.5+i*.75,14+i*.75);if(u>0){const x=hx-23-u*(115+i*65),y=mix(645,714,Math.min(1,u*2));ctx.save();ctx.translate(x,y);ctx.scale(-1,1);warrior(0,0,.93,5*t+i);ctx.restore()}}}
  tex.needsUpdate=true;
 }
 return{update(t){draw(t);vase.rotation.y=Math.PI+.13-.65*ease(t,0,20);sun.intensity=mix(4.2,2.45,ease(t,7,11));fill.intensity=mix(.65,1.3,ease(t,7,11));},state:t=>({horseInside:t>=8,night:t>=10,warriors:Math.min(4,Math.max(0,Math.floor((t-10.5)/.75)+1))})};
}});
