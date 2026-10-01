import{THREE,TSL,start,paint,flat,mesh,ell,box,segment,tube,shapeMesh,batch,human,V,rng,ease,mix,TAU}from'../shared/runtime.js';
await start({title:'Sisyphus — The Living Limestone Relief',background:'#958871',loop:true,setup({scene,camera,sun,ambient,fill}){
 camera.position.set(1.5,6,24);camera.lookAt(0,4,0);camera.fov=35;camera.updateProjectionMatrix();ambient.intensity=1.5;fill.intensity=.4;sun.position.set(-9,14,12);sun.intensity=4.8;sun.shadow.camera.left=-15;sun.shadow.camera.right=15;sun.shadow.camera.top=15;sun.shadow.camera.bottom=-15;sun.shadow.bias=-.00015;
 const stone=paint('#beae8a',{kind:'stone',roughness:.95,bump:.07}),light=paint('#d5c39a',{kind:'stone',roughness:.96,bump:.045}),deep=paint('#a99773',{kind:'stone',roughness:.98,bump:.05});
 box(scene,stone,0,4,-.65,19,11,1.2);box(scene,light,0,-1.1,.05,19.8,.65,1.2);box(scene,light,0,9.1,.05,19.8,.65,1.2);for(const x of[-9.65,9.65])box(scene,light,x,4,.05,.65,10,1.2);
 for(const[y,h]of[[-.64,.1],[8.63,.1]])box(scene,deep,0,y,.78,19,.06,.12);for(let x=-9;x<=9;x+=.34){box(scene,deep,x,8.33,.2,.1,.14,.07);box(scene,light,x,8.5,.3,.14,.09,.1)}
 shapeMesh(scene,deep,[[-9,-.5],[-9,2.7],[-6,5.3],[-4,3.2],[-.5,6.7],[1.7,4.6],[4,7],[7,4.1],[9,5.6],[9,-.5]],.25,-.03);
 shapeMesh(scene,stone,[[-9,-.5],[-9,1.1],[-6,3.2],[-3,1.6],[.2,4.6],[2.5,3.2],[5.5,5.7],[9,3.8],[9,-.5]],.24,.18);
 const ground=x=>1.2+(x+7.4)*.265;
 shapeMesh(scene,light,[[-9,-.5],[-9,ground(-9)],[7.8,ground(7.8)],[9,4.2],[9,-.5]],1,.45);
 tube(scene,stone,[[-9,ground(-9)+.04,1.46],[-4,ground(-4)+.03,1.46],[2,ground(2)+.02,1.46],[7.8,ground(7.8),1.46]],.055);
 const r=rng(203),chips=[];for(let i=0;i<160;i++){let x=-9+r()*18,y=-.3+r()*8.4;if(y>ground(x)+.4)chips.push({p:[x,y,.37],s:[.022+r()*.07,.02+r()*.1,.016],r:[0,0,r()*3]})}batch(scene,new THREE.BoxGeometry(),deep,chips,false);
 for(let i=0;i<13;i++){let x=-8+r()*16,y=1+r()*6;tube(scene,deep,[[x,y,.41],[x+.09,y-.12,.41],[x+.04,y-.2,.41],[x+.16,y-.39,.41]],.008)}
 const ballGroup=new THREE.Group();scene.add(ballGroup);const ball=mesh(ballGroup,new THREE.IcosahedronGeometry(1.16,3),stone);let pos=ball.geometry.attributes.position;for(let i=0;i<pos.count;i++){let x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),f=1+.025*Math.sin(x*17+y*9)*Math.sin(z*15-y*11);pos.setXYZ(i,x*f,y*f,z*f)}ball.geometry.computeVertexNormals();
 const patches=[];for(let i=0;i<35;i++){let a=r()*TAU,b=r()*Math.PI;patches.push({p:[Math.sin(b)*Math.cos(a)*1.166,Math.cos(b)*1.166,Math.sin(b)*Math.sin(a)*1.166],s:[.035,.018,.03],r:[a,b,0]})}batch(ballGroup,new THREE.IcosahedronGeometry(1,0),deep,patches);
 const man=human(scene,{skin:'#d1bd92',cloth:'#c9b38a',scale:1.25,stone:true});
 // Beard, nose, hair locks and draped cloth are actual relief geometry.
 ell(man.g,stone,.07,1.67,.17,.13,.19,.1);ell(man.g,stone,-.04,1.94,-.01,.185,.135,.18);ell(man.g,light,.18,1.83,.16,.055,.11,.07);for(let i=0;i<5;i++)tube(man.g,stone,[[-.15+i*.065,1.99,.14],[-.15+i*.065,1.92,.185],[-.18+i*.065,1.86,.16]],.028);
 const cloth=mesh(man.g,new THREE.ConeGeometry(.32,.55,14,1,true),light,0,.85,0);cloth.rotation.x=Math.PI;for(let i=0;i<9;i++){let a=i*TAU/9;tube(man.g,stone,[[Math.sin(a)*.19,1.1,Math.cos(a)*.16],[Math.sin(a)*.31,.58,Math.cos(a)*.26]],.018)}
 const dustMat=flat('#ccb992',.3),dust=[];for(let i=0;i<26;i++){const m=ell(scene,dustMat,0,0,0,.03,.03,.03);m.castShadow=m.receiveShadow=false;dust.push({m,a:r(),b:r(),c:r()})}
 function motion(t){let bx,mx,push;
  if(t<4.5||t>=11){let tt=t<4.5?t+20:t,u=ease(tt,11,24.5);bx=mix(-6.1,5.05,u);mx=bx-2.22;push=1;}
  else{bx=mix(5.05,-6.1,ease(t,4.5,9));mx=mix(2.83,-8.32,ease(t,6.3,11));push=1-ease(t,4.5,5.4)}
  return{bx,mx,push};
 }
 return{update(t){const q=motion(t),rolling=t>=4.5&&t<9,bounce=rolling?Math.abs(Math.sin((t-4.5)*6))*.16*Math.sin(Math.PI*(t-4.5)/4.5):0;ballGroup.position.set(q.bx,ground(q.bx)+1.21+bounce,1.65);ballGroup.rotation.z=-(q.bx-3)/1.16;man.g.position.set(q.mx,ground(q.mx)+.05,1.75);const phase=t*TAU*.7;man.pose(phase,q.push);man.g.rotation.z=-.1*q.push;man.g.rotation.y=Math.PI*(ease(t,5,6)-ease(t,10,11));
  dust.forEach((d,i)=>{const age=(t-4.5)-d.a*4.2;if(age>0&&age<2.2){const ex=motion(Math.min(8.9,4.5+d.a*4.2)).bx;d.m.position.set(ex+(d.b-.5)*age*2,ground(ex)+.15+age*.35,2+d.c*.6);const s=Math.sin(Math.PI*age/2.2)*(.13+d.c*.2);d.m.scale.set(s*1.8,s,s)}else d.m.scale.setScalar(.00001)});
 },state:t=>({...motion(t),phase:t<4.5?'near summit':t<9?'boulder falls':t<11?'following':'pushing again'})};
}});
