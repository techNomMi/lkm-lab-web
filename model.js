/* Учебная модель. n: об/мин, t: мин, k: 1/оборот. */
(function (root) {
  'use strict';
  function check(n,t,k) {
    if (![n,t,k].every(Number.isFinite) || n<100 || n>500 || t<1 || t>20 || k<=0) throw Error('Нужны 100 ≤ n ≤ 500, 1 ≤ t ≤ 20 и k > 0.');
  }
  const H=(n,t,k)=>-100*Math.expm1(-k*n*t);
  const E=(n,t)=>n*n*t;
  function optimize(k,target) {
    if(!Number.isFinite(k)||k<=0||!Number.isFinite(target)||target<=0||target>=100) throw Error('Нужны k > 0 и цель от 0 до 100% (не включая границы).');
    const q=-Math.log1p(-target/100)/k;
    if(q>10000+1e-9) return null;
    const n=Math.max(100,q/20),t=Math.max(1,q/n);
    return {n,t,k,H:H(n,t,k),E:E(n,t),target};
  }
  function C(t,V,g1,g2,c1,c2,c0) {
    if (![t,V,g1,g2,c1,c2,c0].every(Number.isFinite)||t<0||V<=0||g1<0||g2<0||g1+g2<=0||[c1,c2,c0].some(c=>c<0||c>100)) throw Error('Проверьте объём, расходы и концентрации: V > 0, G₁ + G₂ > 0, C от 0 до 100%.');
    const P=(g1*c1+g2*c2)/(g1+g2),T=V/(g1+g2);
    return P+(c0-P)*Math.exp(-t/T);
  }
  const model={check,H,E,optimize,C};
  if(typeof module!=='undefined'&&module.exports)module.exports=model;
  else root.LKM=model;
})(typeof window!=='undefined'?window:globalThis);
