const assert=require('node:assert/strict');
const M=require('./model.js');
const near=(a,b,tol=1e-7)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
near(M.H(300,10,.001),95.0212931632);assert.equal(M.E(300,10),900000);
for(const [k,target] of [[.001,95],[.0004,95],[.01,95],[.0001,50]]){
 const r=M.optimize(k,target);assert.ok(r&&r.H+1e-9>=target&&r.n>=100&&r.n<=500&&r.t>=1&&r.t<=20+1e-9);
 const q=-Math.log1p(-target/100)/k;
 for(let n=100;n<=500;n++){let t=Math.max(1,q/n);if(t<=20)assert.ok(r.E<=M.E(n,t)+1e-6);}
}
assert.equal(M.optimize(.00001,95),null);assert.throws(()=>M.optimize(0,95));assert.throws(()=>M.optimize(.001,100));assert.throws(()=>M.check(0,5,.001));
near(M.C(0,100,8,2,20,100,10),10);near(M.C(10,100,8,2,20,100,10),36-26/Math.E);near(M.C(1000,100,8,2,20,100,10),36);assert.throws(()=>M.C(1,100,0,0,20,100,10));
console.log('PASS: formulas, global minimum vs grid, infeasible target, constraints, concentration balance');

