/* Socia — Neon UI v3
   - Neon theme, playful animations, pill styling
   - Centered toasts, confirm dialogs, loader
   - Multi-file upload with previews & removal
   - "View Profile" action on cards
   - Smooth screen transitions, improved micro-interactions
*/

const SKILLS = ['Videography','Photography','Coding','Music','Illustration','Writing'];
const WORKSPACES = ['Videography','Photography','Coding'];

const DUMMY_POSTS = Array.from({length:9}).map((_,i)=>({
  id:i+1,
  author:`Creator ${i+1}`,
  skill: SKILLS[i % SKILLS.length],
  title:`Showcase ${i+1}`,
  excerpt:`A short description of the work — crisp, focused, and calm.`,
  likes: Math.floor(Math.random()*300)+10
}));

const DUMMY_COLLABS = Array.from({length:6}).map((_,i)=>({
  id:i+1,
  title:`Project ${i+1} — Short film`,
  skills:['Videography','Sound','Editing'],
  applicants: Math.floor(Math.random()*7)+1
}));

// --------------------------------------------------
// Utilities
// --------------------------------------------------
const $ = (sel, root=document)=> root.querySelector(sel);
const $$ = (sel, root=document)=> Array.from(root.querySelectorAll(sel));

const state = {
  selectedSkill: 'All',
  loaderMinMs: 380
};

// Toasts (centered) --------------------------------
let toastContainer;
function ensureToastContainer(){
  if(!toastContainer){
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-wrap-center';
    document.body.appendChild(toastContainer);
  }
}
function showToast(message, type='info', ms=2600){
  ensureToastContainer();
  const t = document.createElement('div');
  t.className = `toast-center ${type}`;
  t.innerHTML = `
    <span class="icon" data-lucide="${type==='success'?'check-circle':type==='error'?'alert-triangle':'sparkles'}"></span>
    <div class="msg">${message}</div>
    <button class="close" aria-label="Dismiss" title="Dismiss" data-lucide="x"></button>
  `;
  toastContainer.prepend(t);
  lucide.createIcons();
  requestAnimationFrame(()=> t.classList.add('show'));
  const close = ()=> {
    t.classList.remove('show');
    setTimeout(()=> t.remove(), 220);
  };
  t.querySelector('.close').addEventListener('click', close);
  setTimeout(close, ms);
}

// Confirm dialog (Promise<boolean>) -----------------
function confirmDialog({title='Are you sure?', message='This action can’t be undone.', okText='Confirm', cancelText='Cancel'}={}){
  return new Promise(resolve=>{
    const back = document.createElement('div');
    back.className = 'confirm-backdrop';
    back.innerHTML = `
      <div class="confirm-card">
        <div class="confirm-title">${title}</div>
        <div class="confirm-msg">${message}</div>
        <div class="row gap-8">
          <button class="btn outline pill" data-act="cancel">${cancelText}</button>
          <button class="btn primary pill ml-auto" data-act="ok">${okText}</button>
        </div>
      </div>
    `;
    document.body.appendChild(back);
    const card = back.querySelector('.confirm-card');
    requestAnimationFrame(()=> card.classList.add('show'));

    function done(val){
      card.classList.remove('show');
      setTimeout(()=> back.remove(), 180);
      resolve(val);
    }
    back.addEventListener('click', (e)=> { if(e.target===back) done(false); });
    back.querySelector('[data-act="cancel"]').addEventListener('click', ()=> done(false));
    back.querySelector('[data-act="ok"]').addEventListener('click', ()=> done(true));
  });
}

// Mini loader --------------------------------------
let loader;
function ensureLoader(){
  if(!loader){
    loader = document.createElement('div');
    loader.className = 'mini-loader';
    loader.innerHTML = `<div class="spinner" aria-hidden="true"></div>`;
    document.body.appendChild(loader);
  }
}
async function withLoader(fn){
  ensureLoader();
  loader.classList.add('show');
  const start = performance.now();
  let result;
  try{ result = await fn(); }
  finally{
    const elapsed = performance.now() - start;
    const wait = Math.max(0, state.loaderMinMs - elapsed);
    setTimeout(()=> loader.classList.remove('show'), wait);
  }
  return result;
}

// --------------------------------------------------
// Rendering
// --------------------------------------------------
function setActiveScreen(name){
  return withLoader(()=>{
    $$('.screen').forEach(s=> s.removeAttribute('active'));
    const el = $(`#screen-${name}`);
    if(el){ el.setAttribute('active',''); }
    $$('.nav-btn').forEach(b=> b.classList.toggle('active', b.dataset.go === name));
    $$('.mob-tab').forEach(b=> b.classList.toggle('active', b.dataset.go === name));
  });
}

function renderWorkspaces(){
  const wsList = $('#workspaceList');
  wsList.innerHTML = '';
  ['All', ...WORKSPACES].forEach(w=>{
    const b = document.createElement('button');
    b.className = 'ws-item';
    if(w === state.selectedSkill) b.classList.add('active');
    b.textContent = w;
    b.title = `Switch to ${w} workspace`;
    b.addEventListener('click', ()=>{
      state.selectedSkill = w;
      $('#homeSkillLabel').textContent = w==='All' ? 'All skills' : w;
      renderHome();
      renderWorkspaces();
      showToast(`Workspace set to <b>${w}</b>`, 'info', 1800);
    });
    wsList.appendChild(b);
  });

  // profile + settings chips
  const profileWS = $('#profileWS');
  profileWS.innerHTML='';
  WORKSPACES.forEach(w=>{
    const c = document.createElement('button');
    c.className='chip pill';
    c.textContent=w;
    profileWS.appendChild(c);
  });
  const settingsWS = $('#settingsWS');
  settingsWS.innerHTML='';
  WORKSPACES.forEach(w=>{
    const c = document.createElement('button');
    c.className='chip pill';
    c.textContent=w;
    settingsWS.appendChild(c);
  });

  // modal select
  const createWS = $('#createWS');
  createWS.innerHTML = '<option>Choose workspace</option>' + WORKSPACES.map(w=>`<option>${w}</option>`).join('');
}

function cardPost(post){
  const div = document.createElement('div');
  div.className = 'card glass floaty';
  div.innerHTML = `
    <div class="card-media">${post.skill}</div>
    <div class="card-title">${post.title}</div>
    <div class="card-desc">${post.excerpt}</div>
    <div class="card-line">
      <div class="reacts">
        <button class="like-btn pill"><i data-lucide="heart"></i> <span class="like-count">${post.likes}</span></button>
        <button class="comment-btn pill"><i data-lucide="message-square"></i> Comment</button>
      </div>
      <div class="row gap">
        <button class="chip pill view-profile">View Profile</button>
        <button class="chip pill collab-chip">Collab</button>
      </div>
    </div>
  `;
  // interactions
  const likeBtn = $('.like-btn', div);
  const likeCountEl = $('.like-count', div);
  likeBtn.addEventListener('click', ()=>{
    const n = parseInt(likeCountEl.textContent || '0', 10) + 1;
    likeCountEl.textContent = n;
    showToast('Appreciated ❤️', 'success', 1200);
  });
  $('.comment-btn', div).addEventListener('click', ()=>{
    showToast('Comments are coming soon. For now, send a collab request!', 'info', 2200);
  });
  $('.collab-chip', div).addEventListener('click', ()=>{
    showToast('Collab request sent to the creator 🎬', 'success', 2000);
  });
  $('.view-profile', div).addEventListener('click', async ()=>{
    await setActiveScreen('profile');
    showToast(`Viewing <b>${post.author}</b>'s profile`, 'info', 1800);
  });
  return div;
}

function renderHome(){
  const grid = $('#homeGrid');
  grid.innerHTML = '';
  DUMMY_POSTS.filter(p => state.selectedSkill==='All' || p.skill===state.selectedSkill)
    .forEach(p=> grid.appendChild(cardPost(p)));
  lucide.createIcons();
}

function renderExplore(){
  const cat = $('#exploreCats');
  cat.innerHTML = '';
  SKILLS.forEach(s=>{
    const div = document.createElement('div');
    div.className = 'cat-tile';
    div.innerHTML = `<div class="small muted">Category</div><div style="margin-top:6px">${s}</div>`;
    div.addEventListener('click', ()=>{
      state.selectedSkill = s;
      $('#homeSkillLabel').textContent = s;
      renderHome();
      showToast(`Filtering Home by <b>${s}</b>`, 'info', 1700);
      setActiveScreen('home');
    });
    cat.appendChild(div);
  });

  const spot = $('#spotlightGrid');
  spot.innerHTML = '';
  DUMMY_POSTS.slice(0,3).forEach(p=>{
    const c = document.createElement('div');
    c.className='card glass floaty';
    c.innerHTML = `<div class="card-title">${p.title}</div><div class="card-desc">${p.excerpt}</div>`;
    spot.appendChild(c);
  });
}

function renderCollab(){
  const grid = $('#collabGrid');
  grid.innerHTML = '';
  DUMMY_COLLABS.forEach(c=>{
    const card = document.createElement('div');
    card.className='card glass floaty';
    card.innerHTML = `
      <div class="card-title">${c.title}</div>
      <div class="card-desc">Skills: ${c.skills.join(', ')}</div>
      <div class="row gap" style="margin-top:10px">
        <div class="row gap small muted">
          <div class="chip pill">Applicants: ${c.applicants}</div>
        </div>
        <div class="row gap" style="margin-left:auto">
          <button class="btn outline pill view-btn">View</button>
          <button class="btn primary pill apply-btn"><i data-lucide="rocket"></i>Apply</button>
        </div>
      </div>
    `;
    $('.view-btn', card).addEventListener('click', ()=>{
      showToast('Opening project brief…', 'info', 1400);
    });
    $('.apply-btn', card).addEventListener('click', async ()=>{
      const ok = await confirmDialog({
        title:'Apply to this project?',
        message:'We’ll share your workspace portfolio and contact email with the project owner.',
        okText:'Send Application',
        cancelText:'Cancel'
      });
      if(ok){
        showToast('Application submitted. Good luck! ✨', 'success', 2200);
      }else{
        showToast('Application canceled.', 'info', 1600);
      }
    });
    grid.appendChild(card);
  });
}

// --------------------------------------------------
// Create Modal & Multi-file Upload
// --------------------------------------------------
function bytesToSize(bytes){
  if(!bytes && bytes !== 0) return '';
  const sizes=['B','KB','MB','GB']; const i = Math.min(Math.floor(Math.log(bytes)/Math.log(1024)), sizes.length-1);
  return `${(bytes/Math.pow(1024,i)).toFixed(i?1:0)} ${sizes[i]}`;
}

function openModal(){
  const m = $('#createModal');
  m.classList.add('open');
  m.setAttribute('aria-hidden','false');
  lucide.createIcons();

  // Elements
  const fileInput = $('#fileInput');
  const browseBtn = $('#browseBtn');
  const uploadBox = $('#uploadBox');
  const uploadList = $('#uploadList');
  const uploadPlaceholder = $('#uploadPlaceholder');
  const uploadActions = $('#uploadActions');
  const clearFilesBtn = $('#clearFilesBtn');
  const postBtn = $('#postSubmitBtn');

  // Working store for this modal session
  let files = []; // [{file, dataUrl?}]

  const MAX_FILES = 10;
  const MAX_SIZE = 20 * 1024 * 1024; // 20MB

  function refreshUploadUI(){
    if(files.length === 0){
      uploadPlaceholder.hidden = false;
      uploadList.hidden = true;
      uploadActions.hidden = true;
      uploadList.innerHTML = '';
      return;
    }
    uploadPlaceholder.hidden = true;
    uploadList.hidden = false;
    uploadActions.hidden = false;

    uploadList.innerHTML = '';
    files.forEach((item, idx)=>{
      const tile = document.createElement('div');
      tile.className = 'file-tile';

      const thumb = document.createElement('div');
      thumb.className = 'file-thumb';

      if(item.dataUrl){ // image preview
        const img = document.createElement('img');
        img.src = item.dataUrl;
        thumb.appendChild(img);
      }else{
        const icon = document.createElement('i');
        icon.setAttribute('data-lucide', 'file');
        thumb.appendChild(icon);
      }

      const meta = document.createElement('div');
      meta.className = 'file-meta';
      meta.innerHTML = `<div class="file-name" title="${item.file.name}">${item.file.name}</div>
                        <div class="file-size">${bytesToSize(item.file.size)}</div>`;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'file-remove';
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', (e)=>{
        e.stopPropagation();
        files.splice(idx,1);
        refreshUploadUI();
        showToast('File removed', 'info', 1200);
      });

      tile.appendChild(thumb);
      tile.appendChild(meta);
      tile.appendChild(removeBtn);
      uploadList.appendChild(tile);
    });

    lucide.createIcons();
  }

  function addFiles(fileList){
    let added = 0;
    for(const f of fileList){
      if(files.length >= MAX_FILES) { showToast('Max 10 files allowed.', 'error', 1600); break; }
      if(f.size > MAX_SIZE){ showToast(`${f.name} is larger than 20MB`, 'error', 2000); continue; }

      const item = { file: f, dataUrl: null };
      files.push(item); added++;

      if(f.type.startsWith('image/')){
        const reader = new FileReader();
        reader.onload = ()=> { item.dataUrl = reader.result; refreshUploadUI(); };
        reader.readAsDataURL(f);
      }
    }
    if(added>0) refreshUploadUI();
    if(added===0 && fileList.length>0) showToast('No files added. Check size/type limits.', 'error', 2000);
  }

  // Wire browse + input
  browseBtn.addEventListener('click', (e)=>{ e.stopPropagation(); fileInput.click(); });
  uploadBox.addEventListener('click', ()=> fileInput.click());
  fileInput.addEventListener('change', ()=> addFiles(fileInput.files));

  // Drag & drop
  uploadBox.addEventListener('dragenter', (e)=>{ e.preventDefault(); uploadBox.classList.add('dragover'); });
  uploadBox.addEventListener('dragover', (e)=>{ e.preventDefault(); });
  uploadBox.addEventListener('dragleave', (e)=>{ if(e.target===uploadBox) uploadBox.classList.remove('dragover'); });
  uploadBox.addEventListener('drop', (e)=>{
    e.preventDefault();
    uploadBox.classList.remove('dragover');
    if(e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  });

  // Clear all
  clearFilesBtn.addEventListener('click', (e)=>{
    e.stopPropagation();
    files = [];
    fileInput.value = '';
    refreshUploadUI();
    showToast('All files cleared', 'info', 1400);
  });

  // Submit Post
  postBtn.replaceWith(postBtn.cloneNode(true));
  const newPostBtn = $('#postSubmitBtn');
  newPostBtn.addEventListener('click', ()=>{
    const title = $('#createTitle')?.value?.trim();
    if(!title){
      showToast('Please add a title before posting.', 'error', 2200);
      return;
    }
    const count = files.length;
    closeModal();
    setTimeout(()=> showToast(
      count>0 ? `Post published with <b>${count}</b> file${count>1?'s':''} 🚀` : 'Post published successfully 🚀',
      'success', 2400
    ), 180);
  });

  // Close buttons (deduped)
  $$('#createModal [data-action="close-modal"]').forEach(b=>{
    b.replaceWith(b.cloneNode(true));
  });
  $$('#createModal [data-action="close-modal"]').forEach(b=> b.addEventListener('click', closeModal));
}

function closeModal(){
  const m = $('#createModal');
  m.classList.remove('open');
  m.setAttribute('aria-hidden','true');
}

// --------------------------------------------------
// Nav & Settings
// --------------------------------------------------
function wireNav(){
  // Desktop sidebar nav
  $$('.nav-btn').forEach(btn=>{
    const go = btn.dataset.go;
    const openCreate = btn.dataset.action === 'open-create';
    btn.addEventListener('click', ()=>{
      if(openCreate) return openModal();
      if(go){ setActiveScreen(go); }
    });
    btn.title = btn.textContent.trim();
  });
  // Mobile nav
  $$('.mob-tab').forEach(btn=>{
    btn.addEventListener('click', ()=> setActiveScreen(btn.dataset.go));
    btn.title = btn.textContent.trim();
  });
  $$('.fab,[data-action="open-create"]').forEach(btn=>{
    btn.addEventListener('click', openModal);
    btn.title = 'Create a new post';
  });
}

function wireSettings(){
  // Logout confirmation
  const logoutBtn = $('#screen-settings .btn.outline');
  if(logoutBtn){
    logoutBtn.addEventListener('click', async (e)=>{
      e.preventDefault();
      const ok = await confirmDialog({
        title:'Logout?',
        message:'You can always log back in. We’ll keep your workspaces safe.',
        okText:'Logout',
        cancelText:'Stay'
      });
      if(ok){
        await setActiveScreen('splash');
        showToast('You’ve been logged out.', 'info', 1800);
      }else{
        showToast('Still here. Let’s build more! 💡', 'success', 1500);
      }
    });
  }
}

// --------------------------------------------------
// Boot
// --------------------------------------------------
document.addEventListener('DOMContentLoaded', ()=>{
  // start on splash
  setActiveScreen('splash');

  // data-driven renders
  renderWorkspaces();
  renderHome();
  renderExplore();
  renderCollab();

  // wiring
  wireNav();
  wireSettings();

  // icons
  lucide.createIcons();

  // onboarding skill chips (interactive toggle)
  const onbWrap = $('#onbSkills');
  if(onbWrap){
    onbWrap.innerHTML = '';
    SKILLS.forEach(s=>{
      const b = document.createElement('button');
      b.className = 'chip pill';
      b.textContent = s;
      b.addEventListener('click', ()=> b.classList.toggle('active'));
      onbWrap.appendChild(b);
    });
  }

  // global [data-go] for splash/onboarding buttons
  $$('[data-go]').forEach(b=>{
    b.addEventListener('click', async ()=>{
      const target = b.dataset.go;
      await setActiveScreen(target);
      if(target==='home'){
        showToast('Welcome back! Ready to create? ✨', 'info', 2200);
      }
    });
  });

  // "Begin your journey" instant toast
  const beginBtn = $('[data-go="onboarding"]');
  beginBtn?.addEventListener('click', ()=> showToast('Let’s set up your creative universe.', 'success', 1600));
});
