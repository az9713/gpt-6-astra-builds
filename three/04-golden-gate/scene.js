import{THREE,TSL,start,paint,flat,mesh,ell,box,segment,moveSegment,tube,batch,water,sky,human,V,rng,ease,mix}from'../shared/runtime.js';
await start({title:'The Golden Gate — Joining the Bay',background:'#d7c6a2',setup({scene,camera,sun,ambient}){
 sky(scene,'#f6dda4','#7eaaa8');scene.fog=new THREE.FogExp2('#bac8b4',.0015);sun.position.set(-25,65,30);sun.intensity=3.8;ambient.intensity=2;sun.shadow.camera.left=-65;sun.shadow.camera.right=65;sun.shadow.camera.top=65;sun.shadow.camera.bottom=-65;sun.shadow.camera.far=180;
 const steel=paint('#b84826',{roughness:.64,metalness:.18}),edge=paint('#e47b49',{roughness:.67,metalness:.12}),road=paint('#4c6260'),rope=paint('#695b43'),concrete=paint('#c9b48a',{kind:'stone'});
 water(scene,260,240,-.1);
 const globe=ell(scene,flat('#ffdfa3'),-80,75,-160,11,11,11);globe.castShadow=false;
 const rnd=rng(440);
 function hill(x,z,w,d,height,col){const geo=new THREE.PlaneGeometry(w,d,26,18),p=geo.attributes.position;for(let i=0;i<p.count;i++){const a=p.getX(i)/w,b=p.getY(i)/d;let h=Math.pow(Math.max(0,1-a*a*3.7-b*b*3),.7)*height;h+=Math.sin(a*18+b*13)*2+Math.sin(a*37-b*19)*.8;p.setZ(i,Math.max(-1,h))}geo.computeVertexNormals();const m=mesh(scene,geo,paint(col,{kind:'stone'}),x,-.2,z);m.rotation.x=-Math.PI/2;return m}
 hill(-81,-8,72,94,28,'#647a62');hill(80,-28,84,90,20,'#7c8c6c');hill(-97,-90,100,70,26,'#87a291');hill(82,-105,125,60,16,'#a0af96');
 const homes=[],roofs=[];for(let i=0;i<100;i++){let x=56+rnd()*44,z=-20-rnd()*30,y=3+Math.max(0,(x-55)*.12);let h=1+rnd()*2;homes.push({p:[x,y+h/2,z],s:[1.1,h,1.2]});roofs.push({p:[x,y+h+.2,z],s:[1.2,.3,1.3]})}batch(scene,new THREE.BoxGeometry(),paint('#ceb98e'),homes,false);batch(scene,new THREE.BoxGeometry(),paint('#786f5e'),roofs,false);
 for(const x of [-24,24]){
  for(const z of [-3,3]){box(scene,concrete,x,1.5,z,5,3,5);box(scene,steel,x,20,z,1.75,37,1.7);box(scene,edge,x,38.6,z,2.1,.6,2.1);box(scene,edge,x+.58,20,z+.7,.16,36,.12)}
  for(const y of [14,22,29,35.5,38]){box(scene,steel,x,y,0,1.65,1.2,7.7);box(scene,edge,x+.88,y+.05,0,.09,.3,7.7)}
  for(const y of [17.5,25.5,32.5]){segment(scene,steel,[x,y-3,-2.1],[x,y+3,2.1],.18);segment(scene,steel,[x,y-3,2.1],[x,y+3,-2.1],.18)}
 }
 function panel(parent,cx,length){box(parent,road,cx,12,0,length,.36,5.7);box(parent,edge,cx,11.72,0,length,.3,5.9);for(const z of [-2.9,2.9]){box(parent,steel,cx,10.75,z,length,.23,.2);box(parent,edge,cx,12.6,z,length,.12,.12);const n=Math.round(length/2);for(let i=0;i<n;i++){let a=cx-length/2+i*length/n,b=a+length/n;segment(parent,steel,[a,10.75,z],[b,11.7,z],.1);segment(parent,steel,[a,11.7,z],[b,10.75,z],.1);segment(parent,steel,[a,11.7,z],[a,12.6,z],.045)}}}
 panel(scene,-34.5,61);panel(scene,34.5,61);
 const final=new THREE.Group();scene.add(final);panel(final,0,8);for(let x=-3;x<=3;x+=1.5)box(final,concrete,x,12.23,0,.05,.025,4.8);
 function cableY(x){const a=Math.abs(x);return a<=24?19+18*Math.pow(a/24,2):37-24*Math.pow((a-24)/43,.75)}
 for(const z of [-3.1,3.1]){let pts=[];for(let x=-67;x<=67;x+=1)pts.push([x,cableY(x),z]);tube(scene,steel,pts,.14);for(let x=-62;x<=62;x+=2){if(Math.abs(x)<5)continue;segment(scene,edge,[x,12.5,z],[x,cableY(x),z],.055)}}
 for(const x of [-8,8]){segment(scene,rope,[x,12,0],[x*.75,24,0],.2);segment(scene,rope,[x,12,2.4],[x*.75,24,0],.09);segment(scene,rope,[x,12,-2.4],[x*.75,24,0],.09);segment(scene,rope,[x*.75,24,0],[x*.3,21,0],.11)}
 const suspensions=[];for(const x of [-2.5,2.5])for(const z of [-2.4,2.4])suspensions.push({x,z,m:segment(scene,rope,[x,22,0],[x,17,z],.035)});
 const workers=[];for(const [x,z]of[[-5.1,2.1],[-5.8,-2],[5.1,1.8],[6,-1.7]]){const h=human(scene,{cloth:'#637f85',skin:'#be946b',scale:.7});h.g.position.set(x,12.2,z);h.g.rotation.y=x<0?0:Math.PI;ell(h.g,paint('#bc9561'),0,2.03,0,.21,.06,.22);workers.push(h)}
 const guides=[];for(let i=0;i<4;i++){let x=i<2?-3.8:3.8,z=i%2?2.6:-2.6;guides.push({x,z,m:segment(scene,rope,[x,17,z],[x<0?-5:5,13,z],.025)})}
 const boat=new THREE.Group();scene.add(boat);ell(boat,paint('#2c4144'),0,.3,0,1.9,.5,.65);box(boat,paint('#ece0b7'),-.3,.9,0,1.5,.8,.8);cylinderBoat();function cylinderBoat(){box(boat,steel,0,1.5,0,.3,.5,.25);segment(boat,rope,[.7,.8,0],[.7,2.1,0],.025)}
 const wake=flat('#c5e3d8',.45);for(const side of[-1,1])tube(boat,wake,[[-1.5,.05,side*.5],[-3,.06,side*.9],[-5,.03,side*1.5]],.07);
 const origin=V(7.2,18.7,18),finish=V(91,52,107),target=V();
 return{update(t){let settle=ease(t,0,7);final.position.y=4.9*(1-settle)+Math.sin(t*2.7)*.075*(1-settle);final.rotation.z=Math.sin(t*1.4)*.018*(1-settle);final.position.z=Math.sin(t*.75)*.12*(1-settle);
  for(const c of suspensions)moveSegment(c.m,[c.x*.9,22,0],[c.x,12.1+final.position.y,c.z+final.position.z],.035);
  for(const c of guides)moveSegment(c.m,[c.x,12.1+final.position.y,c.z+final.position.z],[c.x<0?-5.1:5.1,13.25,c.z*.75],.025);
  workers.forEach((h,i)=>h.pose(t*1.7+i,.82*(1-ease(t,6,8))));
  const u=ease(t,7,19.5);camera.position.lerpVectors(origin,finish,u);target.set(0,mix(13.4,16,u),0);camera.lookAt(target);boat.position.set(18-t*.5,.02,25);boat.rotation.y=.1;
 },state:t=>({sectionSeated:t>=7,cameraReveal:ease(t,7,19.5)})};
}});
