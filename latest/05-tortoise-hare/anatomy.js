import {THREE,TSL,mesh,ell,tube,V} from '../shared/runtime.js';

export function pigment(base,{vertex=false,roughness=.9,grain=.026}={}) {
  const p=TSL.positionGeometry;
  const wash=TSL.mx_noise_float(p.mul(2.4)).mul(.105).add(1);
  const strokes=TSL.sin(p.y.mul(91).add(TSL.sin(p.x.mul(17)).mul(3)).add(p.z.mul(21))).mul(grain);
  const m=new THREE.MeshStandardNodeMaterial({roughness});
  m.colorNode=(vertex?TSL.attribute('color','vec3'):TSL.color(base)).mul(wash.add(strokes));
  m.roughnessNode=TSL.float(roughness).add(strokes.mul(.35));
  m.userData={tsl:true,role:'original pigment wash and dry-brush striation'};return m;
}

export function geometry(vertices,indices,colors=null) {
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  if(colors)g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  g.setIndex(indices);g.computeVertexNormals();return g;
}
function col(hex){const c=new THREE.Color(hex);return[c.r,c.g,c.b];}
function refine(rings,n=4) {
  const out=[];
  for(let i=0;i<rings.length-1;i++)for(let j=0;j<n;j++){
    const t=j/n,p0=rings[Math.max(0,i-1)],p1=rings[i],p2=rings[i+1],p3=rings[Math.min(rings.length-1,i+2)],r={};
    for(const key of Object.keys(p1)){const a=p0[key],b=p1[key],c=p2[key],d=p3[key];r[key]=.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);if(key.startsWith('r'))r[key]=Math.max(.002,r[key]);}out.push(r);
  }out.push(rings.at(-1));return out;
}
function loftY(rings,{segments=24,color=()=>col('#a5855d')}={}) {
  if(rings.length<15)rings=refine(rings);
  const v=[],ix=[],c=[];
  rings.forEach((r,j)=>{for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2,x=r.cx+Math.cos(a)*r.rx,y=r.y,z=Math.sin(a)*r.rz;v.push(x,y,z);c.push(...color(x,y,z,a));if(j&&i){const b=j*(segments+1)+i;ix.push(b,b-segments-2,b-1,b,b-segments-1,b-segments-2);}}});
  return geometry(v,ix,c);
}
function loftX(rings,segments=28,color=()=>col('#93a260')) {
  if(rings.length<15)rings=refine(rings);
  const v=[],ix=[],c=[];
  rings.forEach((r,j)=>{for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2,y=r.cy+Math.cos(a)*r.ry,z=Math.sin(a)*r.rz;v.push(r.x,y,z);c.push(...color(r.x,y,z,a));if(j&&i){const b=j*(segments+1)+i;ix.push(b,b-1,b-segments-2,b,b-segments-2,b-segments-1);}}});
  return geometry(v,ix,c);
}
function sculptedBone(parent,mat,rx,rz,bulge=1) {
  return mesh(parent,loftY([[-.5,.08],[-.43,.60],[-.22,bulge],[.10,.83],[.35,.54],[.5,.12]].map(([y,r])=>({y,cx:0,rx:rx*r,rz:rz*r}))),mat);
}
const up=V(0,1,0),aVec=V(),bVec=V(),delta=V();
export function placeBone(m,a,b) {aVec.set(...a);bVec.set(...b);delta.copy(bVec).sub(aVec);m.position.copy(aVec).add(bVec).multiplyScalar(.5);m.quaternion.setFromUnitVectors(up,delta.clone().normalize());m.scale.set(1,delta.length(),1);}
// Two equal-length hind-limb segments, choosing the backward knee solution.
export function kneePoint(hip,ankle,length=.47) {
  const dx=ankle[0]-hip[0],dy=ankle[1]-hip[1],d=Math.hypot(dx,dy),h=Math.sqrt(Math.max(.008,length*length-d*d/4));
  return [(hip[0]+ankle[0])/2+dy/Math.max(d,.001)*h,(hip[1]+ankle[1])/2-dx/Math.max(d,.001)*h,hip[2]];
}

function shellGeometry() {
  const vertices=[],indices=[],colors=[];
  function surface(x,z,raise=0){const r2=x*x+z*z;return[1.07*x,.56+.76*Math.sqrt(Math.max(0,1-r2))+raise,.81*z];}
  function tri(a,b,c,color,raise) {
    const n=6, rows=[];
    for(let i=0;i<=n;i++){rows[i]=[];for(let j=0;j<=n-i;j++){const u=i/n,v=j/n,w=1-u-v;rows[i][j]=vertices.length/3;vertices.push(...surface(a[0]*w+b[0]*u+c[0]*v,a[1]*w+b[1]*u+c[1]*v,raise));colors.push(...color);}}
    for(let i=0;i<n;i++)for(let j=0;j<n-i;j++){indices.push(rows[i][j],rows[i+1][j],rows[i][j+1]);if(j<n-i-1)indices.push(rows[i+1][j],rows[i+1][j+1],rows[i][j+1]);}
  }
  function plate(poly,color,raise=.017) {
    const center=poly.reduce((p,q)=>[p[0]+q[0]/poly.length,p[1]+q[1]/poly.length],[0,0]);
    poly=poly.map(p=>[center[0]+(p[0]-center[0])*.970,center[1]+(p[1]-center[1])*.970]);
    for(let i=0;i<poly.length;i++)tri(center,poly[i],poly[(i+1)%poly.length],col(color),raise);
  }
  const xs=[-.89,-.55,-.19,.19,.55,.89],hues=['#637748','#788650','#8b9257','#78864b','#607445'];
  for(let i=0;i<5;i++){const l=xs[i],r=xs[i+1],wl=.235*Math.sqrt(1-l*l),wr=.235*Math.sqrt(1-r*r);plate([[l,0],[l+.055,-wl],[r-.055,-wr],[r,0],[r-.055,wr],[l+.055,wl]],hues[i]);}
  const bounds=[-.89,-.47,0,.47,.89];
  for(const side of[-1,1])for(let i=0;i<4;i++){
    const l=bounds[i],r=bounds[i+1],poly=[[l,side*.235*Math.sqrt(1-l*l)],[r,side*.235*Math.sqrt(1-r*r)]];
    for(let k=0;k<=8;k++){const x=r+(l-r)*k/8;poly.push([x*.975,side*Math.sqrt(Math.max(.008,.925*.925-(x*.975)**2))]);}
    if(side<0)poly.reverse();plate(poly,['#758347','#8d9454','#7c8a4b','#637a46'][i]);
  }
  for(let i=0;i<24;i++){
    const a=i*Math.PI*2/24,b=(i+1)*Math.PI*2/24,poly=[];
    for(let k=0;k<=3;k++){let t=a+(b-a)*k/3;poly.push([Math.cos(t)*.995,Math.sin(t)*.995]);}
    for(let k=3;k>=0;k--){let t=a+(b-a)*k/3;poly.push([Math.cos(t)*.927,Math.sin(t)*.927]);}
    plate(poly,i%3?'#a6a668':'#c0b57a',.012);
  }
  for(let i=0;i<indices.length;i+=3){const swap=indices[i+1];indices[i+1]=indices[i+2];indices[i+2]=swap;}
  const g=geometry(vertices,indices,colors);
  // Fan winding differs around costal plates. Keep the explicitly authored outer normal.
  const p=g.attributes.position,n=g.attributes.normal;
  for(let i=0;i<p.count;i++){const x=p.getX(i)/1.07,z=p.getZ(i)/.81,y=Math.max(.03,(p.getY(i)-.56)/.76);const normal=V(x/1.07,y/.76,z/.81).normalize();n.setXYZ(i,normal.x,normal.y,normal.z);}
  return g;
}

export function makeTortoise(scene) {
  const root=new THREE.Group();root.name='Tortoise — domed carapace, 5 vertebral / 8 costal / 24 marginal scutes';scene.add(root);root.position.z=.9;
  const skin=pigment('#9fa864'),light=pigment('#c5bd82'),ivory=pigment('#eee0b5'),ink=pigment('#304033'),scutes=pigment('#fff',{vertex:true,grain:.013});scutes.side=THREE.DoubleSide;
  const shellBase=mesh(root,new THREE.SphereGeometry(1,48,24,0,Math.PI*2,0,Math.PI/2),pigment('#384e35'),0,.55,0);shellBase.scale.set(1.071,.763,.812);
  mesh(root,shellGeometry(),scutes);
  const plastron=mesh(root,loftX([{x:-.95,cy:.46,ry:.025,rz:.25},{x:-.75,cy:.43,ry:.13,rz:.61},{x:0,cy:.43,ry:.15,rz:.70},{x:.74,cy:.43,ry:.13,rz:.56},{x:.98,cy:.46,ry:.02,rz:.23}]),light);
  plastron.name='Flattened plastron';
  const lip=[];for(let i=0;i<=80;i++){const a=i/80*Math.PI*2;lip.push([Math.cos(a)*1.067,.555,Math.sin(a)*.817]);}tube(root,light,lip,.027);
  // Front/rear openings leave each limb visibly emerging under the carapace.
  const legs=[];
  for(let i=0;i<4;i++){
    const upper=sculptedBone(root,skin,.18,.17),lower=sculptedBone(root,skin,.16,.15),foot=new THREE.Group();root.add(foot);
    mesh(foot,loftX([{x:-.20,cy:0,ry:.025,rz:.07},{x:-.12,cy:0,ry:.10,rz:.18},{x:.09,cy:-.005,ry:.085,rz:.19},{x:.23,cy:-.015,ry:.04,rz:.14},{x:.27,cy:-.02,ry:.006,rz:.07}]),light);
    for(let j=-1;j<=1;j++){const claw=mesh(foot,loftX([{x:.18,cy:-.027,ry:.033,rz:.027},{x:.28,cy:-.04,ry:.018,rz:.023},{x:.32,cy:-.035,ry:.002,rz:.002}],10),ivory);claw.position.z=j*.088;}
    legs.push({upper,lower,foot});
  }
  const neck=mesh(root,loftX([{x:.65,cy:.61,ry:.16,rz:.20},{x:.86,cy:.65,ry:.17,rz:.18},{x:1.10,cy:.78,ry:.155,rz:.155},{x:1.22,cy:.82,ry:.17,rz:.18}]),skin);
  const head=new THREE.Group();root.add(head);head.position.set(1.17,.82,0);
  const headMat=pigment('#fff',{vertex:true});
  mesh(head,loftX([{x:-.18,cy:0,ry:.12,rz:.13},{x:-.08,cy:.02,ry:.24,rz:.24},{x:.14,cy:.025,ry:.25,rz:.25},{x:.30,cy:-.01,ry:.18,rz:.21},{x:.40,cy:-.022,ry:.085,rz:.155},{x:.42,cy:-.005,ry:.025,rz:.105}],28,(x,y)=>col(y<-.055?'#bec385':'#9eab65')),headMat);
  const beak=mesh(head,loftX([{x:.20,cy:-.098,ry:.08,rz:.17},{x:.35,cy:-.078,ry:.06,rz:.165},{x:.432,cy:-.025,ry:.008,rz:.08}],20),light);
  const eyes=[];
  for(const side of[-1,1]){
    ell(head,skin,.055,.146,side*.195,.127,.12,.067);
    const eye=ell(head,ivory,.092,.15,side*.235,.099,.112,.044),pupil=ell(head,ink,.121,.15,side*.27,.045,.064,.024);
    ell(head,ivory,.13,.176,side*.289,.016,.020,.008);
    tube(head,ink,[[.05,-.055,side*.231],[.20,-.07,side*.222],[.34,-.035,side*.167]],.009);
    ell(head,ink,.34,.069,side*.112,.015,.018,.012);eyes.push({eye,pupil});
  }
  const tail=mesh(root,loftX([{x:-1.27,cy:.43,ry:.004,rz:.005},{x:-1.11,cy:.45,ry:.05,rz:.055},{x:-.89,cy:.46,ry:.08,rz:.07}],14),skin);
  const nose=new THREE.Object3D();head.add(nose);nose.position.set(.42,0,0);nose.name='Tortoise finish-line nose probe';
  return{root,head,eyes,legs,nose,neck,tail};
}

function earGeometry() {
  const rings=[];for(let i=0;i<=24;i++){const q=i/24;const width=.145*Math.pow(Math.sin(Math.PI*q),.72);rings.push({y:q*1.1,cx:-.07*q*q,rx:Math.max(.003,width),rz:Math.max(.006,width*.34)});}
  const g=loftY(rings,{segments:16,color:(x,y,z)=>col(z>.016&&y>.10&&y<1.01&&Math.abs(x+.07*(y/1.1)**2)<.085*Math.sin(Math.PI*y/1.1)?'#c99683':'#aa885a')});
  const skinI=[],skinW=[];const p=g.attributes.position;
  for(let i=0;i<p.count;i++){const w=Math.max(0,Math.min(1,(p.getY(i)-.43)/.32));skinI.push(0,1,0,0);skinW.push(1-w,w,0,0);}
  g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skinI,4));g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(skinW,4));return g;
}
export function makeHare(scene) {
  const root=new THREE.Group();root.name='Hare — tapered torso, haunches, muzzle and articulated ears';scene.add(root);root.position.z=-1.55;
  const body=new THREE.Group();root.add(body);
  const fur=pigment('#986943'),cream=pigment('#e5c899'),ink=pigment('#3c352c'),ivory=pigment('#f4e8c8'),pink=pigment('#bc8075'),colored=pigment('#fff',{vertex:true,grain:.025});
  mesh(body,loftY([{y:-.18,cx:-.15,rx:.16,rz:.19},{y:0,cx:-.12,rx:.32,rz:.32},{y:.25,cx:-.06,rx:.32,rz:.30},{y:.54,cx:.02,rx:.25,rz:.255},{y:.78,cx:.05,rx:.23,rz:.23},{y:.97,cx:.05,rx:.13,rz:.14}],{color:(x,y,z)=>col(x>.1&&Math.abs(z)<.225&&y<.74?'#dfc498':'#a4784f')}),colored);
  const tail=mesh(body,loftX([{x:-.58,cy:.05,ry:.03,rz:.035},{x:-.49,cy:.1,ry:.155,rz:.155},{x:-.32,cy:.09,ry:.13,rz:.13},{x:-.26,cy:.08,ry:.025,rz:.02}],18),cream);
  const head=new THREE.Group();body.add(head);head.position.set(.1,.96,0);
  mesh(head,loftX([{x:-.30,cy:0,ry:.02,rz:.035},{x:-.23,cy:.02,ry:.255,rz:.23},{x:-.03,cy:.035,ry:.33,rz:.29},{x:.21,cy:.012,ry:.30,rz:.26},{x:.40,cy:-.075,ry:.21,rz:.23},{x:.59,cy:-.12,ry:.125,rz:.17},{x:.72,cy:-.105,ry:.036,rz:.073}],32,(x,y,z)=>col(x>.24&&y<.06?'#ead1a7':'#ae7c51')),colored);
  // Split cheek pads define the hare's cleft muzzle; a tiny triangular nose caps it.
  for(const side of[-1,1])ell(head,cream,.50,-.125,side*.115,.205,.125,.13);
  const nose=mesh(head,geometry([.772,-.093,0,.713,-.041,-.061,.713,-.041,.061,.735,-.134,0],[0,1,2,0,3,1,0,2,3,1,3,2]),pink);
  tube(head,ink,[[.741,-.117,0],[.724,-.184,0],[.65,-.209,.03]],.009);
  const mouth=new THREE.Group();head.add(mouth);mouth.position.set(.57,-.222,.11);ell(mouth,ink,0,0,0,.091,.036,.076);
  const teeth=mesh(mouth,geometry([-.07,0,.05,.025,0,.075,.025,-.084,.068,-.065,-.084,.045],[0,1,2,0,2,3]),ivory);teeth.material.side=THREE.DoubleSide;
  const eyes=[];
  for(const side of[-1,1]){
    const socket=ell(head,fur,.065,.106,side*.24,.144,.19,.069);
    const eye=ell(head,ivory,.094,.125,side*.275,.11,.155,.036);
    const pupil=ell(head,ink,.123,.124,side*.306,.052,.10,.022);
    const glint=ell(head,ivory,.132,.163,side*.324,.018,.027,.007);
    const brow=new THREE.Group();head.add(brow);brow.position.set(.08,.318,side*.263);
    tube(brow,fur,[[-.10,-.024,0],[0,.018,0],[.115,-.036,0]],.026);
    const lid=tube(head,ink,[[-.017,.093,side*.304],[.096,.063,side*.311],[.197,.091,side*.277]],.012);
    eyes.push({eye,pupil,glint,brow,lid});
    for(let i=-1;i<=1;i++)tube(head,cream,[[.51,-.13,side*.21],[.70,-.10+i*.065,side*.34],[.88,-.07+i*.12,side*.38]],.006);
  }
  const ears=[];
  for(const side of[-1,1]){
    const pivot=new THREE.Group();head.add(pivot);pivot.position.set(-.10,.245,side*.155);
    const ear=new THREE.SkinnedMesh(earGeometry(),colored),base=new THREE.Bone(),tip=new THREE.Bone();
    tip.position.y=.55;base.add(tip);ear.add(base);ear.bind(new THREE.Skeleton([base,tip]));pivot.add(ear);ear.castShadow=true;ear.receiveShadow=true;ears.push({pivot,tip});
  }
  const legs=[],arms=[];
  for(let side=0;side<2;side++){
    const upper=sculptedBone(root,fur,.22,.18,1.16),lower=sculptedBone(root,fur,.10,.11),foot=new THREE.Group();root.add(foot);
    mesh(foot,loftX([{x:-.28,cy:0,ry:.008,rz:.05},{x:-.21,cy:.015,ry:.085,rz:.11},{x:-.045,cy:.005,ry:.095,rz:.145},{x:.25,cy:-.006,ry:.07,rz:.13},{x:.38,cy:-.025,ry:.025,rz:.07},{x:.40,cy:-.027,ry:.004,rz:.025}],24),cream);
    for(const z of[-.042,.042])tube(foot,fur,[[.22,.047,z],[.29,.032,z],[.35,.009,z]],.007);
    legs.push({upper,lower,foot});
    const armUpper=sculptedBone(root,fur,.075,.074),armLower=sculptedBone(root,fur,.066,.063),hand=mesh(root,loftY([{y:-.12,cx:0,rx:.02,rz:.035},{y:-.06,cx:.015,rx:.085,rz:.075},{y:.04,cx:0,rx:.078,rz:.07},{y:.12,cx:-.015,rx:.025,rz:.025}],{segments:16}),cream);
    arms.push({upper:armUpper,lower:armLower,hand});
  }
  const noseProbe=new THREE.Object3D();head.add(noseProbe);noseProbe.position.set(.77,0,0);noseProbe.name='Hare finish-line nose probe';
  return{root,body,head,ears,eyes,legs,arms,mouth,nose:noseProbe,tail};
}
