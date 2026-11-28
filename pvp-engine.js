/* IV Calculator: offline PvP ranking engine. Source data attribution in pvp-data.json. */
(function(root){
'use strict';
const EPS=1e-7;
function rank(stats,cpms,cap=Infinity){
 if(!Array.isArray(stats)||stats.length!==3||!stats.every(v=>Number.isFinite(v)&&v>0)||cpms.length!==99)throw Error('Invalid Pokémon data');
 const rows=[];
 for(let a=0;a<16;a++)for(let d=0;d<16;d++)for(let h=0;h<16;h++){
  const A=stats[0]+a,D=stats[1]+d,S=stats[2]+h,f=A*Math.sqrt(D*S)/10;
  let lo=0,hi=98;
  while(lo<hi){const mid=(lo+hi+1)>>1;if(Math.max(10,Math.floor(f*cpms[mid]**2))<=cap)lo=mid;else hi=mid-1}
  const m=cpms[lo],cp=Math.max(10,Math.floor(f*m*m));if(cp>cap)continue;
  rows.push({ivs:[a,d,h],id:a*256+d*16+h,level:1+lo/2,cp,product:A*D*m*m*Math.max(10,Math.floor(S*m))});
 }
 rows.sort((a,b)=>b.product-a.product||b.cp-a.cp||b.id-a.id);
 let anchor=0,position=1;
 for(let i=0;i<rows.length;i++){if(i===0||Math.abs(rows[i].product-anchor)>EPS){anchor=rows[i].product;position=i+1}rows[i].rank=position;rows[i].percent=100*rows[i].product/rows[0].product}
 return rows;
}
function matches(data,ivs){const id=ivs[0]*256+ivs[1]*16+ivs[2];return [500,1500,2500].map(cap=>({cap,ids:data.rank1[cap][id]||[]}))}
root.IVPvP=Object.freeze({rank,matches});
})(globalThis);