'use strict';
const $=id=>document.getElementById(id), M=window.LKM;
const defaults={volume:100,n:300,t:10,k:.001,target:95};
const fmt=(x,d=2)=>Number(x).toLocaleString('ru-RU',{maximumFractionDigits:d});
let saved=[];
try{const data=JSON.parse(localStorage.getItem('lkm-web-experiments')||'[]');if(Array.isArray(data))saved=data.filter(r=>r&&['n','t','k','volume','target','H','E'].every(x=>Number.isFinite(r[x]))&&r.n>=100&&r.n<=500&&r.t>=1&&r.t<=20&&r.k>0&&r.volume>0&&r.target>0&&r.target<100).map(r=>({...r,H:M.H(r.n,r.t,r.k),E:M.E(r.n,r.t)}));}catch{}
let p={...defaults},valid=true,rows=[],lastPage='';
function persist(){try{localStorage.setItem('lkm-web-experiments',JSON.stringify(saved));return true;}catch{return false;}}
function record(n,t,k=p.k,volume=p.volume,target=p.target){return{n,t,k,volume,target,H:M.H(n,t,k),E:M.E(n,t)};}
function read(){
  for(const key of Object.keys(defaults)){const el=$(key);if(!el.checkValidity())throw Error('Проверьте поле «'+(document.querySelector('label[for="'+key+'"]').textContent.trim())+'»: значение вне допустимого диапазона или не задано.');}
  const result=Object.fromEntries(Object.keys(defaults).map(x=>[x,Number($(x).value)]));M.check(result.n,result.t,result.k);return result;
}
function metrics(el){$(el).innerHTML=[['Однородность смеси',fmt(M.H(p.n,p.t,p.k),3),'%'],['Условные энергозатраты',fmt(M.E(p.n,p.t),0),'усл. ед.'],['Запас к требованию',(M.H(p.n,p.t,p.k)-p.target>=0?'+':'')+fmt(M.H(p.n,p.t,p.k)-p.target,3),'п.п.']].map(([label,value,unit])=>`<div class="metric"><div class="metric-label">${label}</div><div class="metric-value">${value} <small>${unit}</small></div></div>`).join('');}
const colors=['#087f72','#bd7b38','#7077ad','#9c574e','#91a249','#4c8eac','#b0618b','#777'];
function plot(id,series,xlabel,ylabel,xmax,threshold=null,ymax=100,xmin=0){
 const w=640,h=330,left=56,right=22,top=28,bottom=58,pw=w-left-right,ph=h-top-bottom;
 const X=x=>left+(x-xmin)/(xmax-xmin)*pw,Y=y=>top+ph-y/ymax*ph;
 let s=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${ylabel} в зависимости от ${xlabel}">`;
 for(let i=0;i<=5;i++){let y=ymax*i/5;s+=`<line class="grid" x1="${left}" y1="${Y(y)}" x2="${w-right}" y2="${Y(y)}"/><text x="${left-9}" y="${Y(y)+4}" text-anchor="end">${fmt(y,1)}</text>`;}
 for(let i=0;i<=4;i++){let x=xmin+(xmax-xmin)*i/4;s+=`<text x="${X(x)}" y="${h-bottom+23}" text-anchor="middle">${fmt(x,1)}</text>`;}
 s+=`<text x="${left}" y="14">${ylabel}</text><text x="${left+pw/2}" y="${h-8}" text-anchor="middle">${xlabel}</text>`;
 if(threshold!==null)s+=`<line x1="${left}" x2="${w-right}" y1="${Y(threshold)}" y2="${Y(threshold)}" stroke="#859180" stroke-dasharray="5 5"/><text x="${w-right}" y="${Y(threshold)-6}" text-anchor="end">Цель ${fmt(threshold)}%</text>`;
 series.forEach((r,i)=>{s+=`<path class="series" stroke="${colors[i%colors.length]}" d="${r.points.map(([x,y],j)=>`${j?'L':'M'}${X(x).toFixed(2)},${Y(y).toFixed(2)}`).join(' ')}"/>`;});
 s+=`<line class="cursor" x1="${left}" x2="${left}" y1="${top}" y2="${h-bottom}" stroke="#748776" visibility="hidden"/><rect class="hit" x="${left}" y="${top}" width="${pw}" height="${ph}" fill="transparent"/></svg>`;
 const el=$(id);el.innerHTML=`<div class="chart" tabindex="0" aria-label="Интерактивный график. Наведите указатель или проведите пальцем для значений.">${s}<div class="legend">${series.map((r,i)=>`<span><i style="background:${colors[i%colors.length]}"></i>${r.name}</span>`).join('')}${threshold!==null?'<span>┄ Целевой уровень</span>':''}</div><div class="chart-tooltip" aria-live="off">Наведите указатель или проведите пальцем по графику.</div></div>`;
 const svg=el.querySelector('svg'),hit=el.querySelector('.hit'),cursor=el.querySelector('.cursor'),tooltip=el.querySelector('.chart-tooltip');
 function show(clientX){const box=svg.getBoundingClientRect();const x=Math.max(xmin,Math.min(xmax,xmin+((clientX-box.left)*w/box.width-left)/pw*(xmax-xmin)));cursor.setAttribute('x1',X(x));cursor.setAttribute('x2',X(x));cursor.setAttribute('visibility','visible');tooltip.textContent=`${fmt(x,2)} ${xlabel.includes('Скорость')?'об/мин':'мин'} · `+series.map(r=>{const point=r.points.reduce((a,b)=>Math.abs(b[0]-x)<Math.abs(a[0]-x)?b:a);return r.name+': '+fmt(point[1],3)+'%';}).join(' · ');}
 hit.addEventListener('pointermove',e=>show(e.clientX));hit.addEventListener('pointerdown',e=>show(e.clientX));
}
const timePoints=()=>Array.from({length:201},(_,i)=>i/10);
function concentration(){
 try{const ids=['g1','g2','c1','c2','c0'];for(const id of ids)if(!$(id).value||!$(id).checkValidity())throw Error('Введите корректные расходы и концентрации.');const [g1,g2,c1,c2,c0]=ids.map(x=>Number($(x).value));M.C(0,p.volume,g1,g2,c1,c2,c0);const T=p.volume/(g1+g2),P=(g1*c1+g2*c2)/(g1+g2);$('c-error').textContent='';$('c-info').textContent=`T = ${fmt(T,3)} мин; равновесная концентрация P = ${fmt(P,3)}%. Время устранения 95% начального отклонения: ${fmt(T*Math.log(20),3)} мин.`;plot('c-chart',[{name:'C(t)',points:Array.from({length:201},(_,i)=>{const x=5*T*i/200;return[x,M.C(x,p.volume,g1,g2,c1,c2,c0)];})}],'Время, мин','Концентрация C, %',5*T);
 }catch(e){$('c-error').textContent=e.message;$('c-error').className='notice error';$('c-info').textContent='';$('c-chart').innerHTML='';}
}
function render(){
 try{p=read();valid=true;$('error').hidden=true;}catch(e){valid=false;$('error').textContent=e.message+' Показаны последние корректные результаты.';$('error').hidden=false;}
 ['calculate','optimize','csv'].forEach(x=>$(x).disabled=!valid);
 if(!valid)return;
 const page=location.hash.slice(1)||'home';
 if(page==='home')metrics('home-metrics');
 if(page==='simulation'){
 metrics('sim-metrics');const ok=M.H(p.n,p.t,p.k)>=p.target;$('quality').textContent=ok?'Требуемая однородность достигнута.':'Однородность ниже требования. Увеличьте скорость или время.';$('quality').className='notice'+(ok?'':' error');
 plot('time-chart',[...new Set([100,p.n,500])].sort((a,b)=>a-b).map(n=>({name:fmt(n)+' об/мин',points:timePoints().map(t=>[t,M.H(n,t,p.k)])})),'Время t, мин','Однородность H, %',20,p.target);
 plot('speed-chart',[{name:'t = '+fmt(p.t)+' мин',points:Array.from({length:201},(_,i)=>[100+2*i,M.H(100+2*i,p.t,p.k)])}],'Скорость n, об/мин','Однородность H, %',500,p.target,100,100);concentration();
 }
 if(page==='optimization'){
 const r=M.optimize(p.k,p.target);$('optimize').disabled=!r;
 $('opt-result').innerHTML=r?`<span class="pill">ОПТИМАЛЬНЫЙ РЕЖИМ · ЦЕЛЬ ${fmt(p.target)}%</span><div class="metrics"><div class="metric"><div class="metric-label">Скорость n*</div><div class="metric-value">${fmt(r.n,4)} <small>об/мин</small></div></div><div class="metric"><div class="metric-label">Время t*</div><div class="metric-value">${fmt(r.t,4)} <small>мин</small></div></div><div class="metric"><div class="metric-label">Однородность H*</div><div class="metric-value">${fmt(r.H,4)} <small>%</small></div></div></div><p>Минимальные затраты: <strong>${fmt(r.E,4)} усл. ед.</strong></p><p class="muted">Изменение затрат относительно текущего режима: ${fmt((r.E/M.E(p.n,p.t)-1)*100)}%. Сравнение при одинаковом требовании корректно, если оба режима достигают цели.</p>`:`<div class="notice error">Решения нет: максимум H = ${fmt(M.H(500,20,p.k),4)}% при 500 об/мин и 20 мин. Требуется ${fmt(p.target)}%.</div>`;
 }
 if(page==='results'){
 const base=[[100,5],[100,20],[200,10],[300,10],[500,5],[500,20]].map(([n,t])=>record(n,t));rows=[...base,...saved];
 $('results-table').innerHTML='<thead><tr>'+['Опыт','n, об/мин','t, мин','k, 1/об','V, л','H, %','E, усл. ед.','Цель, %','Статус'].map(x=>'<th scope="col">'+x+'</th>').join('')+'</tr></thead><tbody>'+rows.map((r,i)=>`<tr><td>${i<6?'Базовый '+(i+1):'Мой '+(i-5)}</td><td>${fmt(r.n,4)}</td><td>${fmt(r.t,4)}</td><td>${fmt(r.k,6)}</td><td>${fmt(r.volume)}</td><td>${fmt(r.H,4)}</td><td>${fmt(r.E,2)}</td><td>${fmt(r.target)}</td><td><span class="badge ${r.H+1e-9>=r.target?'':'no'}">${r.H+1e-9>=r.target?'Достигнута':'Ниже цели'}</span></td></tr>`).join('')+'</tbody>';
 plot('compare-chart',rows.slice(0,16).map((r,i)=>({name:`№${i+1}: n=${fmt(r.n)}, k=${fmt(r.k,6)}`,points:timePoints().map(t=>[t,M.H(r.n,t,r.k)])})),'Время t, мин','Однородность H, %',20,p.target);
 const r=M.optimize(p.k,p.target);$('conclusion').innerHTML=`<p>В базовой серии цель ${fmt(p.target)}% выполняют ${base.filter(x=>x.H+1e-9>=p.target).length} из 6 режимов. Увеличение n и t повышает H с насыщением к 100%.</p><p>При одинаковом произведении nt однородность одинакова, но E = n(nt) растёт со скоростью. Режимы 100 об/мин × 20 мин и 200 об/мин × 10 мин дают одинаковое качество, а затраты во втором случае вдвое выше.</p><p>${r?`Оптимум для k = ${fmt(p.k,6)}: n = ${fmt(r.n,4)} об/мин; t = ${fmt(r.t,4)} мин; H = ${fmt(r.H,4)}%; E = ${fmt(r.E,4)} усл. ед.`:'При выбранной интенсивности целевое качество недостижимо в заданных пределах.'}</p><p>Вывод относится к принятой учебной модели. Экспериментальная адекватность без независимых измерений не подтверждена.</p>${rows.length>16?'<p class="muted">На графике показаны первые 16 режимов; CSV и таблица содержат все опыты.</p>':''}`;
 }
}
function route(){let id=location.hash.slice(1)||'home';if(!document.querySelector('section.page#'+CSS.escape(id)))id='home';document.querySelectorAll('.page').forEach(el=>el.hidden=el.id!==id);document.querySelectorAll('nav a').forEach(a=>{const active=a.hash==='#'+id;a.classList.toggle('active',active);active?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current');});if(id!==lastPage){$('sidebar').classList.remove('open');$('menu').setAttribute('aria-expanded','false');window.scrollTo(0,0);$('saved-message').textContent='';$('opt-message').textContent='';}lastPage=id;if((location.hash.slice(1)||'home')!==id){location.hash=id;return;}render();}
window.addEventListener('hashchange',route);
$('parameters').addEventListener('submit',e=>e.preventDefault());
$('parameters').addEventListener('input',e=>{if(e.target.id==='n-range')$('n').value=e.target.value;if(e.target.id==='t-range')$('t').value=e.target.value;if(e.target.id==='n')$('n-range').value=e.target.value;if(e.target.id==='t')$('t-range').value=e.target.value;$('saved-message').textContent='';$('opt-message').textContent='';render();});
['g1','g2','c1','c2','c0'].forEach(id=>$(id).addEventListener('input',()=>{if(valid)concentration();}));
$('reset').addEventListener('click',()=>{Object.entries(defaults).forEach(([key,value])=>$(key).value=value);$('n-range').value=300;$('t-range').value=10;$('saved-message').textContent='';$('opt-message').textContent='';render();});
$('calculate').addEventListener('click',()=>{if(!valid)return;saved.push(record(p.n,p.t));const stored=persist();$('saved-message').textContent=stored?'Опыт сохранён в этом браузере.':'Опыт сохранён на время сеанса. Скачайте CSV перед закрытием.';});
$('optimize').addEventListener('click',()=>{if(!valid)return;const r=M.optimize(p.k,p.target);if(!r)return;saved.push(record(r.n,r.t));const stored=persist();$('opt-message').textContent=stored?'Оптимальный режим сохранён. Откройте раздел результатов.':'Режим сохранён на время сеанса. Скачайте CSV.';});
$('clear').addEventListener('click',()=>{saved=[];persist();render();});
$('csv').addEventListener('click',()=>{if(!valid)return;const header=['Опыт','n, об/мин','t, мин','k, 1/об','V, л','H, %','E, усл. ед.','Цель, %','Цель достигнута'];const lines=[header,...rows.map((r,i)=>[i+1,r.n,r.t,r.k,r.volume,r.H,r.E,r.target,r.H+1e-9>=r.target?'Да':'Нет'])];const csv='\uFEFF'+lines.map(line=>line.map(x=>'"'+String(x).replaceAll('"','""')+'"').join(';')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download='lkm-experiments.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
$('menu').addEventListener('click',()=>{const open=$('sidebar').classList.toggle('open');$('menu').setAttribute('aria-expanded',String(open));});
route();

