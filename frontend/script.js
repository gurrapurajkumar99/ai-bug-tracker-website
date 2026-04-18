// ═══════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════
function getApiBase(){
  if(window.BUGTRACKER_API_URL){
    return window.BUGTRACKER_API_URL.replace(/\/$/, '');
  }

  if(window.location.protocol === 'file:'){
    return 'http://localhost:5001/api';
  }

  var isBackendOrigin = window.location.port === '5001';
  var isSeparateLocalFrontend = window.location.port && !isBackendOrigin;
  if(isSeparateLocalFrontend){
    return window.location.protocol + '//' + window.location.hostname + ':5001/api';
  }

  return '/api';
}

var API = getApiBase();
var token = localStorage.getItem('bt_token') || '';
var currentUser = JSON.parse(localStorage.getItem('bt_user') || 'null');

var bugs = [
  {id:'BUG-001',title:'Login crashes on Safari mobile',project:'Authentication',sev:'critical',status:'open',assignee:'Arjun Sharma',reported:'2024-01-15',conf:0.93,rank:98},
  {id:'BUG-002',title:'Payment fails silently for Visa cards',project:'Payments',sev:'critical',status:'in_progress',assignee:'Priya Venkat',reported:'2024-01-14',conf:0.89,rank:96},
  {id:'BUG-003',title:'Dashboard charts not loading on Firefox',project:'Dashboard',sev:'high',status:'open',assignee:'Karan Das',reported:'2024-01-14',conf:0.81,rank:74},
  {id:'BUG-004',title:'API rate limit not applied correctly',project:'API',sev:'high',status:'in_progress',assignee:'Arjun Sharma',reported:'2024-01-13',conf:0.84,rank:72},
  {id:'BUG-005',title:'Password reset email not sent',project:'Authentication',sev:'high',status:'resolved',assignee:'Meena Raj',reported:'2024-01-12',conf:0.77,rank:71},
  {id:'BUG-006',title:'Session expires too quickly',project:'Authentication',sev:'medium',status:'open',assignee:'Karan Das',reported:'2024-01-11',conf:0.71,rank:48},
  {id:'BUG-007',title:'Currency formatting wrong for INR',project:'Payments',sev:'medium',status:'resolved',assignee:'Priya Venkat',reported:'2024-01-10',conf:0.68,rank:44},
  {id:'BUG-008',title:'Export button missing on mobile',project:'Dashboard',sev:'low',status:'resolved',assignee:'Meena Raj',reported:'2024-01-09',conf:0.62,rank:18},
  {id:'BUG-009',title:'Tooltip text truncated on small screens',project:'Dashboard',sev:'low',status:'closed',assignee:'Karan Das',reported:'2024-01-08',conf:0.59,rank:12},
  {id:'BUG-010',title:'GraphQL query timeout after 30s',project:'API',sev:'high',status:'in_progress',assignee:'Arjun Sharma',reported:'2024-01-07',conf:0.86,rank:73},
  {id:'BUG-011',title:'2FA code rejected on Google Auth',project:'Authentication',sev:'critical',status:'open',assignee:'Priya Venkat',reported:'2024-01-06',conf:0.91,rank:97},
  {id:'BUG-012',title:'Refund API returns 500 on retry',project:'Payments',sev:'high',status:'open',assignee:'Arjun Sharma',reported:'2024-01-05',conf:0.83,rank:75},
];

var users = [
  {id:'u1',name:'Admin User',   email:'admin@bugtracker.com', role:'admin',    dept:'Management',  active:true},
  {id:'u2',name:'Arjun Sharma', email:'dev@bugtracker.com',   role:'developer',dept:'Engineering', active:true},
  {id:'u3',name:'Priya Venkat', email:'priya@bugtracker.com', role:'developer',dept:'Engineering', active:true},
  {id:'u4',name:'Meena Raj',    email:'tester@bugtracker.com',role:'tester',   dept:'QA',          active:true},
  {id:'u5',name:'Karan Das',    email:'karan@bugtracker.com', role:'developer',dept:'Backend',     active:true},
];

var projects = [
  {id:'p1',name:'Authentication',key:'AUTH',desc:'Login, OAuth, 2FA, session management',status:'active'},
  {id:'p2',name:'Payments',      key:'PAY', desc:'Stripe/Razorpay integration, refunds', status:'active'},
  {id:'p3',name:'Dashboard',     key:'DASH',desc:'Analytics UI, charts, filters, export',status:'active'},
  {id:'p4',name:'API',           key:'API', desc:'REST & GraphQL, rate limiting, auth',  status:'active'},
];

var aiTimer = null;
var currentBugDetailId = null;
var chartsBuilt = false;
var analyticsBuilt = false;
var isLoggingIn = false;
var isSubmittingBug = false;

// ═══════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════
function fillDemo(e,p){ 
  if(document.getElementById('reg-form').style.display !== 'none') toggleRegForm();
  document.getElementById('l-email').value=e; document.getElementById('l-pass').value=p; 
}

function bindLoginActions(){
  var adminBtn = document.getElementById('demo-admin');
  var developerBtn = document.getElementById('demo-developer');
  var testerBtn = document.getElementById('demo-tester');
  var loginBtn = document.getElementById('login-btn');
  var loginForm = document.getElementById('login-form');
  var emailInput = document.getElementById('l-email');
  var passwordInput = document.getElementById('l-pass');

  if(adminBtn) adminBtn.addEventListener('click', function(){ fillDemo('admin.user@gmail.com','OrgPass2024'); });
  if(developerBtn) developerBtn.addEventListener('click', function(){ fillDemo('arjun.sharma@gmail.com','OrgPass2024'); });
  if(testerBtn) testerBtn.addEventListener('click', function(){ fillDemo('meena.raj@gmail.com','OrgPass2024'); });
  if(loginBtn) loginBtn.addEventListener('click', function(event){ event.preventDefault(); doLogin(); });
  if(loginForm) loginForm.addEventListener('submit', function(event){ event.preventDefault(); doLogin(); });
  [emailInput, passwordInput].forEach(function(input){
    if(!input) return;
    input.addEventListener('keydown', function(event){
      if(event.key === 'Enter'){
        event.preventDefault();
        doLogin();
      }
    });
  });
}

async function doLogin(){
  if(isLoggingIn) return;
  var email=document.getElementById('l-email').value.trim();
  var pass =document.getElementById('l-pass').value.trim();
  if(!email||!pass){toast('Enter email and password');return;}
  isLoggingIn = true;

  // Try real API first
  try {
    var r = await fetch(API+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pass})});
    if(r.ok){
      var d = await r.json();
      token = d.accessToken;
      currentUser = d.user;
      localStorage.setItem('bt_token', token);
      localStorage.setItem('bt_user', JSON.stringify(currentUser));
      bootApp();
      toast('Welcome, '+d.user.name+'!');
      isLoggingIn = false;
      return;
    }
  } catch(_){}

  // Fallback to demo login
  var demo = {
    'admin.user@gmail.com'  :{name:'Admin User',  role:'admin',    email},
    'arjun.sharma@gmail.com':{name:'Arjun Sharma', role:'developer',email},
    'priya.venkat@gmail.com':{name:'Priya Venkat', role:'developer',email},
    'meena.raj@gmail.com'   :{name:'Meena Raj',    role:'tester',   email},
    'karan.das@gmail.com'   :{name:'Karan Das',    role:'developer',email},
  };
  if(demo[email]){
    currentUser = demo[email];
    token = 'demo-token';
    localStorage.setItem('bt_token', token);
    localStorage.setItem('bt_user', JSON.stringify(currentUser));
    bootApp();
    toast('Welcome back, '+currentUser.name+'! (Demo mode — connect backend for live data)');
  } else {
    toast('Invalid credentials. Use a demo account above.');
  }
  isLoggingIn = false;
}

function doLogout(){
  fetch(API+'/auth/logout',{method:'POST',headers:{Authorization:'Bearer '+token}}).catch(()=>{});
  token=''; currentUser=null;
  localStorage.removeItem('bt_token');
  localStorage.removeItem('bt_user');
  document.getElementById('login-wrap').style.display='flex';
  document.getElementById('app').style.display='none';
  chartsBuilt=false; analyticsBuilt=false;
  toast('Signed out');
}

function bootApp(){
  document.getElementById('login-wrap').style.display='none';
  document.getElementById('app').style.display='flex';
  var rc = {admin:'background:#ede9fe;color:#5b21b6',developer:'background:#dbeafe;color:#1e40af',tester:'background:#dcfce7;color:#166534'};
  var av = document.getElementById('sb-av');
  av.textContent = currentUser.name.charAt(0);
  av.style.cssText = 'width:30px;height:30px;background:#ede9fe;color:#5b21b6;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:12px;'+(rc[currentUser.role]||'');
  document.getElementById('sb-name').textContent = currentUser.name;
  document.getElementById('sb-role').textContent  = currentUser.role;
  // show/hide admin nav
  document.getElementById('nav-admin').style.display = currentUser.role==='admin' ? '' : 'none';
  
  // Role-based dashboard options
  const quickCard = document.getElementById('quick-report-card');
  if (['tester','developer'].includes(currentUser.role)) {
    quickCard.style.display = 'block';
    populateQuickForm();
  } else {
    quickCard.style.display = 'none';
  }
  
  loadProjectsFromAPI();
  // Load users from API
  loadUsersFromAPI();
  // Load bugs from API
  loadBugsFromAPI();
  setTimeout(()=>{ buildCharts(); renderDashboard(); },50);
}

function populateQuickForm() {
  const projSel = document.getElementById('q-proj');
  projSel.innerHTML = '<option value="">Select...</option>' + projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
}

// ═══════════════════════════════════════════════
// API HELPERS
// ═══════════════════════════════════════════════
async function apiFetch(path, opts={}){
  opts.headers = Object.assign({ 'Content-Type':'application/json', Authorization:'Bearer '+token }, opts.headers||{});
  try {
    var r = await fetch(API+path, opts);
    var d = await r.json();
    return {ok:r.ok, data:d};
  } catch(e) {
    return {ok:false, data:{message:'Network error — backend not running'}};
  }
}

async function loadUsersFromAPI(refresh=true){
  var {ok,data} = await apiFetch('/users');
  if(ok && data.users){
    users = data.users.map(u=>({id:u._id,name:u.name,email:u.email,role:u.role,dept:u.department||'',active:u.isActive}));
    if(refresh) refreshPeopleViews();
    return true;
  }
  return false;
}

async function loadBugsFromAPI(){
  var {ok,data} = await apiFetch('/bugs');
  if(ok && data.bugs){
    bugs = data.bugs.map(b=>({
      id: b._id?.slice(-6).toUpperCase(),
      _id: b._id,
      title: b.title,
      description: b.description || b.title || '',
      project: b.project?.name||b.project||'',
      sev: b.severity,
      status: b.status,
      assignee: b.assignee?.name||'—',
      assigneeId: b.assignee?._id||'',
      reported: b.createdAt?.slice(0,10)||'',
      environment: b.environment||'Production',
      component: b.component||'—',
      conf: b.aiConfidenceScore||0.5,
      rank: b.priorityRank||50,
    }));
    renderDashboard();
    renderBugs();
  }
}

async function loadProjectsFromAPI(){
  var {ok,data} = await apiFetch('/projects');
  if(ok && data.projects){
    projects = data.projects.map(p=>({
      id:p._id,
      name:p.name,
      key:p.key,
      desc:p.description||'',
      status:p.status||'active'
    }));
    renderProjects();
  }
}

function getAssignableUsers(){
  return users
    .filter(u=>u.active)
    .slice()
    .sort((a,b)=>a.name.localeCompare(b.name));
}

function userOptionLabel(user){
  return `${user.name} (${user.role})`;
}

function updateAssigneeDropdowns(){
  var opts = '<option value="">Auto-assign</option>' + getAssignableUsers().map(u=>`<option value="${u.id}">${userOptionLabel(u)}</option>`).join('');
  var sel = document.getElementById('f-assignee');
  if(sel) sel.innerHTML = opts;
}

function refreshPeopleViews(){
  renderAdmin();
  updateAssigneeDropdowns();
  renderWorkload();
  renderBugs();

  if(currentBugDetailId){
    var bug = bugs.find(b=>b.id===currentBugDetailId);
    if(bug) renderAssignableOptions(bug);
  }
}

// ═══════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════
var TITLES = {dashboard:'Dashboard',bugs:'All Bugs','new-bug':'Report Bug',projects:'Projects',admin:'Admin Panel',analytics:'Analytics'};
function nav(page,btn){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  var el = document.getElementById('pg-'+page);
  if(el) el.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  if(btn) btn.classList.add('active');
  document.getElementById('pg-title').textContent = TITLES[page]||page;
  if(page==='bugs')      renderBugs();
  if(page==='projects')  renderProjects();
  if(page==='admin')     renderAdmin();
  if(page==='analytics'){ if(!analyticsBuilt){buildAnalyticsCharts();analyticsBuilt=true;} updateAnalytics(); }
  if(page==='new-bug')   populateBugForm();
}

function doSearch(q){
  document.getElementById('f-status').value='';
  document.getElementById('f-sev').value='';
  nav('bugs',null);
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  setTimeout(renderBugs,10);
}

// ═══════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════
function renderDashboard(){
  var role = currentUser.role;
  var userBugs = bugs.filter(b => b.assignee === currentUser.name || b.assigneeId === currentUser._id || role === 'admin');
  var open= userBugs.filter(b=>b.status==='open').length;
  var ip  =userBugs.filter(b=>b.status==='in_progress').length;
  var res =userBugs.filter(b=>b.status==='resolved'||b.status==='closed').length;
  document.getElementById('m-total').textContent=userBugs.length;
  document.getElementById('m-open').textContent=open;
  document.getElementById('m-prog').textContent=ip;
  document.getElementById('m-res').textContent=res;
  document.getElementById('nb-open').textContent=bugs.filter(b=>b.status==='open').length;

  // Simplify: hide team workload for non-admin
  const workloadCard = document.querySelector('.card.style-class-23');
  workloadCard.style.display = role === 'admin' ? 'block' : 'none';

  // Recent bugs with image if available
async function quickSubmitBug() {
  const title = document.getElementById('q-title').value.trim();
  const desc = document.getElementById('q-desc').value.trim();
  const proj = document.getElementById('q-proj').value;
  const imageUrl = await uploadImage(document.getElementById('q-image'));
  if (!title || !desc || !proj) {
    toast('Title, description and project required');
    return;
  }
  const payload = { title, description: desc, projectId: proj, imageUrl };
  const { ok, data } = await apiFetch('/bugs', { method: 'POST', body: JSON.stringify(payload) });
  if (ok) {
    await loadBugsFromAPI();
    toast('Quick bug reported!');
    clearQuickForm();
  } else {
    toast('Failed to report bug');
  }
}

function clearQuickForm() {
  ['q-title', 'q-desc', 'q-proj'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('q-image-preview').innerHTML = '';
}

  var userRecent = userBugs.slice(0,6);
  var tbody=document.getElementById('recent-tbody');
  tbody.innerHTML=userRecent.map(b=>`
    <tr style="cursor:pointer" onclick="openBugDetail('${b.id}')">
      <td style="font-family:monospace;font-size:11.5px;color:var(--mut)">${b.id}</td>
      <td style="max-width:150px"><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500">${b.title}</div>
        ${b.imageUrl ? `<img src="${API + b.imageUrl}" style="width:24px;height:24px;border-radius:4px;margin-top:2px;object-fit:cover" />` : ''}
      </td>
      <td>${sevBadge(b.sev)}</td>
      <td>${statusBadge(b.status)}</td>
      <td style="font-size:12px">${b.assignee||'—'}</td>
      <td><div style="display:flex;align-items:center;gap:5px"><div class="pulse"></div><span style="font-size:12px;font-weight:600;color:#5b21b6">${Math.round(b.conf*100)}%</span></div></td>
    </tr>`).join('');
}

function renderWorkload(){
  var team=getAssignableUsers();
  var colors=['#4f46e5','#0369a1','#16a34a','#d97706','#dc2626'];
  var html=team.map((member,i)=>{
    var total=bugs.filter(b=>b.assignee===member.name).length;
    var open =bugs.filter(b=>b.assignee===member.name&&b.status==='open').length;
    var pct  =bugs.length>0?Math.round((total/bugs.length)*100):0;
    return `<div class="workload-row">
      <div class="av" style="width:28px;height:28px;background:#f1f5f9;color:${colors[i%5]}">${member.name.charAt(0)}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:3px">
          <span style="font-weight:500">${member.name} <span style="color:var(--mut);font-weight:400">(${member.role})</span></span>
          <span style="color:var(--mut)">${total} bugs · ${open} open</span>
        </div>
        <div class="prog-track"><div class="prog-fill" style="width:${pct}%;background:${colors[i%5]}"></div></div>
      </div>
    </div>`;
  }).join('');
  document.getElementById('workload-list').innerHTML=html||'<p style="color:var(--mut);font-size:13px">No active employee data</p>';
}

// ═══════════════════════════════════════════════
// BUGS LIST
// ═══════════════════════════════════════════════
function sevBadge(s){return `<span class="badge b-${s}">${(s||'').charAt(0).toUpperCase()+(s||'').slice(1)}</span>`;}
function statusBadge(s){return `<span class="badge b-${s}">${(s||'').replace('_',' ')}</span>`;}

function renderBugs(){
  var fs=document.getElementById('f-status')?.value||'';
  var fv=document.getElementById('f-sev')?.value||'';
  var fp=document.getElementById('f-proj')?.value||'';
  var q =(document.getElementById('g-search')?.value||'').toLowerCase();

  var list=bugs.filter(b=>{
    if(fs&&b.status!==fs)return false;
    if(fv&&b.sev!==fv)return false;
    if(fp&&b.project!==fp)return false;
    if(q&&!b.title.toLowerCase().includes(q)&&!(b.id||'').toLowerCase().includes(q))return false;
    return true;
  });

  document.getElementById('bugs-count-lbl').textContent=list.length+' bug'+(list.length===1?'':'s');

  // update project filter
  var pfsel=document.getElementById('f-proj');
  var existing=Array.from(pfsel.options).map(o=>o.value).filter(Boolean);
  var pNames=[...new Set(bugs.map(b=>b.project).filter(Boolean))];
  pNames.forEach(p=>{ if(!existing.includes(p)){ var o=document.createElement('option');o.value=p;o.textContent=p;pfsel.appendChild(o); }});

  var STATUSES=['open','in_progress','resolved','closed','rejected'];
  document.getElementById('bugs-tbody').innerHTML=list.map(b=>`
    <tr style="cursor:pointer" onclick="openBugDetail('${b.id}')">
      <td style="font-family:monospace;font-size:11.5px;color:var(--mut)">${b.id}</td>
      <td style="max-width:140px"><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500" title="${b.title}">${b.title}</div>
        ${b.imageUrl ? `<img src="${API + b.imageUrl}" style="width:20px;height:20px;border-radius:3px;margin-top:2px;object-fit:cover;display:block" />` : ''}
      </td>
      <td style="font-size:12px;color:var(--mut)">${b.project||'—'}</td>
      <td>${sevBadge(b.sev)}</td>
      <td>${statusBadge(b.status)}</td>
      <td style="font-size:12px">${b.assignee||'—'}</td>
      <td style="font-size:11.5px;color:var(--mut)">${b.reported||''}</td>
      <td>
        <select class="status-sel" onclick="event.stopPropagation()" onchange="changeBugStatus('${b.id}',this.value)">
          ${STATUSES.map(s=>`<option value="${s}" ${b.status===s?'selected':''}>${s.replace('_',' ')}</option>`).join('')}
        </select>
      </td>
    </tr>`).join('');
}

function getSuggestedAssignee(){
  var assignable = getAssignableUsers();
  if(!assignable.length) return null;
  return assignable.map(user=>({
    user,
    openCount:bugs.filter(b=>b.assignee===user.name&&['open','in_progress'].includes(b.status)).length
  })).sort((a,b)=>a.openCount-b.openCount||a.user.name.localeCompare(b.user.name))[0].user;
}

function renderAssignableOptions(bug){
  var select=document.getElementById('detail-assignee');
  if(!select) return;
  var options = getAssignableUsers()
    .map(u=>`<option value="${u.id}" ${(bug.assigneeId&&bug.assigneeId===u.id)||bug.assignee===u.name?'selected':''}>${userOptionLabel(u)}</option>`).join('');
  select.innerHTML = `<option value="">Unassigned</option>` + options;
  var suggestion = getSuggestedAssignee();
  document.getElementById('detail-suggested').textContent = suggestion ? suggestion.name : 'No active users';
}

async function openBugDetail(bugId){
  await loadUsersFromAPI(false);

  var bug = bugs.find(b=>b.id===bugId);
  if(!bug) return;
  currentBugDetailId = bugId;
  document.getElementById('detail-title').textContent = bug.title;
  document.getElementById('detail-subtitle').textContent = `${bug.id} · ${bug.project||'Unknown project'}`;
  document.getElementById('detail-status').innerHTML = statusBadge(bug.status);
  document.getElementById('detail-sev').innerHTML = sevBadge(bug.sev);
  document.getElementById('detail-assignee-name').textContent = bug.assignee || 'Unassigned';
  document.getElementById('detail-reported').textContent = bug.reported || 'Unknown';
  document.getElementById('detail-env').textContent = bug.environment || 'Production';
  document.getElementById('detail-comp').textContent = bug.component || '—';
  document.getElementById('detail-ai').textContent = Math.round((bug.conf||0)*100) + '%';
  document.getElementById('detail-priority').textContent = '#'+(bug.rank||0);
  document.getElementById('detail-desc').textContent = bug.description || bug.title || 'No description available.';
  renderAssignableOptions(bug);
  document.getElementById('bug-detail-overlay').style.display = 'flex';
}

function closeBugDetail(event){
  if(event && event.target && event.target.id !== 'bug-detail-overlay') return;
  document.getElementById('bug-detail-overlay').style.display = 'none';
  currentBugDetailId = null;
}

async function updateBugAssignee(bugId, assigneeId){
  var bug = bugs.find(b=>b.id===bugId);
  if(!bug) return;
  var previousAssignee = bug.assignee;
  var previousAssigneeId = bug.assigneeId;
  var user = users.find(u=>u.id===assigneeId);
  bug.assignee = user ? user.name : 'Unassigned';
  bug.assigneeId = assigneeId || '';

  if(bug._id){
    var {ok} = await apiFetch('/bugs/'+bug._id+'/assignee',{method:'PATCH',body:JSON.stringify({assigneeId:assigneeId||null})});
    if(!ok){
      bug.assignee = previousAssignee;
      bug.assigneeId = previousAssigneeId;
      toast('Failed to update assignee');
      openBugDetail(bugId);
      return;
    }
  }

  toast('Assigned to '+(bug.assignee || 'Unassigned'));
  renderBugs();
  renderDashboard();
  openBugDetail(bugId);
}

async function changeBugStatus(bugId, newStatus){
  var bug = bugs.find(b=>b.id===bugId);
  if(!bug) return;
  var old = bug.status;
  bug.status = newStatus;

  if(bug._id){
    var {ok} = await apiFetch('/bugs/'+bug._id+'/status',{method:'PATCH',body:JSON.stringify({status:newStatus})});
    if(!ok){ bug.status=old; toast('Failed to update status'); return; }
  }

  renderBugs();
  renderDashboard();
  toast('Status updated → '+newStatus.replace('_',' '));
}

// ═══════════════════════════════════════════════
// NEW BUG + LIVE AI
// ═══════════════════════════════════════════════
function populateBugForm(){
  var psel=document.getElementById('f-bugproj');
  psel.innerHTML='<option value="">Select project</option>'+projects.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
  updateAssigneeDropdowns();
}

function liveAI(){
  var title=document.getElementById('f-title').value;
  var desc =document.getElementById('f-desc').value;
  var prev =document.getElementById('ai-preview');
  if(title.length<3&&desc.length<8){prev.style.display='none';return;}
  clearTimeout(aiTimer);
  aiTimer=setTimeout(async ()=>{
    // Try real API
    try {
      var {ok,data}=await apiFetch('/ai/predict',{method:'POST',body:JSON.stringify({title,description:desc,environment:document.getElementById('f-env').value||'production',has_screenshots:false})});
      if(ok&&data.severity){ renderAI(data); return; }
    } catch(_){}
    // Fallback
    renderAI(localAI(title+' '+desc));
  },400);
}

function localAI(text){
  var t=text.toLowerCase();
  var sevMap={critical:{conf:.88,rank:96},high:{conf:.77,rank:72},medium:{conf:.65,rank:45},low:{conf:.55,rank:16}};
  var sev='low';
  if(['crash','data loss','security','null pointer','corrupt','breach','deadlock'].some(w=>t.includes(w))) sev='critical';
  else if(['error','exception','fail','broken','not working','500','timeout'].some(w=>t.includes(w))) sev='high';
  else if(['slow','wrong','incorrect','missing','performance','latency'].some(w=>t.includes(w))) sev='medium';
  var {conf,rank}=sevMap[sev];
  conf=Math.min(.97,conf+Math.random()*.08);
  var scores={};['low','medium','high','critical'].forEach(s=>scores[s]=s===sev?conf:(1-conf)/3);
  return {severity:sev,confidence:conf,priority_rank:rank,severity_scores:scores,suggested_assignee_type:{critical:'Lead Dev',high:'Senior Dev',medium:'Developer',low:'Junior Dev'}[sev]};
}

function renderAI(d){
  var colMap={critical:'#dc2626',high:'#d97706',medium:'#4f46e5',low:'#16a34a'};
  document.getElementById('ai-sev').innerHTML=`<span class="badge b-${d.severity}">${d.severity}</span>`;
  document.getElementById('ai-conf').textContent=Math.round(d.confidence*100)+'%';
  document.getElementById('ai-rank').textContent='#'+d.priority_rank;
  document.getElementById('ai-atype').textContent=d.suggested_assignee_type||'Developer';
  var barsHtml='';
  ['critical','high','medium','low'].forEach(s=>{
    var pct=Math.round((d.severity_scores[s]||0)*100);
    barsHtml+=`<div class="bar-row">
      <span class="bar-lbl">${s}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${colMap[s]}"></div></div>
      <span class="bar-pct" style="color:${colMap[s]}">${pct}%</span>
    </div>`;
  });
  document.getElementById('ai-bars').innerHTML=barsHtml;
  document.getElementById('ai-preview').style.display='block';
}

async function uploadImage(fileInput) {
  if (!fileInput.files[0]) return null;
  const formData = new FormData();
  formData.append('image', fileInput.files[0]);
  try {
    const r = await fetch(API + '/bugs/upload', { method: 'POST', body: formData });
    if (r.ok) {
      const d = await r.json();
      return d.imageUrl;
    }
  } catch (e) {}
  return null;
}

async function previewImage(input) {
  const preview = document.getElementById('f-image-preview');
  preview.innerHTML = '';
  if (input.files[0]) {
    const url = URL.createObjectURL(input.files[0]);
    preview.innerHTML = `<img src="${url}" class="image-preview" />`;
  }
}

async function previewQuickImage(input) {
  const preview = document.getElementById('q-image-preview');
  preview.innerHTML = '';
  if (input.files[0]) {
    const url = URL.createObjectURL(input.files[0]);
    preview.innerHTML = `<img src="${url}" class="image-preview" />`;
  }
}

async function submitBug(){
  if(isSubmittingBug) return;
  var proj  =document.getElementById('f-bugproj').value;
  var title =document.getElementById('f-title').value.trim();
  var desc  =document.getElementById('f-desc').value.trim();
  var env   =document.getElementById('f-env').value;
  var comp  =document.getElementById('f-comp').value.trim();
  var asgn  =document.getElementById('f-assignee').value;
  const imageUrl = await uploadImage(document.getElementById('f-image'));
  if(!proj||!title||!desc){toast('Project, title and description are required');return;}

  isSubmittingBug = true;

  try {
    // Try real API
    var payload={title,description:desc,environment:env,component:comp,projectId:proj};
    if(asgn) payload.assignee=asgn;
    if (imageUrl) payload.imageUrl = imageUrl;
    var {ok,data}=await apiFetch('/bugs',{method:'POST',body:JSON.stringify(payload)});

    if(ok&&data.bug){
      var b=data.bug;
      await loadBugsFromAPI();
      toast('Bug reported! AI severity: '+(b.severity||'?').toUpperCase());
    } else {
      // demo fallback
      var ai=localAI(title+' '+desc);
      var newId='BUG-'+String(bugs.length+1).padStart(3,'0');
      var projName=projects.find(p=>p.id===proj)?.name||proj;
      var assigneeName=asgn?users.find(u=>u.id===asgn)?.name||'—':'—';
      bugs.unshift({id:newId,title,project:projName,sev:ai.severity,status:'open',assignee:assigneeName,reported:new Date().toISOString().slice(0,10),conf:ai.confidence,rank:ai.priority_rank});
      toast((data.message||'Backend not reachable')+'. Bug shown locally only.');
    }

    renderDashboard();
    document.getElementById('an-preds').textContent=bugs.length;
    clearBugForm();
    nav('bugs',null);
  } finally {
    isSubmittingBug = false;
  }
}

function clearBugForm(){
  ['f-bugproj','f-comp','f-title','f-desc','f-env','f-assignee'].forEach(id=>{
    var el=document.getElementById(id);
    if(el) el.value='';
  });
  document.getElementById('ai-preview').style.display='none';
}

// ═══════════════════════════════════════════════
// PROJECTS
// ═══════════════════════════════════════════════
function showCreateProject(){ var f=document.getElementById('create-proj-form'); f.style.display=f.style.display==='none'?'block':'none'; }

async function createProject(){
  var name=document.getElementById('pf-name').value.trim();
  var key =document.getElementById('pf-key').value.trim();
  var desc=document.getElementById('pf-desc').value.trim();
  if(!name||!key){toast('Name and key required');return;}

  var {ok,data}=await apiFetch('/projects',{method:'POST',body:JSON.stringify({name,key,description:desc})});
  if(ok&&data.project){
    projects.push({id:data.project._id,name:data.project.name,key:data.project.key,desc:desc,status:'active'});
    toast('Project created: '+name);
  } else {
    projects.push({id:'p'+Date.now(),name,key,desc,status:'active'});
    toast('Project created (Demo): '+name);
  }
  document.getElementById('pf-name').value='';
  document.getElementById('pf-key').value='';
  document.getElementById('pf-desc').value='';
  document.getElementById('create-proj-form').style.display='none';
  renderProjects();
}

function renderProjects(){
  document.getElementById('projects-grid').innerHTML=projects.map(p=>{
    var total=bugs.filter(b=>b.project===p.name).length;
    var open =bugs.filter(b=>b.project===p.name&&b.status==='open').length;
    var pct  =total>0?Math.round(((total-open)/total)*100):100;
    return `<div class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
        <div>
          <div style="font-weight:600;font-size:14.5px;color:#0f172a">${p.name}</div>
          <div style="font-size:12px;color:var(--mut);margin-top:2px">${p.desc||''}</div>
        </div>
        <span class="badge" style="background:#f1f5f9;color:#475569">${p.key}</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">
        <div style="text-align:center"><div style="font-size:11px;color:var(--mut)">Total</div><div style="font-size:20px;font-weight:600">${total}</div></div>
        <div style="text-align:center"><div style="font-size:11px;color:var(--mut)">Open</div><div style="font-size:20px;font-weight:600;color:var(--red)">${open}</div></div>
        <div style="text-align:center"><div style="font-size:11px;color:var(--mut)">Done</div><div style="font-size:20px;font-weight:600;color:var(--grn)">${total-open}</div></div>
      </div>
      <div style="font-size:11.5px;color:var(--mut);margin-bottom:4px">Resolution — ${pct}%</div>
      <div class="prog-track"><div class="prog-fill" style="width:${pct}%"></div></div>
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════
// ADMIN — full CRUD
// ═══════════════════════════════════════════════
async function addUser(){
  var name=document.getElementById('a-name').value.trim();
  var email=document.getElementById('a-email').value.trim();
  var pass=document.getElementById('a-pass').value.trim();
  var role=document.getElementById('a-role').value;
  var dept=document.getElementById('a-dept').value.trim();
  if(!name||!email||!pass){toast('Name, email and password required');return;}

  // Try real API — POST /api/users (admin create user)
  var {ok,data}=await apiFetch('/users',{method:'POST',body:JSON.stringify({name,email,password:pass,role,department:dept})});
  if(ok&&data.user){
    await loadUsersFromAPI();
    toast('✅ User added to database: '+name);
  } else {
    // demo fallback
    if(users.find(u=>u.email===email)){toast('Email already exists');return;}
    users.push({id:'u'+Date.now(),name,email,role,dept,active:true});
    refreshPeopleViews();
    toast('User added (Demo — connect backend to persist): '+name+' ['+role+']');
  }

  // Clear form
  ['a-name','a-email','a-pass','a-dept'].forEach(id=>{document.getElementById(id).value='';});
  document.getElementById('a-role').value='tester';

  if(ok&&data.user){
    refreshPeopleViews();
  }
}

async function toggleUser(uid){
  var u=users.find(x=>x.id===uid);
  if(!u)return;
  if(u.email===currentUser?.email){toast("Can't deactivate yourself");return;}

  var {ok,data}=await apiFetch('/users/'+uid+'/toggle',{method:'PATCH'});
  if(ok&&data.user){ u.active=data.user.isActive; }
  else { u.active=!u.active; }

  refreshPeopleViews();
  toast('User '+(u.active?'activated':'deactivated')+': '+u.name);
}

async function deleteUser(uid){
  var u=users.find(x=>x.id===uid);
  if(!u)return;
  if(u.email===currentUser?.email){toast("Can't delete yourself");return;}
  if(!confirm('Delete user '+u.name+'?'))return;

  var {ok}=await apiFetch('/users/'+uid,{method:'DELETE'});
  users=users.filter(x=>x.id!==uid);
  refreshPeopleViews();
  toast(ok?'User deleted from database: '+u.name:'User removed (Demo): '+u.name);
}

function renderAdmin(){
  var roleColors={admin:'r-admin',developer:'r-developer',tester:'r-tester'};
  document.getElementById('users-tbody').innerHTML=users.map(u=>`
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:9px">
          <div class="av" style="width:30px;height:30px;background:#f1f5f9;color:#475569;font-size:12px">${u.name.charAt(0)}</div>
          <div>
            <div style="font-weight:600;font-size:13px">${u.name}</div>
            ${u.email===currentUser?.email?'<div style="font-size:10px;color:var(--pri);font-weight:600">YOU</div>':''}
          </div>
        </div>
      </td>
      <td style="font-size:12px;color:var(--mut)">${u.email}</td>
      <td><span class="badge ${roleColors[u.role]||'r-tester'}">${u.role}</span></td>
      <td style="font-size:12px;color:var(--mut)">${u.dept||'—'}</td>
      <td><span class="badge" style="background:${u.active?'#dcfce7':'#f1f5f9'};color:${u.active?'#166534':'#475569'}">${u.active?'Active':'Inactive'}</span></td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn" onclick="toggleUser('${u.id}')" style="font-size:11.5px;height:28px;padding:0 8px;${u.active?'color:var(--amb)':''}">${u.active?'Deactivate':'Activate'}</button>
          ${u.email!==currentUser?.email?`<button class="btn dan" onclick="deleteUser('${u.id}')" style="font-size:11.5px;height:28px;padding:0 8px">Delete</button>`:''}
        </div>
      </td>
    </tr>`).join('');
}

// ═══════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════
function updateAnalytics(){
  var open=bugs.filter(b=>b.status==='open').length;
  var crit=bugs.filter(b=>b.sev==='critical'&&b.status==='open').length;
  document.getElementById('an-total').textContent=bugs.length;
  document.getElementById('an-open').textContent=open;
  document.getElementById('an-crit').textContent=crit;
  document.getElementById('an-preds').textContent=bugs.length;
}

// ═══════════════════════════════════════════════
// CHARTS
// ═══════════════════════════════════════════════
function buildCharts(){
  if(chartsBuilt) return;
  chartsBuilt=true;
  var days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  new Chart(document.getElementById('trendChart'),{
    type:'line',
    data:{labels:days,datasets:[
      {label:'New',data:[5,8,3,7,6,4,9],borderColor:'#4f46e5',backgroundColor:'rgba(79,70,229,.08)',fill:true,tension:.4,pointRadius:3,pointBackgroundColor:'#4f46e5'},
      {label:'Resolved',data:[3,5,6,4,8,5,7],borderColor:'#16a34a',backgroundColor:'rgba(22,163,74,.08)',fill:true,tension:.4,pointRadius:3,pointBackgroundColor:'#16a34a'},
    ]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'rgba(0,0,0,.04)'},ticks:{font:{size:10}}},x:{grid:{display:false},ticks:{font:{size:10}}}}}
  });
  new Chart(document.getElementById('sevChart'),{
    type:'doughnut',
    data:{labels:['Critical','High','Medium','Low'],datasets:[{data:[9,16,14,8],backgroundColor:['#dc2626','#d97706','#4f46e5','#16a34a'],borderWidth:0,hoverOffset:4}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},cutout:'72%'}
  });
}

function buildAnalyticsCharts(){
  var months=['Jan','Feb','Mar','Apr','May','Jun'];
  new Chart(document.getElementById('resChart'),{
    type:'line',
    data:{labels:months,datasets:[
      {label:'Created',data:[22,28,19,35,24,18],borderColor:'#dc2626',backgroundColor:'rgba(220,38,38,.07)',fill:true,tension:.4,pointRadius:3},
      {label:'Resolved',data:[15,22,24,28,30,22],borderColor:'#16a34a',backgroundColor:'rgba(22,163,74,.07)',fill:true,tension:.4,pointRadius:3},
    ]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'rgba(0,0,0,.04)'},ticks:{font:{size:10}}},x:{grid:{display:false},ticks:{font:{size:10}}}}}
  });
  var pnames=projects.map(p=>p.name.substring(0,6));
  var pbugs =projects.map(p=>bugs.filter(b=>b.project===p.name).length);
  new Chart(document.getElementById('projChart'),{
    type:'bar',
    data:{labels:pnames,datasets:[{label:'Bugs',data:pbugs,backgroundColor:['#4f46e5','#0369a1','#16a34a','#d97706'],borderRadius:6}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'rgba(0,0,0,.04)'},ticks:{font:{size:10}}},x:{grid:{display:false},ticks:{font:{size:10}}}}}
  });
}

// ═══════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════
function toast(msg){
  var wrap=document.getElementById('toast-wrap');
  var el=document.createElement('div');
  el.className='toast';el.textContent=msg;
  wrap.appendChild(el);
  setTimeout(()=>el.remove(),3500);
}

// ═══════════════════════════════════════════════
// AUTO-LOGIN if token saved
// ═══════════════════════════════════════════════
if(token && currentUser){
  bootApp();
  document.getElementById('login-wrap').style.display='none';
}

function toggleRegForm(){
  var loginForm = document.getElementById('login-form');
  var regForm = document.getElementById('reg-form');
  loginForm.style.display = loginForm.style.display === 'none' ? 'block' : 'none';
  regForm.style.display = regForm.style.display === 'none' ? 'block' : 'none';
}

async function doRegister(){
  var name = document.getElementById('r-name').value.trim();
  var email = document.getElementById('r-email').value.trim();
  var pass = document.getElementById('r-pass').value;
  var pass2 = document.getElementById('r-pass2').value;
  var role = document.getElementById('r-role').value;
  if(!name || !email || !pass || pass !== pass2 || pass.length < 6){
    toast('Please fill all fields correctly. Password min 6 chars, match confirm.');
    return;
  }
  if(!email.endsWith('@gmail.com')){
    toast('Organization policy: Use Gmail (name@gmail.com)');
    return;
  }
  try {
    var r = await fetch(API + '/users', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({name, email, password: pass, role, department: 'Engineering'})
    });
    var d = await r.json();
    if(r.ok){
      // Auto login
      token = makeToken({ _id: d.user._id, email });
      currentUser = {_id: d.user._id, name, email, role};
      localStorage.setItem('bt_token', token);
      localStorage.setItem('bt_user', JSON.stringify(currentUser));
      bootApp();
      toast('Account created and logged in: Welcome ' + name + '!');
      toggleRegForm();
      return;
    } else {
      toast(d.message || 'Registration failed');
    }
  } catch(e){
    toast('Backend not available. Demo mode only.');
  }
}

function makeToken(user) {
  return Buffer.from(`${user._id}:${user.email}`).toString('base64url');
}

bindLoginActions();
