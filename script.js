// Socia prototype — framework-free
const state = {
  skills: ["Art","Code","Photography","Music","Writing","3D","UI/UX"],
  posts: [
    {id:1, kind:"art", title:"Midnight gradients", user:"@luna", tag:"final", emoji:"🎨"},
    {id:2, kind:"code", title:"Vanilla JS micro-anim kit", user:"@devino", tag:"improving", emoji:"💻"},
    {id:3, kind:"photo", title:"Neon city rain", user:"@kairo", tag:"final", emoji:"📷"},
    {id:4, kind:"music", title:"Lo-fi loop 72bpm", user:"@mila", tag:"beginner", emoji:"🎧"},
    {id:5, kind:"writing", title:"On gentle growth", user:"@sage", tag:"final", emoji:"📝"},
    {id:6, kind:"art", title:"Glass UI badges", user:"@nova", tag:"improving", emoji:"🟣"},
  ],
  exploreCats: ["Beginner wins","Trending","UI/UX","3D","Photography","Music","Writing","Coding"],
  collabs: [
    {title:"Build a tiny habit tracker", skills:["Code","UI/UX"], level:"Beginner", duration:"1-2 weeks", mode:"Remote", applicants:3},
    {title:"Album art for indie EP", skills:["Art","Photography"], level:"Intermediate", duration:"1 month", mode:"Remote", applicants:8},
    {title:"Open-source docs sprint", skills:["Writing","Code"], level:"Any", duration:"3+ months", mode:"Remote", applicants:12},
  ]
};

// Helpers
const $ = (q,ctx=document)=>ctx.querySelector(q);
const $$ = (q,ctx=document)=>Array.from(ctx.querySelectorAll(q));
const mount = (el, html)=>{ el.innerHTML = html; };

function initSplash(){
  $('[data-nav="signup"]').addEventListener('click', ()=>showScreen('auth'));
}

function showScreen(name){
  // splash/auth vs app
  $$('.screen').forEach(s=>s.classList.remove('screen--active'));
  if(name==='splash' || name==='auth'){
    $(`section[data-screen="${name}"]`).classList.add('screen--active');
    $('.app-shell').classList.remove('active');
  }else{
    $('.app-shell').classList.add('active');
    // activate corresponding panel
    switchPanel(name);
  }
}

function switchPanel(name){
  $$('.panel').forEach(p=>p.classList.remove('panel--active'));
  $(`#panel-${name}`).classList.add('panel--active');
  // nav states
  $$('.nav-link').forEach(n=>n.classList.toggle('active', n.dataset.screenTarget===name));
  $$('.bn-link').forEach(n=>n.classList.toggle('active', n.dataset.screenTarget===name));
}

function initAuth(){
  // skills chips
  const wrap = $('#skillChips');
  wrap.innerHTML = state.skills.map(s=>`<button class="chip" data-skill="${s}">${s}</button>`).join('');
  wrap.addEventListener('click', e=>{
    const b = e.target.closest('.chip'); if(!b) return;
    b.classList.toggle('active');
  });
  // proceed buttons already data-nav=home
  $$('[data-nav="home"]').forEach(b=>b.addEventListener('click', ()=>showScreen('home')));
  $$('[data-nav="splash"]').forEach(b=>b.addEventListener('click', ()=>showScreen('splash')));
}

function initShell(){
  // desktop sidebar & mobile bottom nav
  $$('.nav-link, .bn-link').forEach(b=>{
    b.addEventListener('click', ()=>switchPanel(b.dataset.screenTarget));
  });
  // fill selects with skills
  const selSkill = $('#filter-skill');
  selSkill.innerHTML = `<option>All skills</option>` + state.skills.map(s=>`<option>${s}</option>`).join('');
  $('#post-skill').innerHTML = state.skills.map(s=>`<option>${s}</option>`).join('');
}

function renderFeed(kind='all'){
  const grid = $('#feedGrid');
  const src = state.posts.filter(p=> kind==='all' ? true : p.kind===kind);
  const html = src.map(p => `
    <article class="post card">
      <div class="thumb">${p.emoji}</div>
      <div class="meta">
        <div class="row"><span class="badge">${p.kind}</span><span class="badge">${p.tag}</span></div>
        <strong>${p.title}</strong>
        <span class="muted">${p.user}</span>
        <div class="row">
          <button class="btn">❤️</button>
          <button class="btn">💬</button>
          <button class="btn">📌</button>
          <button class="btn">🤝</button>
        </div>
      </div>
    </article>
  `).join('');
  mount(grid, html);
}

function initHome(){
  // tabs
  $('#homeTabs').addEventListener('click', e=>{
    const b = e.target.closest('.tab'); if(!b) return;
    $$('#homeTabs .tab').forEach(t=>t.classList.remove('active'));
    b.classList.add('active');
    renderFeed(b.dataset.feed);
  });
  renderFeed('all');
}

function initExplore(){
  const bubbles = $('#catBubbles');
  bubbles.innerHTML = state.exploreCats.map(c=>`<button class="bubble">${c}</button>`).join('');
  const grid = $('#exploreGrid');
  const items = Array.from({length:10}).map((_,i)=>({title:`Spotlight #${i+1}`, by:`creator_${i+1}`}));
  grid.innerHTML = items.map(it=>`
    <div class="tile">
      <div class="thumb"></div>
      <div class="meta">
        <strong>${it.title}</strong>
        <span class="muted">by ${it.by}</span>
      </div>
    </div>
  `).join('');
}

function initCollab(){
  const list = $('#collabList');
  list.innerHTML = state.collabs.map(c=>`
    <div class="collab-card">
      <div>
        <div class="row"><strong>${c.title}</strong><span class="badge">${c.level}</span><span class="badge">${c.duration}</span><span class="badge">${c.mode}</span></div>
        <div class="muted">Skills: ${c.skills.join(', ')}</div>
      </div>
      <div class="mini" title="${c.applicants} applicants">
        ${'<div class="ava"></div>'.repeat(Math.min(4,c.applicants))}
        <button class="btn btn--primary">Apply</button>
      </div>
    </div>
  `).join('');
}

function initCreate(){
  $('#fakePublish').addEventListener('click', ()=>{
    alert('Demo: your post would be published!');
  });
}

function initProfile(){
  $('#profileSkills').innerHTML = state.skills.slice(0,4).map(s=>`<span class="chip active">${s}</span>`).join('');
  const tabs = ['Art','Code','Photography','Music','Writing'];
  const wrap = $('#workspaceTabs');
  wrap.innerHTML = tabs.map((t,i)=>`<button class="workspace-tab ${i===0?'active':''}" data-ws="${t.toLowerCase()}">${t}</button>`).join('');
  wrap.addEventListener('click', e=>{
    const b = e.target.closest('.workspace-tab'); if(!b) return;
    $$('#workspaceTabs .workspace-tab').forEach(t=>t.classList.remove('active'));
    b.classList.add('active');
    renderWorkspace(b.dataset.ws);
  });
  renderWorkspace('art');
}

function renderWorkspace(kind){
  const grid = $('#workspaceGrid');
  const src = state.posts.filter(p=>p.kind===kind);
  grid.innerHTML = src.map(p=>`
    <article class="post card">
      <div class="thumb">${p.emoji}</div>
      <div class="meta">
        <div class="row"><span class="badge">${p.kind}</span><span class="badge">${p.tag}</span></div>
        <strong>${p.title}</strong>
        <span class="muted">${p.user}</span>
      </div>
    </article>
  `).join('');
}

function initSettings(){ /* placeholder */ }

// Top-level boot
document.addEventListener('DOMContentLoaded', ()=>{
  initSplash();
  initAuth();
  initShell();
  initHome();
  initExplore();
  initCollab();
  initCreate();
  initProfile();
  initSettings();

  // mobile bottom nav mirrors sidebar
  // start at splash
  showScreen('splash');
});
