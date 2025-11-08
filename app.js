/* Socia — Web3 Neon Build
   Smart onboarding • Multi-workspace • Intent feed
   Collab hub • Matchmaking • Talent requests
   Growth & Badges • Neon animations
*/

const SKILLS = ['Videography','Photography','Coding','Music','Illustration','Writing','3D','Sound','Color Grading'];
const WORKSPACES = ['Videography','Photography','Coding'];

const DUMMY_POSTS = Array.from({length:12}).map((_,i)=>({
  id:i+1,
  author:`Creator ${i+1}`,
  skill: SKILLS[i % SKILLS.length],
  intent: ['Showcase','Learn','Collab'][i%3],
  title:`Showcase ${i+1}`,
  excerpt:`A crisp, calm description that highlights the process and final touch.`,
  likes: Math.floor(Math.random()*300)+10
}));

const DUMMY_COLLABS = Array.from({length:6}).map((_,i)=>({
  id:i+1,
  title:`Project ${i+1} — Short film`,
  skills:['Videography','Sound','Editing'],
  applicants: Math.floor(Math.random()*7)+1
}));

const BADGES = [
  { icon:'sparkles', label:'First Post' },
  { icon:'medal', label:'Rising Talent' },
  { icon:'trophy', label:'Top Collab' },
  { icon:'shield-check', label:'Verified Skill' },
];

const state = {
  selectedSkill: 'All',
  selectedIntent: 'All',
  workspaces: [...WORKSPACES],
  currentWorkspace: WORKSPACES[0],
  onboarding: { intent:null, skills:[], wss:[], level:null, prefs:[] },
  metrics: { views: 1280, collabs: 12, saves: 94, kudos: 340 },
  loaderMinMs: 380
};

// ---------------- Utilities ----------------
const $ = (s, r=document)=> r.querySelector(s);
const $$ = (s, r=document)=> Array.from(r.querySelectorAll(s));

function toast(msg, type='info', ms=2400){
  const wrap = $('#toastWrap') || (()=>{const w=document.createElement('div');w.id='toastWrap';w.className='toast-wrap-center';document.body.appendChild(w);return w;})();
  const t = document.createElement('div');
  t.className = `toast-center ${type}`;
  t.innerHTML = `<i class="icon" data-lucide="${type==='success'?'check-circle':type==='error'?'alert-triangle':'sparkles'}"></i><div class="msg">${msg}</div><button class="close"><i data-lucide="x"></i></button>`;
  wrap.prepend(t); lucide.createIcons(); requestAnimationFrame(()=> t.classList.add('show'));
  const close = ()=>{ t.classList.remove('show'); setTimeout(()=> t.remove(),180); };
  t.querySelector('.close').addEventListener('click', close);
  setTimeout(close, ms);
}

function confirmDialog({title='Are you sure?', message='This action can’t be undone.', okText='Confirm', cancelText='Cancel'}={}){
  return new Promise(resolve=>{
    const back = document.createElement('div');
    back.className = 'confirm-backdrop';
    back.innerHTML = `<div class="confirm-card"><div class="confirm-title">${title}</div><div class="confirm-msg">${message}</div>
      <div class="row gap-8"><button class="btn outline pill" data-act="cancel">${cancelText}</button><button class="btn primary pill ml-auto" data-act="ok">${okText}</button></div></div>`;
    document.body.appendChild(back);
    const card = back.querySelector('.confirm-card');
    requestAnimationFrame(()=> card.classList.add('show'));
    function done(val){ card.classList.remove('show'); setTimeout(()=> back.remove(),180); resolve(val); }
    back.addEventListener('click', (e)=> { if(e.target===back) done(false); });
    back.querySelector('[data-act="cancel"]').addEventListener('click', ()=> done(false));
    back.querySelector('[data-act="ok"]').addEventListener('click', ()=> done(true));
  });
}

function showLoader(show=true){
  const l = $('#miniLoader');
  l.classList.toggle('show', show);
}

async function withLoader(fn){
  showLoader(true);
  const t0 = performance.now();
  let res;
  try{ res = await fn(); }
  finally{
    const d = performance.now()-t0;
    const wait = Math.max(0, state.loaderMinMs - d);
    setTimeout(()=> showLoader(false), wait);
  }
  return res;
}

// ---------------- Rendering ----------------
function switchScreen(name){
  return withLoader(()=>{
    $$('[data-screen]').forEach(s=> s.removeAttribute('active'));
    const el = $(`#screen-${name}`);
    if(el){ el.setAttribute('active',''); }
    $$('.nav .nav-btn').forEach(b=> b.classList.toggle('active', b.dataset.go === name));
    $$('.mobile-nav .mob-tab').forEach(b=> b.classList.toggle('active', b.dataset.go === name));
  });
}

function renderWorkspaceLists(){
  const list = $('#workspaceList');
  list.innerHTML = '';
  ['All',...state.workspaces].forEach((ws,i)=>{
    const b = document.createElement('button');
    b.className = 'ws-item pill';
    b.textContent = ws;
    if((state.selectedSkill==='All' && i===0) || ws===state.selectedSkill) b.classList.add('active');
    b.addEventListener('click', ()=>{
      state.selectedSkill = ws;
      $('#homeSkillLabel').textContent = ws==='All'?'All skills':ws;
      renderHome();
      $$('.ws-item', list).forEach(x=> x.classList.remove('active'));
      b.classList.add('active');
      toast(`Workspace switched to <b>${ws}</b>`, 'info', 1600);
    });
    list.appendChild(b);
  });

  // quick switch dropdown
  const sw = $('#wsSwitcher');
  sw.innerHTML = state.workspaces.map(w=>`<option ${w===state.currentWorkspace?'selected':''}>${w}</option>`).join('');
  sw.onchange = ()=>{
    state.currentWorkspace = sw.value;
    toast(`Current workspace: <b>${state.currentWorkspace}</b>`, 'success', 1400);
  };

  // profile chips
  const pws = $('#profileWS'); pws.innerHTML='';
  state.workspaces.forEach(w=>{
    const c = document.createElement('button'); c.className='chip pill'; c.textContent=w;
    c.addEventListener('click', ()=> toast(`Viewing ${w} portfolio`, 'info', 1200));
    pws.appendChild(c);
  });

  // settings
  const sws = $('#settingsWS'); sws.innerHTML='';
  state.workspaces.forEach(w=>{
    const c = document.createElement('button'); c.className='chip pill active'; c.textContent=w;
    c.addEventListener('click', ()=> c.classList.toggle('active'));
    sws.appendChild(c);
  });

  // modal create selector
  const sel = $('#createWS');
  sel.innerHTML = state.workspaces.map(w=>`<option>${w}</option>`).join('');
}

function postCard(p){
  const el = document.createElement('div');
  el.className = 'card glass floaty';
  el.innerHTML = `
    <div class="card-media">${p.skill} • ${p.intent}</div>
    <div class="card-title">${p.title}</div>
    <div class="card-desc">${p.excerpt}</div>
    <div class="card-line">
      <span class="muted small">@${p.author.toLowerCase().replace(/\s+/g,'')}</span>
      <div class="reacts">
        <button class="pill like"><i data-lucide="heart"></i><span>${p.likes}</span></button>
        <button class="pill comment"><i data-lucide="message-square"></i>Comment</button>
        <button class="pill save"><i data-lucide="bookmark"></i>Save</button>
        <button class="chip pill view"><i data-lucide="user"></i>View Profile</button>
      </div>
    </div>`;
  $('.like', el).onclick = ()=>{
    const span = $('.like span', el);
    span.textContent = Number(span.textContent)+1;
    toast('Kudos sent ❤️', 'success', 1200);
  };
  $('.comment', el).onclick = ()=> toast('Comments arriving soon!', 'info', 1400);
  $('.save', el).onclick = ()=> toast('Saved to your workspace.', 'success', 1400);
  $('.view', el).onclick = async ()=> { await switchScreen('profile'); toast(`Viewing <b>${p.author}</b>`, 'info', 1500); };
  return el;
}

function renderHome(){
  const grid = $('#homeGrid'); grid.innerHTML='';
  const filtered = DUMMY_POSTS.filter(p=>{
    const skillOK = (state.selectedSkill==='All') || (p.skill===state.selectedSkill);
    const intentOK = (state.selectedIntent==='All') || (p.intent===state.selectedIntent);
    return skillOK && intentOK;
  });
  filtered.forEach(p=> grid.appendChild(postCard(p)));
  lucide.createIcons();
}

function renderExplore(){
  const cat = $('#exploreCats'); cat.innerHTML='';
  SKILLS.forEach(s=>{
    const div = document.createElement('div');
    div.className = 'cat-tile';
    div.innerHTML = `<div class="small muted">Category</div><div style="margin-top:6px">${s}</div>`;
    div.addEventListener('click', ()=>{
      state.selectedSkill = s;
      $('#homeSkillLabel').textContent = s;
      $$('.ws-item').forEach(x=> x.classList.toggle('active', x.textContent===s));
      renderHome();
      toast(`Filtering Home by <b>${s}</b>`, 'info', 1700);
      switchScreen('home');
    });
    cat.appendChild(div);
  });

  const spot = $('#spotlightGrid'); spot.innerHTML='';
  DUMMY_POSTS.slice(0,3).forEach(p=>{
    const c = document.createElement('div'); c.className='card glass floaty';
    c.innerHTML = `<div class="card-title">${p.title}</div><div class="card-desc">${p.excerpt}</div>`;
    spot.appendChild(c);
  });
}

function renderCollab(){
  const grid = $('#collabGrid'); grid.innerHTML='';
  DUMMY_COLLABS.forEach(c=>{
    const card = document.createElement('div'); card.className='card glass floaty';
    card.innerHTML = `
      <div class="row gap"><i data-lucide="handshake"></i><div class="title">${c.title}</div></div>
      <div class="muted small" style="margin-top:6px">Skills: ${c.skills.join(', ')}</div>
      <div class="row gap" style="margin-top:10px">
        <div class="chip pill">Applicants: ${c.applicants}</div>
        <div class="row gap" style="margin-left:auto">
          <button class="btn outline pill view-btn">View</button>
          <button class="btn primary pill apply-btn"><i data-lucide="rocket"></i>Apply</button>
        </div>
      </div>`;
    $('.view-btn', card).onclick = ()=> toast('Opening brief…', 'info', 1200);
    $('.apply-btn', card).onclick = async ()=>{
      const ok = await confirmDialog({title:'Apply to this project?', message:'We’ll share your selected workspace portfolio and contact email.', okText:'Send Application', cancelText:'Cancel'});
      toast(ok ? 'Application sent ✨' : 'Application canceled', ok?'success':'info', 1800);
    };
    grid.appendChild(card);
  });
  lucide.createIcons();
}

function renderMatch(){
  const grid = $('#matchGrid'); grid.innerHTML='';
  // naive matches based on current workspace + onboarding intent/skills
  const intent = state.onboarding.intent || 'Showcase';
  const skills = state.onboarding.skills.length ? state.onboarding.skills : [state.currentWorkspace];
  const matches = DUMMY_POSTS
    .filter(p => skills.includes(p.skill) || p.intent===intent)
    .slice(0,6);
  if(matches.length===0){ grid.innerHTML = `<div class="card glass">No matches yet — try adding more skills or switching intent.</div>`; return; }
  matches.forEach(m=> grid.appendChild(postCard(m)));
  lucide.createIcons();
}

function renderDashboard(){
  $('#statViews').textContent = state.metrics.views;
  $('#statCollabs').textContent = state.metrics.collabs;
  $('#statSaves').textContent = state.metrics.saves;
  $('#statKudos').textContent = state.metrics.kudos;

  const b = $('#badgeWrap'); b.innerHTML='';
  BADGES.forEach(({icon,label})=>{
    const el = document.createElement('div'); el.className='badge';
    el.innerHTML = `<i data-lucide="${icon}"></i><span>${label}</span>`;
    b.appendChild(el);
  });

  const sc = $('#skillsCloud'); sc.innerHTML='';
  const all = new Set([...SKILLS.slice(0,6), ...state.onboarding.skills]);
  [...all].forEach(s=>{
    const chip = document.createElement('div'); chip.className='skill-bubble'; chip.textContent=s;
    sc.appendChild(chip);
  });
  lucide.createIcons();
}

function renderProfile(){
  $('#profileName').textContent = 'Creator Name';
  $('#profileRole').textContent = `${state.workspaces.length} workspaces • ${state.onboarding.level||'—'} level`;
  const port = $('#profilePortfolio'); port.innerHTML='';
  DUMMY_POSTS.slice(0,4).forEach(p=>{
    const c = document.createElement('div'); c.className='card glass';
    c.innerHTML = `<div class="card-media">${p.skill}</div><div class="card-title">${p.title}</div><div class="muted small">Intent: ${p.intent}</div>`;
    port.appendChild(c);
  });
  lucide.createIcons();
}

// ---------------- Onboarding flow ----------------
let onbStep = 1;
function goOnbStep(step){
  onbStep = step;
  $('#onbStepLabel').textContent = `Step ${step} of 3`;
  $$('.onb-step').forEach(s=> s.hidden = (s.dataset.step != step));
}

function setupOnboarding(){
  // step 1: intents & skills
  const wrap = $('#onbSkills'); wrap.innerHTML='';
  SKILLS.forEach(s=>{
    const b = document.createElement('button'); b.className='chip pill'; b.textContent=s;
    b.onclick = ()=>{ b.classList.toggle('active'); toggleInArray(state.onboarding.skills, s); };
    wrap.appendChild(b);
  });
  $('#intentChips').addEventListener('click', e=>{
    const b = e.target.closest('.chip'); if(!b) return;
    $$('#intentChips .chip').forEach(x=> x.classList.remove('active'));
    b.classList.add('active'); state.onboarding.intent = b.dataset.intent;
  });

  // step 2: workspaces & level
  const wwrap = $('#onbWorkspaceChips'); wwrap.innerHTML='';
  WORKSPACES.concat('Music','Writing','3D').forEach(w=>{
    const c = document.createElement('button'); c.className='chip pill'; c.textContent=w;
    c.onclick = ()=>{ c.classList.toggle('active'); toggleInArray(state.onboarding.wss, w); };
    wwrap.appendChild(c);
  });
  $('#onbLevel').addEventListener('click', e=>{
    const b = e.target.closest('.chip'); if(!b) return;
    $$('#onbLevel .chip').forEach(x=> x.classList.remove('active'));
    b.classList.add('active'); state.onboarding.level = b.dataset.level;
  });

  // step 3: prefs
  $$('#onbStep3 .chip').forEach(c=>{
    c.onclick = ()=> c.classList.toggle('active');
  });

  // nav
  $('[data-action="onb-next"]').onclick = async ()=>{
    if(onbStep<3){ goOnbStep(onbStep+1); return; }
    // finish
    // merge onboarding workspaces into state
    state.workspaces = Array.from(new Set([...state.workspaces, ...state.onboarding.wss]));
    state.currentWorkspace = state.workspaces[0] || 'Videography';
    await switchScreen('home');
    renderWorkspaceLists();
    renderHome();
    toast('Onboarding complete. Welcome ✨', 'success', 1800);
  };
  $('[data-action="onb-prev"]').onclick = ()=> { if(onbStep>1) goOnbStep(onbStep-1); else switchScreen('splash'); };
}

function toggleInArray(arr, item){
  const i = arr.indexOf(item);
  if(i>=0) arr.splice(i,1); else arr.push(item);
}

// ---------------- Modals (Create / Talent) ----------------
function modalOpen(id, open=true){
  const m = $(id);
  if(!m) return;
  if(open){ m.classList.add('open'); m.setAttribute('aria-hidden','false'); }
  else { m.classList.remove('open'); m.setAttribute('aria-hidden','true'); }
  setTimeout(()=> lucide.createIcons(), 0);
}

function setupCreateModal(){
  document.body.addEventListener('click', e=>{
    const open = e.target.closest('[data-action="open-create"]');
    const close = e.target.closest('[data-action="close-modal"]');
    if(open) modalOpen('#createModal', true);
    if(close || e.target.closest('#createModal .backdrop')) modalOpen('#createModal', false);
  });

  const input = $('#fileInput'), browse = $('#browseBtn');
  const box = $('#uploadBox'), list = $('#uploadList'), placeholder = $('#uploadPlaceholder'), actions = $('#uploadActions');
  let files = [];
  const MAX_FILES = 10, MAX_SIZE = 20*1024*1024;

  function refresh(){
    if(files.length===0){ placeholder.hidden=false; list.hidden=true; actions.hidden=true; list.innerHTML=''; return; }
    placeholder.hidden=true; list.hidden=false; actions.hidden=false; list.innerHTML='';
    files.forEach((f,idx)=>{
      const tile = document.createElement('div'); tile.className='file-tile';
      const thumb = document.createElement('div'); thumb.className='file-thumb';
      if(f.type.startsWith('image/')){ const img=new Image(); img.src=URL.createObjectURL(f); img.onload=()=>URL.revokeObjectURL(img.src); thumb.appendChild(img); }
      else { thumb.innerHTML = `<i data-lucide="file"></i>`; }
      const meta = document.createElement('div'); meta.className='file-meta';
      meta.innerHTML = `<div class="file-name">${f.name}</div><div class="file-size">${prettySize(f.size)}</div>`;
      const rm = document.createElement('button'); rm.className='file-remove pill'; rm.textContent='Remove'; rm.onclick=()=>{ files.splice(idx,1); refresh(); toast('File removed','info',1200); };
      tile.append(thumb, meta, rm); list.appendChild(tile);
    });
    lucide.createIcons();
  }
  function prettySize(n){ if(n<1024) return `${n} B`; if(n<1024*1024) return `${(n/1024).toFixed(1)} KB`; return `${(n/1024/1024).toFixed(1)} MB`; }
  function add(filesIn){
    let added=0;
    [...filesIn].forEach(f=>{
      if(files.length>=MAX_FILES) return toast('Max 10 files reached','error',1600);
      if(f.size>MAX_SIZE) return toast(`${f.name} > 20MB`,'error',1600);
      files.push(f); added++;
    });
    refresh(); if(added>0) toast(`${added} file(s) added`,'success',1200);
  }

  browse.onclick = (e)=>{ e.preventDefault(); input.click(); };
  input.onchange = ()=> add(input.files);
  ;['dragenter','dragover'].forEach(evt=> box.addEventListener(evt, e=>{ e.preventDefault(); box.classList.add('dragover'); }));
  ;['dragleave','drop'].forEach(evt=> box.addEventListener(evt, e=>{ e.preventDefault(); box.classList.remove('dragover'); }));
  box.addEventListener('drop', e=> add(e.dataTransfer.files));
  $('#clearFilesBtn').onclick = ()=>{ files=[]; input.value=''; refresh(); toast('All files cleared','info',1200); };

  $('#postSubmitBtn').onclick = ()=>{
    const t = $('#createTitle').value.trim();
    if(!t) return toast('Please add a title','error',1600);
    modalOpen('#createModal', false);
    toast('Post published 🚀','success',1800);
  };
}

function setupTalentModal(){
  const openers = ['#openTalentReq','#openTalentReq2'];
  openers.forEach(id=> $(id).onclick = ()=> modalOpen('#talentModal', true));
  document.body.addEventListener('click', e=>{
    const close = e.target.closest('[data-action="close-talent"]');
    if(close || e.target.closest('#talentModal .backdrop')) modalOpen('#talentModal', false);
  });
  $('#talentSubmit').onclick = ()=>{
    const role = $('#talRole').value.trim();
    if(!role) return toast('Role is required','error',1600);
    modalOpen('#talentModal', false);
    toast('Talent request posted ✨','success',1800);
  };
}

// ---------------- Wiring ----------------
function wireNav(){
  $$('.nav .nav-btn').forEach(btn=>{
    const go = btn.dataset.go;
    const isCreate = btn.dataset.action === 'open-create';
    btn.onclick = ()=>{ if(isCreate) return modalOpen('#createModal', true); if(go) switchScreen(go); };
  });
  $$('.mobile-nav .mob-tab').forEach(btn=> btn.onclick = ()=> switchScreen(btn.dataset.go));
  $('.neon-fab')?.addEventListener('click', ()=> modalOpen('#createModal', true));
}

function wireFeedIntent(){
  $('#feedIntents').addEventListener('click', e=>{
    const b = e.target.closest('.chip'); if(!b) return;
    $$('#feedIntents .chip').forEach(x=> x.classList.remove('active'));
    b.classList.add('active');
    state.selectedIntent = b.dataset.intent;
    renderHome();
  });
}

function wireSettings(){
  $('#saveSettings').onclick = ()=> toast('Settings saved','success',1400);
  $('#logoutBtn').onclick = async ()=>{
    const ok = await confirmDialog({title:'Logout?', message:'You can log back in anytime. We’ll keep your workspaces safe.', okText:'Logout', cancelText:'Stay'});
    if(ok){ await switchScreen('splash'); toast('You are logged out.','info',1600); } else { toast('Still here — let’s build!','success',1400); }
  };
}

// ---------------- Boot ----------------
document.addEventListener('DOMContentLoaded', ()=>{
  lucide.createIcons();
  // start at splash
  switchScreen('splash');

  // Render core
  renderWorkspaceLists();
  renderHome();
  renderExplore();
  renderCollab();
  renderDashboard();
  renderProfile();

  // Onboarding
  setupOnboarding(); goOnbStep(1);

  // Modals
  setupCreateModal();
  setupTalentModal();

  // Matchmaking button
  $('#findMatches').onclick = async ()=> { await withLoader(()=> renderMatch()); toast('Matches updated','success',1200); };

  // Intent chips on Home
  wireFeedIntent();

  // Nav & Settings
  wireNav();
  wireSettings();

  // Global data-go (CTA buttons)
  $$('[data-go]').forEach(b=> b.addEventListener('click', async ()=> {
    const target = b.dataset.go;
    await switchScreen(target);
    if(target==='home') toast('Welcome back! ✨','info',1600);
  }));
});
