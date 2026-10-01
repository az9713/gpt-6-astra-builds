// Original implicit sculpture. Units and proportions are authored for this relief.
// Rest arms open sideways so their surfaces can be joined smoothly before skinning.
export const REST={
 pelvis:[0,1.72,0],spine:[.03,2.34,0],chest:[.025,2.99,0],neck:[.03,3.30,0],head:[.13,3.63,0],
 shoulders:[[.025,2.99,.39],[.025,2.99,-.39]],elbows:[[.04,2.95,1.149],[.04,2.95,-1.149]],
 wrists:[[.06,2.89,1.886],[.06,2.89,-1.886]],hands:[[.06,2.935,2.236],[.06,2.935,-2.236]],
 hips:[[0,1.72,.26],[0,1.72,-.26]],knees:[[.63,.918,.28],[.63,.918,-.28]],
 ankles:[[.01,.096,.31],[.01,.096,-.31]],toes:[[.40,.17,.31],[.40,.17,-.31]]
};
export const BONES=[['pelvis','spine'],['spine','chest'],['chest','neck'],['neck','head'],
 ['shoulders',0,'elbows'],['shoulders',1,'elbows'],['elbows',0,'wrists'],['elbows',1,'wrists'],
 ['wrists',0,'hands'],['wrists',1,'hands'],['hips',0,'knees'],['hips',1,'knees'],
 ['knees',0,'ankles'],['knees',1,'ankles'],['ankles',0,'toes'],['ankles',1,'toes']];
export function boneEnds(pose,def){return def.length===2?[pose[def[0]],pose[def[1]]]:[pose[def[0]][def[1]],pose[def[2]][def[1]]];}
export function sculptureFields(){
 const fields=[];const ell=(c,r,bone)=>fields.push({kind:'ell',c,r,bone});const cap=(a,b,r1,r2,bone)=>fields.push({kind:'cap',a,b,r1,r2,bone});
 ell([-.03,1.74,0],[.30,.28,.36],0);ell([-.09,2.10,0],[.25,.34,.31],1);
 ell([-.045,2.43,0],[.29,.38,.35],1);ell([.03,2.75,0],[.36,.40,.43],2);
 // Pectoral ridge, scapula and narrowing abdominal wall.
 for(const s of[-1,1]){ell([.14,2.84,s*.20],[.18,.23,.24],2);ell([-.14,2.70,s*.21],[.18,.30,.23],2);}
 cap([.01,3.00,0],[.035,3.42,0],.19,.145,2);
 ell([.11,3.66,0],[.245,.305,.237],3);ell([.045,3.86,0],[.228,.218,.229],3);
 ell([.265,3.70,0],[.14,.22,.195],3);ell([.31,3.82,0],[.10,.066,.214],3);
 cap([.347,3.81,0],[.475,3.68,0],.073,.052,3);
 ell([.365,3.603,0],[.084,.059,.117],3);ell([.245,3.469,0],[.179,.20,.180],3);
 for(const s of[-1,1]){ell([-.018,3.68,s*.233],[.075,.114,.041],3);ell([.01,3.50,s*.092],[.075,.19,.072],3);}
 for(let i=0;i<2;i++){
  const s=i===0?1:-1,A=REST.shoulders[i],B=REST.elbows[i],C=REST.wrists[i];
  ell([.025,2.99,s*.425],[.25,.26,.27],4+i);
  cap(A,B,.19,.125,4+i);ell([.13,2.94,s*.75],[.135,.165,.26],4+i);ell([-.055,2.91,s*.78],[.135,.175,.26],4+i);
  ell(B,[.14,.145,.14],6+i);cap(B,C,.138,.075,6+i);ell([.055,2.895,s*1.39],[.132,.142,.25],6+i);
  ell([.06,2.896,s*2.008],[.101,.108,.155],8+i);
  for(let f=0;f<4;f++){const x=-.017+f*.053,z=s*(2.22+(f===1||f===2?.032:0));cap([x,2.92,s*2.055],[x,2.964,z],.027,.024,8+i);}
  cap([.146,2.885,s*1.975],[.206,2.913,s*2.092],.046,.03,8+i);
  const H=REST.hips[i],K=REST.knees[i],F=REST.ankles[i];
  ell([-.075,1.68,s*.235],[.285,.30,.245],0);cap(H,K,.245,.148,10+i);
  ell([.26,1.395,s*.271],[.215,.29,.198],10+i);ell([.56,1.017,s*.283],[.165,.185,.16],10+i);
  cap(K,F,.136,.084,12+i);ell([.275,.55,s*.30],[.171,.267,.154],12+i);
  ell([.015,.14,s*.31],[.105,.15,.098],14+i);ell([.172,.098,s*.31],[.24,.105,.139],14+i);
  for(let toe=0;toe<4;toe++)ell([.373-toe*.019,.081,s*.31+(toe-1.5)*.064],[.073,.064,.039],14+i);
 }
 return fields;
}
