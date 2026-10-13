/* ===== Configuration (edit here) ===== */
const CFG={demoUser:'demo',demoPass:'demo123',name:'Machinery Information System',tag:'Engineering & Maintenance Digitalization',contact:'your.email@example.com',owner:'',siteRepo:'',dataRepo:'',ticketRepo:'',branch:'main',apiBase:'https://api.github.com',usersUrl:'users.json'};
Object.assign(CFG,window.MIS_CONFIG||{}); /* repository names come from config.js */

/* ===== Helpers ===== */
const $=s=>document.querySelector(s),E=s=>String(s??'').replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const add=(d,n)=>new Date(new Date(d).getTime()+n*864e5).toISOString().slice(0,10),D0=n=>add(new Date(),n),T=()=>D0(0);
const dd=(a,b)=>Math.round((new Date(b)-new Date(a))/864e5);
const FQ={Daily:1,Weekly:7,Monthly:30,Quarterly:91,Annual:365},ST=['Running','Maintenance','Breakdown','Offline'];
const emp=()=>({machines:[],maintenance:[],breakdowns:[],diodes:[],parts:[],tickets:[],users:[],depts:[],ups:[],cover:[],notify:{on:false,det:true,eng:[]},audit:[]});
const UN='Unassigned';
/* Older service records get the new Month / Active Status / Service Status values */
const mig=d=>{normD(d);if(d&&Array.isArray(d.maintenance))d.maintenance.forEach(r=>{if(!r.month&&r.date)r.month=String(r.date).slice(0,7);if(!r.active)r.active='Active';if(!r.service)r.service=r.status=='Completed'?'Updated':'Pending'});return d};
const load=k=>{try{return mig(JSON.parse(localStorage.getItem(k)))}catch(e){return null}};
const log=a=>{db.audit.unshift({u:S?S.user:'-',t:new Date().toLocaleString(),a});db.audit.splice(500);save()};
const dl=(n,mt,x)=>{if(S&&(S.vo||S.role=='worker')){alert('Downloads are not available for this account.');return}const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([x],{type:mt}));a.download=n;a.click()};
const tb=(c,r)=>`<table><thead><tr>${c.map(x=>`<th>${E(x)}</th>`).join('')}</tr></thead><tbody>${r.map(y=>`<tr>${y.map(v=>`<td>${E(v)}</td>`).join('')}</tr>`).join('')||'<tr><td>No records</td></tr>'}</tbody></table>`;
const BK={status:1,priority:1,alert:1,st:1,stock:1,active:1,service:1};
const bc=v=>({Running:'ok',Updated:'ok',Pending:'wr',Completed:'ok',Active:'ok',OK:'ok',Done:'ok',Low:'ok',Maintenance:'wr',Scheduled:'wr','In Progress':'wr','DUE SOON':'wr',Approaching:'wr',Medium:'wr',Breakdown:'er',Open:'er',OVERDUE:'er','LOW STOCK':'er',High:'er'}[v]||'of');
const cell=(k,v)=>k=='mach'?(v?String(v).split(', ').map(x=>`<span class=chip>${E(x)}</span>`).join(''):'<span class=mu>none</span>'):k=='tr'&&v?`<span class="b ${/^With transformer/.test(v)?'ok':'of'}">${E(v)}</span>`:k=='otk'?(+v?`<span class="b wr">${+v}</span>`:'<span class=mu>0</span>'):BK[k]&&v?`<span class="b ${bc(v)}">${E(v)}</span>`:E(v);

/* ===== Departments: managed list (db.depts). Machines carry a department; tickets store it when raised. ===== */
function normD(d){d=d||db;if(!d||!Array.isArray(d.machines))return;if(!Array.isArray(d.depts))d.depts=[];
 if(!d.notify||typeof d.notify!='object'||Array.isArray(d.notify))d.notify={};const nf=d.notify,TP=/^[\w-]{8,64}$/;
 if(!Array.isArray(nf.eng)){nf.eng=[];if(TP.test(nf.topic||''))nf.eng.push({n:'Administrator',d:['*'],m:nf.mode=='high'?'high':'all',on:true,t:nf.topic})}
 delete nf.topic;delete nf.mode;nf.on=nf.on===true;nf.det=nf.det!==false;
 nf.eng=nf.eng.filter(e=>e&&typeof e=='object'&&TP.test(e.t||'')).map(e=>{let dd=Array.isArray(e.d)?[...new Set(e.d.map(x=>String(x).trim().slice(0,60)).filter(Boolean))]:[];if(dd.includes('*'))dd=['*'];
  return{n:String(e.n||'').trim().slice(0,60)||'Engineer',d:dd,m:e.m=='high'?'high':'all',on:e.on!==false,t:e.t,u:String(e.u||'').trim().slice(0,30)}});
 const DT=/^\d{4}-\d{2}-\d{2}$/;if(!Array.isArray(d.cover))d.cover=[];d.cover=d.cover.filter(c=>c&&typeof c=='object'&&DT.test(c.from||'')&&DT.test(c.to||'')&&String(c.abs||'').trim()&&String(c.cov||'').trim()).map(c=>({abs:String(c.abs).trim().slice(0,30),cov:String(c.cov).trim().slice(0,30),from:c.from,to:c.to,d:Array.isArray(c.d)?[...new Set(c.d.map(x=>String(x).trim().slice(0,60)).filter(Boolean))]:[],note:String(c.note||'').slice(0,120),by:String(c.by||'').slice(0,30)})).slice(0,200);
 d.depts=d.depts.map(x=>String(x||'').trim()).filter(Boolean).filter((x,i,a)=>a.findIndex(y=>y.toLowerCase()==x.toLowerCase())==i);
 d.machines.forEach(m=>{const v=String(m.dept||'').trim();if(!v){m.dept='';return}const c=d.depts.find(x=>x.toLowerCase()==v.toLowerCase());if(c)m.dept=c;else{d.depts.push(v);m.dept=v}});
 normU(d)}
const ldate=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')},
 cvAct=c=>!!c&&c.from<=ldate()&&ldate()<=c.to,
 EDP=()=>{if(!S||!S.eng)return[];const a=[...(S.dp||[])];((db&&db.cover)||[]).forEach(c=>{if(c.cov==S.user&&cvAct(c))c.d.forEach(x=>{if(!a.includes(x))a.push(x)})});return a};
const DP=()=>{const a=(db&&db.depts)||[];return SC()?a.filter(d=>EDP().includes(d)):a},mdept=n=>((db.machines||[]).find(x=>x.name==n)||{}).dept||'',dOpts=c=>[...DP(),...(c&&!DP().includes(c)?[c]:[])],
 dList=()=>DP().length&&!SC()&&db.machines.some(m=>!m.dept)?[...DP(),UN]:[...DP()],depOf=r=>r.dept||mdept(r.machine)||UN;
/* ===== Engineer accounts: work only in allocated departments; deletions are REQUESTS that an administrator approves.
   (Enforced in the app. A GitHub token cannot be limited to departments, so treat engineers as trusted staff.) ===== */
const SC=()=>!!(S&&S.eng),
 dptOf=(k,r)=>k=='machines'||k=='ups'?(r.dept||''):(r.dept||mdept(r.machine)||''),
 inScope=(k,r)=>!SC()||k=='parts'||EDP().includes(dptOf(k,r)),
 V=k=>(db[k]||[]).filter(r=>!r.del&&inScope(k,r)),
 canEd=m=>!!S&&(S.role=='admin'||(!!S.eng&&m!='parts')),
 PK=['machines','tickets','breakdowns','maintenance','diodes','ups','parts'],
 pendN=()=>db?PK.reduce((n,k)=>n+(db[k]||[]).filter(r=>r.del).length,0):0,
 stamp=(o,isNew)=>{if(!S)return;o.ub=S.user;o.ua=new Date().toISOString().slice(0,16).replace('T',' ');if(isNew)o.cb=S.user},
 mOpts=c=>[...V('machines').map(x=>x.name),...(c&&!V('machines').some(x=>x.name==c)?[c]:[])],
 umv=u=>ums(u).filter(x=>inScope('machines',x));
function scopeErr(m,o,i){if(!SC())return '';
 if(i>=0&&db[m][i]&&!inScope(m,db[m][i]))return 'You cannot change records outside your departments.';
 const d=(m=='machines'||m=='ups')?(o.dept||''):(mdept(o.machine)||o.dept||'');
 if(m!='parts'&&!EDP().includes(d))return 'Choose a machine or department from your own departments ('+EDP().join(', ')+').';
 if(m=='machines'&&o.ups){const u=db.ups.find(x=>x.sn==o.ups);if(!u||!EDP().includes(u.dept||''))return 'You can only attach a UPS from your own departments.'}
 return ''}


/* ===== UPS register: db.ups records {sn,asset,model,tr,dept,pur,ins,b1..bN}; machines link by serial (machine.ups). One UPS can feed many machines. ===== */
const ord=n=>{const t=['th','st','nd','rd'],v=n%100;return n+(t[(v-20)%10]||t[v]||t[0])},
 ubn=d=>{let n=7;((d||db).ups||[]).forEach(u=>Object.keys(u).forEach(k=>{const m=/^b(\d+)$/.exec(k);if(m&&u[k]&&+m[1]>n)n=+m[1]}));return n},
 ulast=u=>{for(let k=ubn({ups:[u]});k>=1;k--)if(u['b'+k])return u['b'+k];return ''},
 ucnt=u=>Object.keys(u).filter(k=>/^b\d+$/.test(k)&&u[k]).length,
 ums=u=>db.machines.filter(x=>x.ups&&x.ups==u.sn),
 uList=()=>DP().length&&!SC()&&db.ups.some(u=>!u.dept)?[...DP(),UN]:[...DP()];
function syncUF(d){const f=M.ups.f,n=ubn(d);let have=f.filter(x=>/^b\d+$/.test(x[0])).length;for(let k=have+1;k<=n;k++)f.push(['b'+k,ord(k)+' Battery Replacement','d',0,1])}
function normU(d){if(!Array.isArray(d.ups))d.ups=[];
 for(let i=d.ups.length-1;i>=0;i--){const u=d.ups[i];if(!u||typeof u!='object'||!String(u.sn==null?'':u.sn).trim()){d.ups.splice(i,1);continue}
  ['sn','asset','model','pur','ins'].forEach(k=>u[k]=String(u[k]==null?'':u[k]).trim());
  const t=String(u.tr==null?'':u.tr).trim();u.tr=(u.tr===true||/^(yes|true|1)$/i.test(t)||/^with(?!out)/i.test(t))?'With transformer':'Without transformer';
  const v=String(u.dept||'').trim();if(!v)u.dept='';else{const c=d.depts.find(x=>x.toLowerCase()==v.toLowerCase());if(c)u.dept=c;else{d.depts.push(v);u.dept=v}}
  Object.keys(u).forEach(k=>{if(/^b\d+$/.test(k))u[k]=String(u[k]==null?'':u[k]).trim()})}
 d.machines.forEach(m=>{m.ups=String(m.ups==null?'':m.ups).trim()});syncUF(d)}

/* ===== Data model: [key,label,type,options,formOnly]  types: d date, tm time, n number, s select, a textarea ===== */
const M={
machines:{t:'Machines',req:['name'],u:'name',flt:'status',date:'installed',f:[['name','Machine Name'],['asset','Fixed Asset'],['type','Machine Type'],['model','Model'],['mfr','Manufacturer'],['diode','Diode Model'],['serial','Serial Number'],['loc','Location'],['dept','Department','s','d'],['ups','UPS','s','u'],['status','Status','s',ST],['installed','Installed Date','d'],['doc','Document Link (URL)',0,0,1]]},
ups:{t:'UPS',h:'UPS Register',req:['sn'],u:'sn',flt:'tr',date:'ins',
 f:[['sn','UPS Serial Number'],['asset','Fixed Asset Number'],['model','Model'],['tr','Transformer','s',['With transformer','Without transformer']],['dept','Department','s','d'],['pur','Purchase Date','d'],['ins','Installation Date','d'],['b1','1st Battery Replacement','d',0,1],['b2','2nd Battery Replacement','d',0,1],['b3','3rd Battery Replacement','d',0,1],['b4','4th Battery Replacement','d',0,1],['b5','5th Battery Replacement','d',0,1],['b6','6th Battery Replacement','d',0,1],['b7','7th Battery Replacement','d',0,1]],
 c:[['lastb','Last Battery Change'],['bn','Battery Changes'],['mach','Machines Using It']],
 calc:r=>({lastb:ulast(r),bn:ucnt(r),mach:ums(r).map(x=>x.name).join(', ')})},
maintenance:{t:'Machine Service Rpt',req:['machine','month'],flt:'service',date:'month',tg:['active','service'],
 f:[['machine','Machine','s','m'],['type','Type','s',['Preventive','Corrective','Emergency']],['month','Month','mo'],['active','Active Status','s',['Active','Inactive']],['service','Service Status','s',['Updated','Pending']]],
 c:[['dept','Department']],calc:r=>({dept:depOf(r)})},
tickets:{t:'Tickets',req:['machine','problem','date'],flt:'status',date:'date',
 f:[['no','Ticket No'],['machine','Machine','s','m'],['problem','Problem'],['date','Date Problem Occurred','d'],['time','Time','tm'],['by','Reported By'],['priority','Priority','s',['Low','Medium','High']],['status','Status','s',['Open','In Progress','Completed']],['asg','Assigned To'],['parts','Parts Used'],['desc','Description','a',0,1],['diagnosis','Diagnosis','a',0,1],['cause','Root Cause','a',0,1],['action','Corrective Action','a',0,1],['down','Downtime (Hours)','n',0,1],['completed','Completion Date','d',0,1]],
 c:[['dept','Department']],calc:r=>({dept:depOf(r)})},
breakdowns:{t:'Breakdowns',h:'Breakdown History',req:['machine','date','problem'],flt:'status',date:'date',
 f:[['machine','Machine','s','m'],['date','Date','d'],['time','Time','tm'],['problem','Problem'],['by','Reported By'],['priority','Priority','s',['Low','Medium','High']],['status','Status','s',['Open','In Progress','Completed']],['down','Downtime (Hours)','n'],['completed','Completion Date','d'],['desc','Description','a',0,1],['diagnosis','Diagnosis','a',0,1],['cause','Root Cause','a',0,1],['action','Corrective Action','a',0,1],['parts','Parts Used',0,0,1]],
 c:[['dept','Department']],calc:r=>({dept:depOf(r)})},
diodes:{t:'Diodes',h:'Diode Changing History',req:['machine','no','installed'],flt:'st',date:'installed',
 f:[['machine','Machine','s','m'],['no','Diode Number'],['type','Diode Type'],['installed','Installation Date','d'],['replaced','Replacement Date','d'],['expected','Expected Lifetime (Days)','n'],['reason','Replacement Reason']],
 c:[['op','Operating Days'],['life','Actual Lifetime (Days)'],['st','Status'],['dept','Department']],
 calc:r=>{const op=dd(r.installed,r.replaced||T());return{op,life:r.replaced?op:'',st:r.replaced?'Replaced':(+r.expected&&op>=r.expected*.9?'Approaching':'Active'),dept:depOf(r)}}},
parts:{t:'Spare Parts',req:['no','name'],u:'no',flt:'stock',
 f:[['no','Part Number'],['name','Part Name'],['cat','Category'],['mfr','Manufacturer'],['supplier','Supplier'],['qty','Quantity','n'],['min','Minimum Stock','n'],['loc','Location'],['cost','Unit Cost','n'],['compat','Compatible Machine','s','m']],
 c:[['stock','Stock']],calc:r=>({stock:+r.qty<+r.min?'LOW STOCK':'OK'})}};

/* ===== Demo (fictional) dataset ===== */
function seed(){const d=emp(),mk=['name','asset','type','mfr','diode','serial','loc','dept','status'];
[['PDS-LASER-001','FA-10001','Laser Marking','Sample Mfr','DL-808-A','SN-A001','Line 1','Production','Running',-700],['PDS-LASER-002','FA-10002','Laser Marking','Sample Mfr','DL-808-A','SN-A002','Line 1','Production','Maintenance',-600],['CNC-SAMPLE-01','FA-10003','CNC Mill','Sample Mfr','-','SN-B001','Hall B','Machining','Running',-900],['PRESS-SAMPLE-01','FA-10004','Hydraulic Press','Sample Mfr','-','SN-C001','Hall C','Fabrication','Breakdown',-1200],['PDS-LASER-003','FA-10005','Laser Cutting','Sample Mfr','DL-915-B','SN-D001','Line 2','Production','Running',-300],['OVEN-SAMPLE-01','FA-10006','Curing Oven','Sample Mfr','-','SN-E001','Hall A','Assembly','Offline',-1500]].forEach((a,ix)=>{const o={doc:'',model:['LM-200','LM-200','CM-500','HP-90','LC-300','CO-45'][ix]};mk.forEach((k,i)=>o[k]=a[i]);o.installed=D0(a[9]);d.machines.push(o)});
const N=d.machines.map(x=>x.name);
for(let i=0;i<12;i++)d.maintenance.push({machine:N[i%6],type:['Preventive','Preventive','Corrective','Emergency'][i%4],month:D0(-30*Math.floor(i/6)).slice(0,7),active:i==5?'Inactive':'Active',service:i%3==0?'Pending':'Updated'});
for(let i=0;i<5;i++)d.breakdowns.push({machine:N[(i*2+1)%6],date:D0(-i*35-3),time:'09:30',problem:'Sample fault '+(i+1),by:'Operator',priority:['High','Medium','Low'][i%3],status:i==0?'Open':i==1?'In Progress':'Completed',down:i*2+1,completed:'',desc:'',diagnosis:'',cause:'',action:'',parts:''});
for(let i=0;i<6;i++)d.diodes.push({machine:N[i],no:'D-00'+(i+1),type:'808nm Module',installed:D0(-500+i*60),replaced:i%3==2?D0(-20*i):'',expected:400,reason:i%3==2?'End of life':''});
const pk=['no','name','cat','mfr','supplier','qty','min','loc','cost','compat'];
[['SP-100','Focus Lens','Optics','Sample Mfr','Sample Supplier',12,5,'Store A',85,N[0]],['SP-101','Cooling Filter','Cooling','Sample Mfr','Sample Supplier',2,4,'Store A',30,N[1]],['SP-102','Seal Kit','Hydraulics','Sample Mfr','Sample Supplier',6,2,'Store B',60,N[3]],['SP-103','Driver Board','Electronics','Sample Mfr','Sample Supplier',3,2,'Store A',450,N[4]]].forEach(a=>{const o={};pk.forEach((k,i)=>o[k]=a[i]);d.parts.push(o)});
d.tickets.push({no:'T-0001',machine:N[3],problem:'Hydraulic pressure drop',date:D0(-1),time:'09:15',by:'Operator',priority:'High',status:'Open',desc:'Pressure falls during the press cycle',diagnosis:'',cause:'',action:'',down:'',completed:'',parts:'',pl:[]},
 {no:'T-0002',machine:N[1],problem:'Laser power unstable',date:D0(-3),time:'14:40',by:'Technician A',priority:'Medium',status:'In Progress',desc:'Output power drifts after 30 minutes',diagnosis:'Checking cooling flow',cause:'',action:'',down:'',completed:'',parts:'',pl:[]},
 {no:'T-0003',machine:N[0],problem:'Cooling filter blocked',date:D0(-12),time:'08:05',by:'Operator',priority:'Low',status:'Completed',desc:'Coolant flow alarm',diagnosis:'Filter clogged',cause:'Dirty coolant',action:'Replaced filter',down:'2',completed:D0(-11),parts:'SP-101 x1',pl:[{no:'SP-101',qty:1}],bd:1});
d.breakdowns.push({machine:N[0],date:D0(-12),time:'08:05',problem:'Cooling filter blocked',by:'Operator',priority:'Low',status:'Completed',down:'2',completed:D0(-11),desc:'Coolant flow alarm',diagnosis:'Filter clogged',cause:'Dirty coolant',action:'Replaced filter',parts:'SP-101 x1',ticket:'T-0003'});
d.ups.push({sn:'SN-UPS-1001',asset:'FA-5001',model:'Sample UPS 3 kVA',tr:'With transformer',dept:'Production',pur:D0(-900),ins:D0(-880),b1:D0(-400)},{sn:'SN-UPS-1002',asset:'FA-5002',model:'Sample UPS 1.5 kVA',tr:'Without transformer',dept:'Machining',pur:D0(-500),ins:D0(-480)});d.machines[0].ups='SN-UPS-1001';d.machines[1].ups='SN-UPS-1001';d.machines[2].ups='SN-UPS-1002';
return mig(d)}

/* ===== Authentication: PBKDF2 (Web Crypto). No passwords are stored in this file except the configurable demo login. ===== */
const b64=u=>btoa(String.fromCharCode(...u)),salt=()=>b64(crypto.getRandomValues(new Uint8Array(16)));
async function hash(p,s){const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(p),'PBKDF2',false,['deriveBits']);
 return b64(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:Uint8Array.from(atob(s),c=>c.charCodeAt(0)),iterations:150000,hash:'SHA-256'},k,256)))}
const VOP=[['dash','Dashboard'],['tickets','Tickets'],['machines','Machines'],['ups','UPS'],['maintenance','Machine Service Rpt'],['breakdowns','Breakdowns'],['diodes','Diodes'],['parts','Spare Parts']],
 vok=v=>!(S&&S.vo)||S.pg.includes(v)||(v=='md'&&S.pg.includes('machines'));
let S=null,db,key,SETAB='dep',view='home',q='',filt='',sortK='',sortD=-1,MI=0,ED,IM,DF='',DL=[],WD=[],RP={k:'machines',a:'',b:'',d:''};
function start(mode,u,role,d){S={mode,user:u,role};key='mis_'+mode;db=d;log('User logged in');go('dash')}
function demo(v){start('demo',CFG.demoUser,'admin',seed());if(v=='md'){MI=0;view='md';render()}else if(v)go(v)}
async function out(){log('User logged out');await flush();DF='';S=null;TOK=null;WR=false;WSENT=[];WK=[];WD=[];LASTM='';LASTN='';INBOXMSG='';go('home')}
/* ===== GitHub-only storage =====
   Website  : public repo (GitHub Pages)  -> index.html, app.js, style.css, config.js, users.json
   Data     : PRIVATE repo               -> data.json (+ backups/)
   Logins   : users.json holds, per person, a GitHub access token ENCRYPTED with that person's password (AES-GCM, PBKDF2 600k).
   Read-only token = viewer, read+write token = administrator. GitHub itself enforces who can write. Nothing is kept in the browser. */
const GH=()=>!!(CFG.owner&&CFG.siteRepo&&CFG.dataRepo),isOn=()=>!!S&&S.mode=='real';
let TOK=null,WR=false,SHA=null,DIRTY=0,BUSY=0,STM=0,UL,SAVEOK=0,BASE='',LASTM='',LASTN='',INBOXMSG='',WK=[],WSENT=[],WBUSY=0,PULLING=0;
const u8=s=>new TextEncoder().encode(s),fromB=b=>Uint8Array.from(atob(b),c=>c.charCodeAt(0));
const toB=u=>{let s='';for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode(...u.subarray(i,i+8192));return btoa(s)};
const stat=m=>{const e=$('#gs');if(e)e.textContent=m};
async function api(repo,path,o={},tok=TOK){const r=await fetch(CFG.apiBase+'/repos/'+CFG.owner+'/'+repo+'/contents/'+path+(o.method?'':'?ref='+CFG.branch),{cache:'no-store',...o,headers:{Authorization:'Bearer '+tok,Accept:'application/vnd.github+json','Content-Type':'application/json'}});
 const t=await r.text();let j=null;try{j=t?JSON.parse(t):null}catch(e){}
 if(!r.ok){const e=new Error((j&&j.message)||'GitHub error '+r.status);e.status=r.status;throw e}return j}
async function ghRead(repo,path,tok=TOK){try{const j=await api(repo,path,{},tok);const txt=j.content&&j.encoding=='base64'?new TextDecoder().decode(fromB(j.content.replace(/\s/g,''))):await(await fetch(j.download_url,{cache:'no-store'})).text();return{txt,sha:j.sha}}catch(e){if(e.status==404)return null;throw e}}
async function ghWrite(repo,path,txt,msg,sha,tok=TOK){return(await api(repo,path,{method:'PUT',body:JSON.stringify({message:msg,content:toB(u8(txt)),branch:CFG.branch,...(sha?{sha}:{})})},tok)).content.sha}
/* write test that changes nothing: a deliberately wrong sha gives 409/422 only when writing is allowed */
async function canWrite(tok,repo=CFG.dataRepo,path='data.json'){try{await api(repo,path,{method:'PUT',body:JSON.stringify({message:'permission check (no change)',content:toB(u8('{}')),branch:CFG.branch,sha:'0'.repeat(40)})},tok);return true}catch(e){return e.status==409||e.status==422}}
/* password -> encrypted token */
const key_=async(p,salt)=>crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:600000,hash:'SHA-256'},await crypto.subtle.importKey('raw',u8(p),'PBKDF2',false,['deriveKey']),{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
async function penc(p,tok){const s=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));return{salt:toB(s),iv:toB(iv),ct:toB(new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},await key_(p,s),u8(tok))))}}
const pdec=async(p,x)=>new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:fromB(x.iv)},await key_(p,fromB(x.salt)),fromB(x.ct)));
async function usersPublic(){try{const r=await fetch(CFG.usersUrl+(CFG.usersUrl.includes('?')?'&':'?')+'t='+Date.now(),{cache:'no-store'});return r.ok?(await r.json()).users||[]:null}catch(e){return null}}
const strip=d=>({...d,users:[]});
async function loadAll(){const f=await ghRead(CFG.dataRepo,'data.json');SHA=f?f.sha:null;const d=mig(Object.assign(emp(),f?JSON.parse(f.txt):{}));d.users=[];BASE=JSON.stringify(strip(d));return d}
async function startReal(u,tok,r,pg,dp){TOK=tok;
 if(r=='viewonly'){/* read-only browsing: chosen pages only, no downloads, no reports */
  WR=false;db=await loadAll();const L=(Array.isArray(pg)?pg:[]).filter(k=>VOP.some(x=>x[0]==k));S={mode:'real',user:u,role:'user',vo:true,pg:L.length?L:['dash']};log('User logged in');return go(S.pg[0])}
 if(r=='worker'){/* worker: never touches the data repository; only the tickets repository */
  WR=false;db=emp();WSENT=[];WK=[];S={mode:'real',user:u,role:'worker'};
  try{const f=await ghRead(CFG.ticketRepo,'machines.json');const j=f?JSON.parse(f.txt):{};WK=(j.machines||[]).map(x=>typeof x=='string'?{n:x,d:''}:{n:String(x.n||''),d:String(x.d||'')}).filter(x=>x.n);WD=(j.departments||[]).map(String)}catch(e){WK=[];WD=[]}
  view='wtk';return render()}
 if(r=='engineer'){WR=await canWrite(tok);if(!WR){TOK=null;throw new Error('This engineer login has no write access to the data. Ask the administrator to re-create it with a read-and-write token for '+CFG.dataRepo+'.')}
  db=await loadAll();S={mode:'real',user:u,role:'engineer',eng:true,dp:(Array.isArray(dp)?dp:[]).map(String)};log('User logged in');await loadEng();return go('dash')}
 WR=await canWrite(tok);db=await loadAll();S={mode:'real',user:u,role:WR?'admin':'user'};log('User logged in');await loadEng();go('dash');
 if(WR){await syncMachines();await syncNotify();pullTickets(true)}}
async function reloadData(){db=await loadAll();render()}
/* saving: one commit per burst of changes; viewers never write */
function save(){normD();if(!isOn()||!WR)return;DIRTY=1;clearTimeout(STM);STM=setTimeout(flush,800);stat('Saving...')}
/* Several people can save at the same time. When GitHub reports that the file changed meanwhile, the app merges:
   BASE = data as this browser last loaded/saved it, local = my current data, remote = latest on GitHub.
   Records are matched by key (machine name, ticket no, part no, UPS serial); fields I changed win, fields only others changed are kept,
   spare-part stock is merged as a difference, new records from both sides are kept, ticket numbers are renumbered if two people took the same one. */
const cj=o=>o===null||typeof o!='object'?JSON.stringify(o):Array.isArray(o)?'['+o.map(cj).join(',')+']':'{'+Object.keys(o).sort().map(k=>JSON.stringify(k)+':'+cj(o[k])).join(',')+'}',
 MK={machines:'name',tickets:'no',parts:'no',ups:'sn'},
 nextNo=list=>'T-'+String(Math.max(0,...list.map(t=>+String(t.no).replace(/\D/g,'')||0))+1).padStart(4,'0');
function mrec(k,b,l,r){const o={};new Set([...Object.keys(b||{}),...Object.keys(l),...Object.keys(r)]).forEach(f=>{const lc=!b||cj(l[f])!=cj(b[f]);
  if(k=='parts'&&f=='qty'&&b&&lc&&(f in r)){o[f]=String((+r[f]||0)+((+l[f]||0)-(+b[f]||0)));return}
  const v=lc?l[f]:r[f];if(v!==undefined)o[f]=v});return o}
function msdiff(a,b){const c=new Map();b.forEach(x=>{const j=cj(x);c.set(j,(c.get(j)||0)+1)});return a.filter(x=>{const j=cj(x),n=c.get(j)||0;if(n>0){c.set(j,n-1);return false}return true})}
function mergeArr(k,b,l,r,info){const kf=MK[k],res=[...r];
 if(!kf){msdiff(b,l).forEach(x=>{const j=res.findIndex(y=>cj(y)==cj(x));if(j>=0)res.splice(j,1)});msdiff(l,b).forEach(x=>res.push(x));return res}
 const bm=new Map(b.map(x=>[x[kf],x])),lm=new Map(l.map(x=>[x[kf],x])),rm=new Map(res.map(x=>[x[kf],x])),ix=key=>res.findIndex(y=>y[kf]==key);
 b.forEach(bx=>{const key=bx[kf],lx=lm.get(key),rx=rm.get(key);
  if(!lx){if(rx&&cj(rx)==cj(bx))res.splice(ix(key),1);else if(rx)info.dropped.push('"'+key+'" was changed by someone else, so it was not deleted.');return}
  if(cj(lx)==cj(bx))return;
  if(!rx){res.push(lx);info.dropped.push('"'+key+'" was deleted by someone else, but you changed it, so your version was kept.');return}
  res[ix(key)]=cj(rx)==cj(bx)?lx:mrec(k,bx,lx,rx)});
 l.forEach(lx=>{const key=lx[kf];if(bm.has(key))return;const rx=rm.get(key);
  if(!rx){res.push(lx);return}if(cj(rx)==cj(lx))return;
  if(k=='tickets'){const nn=nextNo(res);info.renum.push([lx.no,nn,lx]);lx.no=nn;res.push(lx)}
  else info.dropped.push('"'+key+'" had just been added by someone else, so your copy was not saved.')});
 return res}
function merge3(B,L,R){const out={...R},info={dropped:[],renum:[]};
 new Set([...Object.keys(L),...Object.keys(R)]).forEach(k=>{const b=B[k],l=L[k],r=R[k];
  if(k=='users'){out.users=[];return}
  if(k=='audit'){const bs=new Set((b||[]).map(cj)),rs=new Set((r||[]).map(cj));out.audit=[...(l||[]).filter(x=>!bs.has(cj(x))&&!rs.has(cj(x))),...(r||[])].slice(0,500);return}
  if(k=='depts'){const bb=b||[],rr=r||[];let a=[...rr];(l||[]).forEach(x=>{if(!bb.includes(x)&&!a.includes(x))a.push(x)});bb.forEach(x=>{if(!(l||[]).includes(x))a=a.filter(y=>y!=x)});out.depts=a;return}
  if(Array.isArray(l)&&Array.isArray(r)&&(Array.isArray(b)||b===undefined)){out[k]=mergeArr(k,b||[],l,r,info);return}
  out[k]=cj(l)!=cj(b)?l:r});
 info.renum.forEach(([o,n,lx])=>{(out.breakdowns||[]).forEach(x=>{if(x.ticket==o&&(L.breakdowns||[]).includes(x))x.ticket=n})});
 return {data:out,info}}
async function mergeRetry(){const B=BASE?JSON.parse(BASE):null;if(!B)return false;
 for(let t=0;t<4;t++){try{const f=await ghRead(CFG.dataRepo,'data.json');if(!f)return false;
  const R=strip(mig(Object.assign(emp(),JSON.parse(f.txt)))),L=JSON.parse(JSON.stringify(strip(db))),mg=merge3(B,L,R),nd=mig(Object.assign(emp(),mg.data));nd.users=[];
  const txt=JSON.stringify(strip(nd),null,1);SHA=await ghWrite(CFG.dataRepo,'data.json',txt,'MIS data update by '+S.user+' (merged)',f.sha);BASE=txt;
  let cur=nd;if(DIRTY){const L2=JSON.parse(JSON.stringify(strip(db)));cur=mig(Object.assign(emp(),merge3(L,L2,JSON.parse(txt)).data));cur.users=[]}
  db=cur;SAVEOK++;stat('Saved (combined with changes from others)');if($('#md')&&$('#md').className=='ov')cl();render();
  const msg=[...mg.info.dropped,...mg.info.renum.map(x=>'Ticket '+x[0]+' is now '+x[1]+' because another ticket took that number.')];if(msg.length)alert('Saved. Notes:\n'+msg.join('\n'));
  syncMachines();syncNotify();return true}catch(e){if(!(e.status==409||e.status==422))throw e}}return false}
async function flush(){clearTimeout(STM);while(BUSY)await new Promise(r=>setTimeout(r,100));if(!DIRTY)return;DIRTY=0;BUSY=1;
 try{const txt=JSON.stringify(strip(db),null,1);SHA=await ghWrite(CFG.dataRepo,'data.json',txt,'MIS data update by '+S.user,SHA);BASE=txt;stat('Saved to GitHub');SAVEOK++;syncMachines();syncNotify()}
 catch(e){stat('NOT SAVED');if(e.status==409||e.status==422){let ok=false;try{ok=await mergeRetry()}catch(x){ok=false}
   if(!ok){alert('Another person changed the data at the same moment and the changes could not be combined. Your last change was NOT saved. The latest data is loaded now; please repeat the change.');await reloadData()}}else alert('Could not save to GitHub: '+e.message)}BUSY=0}
/* every 90 s: if someone else saved and I have nothing unsaved, show their changes (never while a form or field is in use) */
async function pollData(){if(!S||S.mode!='real'||S.role=='worker'||!SHA||DIRTY||BUSY||PULLING)return;const m=$('#md'),ae=typeof document!='undefined'?document.activeElement:null;
 if((m&&m.className=='ov')||(ae&&/^(INPUT|SELECT|TEXTAREA)$/.test(ae.tagName)))return;
 try{const f=await ghRead(CFG.dataRepo,'data.json');if(!f||f.sha==SHA||DIRTY||BUSY)return;const d=mig(Object.assign(emp(),JSON.parse(f.txt)));d.users=[];SHA=f.sha;BASE=JSON.stringify(strip(d));db=d;stat('Updated with changes from others');render()}catch(e){}}
if(typeof setInterval=='function')setInterval(pollData,90000);
if(typeof addEventListener=='function')addEventListener('beforeunload',e=>{if(DIRTY||BUSY){e.preventDefault();e.returnValue=''}});
/* first-time setup: runs ONLY while users.json does not exist in the website repository */
async function doSetup(u,p,p2,tok,er){
 if(!/^[A-Za-z0-9._-]{2,30}$/.test(u))return er('Username: 2-30 letters, numbers, dot, dash or underscore.');
 if(p.length<12)return er('Password must be at least 12 characters.');if(p!=p2)return er('Passwords do not match.');if(!tok)return er('Paste the administrator GitHub token.');
 const rp=await fetch(CFG.apiBase+'/repos/'+CFG.owner+'/'+CFG.dataRepo,{headers:{Authorization:'Bearer '+tok},cache:'no-store'});if(!rp.ok)return er('Cannot open the data repository with this token. Check owner / repository names in config.js and the token access.');
 try{const cur=await ghRead(CFG.dataRepo,'data.json',tok);
  if(!cur)await ghWrite(CFG.dataRepo,'data.json',JSON.stringify(strip(emp())),'Create data file',null,tok);else if(!await canWrite(tok))return er('This token cannot write to the data repository.');
  await ghWrite(CFG.siteRepo,'users.json',JSON.stringify({v:1,users:[{u,r:'admin',...await penc(p,tok)}]},null,1),'Create first user',null,tok)}
 catch(e){return er(e.status==422?'users.json already exists in the website repository. Wait a minute for the site to update, then sign in.':/not accessible|not found|forbidden/i.test(e.message)?'This token needs Contents: Read and write on BOTH repositories.':e.message)}
 await startReal(u,tok)}
async function doLogin(e,setup){const f=new FormData(e.target),u=f.get('u').trim(),p=f.get('p'),er=m=>{$('#le').textContent=m};
 if(u==CFG.demoUser&&p==CFG.demoPass)return demo();
 if(!GH())return er('GitHub is not configured. Fill in config.js.');
 try{er('Please wait...');
  if(setup)return await doSetup(u,p,f.get('p2'),(f.get('t')||'').trim(),er);
  const x=(UL||[]).find(z=>z.u.toLowerCase()==u.toLowerCase());let tok;try{if(!x)throw 0;tok=await pdec(p,x)}catch(_){return er('Invalid username or password.')}
  await startReal(u,tok,x.r,x.pg,x.dp)}catch(err){er(err.message)}}
function loginV(){const setup=GH()&&UL!==undefined&&!(UL&&UL.length);
 return hdr()+`<div class=lg><div class=cd><h2>${CFG.name}</h2>${!GH()?'<p class=er>GitHub is not configured yet (config.js). Only the demo works.</p>':UL===undefined?'<p class=mu>Checking...</p>':setup?'<p class=mu>First-time setup (only once, stored in GitHub): create the administrator. Paste a GitHub token with Contents: Read and write on both repositories. It is stored encrypted with your password.</p>':''}<form onsubmit="doLogin(event,${setup});return false"><label>Username<input name=u autocomplete=username required></label><label>Password<input name=p type=password autocomplete=current-password required></label>${setup?'<label>Confirm Password<input name=p2 type=password autocomplete=new-password required></label><label>Administrator GitHub Token<input name=t type=password autocomplete=off required></label>':''}<p class=er id=le></p><button class="btn p">${setup?'Create Administrator':'Login'}</button></form><hr><p class=mu>Demo Login: <b>${E(CFG.demoUser)}</b> / <b>${E(CFG.demoPass)}</b> (fictional sample data, nothing is saved)</p><button class=btn onclick="demo()">Enter Demo Mode</button></div></div>`}
function commit(m,i,o,X){stamp(o,i<0);i>=0?Object.assign(db[m][i],o):db[m].push(o);log((i>=0?'Updated ':'Created ')+X.t+' record: '+o[X.f[0][0]]);cl();render();return false}
/* Users page: logins are entries in users.json of the website repository */
async function ulist(){const el=$('#ul');try{const f=await ghRead(CFG.siteRepo,'users.json'),us=f?JSON.parse(f.txt).users:[];el.innerHTML=`<table><thead><tr><th>Username<th>Access<th></tr></thead><tbody>${us.map(x=>`<tr><td>${E(x.u)}<td>${x.r=='admin'?'Administrator (can edit)':x.r=='worker'?'Worker (raise tickets only)':x.r=='viewonly'?'View only ('+(Array.isArray(x.pg)?x.pg.length:0)+' pages, no downloads)':x.r=='engineer'?'Engineer ('+E((x.dp||[]).join(', ')||'no departments')+')':'Viewer (read only)'}<td>${x.r=='engineer'?`<button class=btn onclick="uDept('${E(x.u)}')">Departments</button>`:''}${x.u.toLowerCase()==S.user.toLowerCase()?'(you)':`<button class=btn onclick="delU('${E(x.u)}')">Remove</button>`}`).join('')}</tbody></table>`}catch(e){if(el)el.textContent=e.message}}
function vpShow(v){const e=$('#vpg'),g=$('#epg');if(e)e.style.display=v=='viewonly'?'':'none';if(g)g.style.display=v=='engineer'?'':'none'}
async function addU(e){const f=new FormData(e.target),u=f.get('u').trim(),p=f.get('p'),t=f.get('t').trim();
 try{if(!/^[A-Za-z0-9._-]{2,30}$/.test(u))throw new Error('Username: 2-30 letters, numbers, dot, dash or underscore.');if(p.length<12)throw new Error('Password must be at least 12 characters.');
  const rr=f.get('r'),wk=rr=='worker',vo=rr=='viewonly',eng=rr=='engineer';let pgs=[],dps=[];
  if(eng){dps=f.getAll('dp').filter(d=>db.depts.includes(d));if(!dps.length)throw new Error('Tick at least one department for the engineer.')}
  if(vo){pgs=f.getAll('pg').filter(k=>VOP.some(x=>x[0]==k));if(!pgs.length)throw new Error('Tick at least one page for the View only user.')}
  if(wk){if(!TR())throw new Error('Set ticketRepo in config.js first.');
   let leak=false;try{leak=!!await ghRead(CFG.dataRepo,'data.json',t)}catch(_){}
   if(leak)throw new Error('This token can read the data repository. A worker token must be limited to the tickets repository only.');
   await syncMachines(true);if(INBOXMSG)throw new Error(INBOXMSG);
   if(!await canWrite(t,CFG.ticketRepo,'machines.json'))throw new Error('This token cannot write to the tickets repository ('+CFG.ticketRepo+'). Give it Contents: Read and write on that repository only.')}
  else if(!await ghRead(CFG.dataRepo,'data.json',t))throw new Error('This token cannot read the data repository.');
  if(eng){if(!await canWrite(t))throw new Error('This token cannot write to the data repository. An engineer needs Contents: Read and write on '+CFG.dataRepo+' only.');if(await canWrite(t,CFG.siteRepo,'users.json'))throw new Error('This token can also write to the website repository ('+CFG.siteRepo+'). Create a token for '+CFG.dataRepo+' only.')}
  if(vo&&await canWrite(t))throw new Error('This token can WRITE to the data repository. A View only user needs a read-only token (Contents: Read-only on '+CFG.dataRepo+' only).');
  const w=(wk||vo||eng)?false:await canWrite(t),cur=await ghRead(CFG.siteRepo,'users.json'),j=cur?JSON.parse(cur.txt):{v:1,users:[]};
  if(j.users.some(x=>x.u.toLowerCase()==u.toLowerCase()))throw new Error('This username already exists.');
  j.users.push({u,r:wk?'worker':vo?'viewonly':eng?'engineer':w?'admin':'viewer',...(vo?{pg:pgs}:{}),...(eng?{dp:dps}:{}),...await penc(p,t)});await ghWrite(CFG.siteRepo,'users.json',JSON.stringify(j,null,1),'Add user '+u,cur&&cur.sha);
  const rl=wk?'worker':vo?'view only user':eng?'engineer':w?'administrator':'viewer';log('User added: '+u+' ('+rl+')');e.target.reset();ulist();alert('User added as '+rl+'. They can sign in once the website has refreshed (about a minute).')}catch(err){alert(err.message)}}
async function delU(u){if(!confirm('Remove '+u+' from the login list? To fully revoke access also delete that person\'s GitHub token.'))return;
 try{const cur=await ghRead(CFG.siteRepo,'users.json'),j=JSON.parse(cur.txt);j.users=j.users.filter(x=>x.u!=u);await ghWrite(CFG.siteRepo,'users.json',JSON.stringify(j,null,1),'Remove user '+u,cur.sha);log('User removed: '+u);ulist()}catch(e){alert(e.message)}}
/* Backups inside the private data repository (backups/ folder) */
async function bkNow(){try{const n='backups/mis-backup-'+new Date().toISOString().replace(/[:.]/g,'-').slice(0,19)+'.json';await ghWrite(CFG.dataRepo,n,JSON.stringify(strip(db)),'MIS backup by '+S.user,null);log('Backup created: '+n);bkList();alert('Backup saved in GitHub: '+n)}catch(e){alert(e.message)}}
async function bkList(){const el=$('#bk');try{const l=(await api(CFG.dataRepo,'backups')).filter(x=>/^[\w.-]+\.json$/.test(x.name)).sort((a,b)=>a.name<b.name?1:-1);el.innerHTML=l.length?`<table><thead><tr><th>Backup<th></tr></thead><tbody>${l.map(x=>`<tr><td>${E(x.name)}<td><button class=btn onclick="bkRestore('${E(x.name)}')">Restore</button>`).join('')}</tbody></table>`:'<p class=mu>No backups yet.</p>'}catch(e){if(el)el.innerHTML=e.status==404?'<p class=mu>No backups yet.</p>':E(e.message)}}
async function bkRestore(n){if(!/^[\w.-]+\.json$/.test(n)||!confirm('Replace ALL current data with '+n+'?'))return;try{const f=await ghRead(CFG.dataRepo,'backups/'+n);db=mig(Object.assign(emp(),JSON.parse(f.txt)));db.users=[];log('Backup restored: '+n);save();render()}catch(e){alert(e.message)}}
function upLocal(){const d=load('mis_real');if(!d||!(d.machines||[]).length)return alert('No old data found in this browser.');if(confirm('Replace the GitHub data with the old data found in this browser?')){db=mig(Object.assign(emp(),d));db.users=[];log('Old browser data imported');save();render()}}

/* ===== Worker accounts: raise tickets ONLY =====
   A worker token has access to the separate tickets repository (CFG.ticketRepo) and NOT to the data repository.
   Worker  -> writes one file per ticket into  inbox/  of the tickets repository.
   Admin   -> imports inbox/ files as Open tickets (new ticket number), then deletes them from the inbox.
   Admin also keeps  machines.json  (machine NAMES only) in the tickets repository so workers can pick a machine. */
const TR=()=>!!CFG.ticketRepo;
async function syncMachines(force){if(!isOn()||!WR||S.role!='admin'||!TR())return;
 const seen={},items=db.machines.map(m=>({n:String(m.name||'').trim(),d:String(m.dept||'').trim()})).filter(m=>m.n&&!seen[m.n]&&(seen[m.n]=1)).sort((x,y)=>x.n<y.n?-1:1),str=JSON.stringify({v:2,departments:[...DP()],machines:items},null,1);
 if(!force&&str==LASTM)return;
 try{const f=await ghRead(CFG.ticketRepo,'machines.json');
  if(!f||f.txt!=str)await ghWrite(CFG.ticketRepo,'machines.json',str,'Update machine list',f&&f.sha);
  LASTM=str;INBOXMSG=''}
 catch(e){INBOXMSG='Worker tickets repository not reachable: '+e.message+' (administrator token needs Contents: Read and write on '+CFG.ticketRepo+').'}}
const cut=(v,n)=>String(v==null?'':v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim().slice(0,n);
async function pullTickets(silent){if(!isOn()||!WR||S.role!='admin'||!TR()||PULLING)return;PULLING=1;
 try{let l;try{l=await api(CFG.ticketRepo,'inbox')}catch(e){if(e.status==404){if(!silent)alert('No new worker tickets.');return}throw e}
  l=(Array.isArray(l)?l:[]).filter(x=>x.type=='file'&&/^[\w.-]+\.json$/.test(x.name)).sort((a,b)=>a.name<b.name?-1:1);
  if(!l.length){if(!silent)alert('No new worker tickets.');return}
  const got=[];
  for(const x of l){const f=await ghRead(CFG.ticketRepo,'inbox/'+x.name);if(!f)continue;let j;try{j=JSON.parse(f.txt)}catch(e){continue}
   got.push({name:x.name,sha:f.sha,j})}
  let n=0;
  for(const g of got){if(db.tickets.some(t=>t.srcf==g.name))continue;const j=g.j||{};
   const machine=cut(j.machine,120),problem=cut(j.problem,300);if(!machine||!problem)continue;
   db.tickets.push({no:tno(),machine,problem,date:/^\d{4}-\d{2}-\d{2}$/.test(j.date)?j.date:T(),time:/^\d{2}:\d{2}$/.test(j.time)?j.time:'',by:cut(j.by,80)||cut(j.worker,40),
    priority:['Low','Medium','High'].includes(j.priority)?j.priority:'Medium',status:'Open',dept:db.machines.some(x=>x.name==machine)?mdept(machine):(cut(j.dept,80)==UN?'':cut(j.dept,80)),desc:cut(j.desc,2000),diagnosis:'',cause:'',action:'',down:'',completed:'',pl:[],parts:'',
    srcf:g.name,src:'Worker: '+cut(j.worker,40)});n++;
   log('Ticket raised by worker '+cut(j.worker,40)+': '+db.tickets[db.tickets.length-1].no+' - '+machine+' - '+problem)}
  if(n){const before=SAVEOK;save();await flush();if(SAVEOK<=before){if(!silent)alert('Tickets were NOT saved. They stay in the inbox and will be imported next time.');return}}
  /* delete from inbox only after the data is safely saved in GitHub */
  for(const g of got){try{await api(CFG.ticketRepo,'inbox/'+g.name,{method:'DELETE',body:JSON.stringify({message:'Imported by '+S.user,sha:g.sha,branch:CFG.branch})})}catch(e){}}
  if(n){stat(n+' worker ticket(s) imported');if(['dash','tickets','machines'].includes(view)&&!$('#md').className)render()}
  if(!silent)alert(n+' worker ticket(s) imported.')}
 catch(e){if(!silent)alert('Could not read worker tickets: '+e.message);else INBOXMSG='Worker inbox not reachable: '+e.message}
 finally{PULLING=0}}
if(typeof setInterval=='function')setInterval(()=>{if(S&&S.mode=='real'&&S.role=='admin')pullTickets(true)},120000);
function wdeps(){const used=new Set(WK.map(x=>x.d||UN));return[...WD.filter(d=>used.has(d)),...(used.has(UN)&&WD.length?[UN]:[])]}
function wmOpts(dep){const has=wdeps().length>0;if(has&&!dep)return'<option value="">Select department first</option>';return'<option value="">-- Select --</option>'+WK.filter(x=>!has||(x.d||UN)==dep).map(x=>`<option>${E(x.n)}</option>`).join('')}
function wdep(v){const s=$('#wm');s.disabled=!v;s.innerHTML=wmOpts(v)}
function workerV(){const hasD=wdeps().length>0,mo=WK.length?`${hasD?`<label>Department *<select name=dept onchange="wdep(this.value)"><option value="">-- Select --</option>${wdeps().map(d=>`<option>${E(d)}</option>`).join('')}</select></label>`:''}<label>Machine *<select name=machine id=wm${hasD?' disabled':''}>${wmOpts('')}</select></label>`:'<label>Machine *<input name=machine required maxlength=120></label>';
 return `<h2>Raise a Ticket</h2><div class=cd style="max-width:640px"><p class=mu>Report a machine problem. The maintenance team receives it as an Open ticket.</p><form onsubmit="return wsub(event)"><div class=fg>${mo}<label>Date Problem Occurred *<input type=date name=date value="${T()}" required></label><label>Time<input type=time name=time value="${new Date().toTimeString().slice(0,5)}"></label><label>Reported By<input name=by value="${E(S.user)}" maxlength=80></label><label>Priority<select name=priority><option>Low</option><option selected>Medium</option><option>High</option></select></label></div><label>Problem *<input name=problem required maxlength=300></label><label>Description<textarea name=desc rows=3 maxlength=2000></textarea></label><p class=er id=we></p><button class="btn p" id=wb>Submit Ticket</button></form></div>
 <h3>Sent in this session</h3><div class=tw>${tb(['Sent at','Machine','Problem','Priority','Status'],WSENT.map(x=>[x.at,x.machine,x.problem,x.priority,'Sent to maintenance team']))}</div>`}
async function wsub(e){e.preventDefault();if(WBUSY)return false;const f=new FormData(e.target),g=k=>cut(f.get(k),k=='desc'?2000:300),er=m=>{$('#we').textContent=m;return false};
 const o={machine:cut(f.get('machine'),120),problem:g('problem'),date:g('date'),time:g('time'),by:cut(f.get('by'),80)||S.user,priority:['Low','Medium','High'].includes(f.get('priority'))?f.get('priority'):'Medium',desc:g('desc'),dept:cut(f.get('dept'),80),worker:S.user,submitted:new Date().toISOString()};
 if(wdeps().length&&WK.length&&!o.dept)return er('Select the department.');if(!o.machine)return er('Select the machine.');if(!o.problem)return er('Enter the problem.');if(!/^\d{4}-\d{2}-\d{2}$/.test(o.date))return er('Enter the date the problem happened.');
 WBUSY=1;$('#wb').disabled=true;er('Sending...');
 try{const nm=o.submitted.replace(/[:.]/g,'-')+'-'+Math.random().toString(36).slice(2,8)+'.json';
  await ghWrite(CFG.ticketRepo,'inbox/'+nm,JSON.stringify(o,null,1),'Ticket from '+S.user,null);
  await notifyAdmin(o);WSENT.unshift({at:new Date().toLocaleString(),machine:o.machine,problem:o.problem,priority:o.priority});WBUSY=0;render();alert('Ticket sent. Thank you.')}
 catch(err){WBUSY=0;const b=$('#wb');if(b)b.disabled=false;er('Could not send the ticket: '+err.message)}
 return false}

/* ===== Mobile notifications (ntfy) for new worker tickets. Switched on/off by the administrator in Settings.
   Admin settings live in db.notify (private data repo). Workers read mis-tickets/notify.json:
   when OFF the file contains no topic at all, so nothing can be sent. ===== */
function newTopic(){const c='abcdefghijkmnpqrstuvwxyz23456789',a=crypto.getRandomValues(new Uint8Array(16));return'mis-'+[...a].map(x=>c[x%c.length]).join('')}
let NQ=Promise.resolve();
function syncNotify(force){const p=NQ.then(()=>syncNotify1(force),()=>syncNotify1(force));NQ=p.catch(()=>{});return p}
async function syncNotify1(force){if(!isOn()||!WR||S.role!='admin'||!TR())return false;const n=db.notify||{},td=ldate(),cvw=e=>e.u?(db.cover||[]).filter(c=>c.cov==e.u&&c.to>=td&&c.d.length).map(c=>({d:c.d,f:c.from,t:c.to})):[],act=(n.eng||[]).filter(e=>e.on&&e.t&&(e.d.length||cvw(e).length)),
 o=n.on&&act.length?{v:2,on:true,det:n.det!==false,eng:act.map(e=>{const w=cvw(e);return w.length?{t:e.t,d:e.d,m:e.m,cv:w}:{t:e.t,d:e.d,m:e.m}})}:{v:1,on:false},str=JSON.stringify(o,null,1);
 if(!force&&str==LASTN)return true;
 try{const f=await ghRead(CFG.ticketRepo,'notify.json');if(!f||f.txt!=str)await ghWrite(CFG.ticketRepo,'notify.json',str,'Update notification settings',f&&f.sha);LASTN=str;return true}
 catch(e){INBOXMSG='Worker tickets repository not reachable: '+e.message+' (administrator token needs Contents: Read and write on '+CFG.ticketRepo+').';return false}}
async function ntfyPost(o){const ctl=typeof AbortController!='undefined'?new AbortController():null;if(ctl)setTimeout(()=>ctl.abort(),6000);
 const r=await fetch('https://ntfy.sh/',{method:'POST',signal:ctl?ctl.signal:undefined,body:JSON.stringify({...o,click:location.href.split('#')[0].split('?')[0]})});if(!r.ok)throw new Error('ntfy answered '+r.status)}
/* Worker side: alert every active engineer whose departments include the ticket's department (or "All"), respecting each one's alert level. */
async function notifyAdmin(o){try{const f=await ghRead(CFG.ticketRepo,'notify.json');if(!f)return;const n=JSON.parse(f.txt);if(n.on!==true)return;
 const OK=/^[\w-]{8,64}$/,T=Array.isArray(n.eng)?n.eng:(OK.test(n.topic||'')?[{t:n.topic,d:['*'],m:n.mode}]:[]),
  mm=WK.find(x=>x.n==o.machine),rd=mm?mm.d:(o.dept==UN?'':o.dept)||'',seen={},
  hit=T.filter(e=>{if(!e||!OK.test(e.t||'')||seen[e.t])return false;const td=ldate(),d=(Array.isArray(e.d)?e.d:['*']).concat(...(Array.isArray(e.cv)?e.cv:[]).filter(w=>w&&w.f<=td&&td<=w.t&&Array.isArray(w.d)).map(w=>w.d));
   if(e.m=='high'&&o.priority!='High')return false;if(!(d.includes('*')||(rd&&d.includes(rd))))return false;seen[e.t]=1;return true}),
  dt=n.det!==false,title=(dt?'New ticket: '+o.machine+(rd?' ('+rd+')':''):'New ticket received').slice(0,120),
  msg=(dt?o.priority+' priority \u00b7 '+o.problem+' \u00b7 by '+o.worker:'Open MIS to see the details.').slice(0,300);
 await Promise.all(hit.map(e=>ntfyPost({topic:e.t,title,message:msg,priority:o.priority=='High'?4:3,tags:['wrench']}).catch(()=>{})))}catch(e){}}
let ND=[];
function notifCard(){if(S.role!='admin')return'';const n=db.notify||{},on=!!n.on;
 if(!isOn())return`<div class=cd><h3>Mobile notifications</h3><p class=mu>Not available in demo mode.</p></div>`;
 if(!TR())return`<div class=cd><h3>Mobile notifications</h3><p class=mu>Set ticketRepo in config.js to use worker tickets and notifications.</p></div>`;
 ND=['*',...DP()];
 const eng=(n.eng||[]).map((e,i)=>`<div class=cd style="margin:8px 0;${e.on?'':'opacity:.6'}"><div class=tools><b>${E(e.n)}</b>${e.d.length?'':'<span class=b style="--c:var(--wr)">no department: never notified</span>'}<span class=mu>ntfy topic:</span><input readonly value="${E(e.t)}" onfocus="this.select()" aria-label="Topic for ${E(e.n)}" style="max-width:270px"></div>
  <div class=tools>${ND.map((k,j)=>`<button class="btn${e.d.includes(k)?' p':''}" onclick="eChip(${i},${j})">${k=='*'?'All departments':E(k)}</button>`).join('')}</div>
  <div class=tools><label style="display:flex;gap:6px;align-items:center;margin:0">Alert on <select aria-label="Alert level" onchange="eSet(${i},'m',this.value)" style="width:auto;margin:0"><option value=all${e.m!='high'?' selected':''}>Every ticket</option><option value=high${e.m=='high'?' selected':''}>High priority only</option></select></label><label style="display:flex;gap:6px;align-items:center;margin:0">Login <select aria-label="Login for cover" onchange="eSet(${i},'u',this.value)" style="width:auto;margin:0"><option value="">none</option>${ENG.map(x=>`<option${e.u==x.u?' selected':''}>${E(x.u)}</option>`).join('')}${e.u&&!ENG.some(x=>x.u==e.u)?`<option selected>${E(e.u)}</option>`:''}</select></label><label style="display:flex;gap:6px;align-items:center;margin:0"><input type=checkbox style="width:auto;margin:0" ${e.on?'checked':''} onchange="eSet(${i},'on',this.checked)">Active</label><button class=btn onclick="eTest(${i})">Send test</button><button class=btn onclick="eNew(${i})">New topic</button><button class=btn onclick="eRen(${i})">Rename</button><button class=btn onclick="eDel(${i})">Remove</button></div></div>`).join('');
 return`<div class=cd><h3>Mobile notifications (new worker tickets)</h3><p>Status: <span class=b style="--c:var(--${on?'ok':'of'})">${on?'ACTIVATED':'DEACTIVATED'}</span></p>
 <p class=mu>${on?'Each active engineer below gets an alert on their phone for tickets in their departments.':'Off: no alerts are sent and no topics are stored in the tickets repository. Activate it when you want phone alerts.'}</p>
 <button class="btn${on?'':' p'}" onclick="notifToggle()">${on?'Deactivate':'Activate'}</button>
 ${on?`<label style="display:flex;gap:8px;align-items:center;margin:10px 0"><input type=checkbox id=nd style="width:auto;margin:0" ${n.det!==false?'checked':''} onchange="notifDet()"> Include machine and problem in the alert (off = generic "New ticket received")</label>
 <h3>Engineers</h3>${eng||'<p class=mu>No engineers yet.</p>'}
 <form class=tools onsubmit="return eAdd(event)"><input name=n placeholder="New engineer name" maxlength=60 required><button class="btn p">Add engineer</button></form>
 <ol class=mu><li>Each engineer installs the free <b>ntfy</b> app (Android / iPhone).</li><li>They tap +, then enter THEIR topic from the list above (default server ntfy.sh).</li><li>Choose their departments here, then press "Send test".</li></ol>
 <p class=mu>Tickets with no department alert only engineers set to "All departments". Alerts pass through ntfy.sh; keep topics private and use "New topic" for one person if theirs leaks.</p>`:''}</div>`}
async function notifToggle(){if(S.role!='admin'||!TR())return;const n=db.notify;
 if(!n.on){n.on=true;if(!n.eng.length)n.eng.push({n:'Administrator',d:['*'],m:'all',on:true,t:newTopic()});save();INBOXMSG='';
  if(!await syncNotify(true)){n.on=false;save();alert('Could not activate: '+(INBOXMSG||'unknown error'))}else log('Mobile notifications activated')}
 else{n.on=false;save();await syncNotify(true);log('Mobile notifications deactivated')}
 render()}
async function nPush(msg){save();if(!await syncNotify(true))alert('Saved here, but the tickets repository could not be updated: '+INBOXMSG);if(msg)log(msg);render()}
async function notifDet(){if(S.role!='admin')return;db.notify.det=$('#nd')?$('#nd').checked:true;await nPush()}
function eAdd(ev){ev.preventDefault();if(S.role!='admin')return false;const v=String(new FormData(ev.target).get('n')||'').trim().slice(0,60);if(!v)return false;
 db.notify.eng.push({n:v,d:[],m:'all',on:true,t:newTopic()});nPush('Engineer added to notifications: '+v);return false}
function eChip(i,j){if(S.role!='admin')return;const e=db.notify.eng[i],k=ND[j];if(!e||k==null)return;
 if(k=='*')e.d=e.d.includes('*')?[]:['*'];else{const a=e.d.filter(x=>x!='*'),p=a.indexOf(k);if(p>=0)a.splice(p,1);else a.push(k);e.d=a}return nPush()}
function eSet(i,k,v){if(S.role!='admin')return;const e=db.notify.eng[i];if(!e)return;if(k=='m')e.m=v=='high'?'high':'all';if(k=='on')e.on=!!v;if(k=='u')e.u=String(v||'').slice(0,30);return nPush()}
function eRen(i){if(S.role!='admin')return;const e=db.notify.eng[i];if(!e)return;const v=(prompt('Engineer name',e.n)||'').trim().slice(0,60);if(!v||v==e.n)return;e.n=v;return nPush('Notification engineer renamed: '+v)}
function eDel(i){if(S.role!='admin')return;const e=db.notify.eng[i];if(!e||!confirm('Remove '+e.n+' from notifications? Their phone stops receiving alerts.'))return;const nm=e.n;db.notify.eng.splice(i,1);return nPush('Engineer removed from notifications: '+nm)}
function eNew(i){if(S.role!='admin')return;const e=db.notify.eng[i];if(!e||!confirm('Create a new topic for '+e.n+'? They must subscribe to the new topic in the ntfy app.'))return;e.t=newTopic();return nPush('Notification topic regenerated for '+e.n)}
async function eTest(i){const e=db.notify.eng[i];if(!e)return;
 try{await ntfyPost({topic:e.t,title:'MIS test notification',message:'Notifications are working for '+e.n+'.',tags:['white_check_mark']});alert('Test sent to '+e.n+'. If they subscribed to the topic in the ntfy app it should arrive in a few seconds.')}catch(x){alert('Could not send the test: '+x.message)}}

/* UPS selector inside the machine form: same-department UPS first, with how many other machines share each one */
function upsSel(r){const cd=r.dept||'',cur=r.ups||'',ix=ED?ED.i:-1,
 opt=u=>{const c=db.machines.filter((x,j)=>x.ups==u.sn&&j!=ix).length;return `<option value="${E(u.sn)}"${cur==u.sn?' selected':''}>${E(u.sn+(u.model?' \u00b7 '+u.model:'')+(c?' (also used by '+c+')':''))}</option>`},
 same=cd?V('ups').filter(u=>(u.dept||'')==cd):[],oth=V('ups').filter(u=>!cd||(u.dept||'')!=cd);
 return `<select name=ups id=mups><option value="">None</option>${same.length?`<optgroup label="${E(cd)} UPS">${same.map(opt).join('')}</optgroup>`:''}${oth.length?`<optgroup label="${same.length?'Other departments':'All UPS'}">${oth.map(opt).join('')}</optgroup>`:''}${cur&&!db.ups.some(u=>u.sn==cur)?`<option value="${E(cur)}" selected>${E(cur)} (not in UPS list)</option>`:''}</select>`}
function mupsRef(){const f=$('#md form'),s=$('#mups');if(!f||!s)return;s.outerHTML=upsSel({dept:f.elements.dept.value,ups:s.value})}
/* UPS add / edit form: transformer switch, battery replacement dates (7 + as many more as needed) */
let UD=null,UX=7;
function uform(i){if(!canEd('ups'))return;if(i>=0&&db.ups[i]&&(db.ups[i].del||!inScope('ups',db.ups[i])))return;ED={m:'ups',i};UD=i>=0?{...db.ups[i]}:{tr:'Without transformer',dept:(DF&&DF!=UN&&DP().includes(DF))?DF:''};UX=ubn({ups:[UD]});udraw()}
function ucollect(){const f=$('#md form');if(!f||!UD)return;const g=n=>f.elements[n]?f.elements[n].value.trim():'';['sn','asset','model','dept','pur','ins'].forEach(k=>UD[k]=g(k));UD.tr=f.elements.tr&&f.elements.tr.checked?'With transformer':'Without transformer';for(let k=1;k<=UX;k++)UD['b'+k]=g('b'+k)}
function uadd(){ucollect();UX++;udraw()}
function udraw(){const u=UD,i=ED.i,ms=i>=0?umv(db.ups[i]):[];let bats='';for(let k=1;k<=UX;k++)bats+=`<label>${ord(k)} battery replacement<input type=date name=b${k} value="${E(u['b'+k]||'')}"></label>`;
 $('#md').className='ov';$('#md').innerHTML=`<div class="mb wide"><h3>${i>=0?'Edit':'Add'} UPS</h3><form onsubmit="return usv(event)"><div class=fg><label>UPS Serial Number *<input name=sn value="${E(u.sn||'')}"></label><label>Fixed Asset Number<input name=asset value="${E(u.asset||'')}"></label><label>Model<input name=model value="${E(u.model||'')}"></label>
 <label class=sw><input type=checkbox name=tr${u.tr=='With transformer'?' checked':''} onchange="$('#trt').textContent=this.checked?'With transformer':'Without transformer'"><span class=trk></span><span id=trt>${E(u.tr||'Without transformer')}</span></label>
 <label>Department<select name=dept><option value="">-- Select --</option>${dOpts(u.dept).map(x=>`<option${u.dept==x?' selected':''}>${E(x)}</option>`).join('')}</select></label><label>Purchase Date<input type=date name=pur value="${E(u.pur||'')}"></label><label>Installation Date<input type=date name=ins value="${E(u.ins||'')}"></label></div>
 <h3>Battery replacement dates</h3><div class=fg>${bats}</div><p><button type=button class=btn onclick="uadd()">+ Add ${ord(UX+1)} replacement</button></p>
 <h3>Machines using this UPS</h3><p>${ms.length?ms.map(x=>`<span class=chip>${E(x.name)}</span>`).join(''):'<span class=mu>None yet. Attach a UPS from each machine\'s Edit form.</span>'}</p><p class=er id=fe></p><button class="btn p">Save UPS</button><button type=button class=btn onclick="cl()">Cancel</button></form></div>`}
function usv(e){e.preventDefault();if(!canEd('ups'))return false;const f=e.target,X=M.ups,i=ED.i,er=t=>{$('#fe').textContent=t;return false},g=n=>(f.elements[n]?f.elements[n].value:'').trim();
 const o={sn:g('sn'),asset:g('asset'),model:g('model'),tr:f.elements.tr.checked?'With transformer':'Without transformer',dept:g('dept'),pur:g('pur'),ins:g('ins')};
 if(!o.sn)return er('Required: UPS Serial Number');
 {const sce=scopeErr('ups',o,i);if(sce)return er(sce)}
 if(db.ups.some((r,j)=>j!=i&&r.sn.toLowerCase()==o.sn.toLowerCase()))return er('This UPS Serial Number already exists.');
 if(o.pur&&o.ins&&o.ins<o.pur)return er('Installation date is before the purchase date.');
 let hi=0;for(let k=1;k<=UX;k++){const v=g('b'+k);o['b'+k]=v;if(v)hi=k}
 for(let k=Math.max(8,hi+1);k<=UX;k++)delete o['b'+k];
 if(i>=0){const old=db.ups[i];Object.keys(old).forEach(k=>{if(/^b\d+$/.test(k)&&!(k in o))delete old[k]});if(old.sn!=o.sn)db.machines.forEach(x=>{if(x.ups==old.sn)x.ups=o.sn})}
 return commit('ups',i,o,X)}
/* UPS card on the machine detail page */
function mupsH(m){const u=db.ups.find(x=>x.sn==m.ups);if(!u)return '<h3>UPS</h3><p class=mu>No UPS attached. Edit the machine to choose one.</p>';
 const oth=umv(u).filter(x=>x.name!=m.name).map(x=>E(x.name)).join(', ')||'no other machine';
 return `<h3>UPS</h3><div class="cd fg">${[['UPS Serial Number',u.sn],['Fixed Asset Number',u.asset],['Model',u.model],['Transformer',u.tr],['Department',u.dept||UN],['Purchase Date',u.pur],['Installation Date',u.ins],['Last Battery Change',ulast(u)],['Battery Changes',ucnt(u)]].map(([l,v])=>`<div><span class=mu>${l}</span><br><b>${E(v||'\u2013')}</b></div>`).join('')}</div><p class=mu>This UPS also powers: ${oth}.</p>`}

/* engineer department allocation: edit later without re-creating the login */
async function uDept(name){if(S.role!='admin')return;try{const f=await ghRead(CFG.siteRepo,'users.json'),u=JSON.parse(f.txt).users.find(x=>x.u==name);if(!u||u.r!='engineer')return;const cur=Array.isArray(u.dp)?u.dp:[];
 $('#md').className='ov';$('#md').innerHTML=`<div class=mb><h3>Departments for ${E(name)}</h3><form onsubmit="return uDeptSave(event,'${E(name)}')"><div class=tgr>${DP().map(d=>`<label style="display:flex;gap:6px;align-items:center;margin:0"><input type=checkbox name=dp value="${E(d)}" style="width:auto;margin:0"${cur.includes(d)?' checked':''}>${E(d)}</label>`).join('')}</div><p class=mu>Takes effect the next time this person signs in.</p><p class=er id=fe></p><button class="btn p">Save</button><button type=button class=btn onclick="cl()">Cancel</button></form></div>`}catch(e){alert(e.message)}}
async function uDeptSave(e,name){e.preventDefault();const dps=new FormData(e.target).getAll('dp').filter(d=>db.depts.includes(d));if(!dps.length){$('#fe').textContent='Tick at least one department.';return false}
 try{const f=await ghRead(CFG.siteRepo,'users.json'),j=JSON.parse(f.txt),u=j.users.find(x=>x.u==name);if(!u)throw new Error('User not found.');u.dp=dps;await ghWrite(CFG.siteRepo,'users.json',JSON.stringify(j,null,1),'Update departments for '+name,f.sha);log('Engineer departments changed: '+name+' -> '+dps.join(', '));cl();ulist()}catch(err){$('#fe').textContent=err.message}return false}
async function userDeptSync(oldD,newD){if(!isOn()||S.role!='admin')return;try{const f=await ghRead(CFG.siteRepo,'users.json');if(!f)return;const j=JSON.parse(f.txt);let ch=false;
 j.users.forEach(u=>{if(u.r=='engineer'&&Array.isArray(u.dp)&&u.dp.includes(oldD)){u.dp=u.dp.map(d=>d==oldD?newD:d).filter(Boolean);ch=true}});
 if(ch)await ghWrite(CFG.siteRepo,'users.json',JSON.stringify(j,null,1),'Department change: '+oldD+(newD?' -> '+newD:' removed'),f.sha)}catch(e){alert('The department was changed, but engineer logins could not be updated: '+e.message+' Open Settings > Users > Departments to fix them.')}}

/* ===== Absence cover + ticket assignment ===== */
let ENG=[],ENGL=0,TKV='all',TKL=[],CV={abs:'',cov:'',from:'',to:'',d:[],note:''};
async function loadEng(){try{const r=await fetch(CFG.usersUrl+(CFG.usersUrl.includes('?')?'&':'?')+'t='+Date.now(),{cache:'no-store'});if(!r.ok)return;const j=await r.json();ENG=(j.users||[]).filter(x=>x&&x.r=='engineer').map(x=>({u:String(x.u),dp:Array.isArray(x.dp)?x.dp.map(String):[]}));}catch(e){}finally{ENGL=Date.now()}}
function asgList(dept){const a=new Set();ENG.forEach(e=>{if(!dept||e.dp.includes(dept))a.add(e.u)});(db.cover||[]).forEach(c=>{if(cvAct(c)&&(!dept||c.d.includes(dept)))a.add(c.cov)});return[...a]}
function asgSel(dept,cur){const L=asgList(dept);if(cur&&!L.includes(cur))L.push(cur);return `<select name=asg id=asg><option value="">Whole department</option>${L.map(x=>`<option${x==cur?' selected':''}>${E(x)}</option>`).join('')}</select>`}
function coverBanner(){if(!S||!S.eng)return'';let h='';(db.cover||[]).forEach(c=>{if(!cvAct(c))return;
 if(c.cov==S.user)h+=`<div class="cd np cvb"><b>You are covering for ${E(c.abs)}</b> until ${E(c.to)} (${E(c.d.join(' + '))}). Their tickets are under Tickets \u2192 Covering ${E(c.abs)}.${c.note?' <span class=mu>'+E(c.note)+'</span>':''}</div>`;
 if(c.abs==S.user)h+=`<div class="cd np cvb"><b>You are marked absent</b> until ${E(c.to)}. ${E(c.cov)} is covering your tickets.</div>`});return h}
const cvStat=c=>cvAct(c)?['Active today','ok']:(c.from>ldate()?['Upcoming','wr']:['Ended','of']);
function coverCard(){return `<div class=cd><h3>Cover for absent engineers</h3><p class=mu>Mark an engineer absent and pick who covers. For the dates you choose the cover person can see and edit the lent departments, sees the absent person's tickets, and gets their phone alerts. Access ends by itself after the last date.</p><div id=cvb><p class=mu>Loading...</p></div></div>`}
async function coverLoad(){await loadEng();coverDraw()}
function cvNav(){const b=[...document.querySelectorAll('.snav .ni')].find(x=>/^Cover/.test(x.textContent.trim())),sm=b&&b.querySelector('small');if(sm){const n=(db.cover||[]).filter(cvAct).length;sm.textContent=n?n+' active':'No cover set'}}
function coverDraw(){cvNav();const el=$('#cvb');if(!el)return;const dl=db.depts||[],t=ldate();if(!CV.from)CV.from=t;if(!CV.to)CV.to=t;
 if(!CV.abs&&ENG[0]){CV.abs=ENG[0].u;CV.d=[...ENG[0].dp]}if(!CV.cov||CV.cov==CV.abs)CV.cov=(ENG.find(e=>e.u!=CV.abs)||{}).u||'';
 if(!ENG.length){el.innerHTML='<p class=mu>No Engineer logins yet. Add them in Users first.</p>';return}
 const so=v=>ENG.map(e=>`<option${e.u==v?' selected':''}>${E(e.u)}</option>`).join('');
 const rows=(db.cover||[]).map((c,i)=>{const s=cvStat(c),al=(db.notify.eng||[]).some(e=>e.u==c.cov);return `<div class=rq><span><b>${E(c.abs)}</b> covered by <b>${E(c.cov)}</b> <span class=b style="--c:var(--${s[1]})">${s[0]}</span><br><span class=mu>${E(c.from)} to ${E(c.to)} \u00b7 ${E(c.d.join(' + ')||'no department')}${c.note?' \u00b7 '+E(c.note):''}</span><br><span class=mu>${al?'Phone alerts: '+E(c.cov)+' receives them for these dates':'Phone alerts: not set up. In Notifications add '+E(c.cov)+' and choose their login.'}</span></span><span class=tools style="margin:0"><button class=btn onclick="coverMove(${i})">Move their open tickets to ${E(c.cov)} now</button><button class=btn onclick="coverEnd(${i})">End / remove</button></span></div>`}).join('');
 el.innerHTML=`<form class=fg onsubmit="return coverAdd(event)"><label>Absent engineer<select name=abs onchange="cvPick(this.value)">${so(CV.abs)}</select></label><label>Covered by<select name=cov>${so(CV.cov)}</select></label><label>From<input type=date name=from value="${E(CV.from)}"></label><label>To<input type=date name=to value="${E(CV.to)}"></label></form>
 <p>Departments the cover person gets:</p><div class=tools>${dl.map((d,j)=>`<button type=button class="btn${CV.d.includes(d)?' p':''}" onclick="cvChip(${j})">${E(d)}</button>`).join('')||'<span class=mu>No departments defined.</span>'}</div>
 <div class=fg><label>Note (optional)<input id=cvn maxlength=120 value="${E(CV.note)}" placeholder="e.g. Annual leave" oninput="CV.note=this.value"></label></div><p class=er id=cve></p><button class="btn p" onclick="coverAdd()">Save cover</button>
 <h3>Cover arrangements</h3>${rows||'<p class=mu>No cover arrangements.</p>'}`}
function cvPick(u){const e=ENG.find(x=>x.u==u);CV.abs=u;CV.d=e?[...e.dp]:[];cvKeep();coverDraw()}
function cvKeep(){const f=$('#cvb form');if(!f)return;CV.cov=f.elements.cov.value;CV.from=f.elements.from.value;CV.to=f.elements.to.value}
function cvChip(j){if(S.role!='admin')return;cvKeep();const d=db.depts[j],p=CV.d.indexOf(d);if(p>=0)CV.d.splice(p,1);else CV.d.push(d);coverDraw()}
function coverAdd(ev){if(ev&&ev.preventDefault)ev.preventDefault();if(S.role!='admin')return false;cvKeep();const f=$('#cvb form'),er=t=>{$('#cve').textContent=t;return false};
 const o={abs:f.elements.abs.value,cov:f.elements.cov.value,from:CV.from,to:CV.to,d:[...CV.d],note:String(CV.note||'').trim().slice(0,120),by:S.user};
 if(!o.abs||!o.cov)return er('Choose both engineers.');if(o.abs==o.cov)return er('Choose a different cover engineer.');if(!o.from||!o.to)return er('Choose the dates.');if(o.to<o.from)return er('The last date is before the first date.');if(!o.d.length)return er('Choose at least one department to lend.');
 db.cover.push(o);log('Cover set: '+o.abs+' absent, '+o.cov+' covering ('+o.from+' to '+o.to+', '+o.d.join(' + ')+')');CV.note='';save();syncNotify(true);coverDraw();return false}
function coverEnd(i){if(S.role!='admin')return;const c=db.cover[i];if(!c||!confirm('Remove this cover arrangement? '+c.cov+' loses the extra access and alerts immediately.'))return;db.cover.splice(i,1);log('Cover removed: '+c.abs+' / '+c.cov);save();syncNotify(true);coverDraw()}
function coverMove(i){if(S.role!='admin')return;const c=db.cover[i];if(!c)return;const L=db.tickets.filter(t=>!t.del&&t.asg==c.abs&&t.status!='Completed');if(!L.length)return alert(c.abs+' has no open assigned tickets.');
 if(!confirm('Move '+L.length+' open ticket(s) from '+c.abs+' to '+c.cov+'?'))return;L.forEach(t=>{t.asg=c.cov;stamp(t,false)});log('Open tickets moved from '+c.abs+' to '+c.cov+': '+L.length);save();coverDraw();alert(L.length+' ticket(s) moved to '+c.cov+'.')}

/* ===== Dashboard: machines by location (working / not working) ===== */
let LS={g:'loc',nw:'all',so:'nw'},LR=[],LF=null,LFN='';
function locCard(ms){const g=LS.g,bad=x=>LS.nw=='bd'?x.status=='Breakdown':x.status!='Running',G=new Map();
 ms.forEach(m=>{const raw=String((g=='loc'?m.loc:m.dept)||'').trim(),key=raw.toLowerCase(),e=G.get(key)||{raw,key,k:raw||(g=='loc'?'No location':'No department'),w:0,x:0};if(bad(m))e.x++;else e.w++;G.set(key,e)});
 LR=[...G.values()].sort((a,b)=>LS.so=='az'?a.k.localeCompare(b.k):(b.x-a.x)||a.k.localeCompare(b.k));const W=LR.reduce((n,r)=>n+r.w,0),X=LR.reduce((n,r)=>n+r.x,0);
 return `<div class="cd lcard"><div class=tools style="justify-content:space-between"><h3 style="margin:0">Machines by ${g=='loc'?'location':'department'}</h3><span><span class=b style="--c:var(--ok)">${W} working</span> <span class=b style="--c:var(--er)">${X} not working</span></span></div>
 <div class="tools np"><label class=lo>Group by <select aria-label="Group by" onchange="LS.g=this.value;render()"><option value=loc${g=='loc'?' selected':''}>Location</option><option value=dept${g=='dept'?' selected':''}>Department</option></select></label><label class=lo>Not working means <select aria-label="Not working means" onchange="LS.nw=this.value;render()"><option value=all${LS.nw!='bd'?' selected':''}>Maintenance + Breakdown + Offline</option><option value=bd${LS.nw=='bd'?' selected':''}>Breakdown only</option></select></label><label class=lo>Sort <select aria-label="Sort" onchange="LS.so=this.value;render()"><option value=nw${LS.so!='az'?' selected':''}>Most not working first</option><option value=az${LS.so=='az'?' selected':''}>A to Z</option></select></label></div>
 <div class="lrow lh"><span>${g=='loc'?'Location':'Department'}</span><span></span><span class=n>Working</span><span class=n>Not working</span></div>
 ${LR.length?LR.map((r,i)=>{const t=r.w+r.x,p=Math.round(r.w/t*100);return `<div class=lrow role=button tabindex=0 onclick="locGo(${i})" onkeydown="if(event.key=='Enter')locGo(${i})"><span title="${E(r.k)}">${E(r.k)}</span><span class=lbar><i style="width:${p}%;background:var(--ok)"></i><i style="width:${100-p}%;background:var(--er)"></i></span><span class="n" style="color:var(--ok)">${r.w}</span><span class=n style="color:${r.x?'var(--er)':'var(--mu)'}">${r.x}</span></div>`}).join(''):'<p class=mu>No machines yet.</p>'}
 <p class=mu>Click a row to open the Machines page for it.</p></div><br>`}
function locGo(i){const r=LR[i];if(!r)return;go('machines');if(LS.g=='dept'){DF=r.raw||UN}else{DF='';LF=r.key;LFN=r.k}draw()}

/* ===== Navigation / rendering ===== */
const go=v=>{LF=null;TKV='all';if(S&&S.role=='worker')v='wtk';if(SC()&&(v=='settings'||v=='users'))v='dash';if(v=='users'){v='settings';SETAB='usr'}if(S&&S.vo&&v!='login'&&!vok(v))v=S.pg[0];if(v=='login')UL=undefined;view=v;q='';filt='';sortK='';sortD=-1;render();scrollTo(0,0)};
const sc=id=>{view='home';render();(document.getElementById(id)||document.body).scrollIntoView()};
function hdr(){return `<header class=top><b>MIS</b>${[['home','Home'],['about','About'],['features','Features'],['system','System'],['preview','Dashboard Preview'],['tech','Technology'],['project','Project'],['contact','Contact']].map(([k,l])=>`<button class=n onclick="sc('${k}')">${l}</button>`).join('')}<button class="btn p" style="margin-left:auto" onclick="go('login')">Login</button></header>`}
function render(){const a=$('#app');normD();document.body.classList.toggle('vo',!!(S&&S.vo));if(S&&S.vo&&!vok(view))view=S.pg[0];
 if(!S){a.innerHTML=view=='login'?loginV():pub();if(view=='login'&&UL===undefined&&GH())usersPublic().then(x=>{UL=x||[];if(view=='login'&&!S)render()});return}
 if(S.role=='worker'){view='wtk';a.innerHTML=`<header class="top np"><b>MIS</b><button class="n on">Raise Ticket</button><button class=n onclick="out()">Logout</button><span style="margin-left:auto;color:#9fb0c3">${E(S.user)} (Worker)</span></header><main class=w>${workerV()}</main>`;return}
 const nv=[['dash','Dashboard'],['tickets','Tickets'],['machines','Machines'],['ups','UPS'],['maintenance','Machine Service Rpt'],['breakdowns','Breakdowns'],['diodes','Diodes'],['parts','Spare Parts'],['reports','Reports'],['settings','Settings']].filter(([k])=>vok(k)&&!(SC()&&k=='settings')).map(([k,l])=>k=='settings'&&S.role=='admin'&&pendN()?[k,l+' ('+pendN()+')']:[k,l]);
 a.innerHTML=`<header class="top np"><b>MIS</b>${nv.map(([k,l])=>`<button class="n${view==k||(view=='md'&&k=='machines')?' on':''}" onclick="go('${k}')">${l}</button>`).join('')}<button class=n onclick="out()">Logout</button><span id=gs style="margin-left:auto;color:#f5c26b"></span><span style="margin-left:12px;color:#9fb0c3">${E(S.user)}${S.mode=='demo'?' (Demo)':S.eng?' (Engineer: '+E(EDP().join(', '))+')':S.role!='admin'?' (View only)':''}</span></header><main class=w>${coverBanner()}${M[view]?page(view):({md:mdet,reports:repV,users:usersV,settings:setV}[view]||dash)()}</main>`;
 if(M[view])draw();if(view=='reports')rd();if(view=='dash')gsr();if(view=='settings'&&isOn()){if(SETAB=='bak')bkList();if(SETAB=='usr')ulist();if(SETAB=='cov')coverLoad();if(SETAB=='ntf'&&(!ENGL||Date.now()-ENGL>60000))loadEng().then(()=>{if(view=='settings'&&SETAB=='ntf')render()})}}

/* ===== Public portfolio ===== */
function pub(){db=seed();const C=(t,p)=>`<div class=cd><h3>${t}</h3><p class=mu>${p}</p></div>`,sec=(id,t,b)=>`<section id=${id} class=w><h2>${t}</h2>${b}</section>`;
 const sys=[['Login','Secure sign-in with hashed passwords','login'],['Dashboard','Status cards and live charts','dash'],['Machine Information','Searchable machine register','machines'],['UPS','UPS register with battery history','ups'],['Machine Details','History, documents and timeline','md'],['Machine Service Rpt','Monthly service reports with Active and Updated status','maintenance'],['Breakdown','Fault records and repair status','breakdowns'],['Diode Management','Lifetime tracking','diodes'],['Spare Parts','Stock with low-stock alerts','parts'],['Reports','CSV, Excel and print','reports']];
 return hdr()+`<section id=home class=hero><h1>MACHINERY INFORMATION SYSTEM</h1><h3>Digital Machinery Maintenance &amp; Asset Management</h3><p style="max-width:680px;margin:12px auto 24px;color:#b9c6d6">A system designed to manage machinery information, preventive maintenance, breakdowns, spare parts, diode replacements and equipment history.</p><button class="btn p" onclick="go('login')">Login to System</button><button class=btn onclick="demo()">View System</button><button class=btn onclick="sc('features')">Explore Features</button><button class=btn onclick="sc('about')">About Project</button></section>`
 +sec('about','About the Project','<div class=g>'+C('Problem','Machinery maintenance information is often spread across paper records, Excel files, manual reports, separate maintenance records and operator communications.')+C('Solution','The Machinery Information System centralizes machinery information and maintenance activities into one digital platform.')+C('Result','Centralized machine records, maintenance tracking, breakdown history, diode replacement tracking, spare-parts management, dashboards, reports and historical machine information.')+'</div>')
 +sec('features','Features','<div class=g>'+[['Machine Management','Centralized information for all machinery.'],['Preventive Maintenance','Track scheduled maintenance and upcoming service.'],['Breakdown Management','Record and analyze equipment failures.'],['Ticketing','Raise a ticket when a machine has a problem. Completed repairs feed the breakdown report and deduct the parts used from stock.'],['Diode Tracking','Monitor diode installation and replacement history.'],['Spare Parts','Track spare-parts inventory and usage.'],['Analytics','Monitor machine performance through dashboards.'],['Reporting','Generate maintenance and machinery reports.'],['Document Management','Link machine manuals and technical documents.']].map(x=>C(...x)).join('')+'</div>')
 +sec('system','System Preview','<p class=mu>Every card opens the working module in Demo Mode (fictional sample data).</p><div class=g>'+sys.map(([t,p,v])=>`<div class=cd><h3>${t}</h3><p class=mu>${p}</p><button class=btn onclick="${v=='login'?"go('login')":`demo('${v}')`}">Open</button></div>`).join('')+'</div>')
 +sec('preview','Dashboard Preview','<p class=mu>Computed live from the sample dataset.</p>'+dash())
 +sec('tech','Technologies Used','<div class=g>'+[['HTML5','Page structure and forms.'],['CSS3','Responsive layout, light and dark themes.'],['JavaScript','All application logic, no frameworks.'],['Charts / Data Visualization','Bar charts drawn with HTML and CSS.'],['Database','JSON files in a private GitHub repository, with commit history and backups.'],['Responsive Web Design','Desktop, tablet and mobile layouts.'],['Web Crypto API','PBKDF2 and AES-GCM: each GitHub token is encrypted with its owner\'s password.']].map(x=>C(...x)).join('')+'</div>')
 +sec('project','Project Achievements','<div class=g>'+[['Digitalization','Converted manual machinery information into a centralized digital system.'],['Maintenance Visibility','Improved visibility of maintenance schedules and machine history.'],['Data Management','Centralized machine-related information.'],['Analytics','Created dashboards for maintenance and equipment information.'],['Traceability','Maintained historical records of maintenance and component replacements.']].map(x=>C(...x)).join('')+'</div>')
 +`<footer id=contact><b style="color:#fff">${E(CFG.name)}</b><br>${E(CFG.tag)}<br>${E(CFG.contact)}<br><small>Public visitors see fictional sample data only.</small></footer>`}

/* ===== Dashboard ===== */
function dash(){const ot=V('tickets').filter(t=>t.status!='Completed'),ms=V('machines'),c=s=>ms.filter(x=>x.status==s).length,due=V('maintenance').filter(r=>r.active!='Inactive'&&r.service=='Pending').length,
 mo=[...Array(6)].map((_,i)=>{const d=new Date();d.setDate(1);d.setHours(12);d.setMonth(d.getMonth()-5+i);return d.toISOString().slice(0,7)}),
 by=(a,k)=>mo.map(x=>a.filter(r=>(r[k]||'').slice(0,7)==x).length),TY=['Preventive','Corrective','Emergency'],
 dt=ms.map(x=>[x.name,V('breakdowns').filter(r=>r.machine==x.name).reduce((s,r)=>s+(+r.down||0),0)]),
 bar=(t,l,v)=>{const mx=Math.max(1,...v);return `<div class=cd><b>${t}</b>${l.map((x,i)=>`<div class=br title="${E(x)}: ${v[i]}"><span>${E(x)}</span><i style="width:${v[i]/mx*100}%"></i><b>${v[i]}</b></div>`).join('')}</div>`};
 return `<h2>MACHINERY INFORMATION SYSTEM</h2>${pendBanner()}${S?`<div class="cd np"><input id=gq type=search aria-label="Search all records" placeholder="Search by machine name, model, serial number, asset no or location to collect the full machine history (diode changes, breakdowns, service reports)" value="${E(GQ)}" oninput="gsr(this.value)"><div id=gr></div></div><br>`:''}<div class=g>${[['Total Machines',ms.length,'of'],['Running',c('Running'),'ok'],['Maintenance',c('Maintenance'),'wr'],['Breakdown',c('Breakdown'),'er'],['Offline',c('Offline'),'of'],['Service Pending',due,'wr'],['Open Tickets',ot.length,ot.some(t=>t.priority=='High')?'er':'wr']].map(([l,n,k])=>`<div class="cd k1 ${k}"><span class=mu>${l}</span><div class=k>${n}</div></div>`).join('')}</div><br>${locCard(ms)}${tkd(ot)}<div class=g>${bar('Machine Status',ST,ST.map(c))}${bar('Machine Service Trend',mo,by(V('maintenance'),'month'))}${bar('Breakdown Trend',mo,by(V('breakdowns'),'date'))}${bar('Diode Replacements',mo,by(V('diodes'),'replaced'))}${bar('Downtime (Hours)',dt.map(x=>x[0]),dt.map(x=>x[1]))}${bar('Service Type',TY,TY.map(t=>V('maintenance').filter(r=>r.type==t).length))}</div>`}

/* ===== Generic module page: search, filter, sort, add, edit, delete ===== */
function page(m){const bar=`<div class="tools np"><input placeholder="Search..." aria-label="Search" oninput="q=this.value;draw()"><select id=fs aria-label="Filter" onchange="filt=this.value;draw()"></select>${S.vo?'':'<button class=btn onclick="exT(\'xlsx\')">Excel</button><button class=btn onclick="exT(\'pdf\')">PDF</button><button class=btn onclick="exT(\'csv\')">CSV</button>'}${canEd(m)?`<button class="btn p" onclick="openForm('${m}',-1)">${m=='tickets'?'+ Raise Ticket':m=='ups'?'+ Add UPS':'+ Add'}</button>`:''}${m=='machines'?'<span id=lfc class=np></span>':''}</div>${m=='tickets'&&SC()?'<div class="tools np" id=tkt></div>':''}`;
 if((m=='machines'||m=='ups')&&DP().length)return `<h2>${M[m].t}</h2><div class="shell mshell"><div class=np><nav class=snav id=mn aria-label="Machine departments"></nav>${m=='machines'?'<div class=mlg><span><span class="b er">1 down</span> machines in Breakdown</span><span><span class="b wr">2 open</span> open tickets</span></div>':''}</div><section class=ss><div class=mhd><h3 class=sh id=mt></h3><div class=mbs id=ms></div></div>${bar}<div class=tw id=tb></div></section></div>`;
 return `<h2>${M[m].t}</h2>${bar}<div class=tw id=tb></div>`}
const otMap=()=>{const o={};V('tickets').forEach(t=>{if(t.status!='Completed')o[t.machine]=(o[t.machine]||0)+1});return o};
const mstats=d=>{const o=otMap(),ms=V('machines').filter(x=>!d||(x.dept||UN)==d);return{n:ms.length,b:ms.filter(x=>x.status=='Breakdown').length,t:ms.reduce((q,x)=>q+(o[x.name]||0),0)}};
const mbadges=c=>(c.b?`<span class="b er" title="${c.b} machine(s) in breakdown">${c.b} down</span>`:'')+(c.t?`<span class="b wr" title="${c.t} open ticket(s)">${c.t} open</span>`:'');
function mtabs(){const el=$('#mn');if(!el)return;const U=view=='ups';DL=['',...(U?uList():dList())];
 el.innerHTML=DL.map((d,i)=>{const on=(DF||'')==d;let sm,bd;if(U){sm=V('ups').filter(x=>!d||(x.dept||UN)==d).length+' UPS';bd=''}else{const c=mstats(d);sm=c.n+(c.n==1?' machine':' machines');bd=mbadges(c)||'<span class=okx>OK</span>'}
  return `<button class="mtab${on?' on':''}${d==UN?' sep':''}" onclick="DF=DL[${i}];draw()"${on?' aria-current=true':''}><span class=l><span>${E(d||(U?'All UPS':'All machines'))}</span><small>${sm}</small></span><span class=mbs>${bd}</span></button>`}).join('')}
const dgh=(m,rs,r,ri)=>(m=='machines'||m=='ups')&&!sortK&&!DF&&DP().length&&(ri==0||(rs[ri-1].dept||UN)!=(r.dept||UN))?`<tr><td colspan=99 style="background:var(--bg);font-weight:700">${E(r.dept||UN)} (${rs.filter(x=>(x.dept||UN)==(r.dept||UN)).length})</td></tr>`:'';
function draw(){const m=view,X=M[m],fs=$('#fs');
 const tabs=(m=='machines'||m=='ups')&&DP().length;if(tabs&&DF&&!(m=='ups'?uList():dList()).includes(DF))DF='';
 let rs=db[m].map((r,i)=>({...r,...(X.calc?X.calc(r):{}),_i:i})).filter(r=>inScope(m,r));
 if(m=='machines'){const lf=$('#lfc');if(lf)lf.innerHTML=LF!=null?`<span class=chip>Location: ${E(LFN||'No location')} <button class=btn onclick="LF=null;draw()" aria-label="Clear location filter">\u2715</button></span>`:'';if(LF!=null)rs=rs.filter(r=>String(r.loc||'').trim().toLowerCase()==LF)}
 if(m=='tickets'&&SC()){const op=r=>r.status!='Completed',acts=(db.cover||[]).filter(c=>c.cov==S.user&&cvAct(c)),T=[['all','All in my departments',rs.filter(op).length],['mine','My tickets',rs.filter(r=>r.asg==S.user&&op(r)).length],...acts.map(c=>['cv:'+c.abs,'Covering '+c.abs,rs.filter(r=>r.asg==c.abs&&op(r)).length])];
  if(!T.some(t=>t[0]==TKV))TKV='all';rs=TKV=='mine'?rs.filter(r=>r.asg==S.user):TKV.startsWith('cv:')?rs.filter(r=>r.asg==TKV.slice(3)):rs;TKL=T;
  const tk=$('#tkt');if(tk)tk.innerHTML=T.map((t,i)=>`<button class="btn${t[0]==TKV?' p':''}" onclick="TKV=TKL[${i}][0];draw()">${E(t[1])} (${t[2]} open)</button>`).join('')}
 if(tabs&&m=='machines'){const o=otMap();rs.forEach(r=>{r.otk=o[r.name]||0})}
 if(fs.options.length==0)fs.innerHTML='<option value="">All</option>'+[...new Set(rs.map(r=>r[X.flt]))].filter(Boolean).map(v=>`<option>${E(v)}</option>`).join('');
 rs=rs.filter(r=>(!filt||r[X.flt]==filt)&&(!tabs||!DF||(r.dept||UN)==DF)&&(!q||JSON.stringify(Object.values(r)).toLowerCase().includes(q.toLowerCase())));
 if((m=='machines'||m=='ups')&&!sortK){const ix=d=>DP().indexOf(d||'')<0?999:DP().indexOf(d||'');rs.sort((a,b)=>ix(a.dept)-ix(b.dept)||a._i-b._i)}
 if(sortK)rs.sort((a,b)=>(a[sortK]>b[sortK]?1:a[sortK]<b[sortK]?-1:0)*sortD);
 let cols=[...X.f.filter(f=>!f[4]),...(X.c||[]),['ub','Last Edited By']];
 if(tabs){if(DF)cols=cols.filter(c=>c[0]!='dept');if(m=='machines')cols=[...cols,['otk','Open Tickets']]}
 if(tabs){mtabs();$('#mt').textContent=DF||(m=='ups'?'All UPS':'All machines');$('#ms').innerHTML=`<span class=mu>${rs.length} shown</span>${m=='machines'?mbadges(mstats(DF)):''}`}
 CUR={t:X.t,c:cols.map(c=>c[1]),r:rs.filter(r=>!r.del).map(r=>cols.map(c=>r[c[0]]??''))};
 $('#tb').innerHTML=`<table><thead><tr>${cols.map(([k,l])=>`<th onclick="sortK='${k}';sortD*=-1;draw()">${l}${sortK==k?(sortD>0?' ▲':' ▼'):''}</th>`).join('')}${X.noact?'':'<th>Actions</th>'}</tr></thead><tbody>${rs.map((r,ri)=>dgh(m,rs,r,ri)+`<tr${r.del?' class=pd':tabs&&r.status=='Breakdown'?' class=bk':''}>${cols.map(([k])=>`<td>${X.noact&&k==X.f[0][0]?`<button class=btn style="border:0;background:none;color:var(--ac);padding:0;text-transform:none" title="Edit this record" onclick="openForm('${m}',${r._i})">${E(r[k])}</button>`:(X.tg||[]).includes(k)&&canEd(m)&&!r.del?`<button class="b ${bc(r[k])} np" style="border:0;cursor:pointer" title="Click to switch" onclick="tg('${m}',${r._i},'${k}')">${E(r[k]||'Set')}</button>`:cell(k,r[k])}</td>`).join('')}${X.noact?'':`<td>${m=='machines'?`<button class=btn onclick="MI=${r._i};go('md')">View</button>`:''}${r.del?`<span class="b wr" title="${E('Requested by '+r.del.by+': '+r.del.why)}">Deletion pending approval</span>`:canEd(m)?`<button class=btn onclick="openForm('${m}',${r._i})">Edit</button><button class=btn onclick="del('${m}',${r._i})">Delete</button>`:''}</td>`}</tr>`).join('')||'<tr><td colspan=99>No records. Add one, or use Settings to import.</td></tr>'}</tbody></table>`}
let CUR={t:'',c:[],r:[]};
/* Excel / PDF / CSV of the table exactly as shown (search, filter and sort applied) */
function exT(t){const n=(CUR.t||'data').replace(/\W+/g,'_').toLowerCase()+'-'+T();log('Exported '+CUR.t+' ('+t+')');
 if(t=='xlsx')return dl(n+'.xlsx',XM,xlsx(CUR.c,CUR.r));
 if(t=='csv')return dl(n+'.csv','text/csv','\ufeff'+[CUR.c,...CUR.r].map(x=>x.map(qt).join(',')).join('\r\n'));
 dl(n+'.pdf','application/pdf',pdf('Machinery Information System - '+CUR.t,new Date().toLocaleDateString()+'   |   '+CUR.r.length+' records',[{t:CUR.t,c:CUR.c,r:CUR.r}]))}
/* Full history of one machine: information, diode changing history, breakdown history, machine service rpt, timeline */
function hsec(m){const sec=(t,k)=>{const X=M[k],c=vc(X),r=db[k].filter(o=>o.machine==m.name).map(o=>({...o,...(X.calc?X.calc(o):{})}));return{t,c:c.map(f=>f[1]),r:r.map(o=>c.map(f=>o[f[0]]??''))}},mi=vc(M.machines);
 return[{t:'Machine Information',c:mi.map(f=>f[1]),r:[mi.map(f=>m[f[0]]??'')]},sec('Diode Changing History','diodes'),sec('Breakdown History','breakdowns'),sec('Machine Service Rpt','maintenance'),{t:'Machine History',c:HX.f.map(f=>f[1]),r:ev().filter(e=>e.machine==m.name).map(e=>HX.f.map(f=>e[f[0]]??''))}]}
function hx(t,m){m=m||db.machines[MI];if(!m)return;const s=hsec(m),fn='history-'+String(m.name).replace(/\W+/g,'_')+'-'+T();log('Machine history exported: '+m.name);
 if(t=='pdf')return dl(fn+'.pdf','application/pdf',pdf('Machine History - '+m.name,'Asset '+(m.asset||'-')+'   |   Serial '+(m.serial||'-')+'   |   Model '+(m.model||'-')+'   |   '+T(),s));
 dl(fn+'.xlsx',XM,xlsxN(s.map(x=>[x.t,x.c,x.r])))}
/* one-click switch for Active/Inactive and Updated/Pending */
function tg(m,i,k){if(!canEd(m)||!db[m][i]||db[m][i].del||!inScope(m,db[m][i]))return;const o=M[m].f.find(f=>f[0]==k)[3],r=db[m][i];r[k]=r[k]==o[0]?o[1]:o[0];log(M[m].t+' '+k+' set to '+r[k]+': '+r[M[m].f[0][0]]);save();draw()}
function openForm(m,i){if(!canEd(m))return;if(i>=0&&db[m][i]&&(db[m][i].del||!inScope(m,db[m][i])))return;if(m=='tickets')return tform(i);if(m=='ups')return uform(i);ED={m,i};const X=M[m],r=i>=0?db[m][i]:(m=='machines'&&DF&&DF!=UN&&DP().includes(DF)?{dept:DF}:{});
 $('#md').innerHTML=`<div class=mb><h3>${i>=0?'Edit':'Add'} ${X.t}</h3><form onsubmit="return sv(event)"><div class=fg>${X.f.map(([k,l,t,o])=>{const v=E(r[k]);
 const inp=t=='s'&&o=='u'?upsSel(r):t=='s'?`<select name=${k}${m=='machines'&&k=='dept'?' onchange="mupsRef()"':''}><option value="">-- Select --</option>${(o=='m'?mOpts(r[k]):o=='d'?dOpts(r[k]):o).map(x=>`<option${r[k]==x?' selected':''}>${E(x)}</option>`).join('')}</select>`:t=='a'?`<textarea name=${k} rows=2>${v}</textarea>`:`<input name=${k} value="${v}" type="${{d:'date',tm:'time',n:'number',mo:'month'}[t]||'text'}"${t=='n'?' step=any min=0':''}>`;
 return `<label>${l}${X.req.includes(k)?' *':''}${inp}</label>`}).join('')}</div>${m=='machines'?'<p class=mu>Departments are managed in Settings, section Departments.</p>':''}<p class=er id=fe></p><button class="btn p">Save</button><button type=button class=btn onclick="cl()">Cancel</button>${i>=0&&S.role=='admin'?`<button type=button class=btn onclick="cl();del('${m}',${i})">Delete</button>`:''}</form></div>`;$('#md').className='ov'}
const cl=()=>{$('#md').className='';$('#md').innerHTML=''};
function sv(e){e.preventDefault();const {m,i}=ED,X=M[m],fd=new FormData(e.target),o={},er=t=>{$('#fe').textContent=t;return false};
 X.f.forEach(f=>o[f[0]]=(fd.get(f[0])||'').trim());
 for(const k of X.req)if(!o[k])return er('Required: '+X.f.find(f=>f[0]==k)[1]);
 for(const f of X.f)if(f[2]=='n'&&o[f[0]]!==''&&!(+o[f[0]]>=0))return er(f[1]+' must be a number, 0 or more.');
 if(m=='maintenance'){if(!o.month&&o.date)o.month=o.date.slice(0,7);if(o.month&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(o.month))return er('Month must look like 2026-09.')}
 if(X.u&&db[m].some((r,j)=>j!=i&&r[X.u]==o[X.u]))return er('This '+X.f[0][1]+' already exists.');
 {const sce=scopeErr(m,o,i);if(sce)return er(sce)}
 if(m=='machines'&&o.ups&&!db.ups.some(u=>u.sn==o.ups))return er('The selected UPS no longer exists. Choose another or None.');
 if(m=='diodes'&&o.replaced&&o.replaced<o.installed)return er('Replacement date is before installation date.');
 if(m=='breakdowns'&&i<0)o.dept=mdept(o.machine);
 return commit(m,i,o,X)}
const rtitle=(k,r)=>k=='tickets'?(r.no+' - '+r.machine+(r.problem?' - '+r.problem:'')):String(r[M[k].f[0][0]]||'')+(r.problem?' - '+r.problem:'');
function del(m,i){if(!canEd(m))return;const r=db[m][i];if(!r||r.del)return;
 if(S.role!='admin'){if(!inScope(m,r))return;return delAsk(m,i)}
 const nu=m=='ups'?ums(db.ups[i]).length:0;if(!confirm('Delete this record?'+(nu?' '+nu+' machine(s) will lose their UPS link.':'')))return;log('Deleted '+M[m].t+' record: '+db[m][i][M[m].f[0][0]]);if(m=='ups'){const sn=db.ups[i].sn;db.machines.forEach(x=>{if(x.ups==sn)x.ups=''})}db[m].splice(i,1);save();render()}
function delAsk(m,i){ED={m,i};const r=db[m][i];$('#md').className='ov';$('#md').innerHTML=`<div class=mb><h3>Request deletion</h3><p>${E(M[m].t)}: <b>${E(rtitle(m,r))}</b></p><p class=mu>The record stays in the system until an administrator approves. Until then it is marked "Deletion pending approval" and left out of counts and reports.</p><form onsubmit="return delReq(event)"><label>Reason<input name=why maxlength=200 placeholder="e.g. duplicate entry" required></label><p class=er id=fe></p><button class="btn p">Send request</button><button type=button class=btn onclick="cl()">Cancel</button></form></div>`}
function delReq(e){e.preventDefault();const {m,i}=ED,r=db[m]&&db[m][i];if(!r||r.del||!canEd(m)||(SC()&&!inScope(m,r)))return false;
 const why=String(new FormData(e.target).get('why')||'').trim().slice(0,200)||'No reason given';
 r.del={by:S.user,at:new Date().toISOString().slice(0,10),why};log('Deletion requested ('+M[m].t+'): '+rtitle(m,r)+' - '+why);save();cl();render();return false}
function pendBanner(){if(!S||S.role!='admin'||!pendN())return '';return `<div class="cd np" style="border-color:var(--wr);margin-bottom:14px"><b>${pendN()} deletion request${pendN()==1?'':'s'} waiting for your approval</b> <button class="btn p" onclick="SETAB='apr';go('settings')">Review</button></div>`}
function aprCard(){const L=[];PK.forEach(k=>(db[k]||[]).forEach((r,i)=>{if(r.del)L.push({k,i,r})}));
 return L.length?`<div class=tw><table><thead><tr><th>Type<th>Record<th>Department<th>Requested by<th>Date<th>Reason<th></tr></thead><tbody>${L.map(x=>`<tr><td>${E(M[x.k].t)}<td>${E(rtitle(x.k,x.r))}<td>${E(dptOf(x.k,x.r)||UN)}<td>${E(x.r.del.by)}<td>${E(x.r.del.at)}<td>${E(x.r.del.why)}<td><button class=btn onclick="apprDel('${x.k}',${x.i})" style="color:var(--er)">Approve: delete permanently</button><button class=btn onclick="rejDel('${x.k}',${x.i})">Reject: restore</button></tr>`).join('')}</tbody></table></div>`:'<div class=cd><p class=mu style="margin:0">No deletion requests. When an engineer deletes a record it waits here for your decision.</p></div>'}
function apprDel(k,i){if(S.role!='admin')return;const r=db[k]&&db[k][i];if(!r||!r.del)return;if(!confirm('Permanently delete "'+rtitle(k,r)+'"? This cannot be undone from the app.'))return;
 if(k=='ups'){const sn=r.sn;db.machines.forEach(x=>{if(x.ups==sn)x.ups=''})}log('Deletion approved ('+M[k].t+'): '+rtitle(k,r)+' (requested by '+r.del.by+')');db[k].splice(i,1);save();render()}
function rejDel(k,i){if(S.role!='admin')return;const r=db[k]&&db[k][i];if(!r||!r.del)return;log('Deletion rejected ('+M[k].t+'): '+rtitle(k,r)+' (requested by '+r.del.by+')');delete r.del;save();render()}

/* ===== Ticketing: raise a problem ticket per machine -> shows on the dashboard -> when Completed it is added to the Breakdown report
   automatically and the spare parts used are deducted from the spare-parts stock (once, at completion). ===== */
let TP=[];
const tno=()=>'T-'+String(Math.max(0,...db.tickets.map(t=>+String(t.no).replace(/\D/g,'')||0))+1).padStart(4,'0');
const tkd=ot=>`<div class=cd style="margin-bottom:14px"><b>Open Tickets (${ot.length})</b>${canEd('tickets')?` <button class="btn p np" onclick="go('tickets');tform(-1)">+ Raise Ticket</button>${TR()&&isOn()&&S.role=='admin'?' <button class="btn np" onclick="pullTickets()">Check Worker Tickets</button>':''}`:''}<div class=tw>${ot.length?`<table style="min-width:700px"><thead><tr><th>Ticket No<th>Machine${DP().length?'<th>Department':''}<th>Problem<th>Date Problem Occurred<th>Priority<th>Status</tr></thead><tbody>${[...ot].sort((a,b)=>a.date<b.date?1:-1).map(t=>`<tr><td>${canEd('tickets')?`<button class=btn style="border:0;background:none;color:var(--ac);padding:0" onclick="tform(${db.tickets.indexOf(t)})">${E(t.no)}</button>`:E(t.no)}<td>${E(t.machine)}${DP().length?`<td>${E(depOf(t))}`:''}<td>${E(t.problem)}<td>${E(t.date)}<td>${cell('priority',t.priority)}<td>${cell('status',t.status)}`).join('')}</tbody></table>`:'<p class=mu>No open tickets.</p>'}</div></div>`;
function tpDraw(){const e=$('#tp');if(e)e.innerHTML=TP.map((x,k)=>`<div class=fg style="margin:6px 0;align-items:end"><label>Spare Part<select onchange="TP[${k}].no=this.value"><option value="">-- Select --</option>${db.parts.map(p=>`<option value="${E(p.no)}"${p.no==x.no?' selected':''}>${E(p.no)} - ${E(p.name)} (in stock: ${E(p.qty)})</option>`).join('')}</select></label><label>Quantity Used<input type=number min=1 step=1 value="${E(x.qty)}" onchange="TP[${k}].qty=this.value"></label><button type=button class=btn onclick="TP.splice(${k},1);tpDraw()">Remove</button></div>`).join('')||'<p class=mu>No parts used.</p>'}
function tmOpts(cd,cur){const has=DP().length>0;if(has&&!cd)return'<option value="">Select department first</option>';
 const L=V('machines').filter(x=>!has||(x.dept||UN)==cd);if(cur&&!L.some(x=>x.name==cur)){const z=db.machines.find(x=>x.name==cur);if(z)L.push(z)}
 return'<option value="">-- Select --</option>'+L.map(x=>`<option${x.name==cur?' selected':''}>${E(x.name)}</option>`).join('')}
function tdeptHtml(r){const has=DP().length>0,cd=r.dept||(r.machine?mdept(r.machine)||UN:'');
 return(has?`<label>Department *<select name=dept onchange="tdep(this.value)"><option value="">-- Select --</option>${dList().map(d=>`<option${d==cd?' selected':''}>${E(d)}</option>`).join('')}</select></label>`:'')+`<label>Machine *<select name=machine id=tm${has&&!cd?' disabled':''}>${tmOpts(cd,r.machine)}</select></label>`}
function tdep(v){const s=$('#tm');s.disabled=!v;s.innerHTML=tmOpts(v,'');const a=$('#asg');if(a)a.outerHTML=asgSel(v==UN?'':v,a.value)}
function tform(i){if(!canEd('tickets'))return;if(i>=0&&db.tickets[i]&&(db.tickets[i].del||!inScope('tickets',db.tickets[i])))return;const r=i>=0?db.tickets[i]:{},X=M.tickets;
 if(r.status=='Completed'){const dp=r.dept||mdept(r.machine)||UN,lk=(l,v,f)=>`<div class="lit${f?' full':''}"><span>${E(l)}</span><b>${E(v==null||v===''?'\u2013':v)}</b></div>`,pl=(r.pl||[]).filter(x=>x&&x.no),pq=pl.reduce((q,x)=>q+(+x.qty||0),0),
   parts=pl.length?`<table class=pt><thead><tr><th>Part No<th>Part name<th class=n>Qty used</tr></thead><tbody>${pl.map(x=>`<tr><td>${E(x.no)}<td>${E((db.parts.find(p=>p.no==x.no)||{}).name||'\u2013')}<td class=n>${E(+x.qty||0)}</tr>`).join('')}</tbody><tfoot><tr><td colspan=2>Total<td class=n>${pq}</tr></tfoot></table>`:r.parts?`<div class=tgr>${lk('Parts Used',r.parts,1)}</div>`:'<div class=tgr><div class="lit full"><b class=mu style="font-weight:400">No spare parts used on this ticket.</b></div></div>';
  $('#md').innerHTML=`<div class="mb wide"><h3>Ticket ${E(r.no)} <span class=b style="--c:var(--ok)">Completed, locked</span></h3><div class=tsec>Ticket</div><div class=tgr>${lk('Machine',r.machine)}${DP().length||dp!=UN?lk('Department',dp):''}${lk('Priority',r.priority)}${lk('Date Problem Occurred',r.date)}${lk('Time',r.time)}${lk('Reported By',r.by)}</div><div class=tsec>Problem</div><div class=tgr>${lk('Problem',r.problem,1)}${lk('Description',r.desc,1)}</div><div class=tsec>Repair details</div><div class=tgr>${lk('Diagnosis',r.diagnosis)}${lk('Root Cause',r.cause,1)}${lk('Corrective Action',r.action,1)}${lk('Downtime (Hours)',r.down)}${lk('Completion Date',r.completed)}</div><div class=tsec>Spare parts used</div>${parts}<p class=mu>Completed tickets are locked because stock was already deducted and the breakdown report entry was created.</p><button class="btn p" onclick="cl()">Close</button></div>`;$('#md').className='ov';return}
 ED={m:'tickets',i};TP=(r.pl||[]).map(x=>({...x}));
 const v=k=>E(r[k]??''),sel=(k,o,d)=>`<select name=${k}>${o.map(x=>`<option${(r[k]||d)==x?' selected':''}>${x}</option>`).join('')}</select>`;
 $('#md').innerHTML=`<div class=mb><h3>${i>=0?'Update Ticket '+E(r.no):'Raise Ticket'}</h3><form onsubmit="return tsv(event)"><div class=fg>${tdeptHtml(r)}<label>Date Problem Occurred *<input type=date name=date value="${v('date')||T()}"></label><label>Time<input type=time name=time value="${v('time')||new Date().toTimeString().slice(0,5)}"></label><label>Reported By<input name=by value="${v('by')||E(S.user)}"></label><label>Priority${sel('priority',['Low','Medium','High'],'Medium')}</label><label>Status${sel('status',['Open','In Progress','Completed'],'Open')}</label><label>Assigned To${asgSel(r.dept||mdept(r.machine)||'',r.asg||'')}</label></div><label>Problem *<input name=problem value="${v('problem')}"></label><label>Description<textarea name=desc rows=2>${v('desc')}</textarea></label><h3>Repair Details</h3><div class=fg><label>Diagnosis<input name=diagnosis value="${v('diagnosis')}"></label><label>Root Cause<input name=cause value="${v('cause')}"></label><label>Corrective Action<input name=action value="${v('action')}"></label><label>Downtime (Hours)<input type=number step=any min=0 name=down value="${v('down')}"></label><label>Completion Date<input type=date name=completed value="${v('completed')}"></label></div><h3>Spare Parts Used</h3><div id=tp></div><button type=button class=btn onclick="TP.push({no:'',qty:1});tpDraw()">+ Add Part</button><p class=mu>Stock is reduced automatically when the ticket is saved as Completed. A completed ticket is added to the Breakdown report.</p><p class=er id=fe></p><button class="btn p">Save</button><button type=button class=btn onclick="cl()">Cancel</button></form></div>`;
 $('#md').className='ov';tpDraw()}
function tsv(e){e.preventDefault();const fd=new FormData(e.target),g=k=>(fd.get(k)||'').trim(),{i}=ED,old=i>=0?db.tickets[i]:null,er=t=>{$('#fe').textContent=t;return false};
 const o={no:old?old.no:tno(),machine:g('machine'),problem:g('problem'),date:g('date'),time:g('time'),by:g('by'),priority:g('priority')||'Medium',status:g('status')||'Open',asg:g('asg').slice(0,30),desc:g('desc'),diagnosis:g('diagnosis'),cause:g('cause'),action:g('action'),down:g('down'),completed:g('completed')};
 if(!o.machine)return er('Select the machine.');if(!o.problem)return er('Enter the problem.');if(!o.date)return er('Enter the date the problem happened.');
 {const sce=scopeErr('tickets',o,i);if(sce)return er(sce)}
 const hasD=DP().length>0,ds=g('dept'),mm=db.machines.find(x=>x.name==o.machine);if(hasD&&!ds)return er('Select the department.');
 if(hasD&&mm&&(mm.dept||UN)!=ds)return er('This machine does not belong to the selected department.');
 o.dept=hasD?(ds==UN?'':ds):(mm?mm.dept||'':'');
 if(o.down!==''&&!(+o.down>=0))return er('Downtime must be a number, 0 or more.');
 const pl=[];for(const x of TP){if(!x.no&&!(+x.qty>0))continue;if(!x.no)return er('Select the spare part for each row, or remove the row.');if(!Number.isInteger(+x.qty)||+x.qty<1)return er('Part quantities must be whole numbers, 1 or more.');const h=pl.find(p=>p.no==x.no);h?h.qty+=+x.qty:pl.push({no:x.no,qty:+x.qty})}
 const done=o.status=='Completed';
 if(done){o.completed=o.completed||T();for(const p of pl){const sp=db.parts.find(s=>s.no==p.no);if(!sp)return er('Unknown spare part '+p.no);if(+sp.qty<p.qty)return er('Not enough stock for '+sp.no+' ('+sp.qty+' in stock, '+p.qty+' needed).')}}
 o.pl=pl;o.parts=pl.map(p=>p.no+' x'+p.qty).join('; ');
 if(done){pl.forEach(p=>{const sp=db.parts.find(s=>s.no==p.no);sp.qty=String(+sp.qty-p.qty);log('Spare part issued: '+p.no+' x'+p.qty+' ('+o.no+')')});
  db.breakdowns.push({machine:o.machine,date:o.date,time:o.time,problem:o.problem,by:o.by,priority:o.priority,status:'Completed',down:o.down,completed:o.completed,desc:o.desc,diagnosis:o.diagnosis,cause:o.cause,action:o.action,parts:o.parts,ticket:o.no,dept:o.dept});stamp(db.breakdowns[db.breakdowns.length-1],true);o.bd=1;log('Breakdown report entry added from ticket '+o.no)}
 stamp(o,i<0);i>=0?Object.assign(db.tickets[i],o):db.tickets.push(o);
 log((i<0?'Ticket raised: ':done?'Ticket completed: ':'Ticket updated: ')+o.no+' - '+o.machine+' - '+o.problem);cl();render();return false}

/* ===== Machine details + timeline ===== */
const ev=()=>[...V('tickets').filter(t=>t.status!='Completed').map(t=>({date:t.date,machine:t.machine,type:'Ticket ('+t.status+')',text:t.no+' '+t.problem,down:0,dept:t.dept||mdept(t.machine)})),...V('machines').map(m=>({date:m.installed,machine:m.name,type:'Machine Installed',text:m.type,down:0})),...V('maintenance').map(r=>({date:r.month,machine:r.machine,type:'Machine Service ('+r.service+')',text:r.type+' - '+(r.active||'Active'),down:0})),...V('breakdowns').map(r=>({date:r.date,machine:r.machine,type:'Breakdown',text:r.problem,down:+r.down||0,dept:r.dept||mdept(r.machine)})),...V('diodes').map(r=>({date:r.replaced||r.installed,machine:r.machine,type:r.replaced?'Diode Replaced':'Diode Installed',text:r.no,down:0}))].filter(e=>e.date).sort((a,b)=>a.date>b.date?1:-1);
function mdet(){const m=db.machines[MI];if(!m||m.del||!inScope('machines',m))return '<p>Machine not found.</p>';
 const t=(k,ks,ls)=>`<h3>${M[k].t}</h3><div class=tw>${tb(ls,db[k].filter(r=>r.machine==m.name).map(r=>ks.map(x=>r[x]||'')))}</div>`;
 return `<button class="btn np" onclick="go('machines')">Back to Machines</button><h2>${E(m.name)} – ${E(m.asset)}</h2>${S.vo?'':'<div class="tools np"><button class=btn onclick="hx(\'xlsx\')">Excel</button><button class=btn onclick="hx(\'pdf\')">PDF</button></div>'}<div class="cd fg">${M.machines.f.filter(f=>!f[4]).map(f=>`<div><span class=mu>${f[1]}</span><br><b>${cell(f[0],m[f[0]])}</b></div>`).join('')}</div>`
 +mupsH(m)+t('maintenance',['month','type','active','service'],['Month','Type','Active Status','Service Status'])+t('breakdowns',['date','problem','priority','down','status'],['Date','Problem','Priority','Downtime (Hours)','Status'])+t('diodes',['no','type','installed','replaced'],['Diode Number','Type','Installed','Replaced'])
 +`<h3>Spare Parts</h3><div class=tw>${tb(['Part Number','Part Name','Quantity'],db.parts.filter(p=>p.compat==m.name).map(p=>[p.no,p.name,p.qty]))}</div><h3>Documents</h3><p>${/^https?:\/\//.test(m.doc||'')?`<a href="${E(m.doc)}" target=_blank rel=noopener>${E(m.doc)}</a>`:'No document linked. Edit the machine to add a link.'}</p><h3>Timeline</h3><div class=tl>${ev().filter(e=>e.machine==m.name).map((e,i,a)=>`<div><b>${E(e.date)} – ${E(e.type)}</b><br><span class=mu>${E(e.text)}</span>${i<a.length-1?'<br>↓':''}</div>`).join('')}</div>`}

/* ===== Reports ===== */
const RL=[['dsum','Department Summary'],['machines','Machine Report'],['ups','UPS Report'],['maintenance','Machine Service Rpt'],['breakdowns','Breakdown History'],['tickets','Ticket Report'],['downtime','Downtime Report'],['diodes','Diode Changing History'],['parts','Spare Parts Report'],['history','Machine History']];
function dsum(){const {a,b,d}=RP,inr=v=>(!a&&!b)||(v&&(!a||v>=a.slice(0,v.length))&&(!b||v<=b.slice(0,v.length))),names=[...DP()],add=v=>{v=v||UN;if(!names.includes(v))names.push(v)};
 V('machines').forEach(m=>add(m.dept));V('tickets').forEach(t=>add(depOf(t)));V('breakdowns').forEach(t=>add(depOf(t)));
 const DR=names.filter(n=>!d||n==d).map(n=>{const ts=V('tickets').filter(t=>depOf(t)==n&&inr(t.date)),bs=V('breakdowns').filter(t=>depOf(t)==n&&inr(t.date)),ms=V('machines').filter(m=>(m.dept||UN)==n);
  return{n,m:ms.length,t:ts.length,o:ts.filter(t=>t.status!='Completed').length,b:bs.length,h:Math.round(bs.reduce((x,y)=>x+(+y.down||0),0)*10)/10,p:ts.filter(t=>t.status=='Completed').reduce((x,t)=>x+(t.pl||[]).reduce((q,z)=>q+(+z.qty||0),0),0)}}).filter(r=>r.n!=UN||r.m||r.t||r.b),
 sm=k=>Math.round(DR.reduce((x,r)=>x+r[k],0)*10)/10,rows=DR.map(r=>[r.n,r.m,r.t,r.o,r.b,r.h,r.p]),mx=Math.max(1,...DR.map(r=>r.h));
 rows.push(['Total',sm('m'),sm('t'),sm('o'),sm('b'),sm('h'),sm('p')]);
 const top=`<div class=g style="margin-bottom:14px">${[['Machines','m'],['Tickets raised','t'],['Open tickets','o'],['Breakdowns','b'],['Downtime hours','h']].map(([l,k])=>`<div class=cd><span class=mu>${l}</span><div class=k>${sm(k)}</div></div>`).join('')}</div><div class=cd style="margin-bottom:14px"><b>Downtime hours by department</b>${DR.map(r=>`<div class=br><span title="${E(r.n)}">${E(r.n)}</span><i style="width:${Math.max(2,Math.round(r.h/mx*100))}%"></i><b>${r.h}</b></div>`).join('')}</div>`;
 return{c:['Department','Machines','Tickets','Open','Breakdowns','Downtime (h)','Parts used'],r:rows,top}}
function rep(){const {k,a,b,d}=RP,inr=v=>(!a&&!b)||(v&&(!a||v>=a.slice(0,v.length))&&(!b||v<=b.slice(0,v.length))),fd=v=>!d||(v||UN)==d;
 if(k=='dsum')return dsum();
 if(k=='history'||k=='downtime')return{c:['Date','Machine','Department','Event','Details','Downtime (Hours)'],r:ev().filter(x=>inr(x.date)&&(k=='history'||x.down>0)&&fd(x.dept||mdept(x.machine))).map(x=>[x.date,x.machine,x.dept||mdept(x.machine)||UN,x.type,x.text,x.down])};
 const X=M[k],cl=[...X.f,...(X.c||[])],mine=r=>!RP.mine||(S&&(r.cb==S.user||r.ub==S.user));
 return{c:[...cl.map(f=>f[1]),'Done By'],r:V(k).map(r=>({...r,...(X.calc?X.calc(r):{})})).filter(r=>(!X.date||inr(r[X.date]||''))&&fd(k=='parts'?mdept(r.compat):r.dept||(k=='machines'?'':mdept(r.machine)))&&mine(r)).map(r=>[...cl.map(f=>r[f[0]]??''),r.ub||r.cb||''])}}
function repV(){return `<h2>Reports</h2><div class="tools np"><select aria-label="Report" onchange="RP.k=this.value;rd()">${RL.map(([k,l])=>`<option value=${k}${RP.k==k?' selected':''}>${l}</option>`).join('')}</select>${DP().length?`<select aria-label="Department" onchange="RP.d=this.value;rd()"><option value="">All departments</option>${dList().map(x=>`<option value="${E(x)}"${RP.d==x?' selected':''}>${E(x)}</option>`).join('')}</select>`:''}${SC()?'<label class=np style="display:flex;align-items:center;gap:6px;margin:0"><input type=checkbox style="width:auto;margin:0"'+(RP.mine?' checked':'')+' onchange="RP.mine=this.checked;rd()">Only my entries</label>':''}<input type=date aria-label="From" value="${RP.a}" onchange="RP.a=this.value;rd()"><input type=date aria-label="To" value="${RP.b}" onchange="RP.b=this.value;rd()"><button class=btn onclick="ex('csv')">CSV</button><button class=btn onclick="ex('csv2')">CSV (;)</button><button class=btn onclick="ex('xlsx')">Excel (.xlsx)</button><button class="btn p" onclick="ex('pdf')">PDF</button><button class=btn onclick="ex('print')">Print</button></div><div class=tw id=rp></div>`}
const rd=()=>{const x=rep();$('#rp').innerHTML=(x.top||'')+tb(x.c,x.r)};
function ex(t){const x=rep(),nm='report-'+RP.k;log('Report generated: '+RP.k);
 if(t=='print')return print();
 if(t=='pdf'){const ti=(RL.find(z=>z[0]==RP.k)||['',RP.k])[1];return dl(nm+'.pdf','application/pdf',pdf('Machinery Information System - '+ti,new Date().toLocaleDateString()+'   |   '+x.r.length+' records',[{t:ti,c:x.c,r:x.r}]))}
 if(t=='xlsx')return dl(nm+'.xlsx',XM,xlsx(x.c,x.r));
 const d=t=='csv2'?';':',';dl(nm+'.csv','text/csv','\ufeff'+(d==';'?'sep=;\r\n':'')+[x.c,...x.r].map(r=>r.map(qt).join(d)).join('\r\n'))}

function exMod(t){const k=$('#em').value,X=M[k],c=X.f.map(f=>f[1]),r=db[k].map(o=>X.f.map(f=>o[f[0]]??''));log('Exported '+X.t);
 t=='xlsx'?dl(k+'.xlsx',XM,xlsx(c,r)):dl(k+'.csv','text/csv','\ufeff'+[c,...r].map(x=>x.map(qt).join(',')).join('\r\n'))}

/* ===== Dashboard search: matching records from every module -> ONE Excel file and ONE PDF file ===== */
let GQ='';
const vc=X=>[...X.f.filter(f=>!f[4]),...(X.c||[])];
/* Machine-wise search: every word must match. Sections: machine history, diode changing history, breakdown history, machine service rpt, machines, parts. */
const HX={t:'Machine History',f:[['date','Date'],['machine','Machine'],['type','Event'],['text','Details'],['down','Downtime (Hours)']]};
function gs(){const w=GQ.toLowerCase().split(/\s+/).filter(Boolean);if(!w.length)return[];
 const hit=r=>{const s=Object.values(r).join(' ').toLowerCase();return w.every(x=>s.includes(x))},
 nm=new Set(V('machines').filter(hit).map(x=>x.name)), /* machines found by name, model, serial, asset no, location, type, diode model... */
 srt=(a,dk)=>a.sort((x,y)=>String(x.machine||x.name||'').localeCompare(String(y.machine||y.name||''))||String(x[dk]||'').localeCompare(String(y[dk]||'')));
 return[{k:'machines',X:M.machines,rows:srt(V('machines').filter(x=>nm.has(x.name)),'installed')},{k:'history',X:HX,rows:srt(ev().filter(e=>nm.has(e.machine)||hit(e)),'date')},...['tickets','diodes','breakdowns','maintenance','parts'].map(k=>{const X=M[k];return{k,X,rows:srt(V(k).map(r=>({...r,...(X.calc?X.calc(r):{})})).filter(r=>hit(r)||nm.has(r.machine||r.compat)),X.date||'date')}})].filter(s=>s.rows.length)}
function gsr(v){if(v!==undefined)GQ=v.trim();const el=$('#gr');if(!el)return;const s=gs(),n=s.reduce((a,x)=>a+x.rows.length,0);
 el.innerHTML=!GQ?'':!n?'<p class=mu>No records match.</p>':`<p><b>${n}</b> records found in ${s.length} section(s). All search words must match.</p>${S.vo?'':'<button class="btn p" onclick="gx(\'xlsx\')">Excel (.xlsx)</button><button class="btn p" onclick="gx(\'pdf\')">PDF</button><button class="btn p" onclick="gx(\'csv\')">CSV (History)</button>'}`
 +s.map(x=>`<h3>${x.X.h||x.X.t} (${x.rows.length})</h3><div class=tw>${tb(vc(x.X).map(f=>f[1]),x.rows.slice(0,10).map(r=>vc(x.X).map(f=>r[f[0]]??'')))}</div>${x.rows.length>10?`<p class=mu>Showing 10 of ${x.rows.length}. ${S.vo?'Open the page list to see all of them.':'The exported files contain all of them.'}</p>`:''}`).join('')}
function gx(t){const s=gs();if(!s.length)return;const d=new Date().toISOString().slice(0,10),n=s.reduce((a,x)=>a+x.rows.length,0),fn='search-'+(GQ.replace(/[^\w]+/g,'_').slice(0,30)||'results')+'-'+d;
 log('Search report generated: '+GQ);
 if(t=='csv'){const h=s.find(x=>x.k=='history');return h?dl(fn+'.csv','text/csv','\ufeff'+[HX.f.map(f=>f[1]),...h.rows.map(r=>HX.f.map(f=>r[f[0]]??''))].map(x=>x.map(qt).join(',')).join('\r\n')):alert('No machine history rows to export.')}
 if(t=='pdf')return dl(fn+'.pdf','application/pdf',pdf('Machinery Information System - Search Report','Search: "'+GQ+'"   |   '+d+'   |   '+n+' records',s.map(x=>({t:(x.X.h||x.X.t)+' ('+x.rows.length+')',c:vc(x.X).map(f=>f[1]),r:x.rows.map(r=>vc(x.X).map(f=>r[f[0]]??''))}))));
 dl(fn+'.xlsx',XM,xlsxN([['Summary',['Item','Value'],[['Search',GQ],['Date',d],['User',S.user],['Total Records',n],...s.map(x=>[x.X.h||x.X.t,x.rows.length])]],...s.map(x=>{const c=[...x.X.f,...(x.X.c||[])];return[x.X.h||x.X.t,c.map(f=>f[1]),x.rows.map(r=>c.map(f=>r[f[0]]??''))]})]))}
/* Excel workbook with several sheets */
function xlsxN(SH){const H='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n',NS='http://schemas.openxmlformats.org/',
 xe=s=>String(s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/[&<>"]/g,ch=>'&#'+ch.charCodeAt(0)+';'),
 col=i=>{let s='';for(i++;i;i=Math.floor((i-1)/26))s=String.fromCharCode(65+(i-1)%26)+s;return s},
 cx=(v,i,j)=>{v=v??'';const ref=col(j)+(i+1);return /^-?(0|[1-9]\d{0,14})(\.\d+)?$/.test(String(v))?`<c r="${ref}"><v>${v}</v></c>`:`<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xe(v)}</t></is></c>`},
 used=new Set(),nm=SH.map(([n])=>{const b=String(n).replace(/[\[\]:*?\/\\]/g,' ').slice(0,28)||'Sheet';let u=b,k=1;while(used.has(u.toLowerCase()))u=b+' '+(++k);used.add(u.toLowerCase());return xe(u)}),
 F={'[Content_Types].xml':H+`<Types xmlns="${NS}package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${SH.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`,
 '_rels/.rels':H+`<Relationships xmlns="${NS}package/2006/relationships"><Relationship Id="rId1" Type="${NS}officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
 'xl/workbook.xml':H+`<workbook xmlns="${NS}spreadsheetml/2006/main" xmlns:r="${NS}officeDocument/2006/relationships"><sheets>${nm.map((n,i)=>`<sheet name="${n}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets></workbook>`,
 'xl/_rels/workbook.xml.rels':H+`<Relationships xmlns="${NS}package/2006/relationships">${SH.map((_,i)=>`<Relationship Id="rId${i+1}" Type="${NS}officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}</Relationships>`};
 SH.forEach(([,c,r],i)=>F['xl/worksheets/sheet'+(i+1)+'.xml']=H+`<worksheet xmlns="${NS}spreadsheetml/2006/main"><sheetData>${[c,...r].map((y,a)=>`<row r="${a+1}">${y.map((v,b)=>cx(v,a,b)).join('')}</row>`).join('')}</sheetData></worksheet>`);
 return zip(F)}
/* Minimal PDF writer (A4 landscape, Helvetica text tables, no libraries) */
function pdf(title,sub,secs){const W=842,Hh=595,mg=30,fs=7,lh=11,esc=s=>String(s??'').replace(/[^\x20-\x7e\xa0-\xff]/g,'?').replace(/[\\()]/g,'\\$&'),pages=[];let cur,y;
 const nw=()=>{cur=[];pages.push(cur);y=Hh-mg},tx=(x,yy,s,b,z)=>cur.push(`BT /F${b?2:1} ${z||fs} Tf ${x.toFixed(1)} ${yy} Td (${esc(s)}) Tj ET`);
 nw();tx(mg,y-=14,title,1,14);tx(mg,y-=16,sub,0,9);y-=8;
 for(const s of secs){const wt=s.c.map((h,i)=>Math.min(30,Math.max(6,String(h).length,...s.r.slice(0,300).map(r=>String(r[i]??'').length)))),tw=wt.reduce((a,b)=>a+b,0),cw=wt.map(x=>(W-2*mg)*x/tw),px=cw.map((_,i)=>mg+cw.slice(0,i).reduce((a,b)=>a+b,0)),cut=(v,i)=>{v=String(v??'');const mx=Math.max(4,Math.floor(cw[i]/(fs*.55))-1);return v.length>mx?v.slice(0,mx-2)+'..':v},head=()=>{s.c.forEach((h,i)=>tx(px[i],y,cut(h,i),1));y-=lh};
  if(y<mg+lh*5)nw();tx(mg,y-=4,s.t,1,10);y-=8;head();
  for(const r of s.r){if(y<mg+lh){nw();tx(mg,y,s.t+' (continued)',1,9);y-=lh;head()}r.forEach((v,i)=>tx(px[i],y,cut(v,i)));y-=lh}
  y-=10}
 pages.forEach((p,i)=>{cur=p;tx(W/2-30,14,'Page '+(i+1)+' of '+pages.length)});
 let out='%PDF-1.4\n';const offs=[],add=(id,b)=>{offs[id]=out.length;out+=id+' 0 obj\n'+b+'\nendobj\n'};
 add(1,'<< /Type /Catalog /Pages 2 0 R >>');add(2,`<< /Type /Pages /Kids [${pages.map((_,i)=>(5+2*i)+' 0 R').join(' ')}] /Count ${pages.length} >>`);
 add(3,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');add(4,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
 pages.forEach((p,i)=>{const c=p.join('\n');add(5+2*i,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${Hh}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6+2*i} 0 R >>`);add(6+2*i,`<< /Length ${c.length} >>\nstream\n${c}\nendstream`)});
 const n=5+2*pages.length,xr=out.length;
 out+=`xref\n0 ${n}\n0000000000 65535 f \n`+offs.slice(1).map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size ${n} /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF`;
 return new Blob([Uint8Array.from(out,c=>c.charCodeAt(0))],{type:'application/pdf'})}

/* ===== Users, audit log ===== */
function usersV(){if(S.role!='admin')return '<p>Administrators only.</p>';
 return `${S.mode=='demo'?'<p class=mu>Demo mode: accounts are not editable.</p>':`<form class="tools np" onsubmit="addU(event);return false"><input name=u placeholder="Username" required><input name=p type=password placeholder="Password (min 12)" autocomplete=new-password required><input name=t type=password placeholder="GitHub token for this person" autocomplete=off required><select name=r aria-label="Role" onchange="vpShow(this.value)"><option value=auto>Administrator / Viewer (token decides)</option><option value=viewonly>View only (no downloads, no reports)</option><option value=engineer>Engineer / Technical support</option>${TR()?'<option value=worker>Worker (raise tickets only)</option>':''}</select><fieldset id=vpg style="display:none;flex-basis:100%;border:1px solid var(--bd);border-radius:6px"><legend>Pages this person can open</legend>${VOP.map(([k,l])=>`<label style="display:inline-flex;gap:5px;align-items:center;margin:2px 12px 2px 0"><input type=checkbox name=pg value=${k} checked style="width:auto;margin:0">${l}</label>`).join('')}</fieldset><fieldset id=epg style="display:none;flex-basis:100%;border:1px solid var(--bd);border-radius:6px"><legend>Departments this engineer works in</legend>${DP().length?DP().map(d=>`<label style="display:inline-flex;gap:5px;align-items:center;margin:2px 12px 2px 0"><input type=checkbox name=dp value="${E(d)}" style="width:auto;margin:0">${E(d)}</label>`).join(''):'<span class=mu>Add departments in Settings first.</span>'}</fieldset><button class="btn p">Add User</button></form><p class=mu>Administrator = token with Read and write on the data, tickets and website repositories. Viewer = read-only token for the data repository. Worker = token limited to the tickets repository ONLY (Contents: Read and write on <b>${E(CFG.ticketRepo||'tickets repository not set in config.js')}</b>); a worker can only raise tickets and cannot see any records or reports. View only = a READ-ONLY token for the data repository (like a Viewer) but the person only sees the pages you tick and gets no Excel, PDF, CSV, print or Reports. Engineer = a token with READ AND WRITE on the data repository only (never the website repository). The person works only in the departments you tick; their deletions wait for your approval in Settings > Approvals. Best practice: one token per person.</p>${INBOXMSG?`<p class=er>${E(INBOXMSG)}</p>`:''}${TR()&&WR?'<p><button class=btn onclick="pullTickets()">Check worker tickets now</button></p>':''}<div class=tw id=ul>Loading...</div>`}<h3>Audit Log</h3><div class=tw>${tb(['User','Date / Time','Action'],db.audit.slice(0,100).map(a=>[a.u,a.t,a.a]))}</div>`}

/* ===== Settings: CSV import (validate, detect duplicates, preview, confirm), backup, restore, reset ===== */
function deptCard(){const n=d=>db.machines.filter(m=>m.dept==d).length;
 return `<div class=cd><h3>Departments</h3><p class=mu>Machines are grouped by these departments (Machines page, tickets and reports).</p><form class=tools onsubmit="return deptAdd(event)"><input name=n placeholder="New department name" maxlength=60 required><button class="btn p">Add</button></form>${DP().length?`<div class=tw><table><thead><tr><th>Department<th>Machines<th></tr></thead><tbody>${DP().map((d,i)=>`<tr><td>${E(d)}<td>${n(d)}<td><button class=btn onclick="deptRen(${i})">Rename</button><button class=btn onclick="deptDel(${i})">Delete</button></tr>`).join('')}</tbody></table></div>`:'<p class=mu>No departments yet.</p>'}</div>`}
function deptAdd(e){e.preventDefault();if(S.role!='admin')return false;const v=String(new FormData(e.target).get('n')||'').trim().slice(0,60);if(!v)return false;
 if(v.toLowerCase()==UN.toLowerCase()||DP().some(x=>x.toLowerCase()==v.toLowerCase())){alert('That department already exists.');return false}
 db.depts.push(v);log('Department added: '+v);save();render();return false}
function deptRen(i){if(S.role!='admin')return;const o=db.depts[i],v=(prompt('Rename department',o)||'').trim().slice(0,60);if(!v||v==o)return;
 if(v.toLowerCase()==UN.toLowerCase()||db.depts.some((x,j)=>j!=i&&x.toLowerCase()==v.toLowerCase())){alert('That name is already used.');return}
 db.depts[i]=v;[...db.machines,...db.tickets,...db.breakdowns,...db.ups].forEach(r=>{if(r.dept==o)r.dept=v});db.notify.eng.forEach(e=>{e.d=e.d.map(x=>x==o?v:x)});db.cover.forEach(c=>{c.d=c.d.map(x=>x==o?v:x)});userDeptSync(o,v);log('Department renamed: '+o+' -> '+v);save();render()}
function deptDel(i){if(S.role!='admin')return;const o=db.depts[i],n=db.machines.filter(m=>m.dept==o).length,nu=db.ups.filter(u=>u.dept==o).length;if(n||nu)return alert('Move the '+n+' machine(s) and '+nu+' UPS in "'+o+'" to another department first.');
 if(!confirm('Delete department "'+o+'"? Old tickets keep their department name.'))return;db.depts.splice(i,1);db.notify.eng.forEach(e=>{e.d=e.d.filter(x=>x!=o)});db.cover.forEach(c=>{c.d=c.d.filter(x=>x!=o)});userDeptSync(o,null);log('Department deleted: '+o);save();render()}
const SSEC=[['dep','Departments',()=>DP().length+(DP().length==1?' department':' departments')],['usr','Users','Logins and roles'],['apr','Approvals',()=>pendN()+' pending'],['cov','Cover',()=>{const n=(db.cover||[]).filter(cvAct).length;return n?n+' active':'No cover set'}],['ntf','Notifications',()=>isOn()&&TR()?(db.notify.on?'Activated':'Deactivated'):'Not available'],['dat','Data import / export','Excel and CSV'],['bak','Backups','Snapshots and restore']];
function sTab(k){SETAB=k;render()}
const dataCards=()=>`<div class=g><div class=cd><h3>Import Existing Data (Excel / CSV)</h3><p class=mu>Accepts .xlsx and .csv (comma, semicolon or tab separated). Headings must match the field names; dates, numbers and list values are checked and converted. Existing records are never deleted.</p><select id=im>${Object.keys(M).map(k=>`<option value=${k}>${M[k].t}</option>`).join('')}</select><button class=btn onclick="tpl('xlsx')">Template (.xlsx)</button><button class=btn onclick="tpl('csv')">Template (.csv)</button><input type=file accept=".xlsx,.csv,.tsv,.txt,.xls" aria-label="Excel or CSV file" onchange="imp(this)"><div class=tw id=ip></div></div><div class=cd><h3>Export Data (Excel / CSV)</h3><select id=em>${Object.keys(M).map(k=>`<option value=${k}>${M[k].t}</option>`).join('')}</select><button class=btn onclick="exMod('xlsx')">Excel (.xlsx)</button><button class=btn onclick="exMod('csv')">CSV</button><p class=mu>Same headings the import accepts, so an export can be imported again.</p></div></div>`,
 backupCards=()=>`${isOn()?`<div class=cd><h3>GitHub Backups</h3><p class=mu>Snapshots are stored in the private data repository (folder backups). Every change is also kept in GitHub's commit history.</p><button class="btn p" onclick="bkNow()">Create Backup Now</button><button class=btn onclick="upLocal()">Import old data found in this browser</button><div class=tw id=bk></div></div>`:''}<div class=cd><h3>Backup file and transfer</h3><button class=btn onclick="dl('mis-backup.json','application/json',JSON.stringify(db))">Export Backup</button><p><input type=file accept=.json aria-label="Backup file" onchange="rest(this)"></p><p class=mu>The backup holds all data and password hashes. Keep it private.</p></div><div class="cd dz"><h3>Danger zone</h3><p class=mu>Reset Data deletes ALL records. A copy stays in GitHub history, but create a backup first.</p><button class="btn dg" onclick="rst()">Reset Data</button></div>`;
function setV(){if(S.role!='admin')return '<p>Administrators only.</p>';
 if(!SSEC.some(x=>x[0]==SETAB))SETAB='dep';
 const body={dep:deptCard,usr:usersV,apr:aprCard,cov:coverCard,ntf:notifCard,dat:dataCards,bak:backupCards}[SETAB]();
 return `<h2>Settings</h2><div class=shell><nav class="snav np" aria-label="Settings sections">${SSEC.map(([k,l,h])=>`<button class="ni${k==SETAB?' on':''}" onclick="sTab('${k}')"${k==SETAB?' aria-current=page':''}><span>${l}</span><small>${E(typeof h=='function'?h():h)}</small></button>`).join('')}</nav><section class=ss><h3 class=sh>${E(SSEC.find(x=>x[0]==SETAB)[1])}</h3>${body}</section></div>`}
/* ---- File formats: CSV (comma/semicolon/tab, UTF-8 or ANSI), real .xlsx read + write (no libraries), old HTML-style .xls ---- */
const XM='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',pad=n=>String(n).padStart(2,'0'),nk=s=>String(s).toLowerCase().replace(/[^a-z0-9]/g,''),
 ux=s=>s.replace(/&(#x[0-9a-f]+|#\d+|lt|gt|amp|quot|apos);/gi,(m,e)=>({lt:'<',gt:'>',amp:'&',quot:'"',apos:"'"}[e.toLowerCase()]??String.fromCodePoint(e[1].toLowerCase()=='x'?parseInt(e.slice(2),16):+e.slice(1)))),
 dec=b=>{try{return new TextDecoder('utf-8',{fatal:true}).decode(b)}catch(e){return new TextDecoder('windows-1252').decode(b)}},
 qt=v=>{v=String(v??'');if(/^[=+@\t\r]/.test(v)||/^-(?!\d)/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"'},
 CT=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})(),
 crc=u=>{let c=-1;for(const b of u)c=CT[(c^b)&255]^(c>>>8);return (c^-1)>>>0};
function zip(F){const te=new TextEncoder(),parts=[],cd=[];let off=0;
 for(const [n,s] of Object.entries(F)){const nb=te.encode(n),d=te.encode(s),c=crc(d),l=new DataView(new ArrayBuffer(30)),h=new DataView(new ArrayBuffer(46));
  l.setUint32(0,0x04034b50,true);l.setUint16(4,20,true);l.setUint16(6,0x800,true);l.setUint16(12,0x21,true);l.setUint32(14,c,true);l.setUint32(18,d.length,true);l.setUint32(22,d.length,true);l.setUint16(26,nb.length,true);
  h.setUint32(0,0x02014b50,true);h.setUint16(4,20,true);h.setUint16(6,20,true);h.setUint16(8,0x800,true);h.setUint16(14,0x21,true);h.setUint32(16,c,true);h.setUint32(20,d.length,true);h.setUint32(24,d.length,true);h.setUint16(28,nb.length,true);h.setUint32(42,off,true);
  parts.push(new Uint8Array(l.buffer),nb,d);cd.push(new Uint8Array(h.buffer),nb);off+=30+nb.length+d.length}
 const n=Object.keys(F).length,e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,n,true);e.setUint16(10,n,true);e.setUint32(12,cd.reduce((a,x)=>a+x.length,0),true);e.setUint32(16,off,true);
 return new Blob([...parts,...cd,new Uint8Array(e.buffer)],{type:XM})}
function xlsx(c,r){const H='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n',
 col=i=>{let s='';for(i++;i;i=Math.floor((i-1)/26))s=String.fromCharCode(65+(i-1)%26)+s;return s},
 x=s=>String(s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/[&<>"]/g,ch=>'&#'+ch.charCodeAt(0)+';'),
 cx=(v,i,j)=>{v=v??'';const ref=col(j)+(i+1);return /^-?(0|[1-9]\d{0,14})(\.\d+)?$/.test(String(v))?`<c r="${ref}"><v>${v}</v></c>`:`<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${x(v)}</t></is></c>`},
 N='xmlns="http://schemas.openxmlformats.org/',R='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
 return zip({'[Content_Types].xml':H+`<Types ${N}package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
 '_rels/.rels':H+`<Relationships ${N}package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
 'xl/workbook.xml':H+`<workbook ${N}spreadsheetml/2006/main" xmlns:r="${R}"><sheets><sheet name="Data" sheetId="1" r:id="rId1"/></sheets></workbook>`,
 'xl/_rels/workbook.xml.rels':H+`<Relationships ${N}package/2006/relationships"><Relationship Id="rId1" Type="${R}/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
 'xl/worksheets/sheet1.xml':H+`<worksheet ${N}spreadsheetml/2006/main"><sheetData>${[c,...r].map((y,i)=>`<row r="${i+1}">${y.map((v,j)=>cx(v,i,j)).join('')}</row>`).join('')}</sheetData></worksheet>`})}
async function unzip(buf){const v=new DataView(buf),u=new Uint8Array(buf);let e=u.length-22;while(e>=0&&v.getUint32(e,true)!=0x06054b50)e--;if(e<0)throw new Error('Not a valid Excel (.xlsx) file.');
 const n=v.getUint16(e+10,true),F={};let p=v.getUint32(e+16,true);
 for(let i=0;i<n;i++){const m=v.getUint16(p+10,true),cs=v.getUint32(p+20,true),nl=v.getUint16(p+28,true),xl=v.getUint16(p+30,true),cl=v.getUint16(p+32,true),lo=v.getUint32(p+42,true),name=new TextDecoder().decode(u.subarray(p+46,p+46+nl)),
  s=lo+30+v.getUint16(lo+26,true)+v.getUint16(lo+28,true),d=u.subarray(s,s+cs);
  F[name]=async()=>m==0?d:new Uint8Array(await new Response(new Blob([d]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());p+=46+nl+xl+cl}
 return F}
async function xread(buf){const F=await unzip(buf),tx=async n=>dec(await F[n]()),
 sn=Object.keys(F).filter(n=>/^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort((a,b)=>a.match(/\d+/)[0]-b.match(/\d+/)[0])[0];
 if(!sn)throw new Error('No worksheet found in this file (only Excel .xlsx workbooks are supported).');
 const tt=b=>[...b.matchAll(/<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/g)].map(x=>x[1]).join(''),
 SS=F['xl/sharedStrings.xml']?[...(await tx('xl/sharedStrings.xml')).matchAll(/<(?:\w+:)?si\b[^>]*>([\s\S]*?)<\/(?:\w+:)?si>/g)].map(m=>ux(tt(m[1]))):[],R=[],
 xml=(await tx(sn)).replace(/<(?:\w+:)?row\b[^>]*\/>/g,'');
 for(const rm of xml.matchAll(/<(?:\w+:)?row\b[^>]*>([\s\S]*?)<\/(?:\w+:)?row>/g)){const row=[];
  for(const cm of rm[1].matchAll(/<(?:\w+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?c>)/g)){const a=cm[1],ref=(a.match(/\br="([A-Z]+)/)||[])[1],ty=(a.match(/\bt="(\w+)"/)||[])[1],b=cm[2]||'';
   let j=row.length;if(ref){j=0;for(const ch of ref)j=j*26+ch.charCodeAt(0)-64;j--}
   let v=(b.match(/<(?:\w+:)?v>([\s\S]*?)<\/(?:\w+:)?v>/)||[])[1];if(ty=='inlineStr')v=tt(b);
   v=v==null?'':ux(v);if(ty=='s')v=SS[+v]??'';if(ty=='b')v=v=='1'?'TRUE':'FALSE';row[j]=v}
  R.push([...row].map(x=>x??''))}
 return R.filter(r=>r.some(v=>String(v).trim()))}
const htab=t=>[...t.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(m=>[...m[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)].map(c=>ux(c[1].replace(/<[^>]*>/g,'')).trim())).filter(r=>r.some(Boolean));
function csv(t,d=','){const R=[];let r=[],c='',q=0;for(let i=0;i<t.length;i++){const h=t[i];if(q){if(h=='"'){if(t[i+1]=='"'){c+='"';i++}else q=0}else c+=h}else if(h=='"'&&!c)q=1;else if(h==d){r.push(c);c=''}else if(h=='\n'||h=='\r'){if(h=='\r'&&t[i+1]=='\n')i++;r.push(c);c='';R.push(r);r=[]}else c+=h}if(c||r.length){r.push(c);R.push(r)}return R.filter(x=>x.some(v=>v.trim()))}
async function readTable(fl){const b=await fl.arrayBuffer(),u=new Uint8Array(b);
 if(u[0]==0x50&&u[1]==0x4b)return xread(b);
 if(u[0]==0xD0&&u[1]==0xCF)throw new Error('Old binary .xls files cannot be read. In Excel choose Save As > Excel Workbook (.xlsx) or CSV.');
 const t=dec(u).replace(/^\ufeff/,'');if(/^\s*<(\?xml|html|table|!doctype)/i.test(t))return htab(t);
 const m=t.match(/^sep=(.)\r?\n/i),l=t.split(/\r?\n/)[0],d=m?m[1]:[',',';','\t'].map(x=>[x,l.split(x).length]).sort((a,b)=>b[1]-a[1])[0][0];
 return csv(m?t.slice(m[0].length):t,d)}
/* ---- Value checks: dates (ISO, d/m/y, Excel serial), times, numbers (1,234.50 or 1.234,50), fixed lists ---- */
function iso(v){let y,m,d,x;
 if(x=v.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/)){y=+x[1];m=+x[2];d=+x[3]}
 else if(x=v.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})/)){y=+x[3];if(y<100)y+=2000;const a=+x[1],b=+x[2];if(b>12&&a<=12){m=a;d=b}else{d=a;m=b}}
 else if(/^\d{5}(\.\d+)?$/.test(v)&&v>10000&&v<80000){const t=new Date(Date.UTC(1899,11,30)+Math.floor(v)*864e5);y=t.getUTCFullYear();m=t.getUTCMonth()+1;d=t.getUTCDate()}
 else{const t=new Date(v);if(isNaN(t))return null;y=t.getFullYear();m=t.getMonth()+1;d=t.getDate()}
 const c=new Date(Date.UTC(y,m-1,d));return c.getUTCFullYear()==y&&c.getUTCMonth()==m-1&&c.getUTCDate()==d?`${y}-${pad(m)}-${pad(d)}`:null}
function mon(v){let x;const MN=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
 if(x=v.match(/^(\d{4})[-\/.](\d{1,2})$/))return +x[2]>=1&&+x[2]<=12?x[1]+'-'+pad(x[2]):null;
 if(x=v.match(/^(\d{1,2})[-\/.](\d{4})$/))return +x[1]>=1&&+x[1]<=12?x[2]+'-'+pad(x[1]):null;
 if(x=v.match(/^([a-z]{3})[a-z]*[\s.,-]+(\d{2,4})$/i)){const i=MN.indexOf(x[1].toLowerCase());if(i<0)return null;let y=+x[2];if(y<100)y+=2000;return y+'-'+pad(i+1)}
 const d=iso(v);return d?d.slice(0,7):null}
function tim(v){let x;if(x=v.match(/(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?\s*([ap]m)?\s*$/i)){let h=+x[1];const p=(x[3]||'').toLowerCase();if(p=='pm'&&h<12)h+=12;if(p=='am'&&h==12)h=0;return h<24&&+x[2]<60?pad(h)+':'+x[2]:null}
 if(/^\d+(\.\d+)?$/.test(v)){const n=Math.round(v%1*1440)%1440;return pad(Math.floor(n/60))+':'+pad(n%60)}return null}
function mon(v){v=String(v).trim();let x;if(/^\d{4}-(0[1-9]|1[0-2])$/.test(v))return v;
 if(x=v.match(/^(\d{1,2})[\/.-](\d{4})$/))return +x[1]>=1&&+x[1]<=12?x[2]+'-'+pad(x[1]):null;
 if(x=v.match(/^([A-Za-z]{3,9})[\s\-.,\/]*(\d{2,4})$/)){const i='jan feb mar apr may jun jul aug sep oct nov dec'.split(' ').indexOf(x[1].slice(0,3).toLowerCase());let y=+x[2];if(i<0)return null;if(y<100)y+=2000;return y+'-'+pad(i+1)}
 const r=iso(v);return r?r.slice(0,7):null}
function norm(f,v){v=String(v??'').trim();if(v==='')return[''];const t=f[2],o=f[3];
 if(t=='d'){const r=iso(v);return r?[r]:[v,'invalid date']}
 if(t=='tm'){const r=tim(v);return r?[r]:[v,'invalid time']}
 if(t=='mo'){const r=mon(v);return r?[r]:[v,'invalid month (use 2026-03)']}
 if(t=='mo'){const r=mon(v);return r?[r]:[v,'invalid month (use 2026-09 or Sep 2026)']}
 if(t=='n'){let s=v.replace(/[^\d.,\-eE+]/g,'');
  if(s.includes(',')&&s.includes('.'))s=s.lastIndexOf(',')>s.lastIndexOf('.')?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,'');
  else if(s.includes(','))s=/^-?\d{1,3}(,\d{3})+$/.test(s)?s.replace(/,/g,''):s.replace(',','.');
  return s!==''&&isFinite(s)&&+s>=0?[String(+s)]:[v,'not a valid number']}
 if(t=='s'&&(o=='d'||o=='u'))return[v];
 if(t=='s'&&o!='m'){const r=o.find(x=>x.toLowerCase()==v.toLowerCase());return r?[r]:[v,'must be '+o.join(' / ')]}
 return[v]}
/* ---- Import: read, map headings, validate, detect duplicates, preview, confirm ---- */
async function imp(inp){const fl=inp.files[0];if(!fl)return;const m=$('#im').value,X=M[m],P=$('#ip');
 try{const R=await readTable(fl),hd=R.shift()||[],H=hd.map(h=>{const k=nk(h)=='maintenancetype'?'type':nk(h),f=X.f.find(f=>nk(f[1])==k||nk(f[1].replace(/\(.*\)/,''))==k||f[0]==String(h).trim().toLowerCase());return f&&k?f[0]:null});
  IM={m,rows:[]};const seen=[...db[m]];
  R.forEach(r=>{const o={},er=[];
   X.f.forEach(f=>{const i=H.indexOf(f[0]),[v,e]=norm(f,i<0?'':r[i]);o[f[0]]=v;if(e)er.push(f[1]+' "'+v+'" '+e)});
   if(m=='maintenance'){if(!o.month&&o.date)o.month=o.date.slice(0,7);o.active=o.active||'Active';o.service=o.service||(o.status=='Completed'?'Updated':'Pending')}
   const miss=X.req.find(k=>!o[k]);if(miss&&!er.length)er.push('missing '+X.f.find(f=>f[0]==miss)[1]);
   const dup=!er.length&&seen.some(e=>X.u?e[X.u]==o[X.u]:X.f.every(f=>String(e[f[0]]??'')==o[f[0]])),st=er.length?'Error: '+er.join('; '):dup?'Duplicate':'New';
   if(st=='New')seen.push(o);IM.rows.push({o,st})});
  const n=s=>IM.rows.filter(x=>x.st.startsWith(s)).length,pf=X.f.slice(0,3),ig=hd.filter((h,i)=>!H[i]&&String(h).trim());
  P.innerHTML=`<p class=mu>${E(fl.name)}: ${R.length} rows, ${H.filter(Boolean).length} of ${hd.length} columns recognised${ig.length?'. Ignored: '+E(ig.join(', ')):''}.</p>`+(H.some(Boolean)?'':'<p class=er>No column headings match. Download a template to see the expected headings.</p>')+tb(['Row','Status',...pf.map(f=>f[1])],IM.rows.slice(0,50).map((x,i)=>[i+1,x.st,...pf.map(f=>x.o[f[0]])]))+`<p>${n('New')} new, ${n('Dup')} duplicate, ${n('Err')} with errors (first 50 shown). Only new rows are imported.</p>`+(n('New')?'<button class="btn p" onclick="okImp()">Confirm Import</button>':'')
 }catch(e){IM=null;P.innerHTML='<p class=er>'+E(e.message||'This file could not be read.')+'</p>'}}
function tpl(t){const k=$('#im').value,c=M[k].f.map(f=>f[1]);t=='xlsx'?dl('template-'+k+'.xlsx',XM,xlsx(c,[])):dl('template-'+k+'.csv','text/csv','\ufeff'+c.map(qt).join(',')+'\r\n')}
function okImp(){if(S.role!='admin')return;const n=IM.rows.filter(x=>x.st=='New').map(x=>x.o);db[IM.m].push(...n);log('Imported '+n.length+' '+M[IM.m].t+' records');alert(n.length+' records imported.');render()}
function rest(inp){if(S.role!='admin')return;const fl=inp.files[0];if(!fl)return;const fr=new FileReader();fr.onload=()=>{try{const j=JSON.parse(fr.result);if(!Array.isArray(j.machines))throw 0;if(!confirm('Replace ALL current data with this backup?'))return;db=mig(Object.assign(emp(),j));log('Backup restored');render()}catch(e){alert('Not a valid backup file.')}};fr.readAsText(fl)}
function rst(){if(S.role!='admin'||!confirm('Delete ALL records? A copy stays in GitHub history. Create a backup first.'))return;db=S.mode=='demo'?seed():Object.assign(emp(),{audit:db.audit});log('All data reset');save();render()}

render();
