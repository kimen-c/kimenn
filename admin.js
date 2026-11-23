import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
const configured = SUPABASE_URL.startsWith('https://') && SUPABASE_ANON_KEY.length > 20;
const supabase = configured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const $ = selector => document.querySelector(selector);
$('#year').textContent = new Date().getFullYear();
const loginPanel = $('#loginPanel'), dashboard = $('#dashboard');
const setStatus = (selector, message, error=false) => { const el=$(selector); el.textContent=message; el.classList.toggle('error',error); };
const safe = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

if (!supabase) {
  setStatus('#loginStatus','Isi config.js dengan URL dan anon/publishable key Supabase.',true);
  $('#loginForm').addEventListener('submit',e=>e.preventDefault());
} else {
  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    setStatus('#loginStatus','Signing in...');
    const {error}=await supabase.auth.signInWithPassword({email:$('#loginEmail').value.trim(),password:$('#loginPassword').value});
    if(error) return setStatus('#loginStatus','Login gagal. Periksa email, password, dan status akun.',true);
    await checkSession();
  });
  $('#logoutButton').addEventListener('click', async()=>{await supabase.auth.signOut();showLoggedOut();});
  supabase.auth.onAuthStateChange((_event,session)=>{ if(session) showDashboard(session.user); else showLoggedOut(); });
  checkSession();
}

function showLoggedOut(){loginPanel.hidden=false;dashboard.hidden=true;}
async function checkSession(){const {data}=await supabase.auth.getSession();if(data.session)showDashboard(data.session.user);else showLoggedOut();}
async function showDashboard(user){
  loginPanel.hidden=true;dashboard.hidden=false;$('#adminEmail').textContent=user.email||'Signed in';
  await Promise.all([loadAdminProjects(),loadMessages()]);
}
async function loadAdminProjects(){
  const list=$('#adminProjects');list.innerHTML='<p class="admin-muted">Loading...</p>';
  const {data,error}=await supabase.from('projects').select('*').order('created_at',{ascending:false});
  if(error){list.innerHTML='<p class="admin-muted">Tidak bisa memuat project. Pastikan akun ini terdaftar sebagai admin di tabel admins.</p>';return;}
  if(!data.length){list.innerHTML='<p class="admin-muted">Belum ada project.</p>';return;}
  list.innerHTML=data.map(p=>`<article class="admin-item"><div><h3>${safe(p.title)}</h3><p>${safe(p.category||'Project')} · ${p.is_published?'Published':'Draft'}</p></div><div class="admin-item-actions"><button class="small-action" data-edit="${p.id}">Edit</button><button class="small-action danger" data-delete="${p.id}">Delete</button></div></article>`).join('');
  list.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>editProject(data.find(p=>p.id===b.dataset.edit))));
  list.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>deleteProject(b.dataset.delete)));
}
function editProject(p){$('#projectId').value=p.id;$('#projectTitle').value=p.title;$('#projectDescription').value=p.description||'';$('#projectCategory').value=p.category||'';$('#projectCover').value=p.cover_url||'';$('#projectUrl').value=p.project_url||'';$('#projectPublished').checked=p.is_published;$('#editorTitle').textContent='Edit project';window.scrollTo({top:0,behavior:'smooth'});}
function resetProject(){ $('#projectForm').reset();$('#projectId').value='';$('#projectPublished').checked=true;$('#editorTitle').textContent='Add project';setStatus('#projectStatus','');}
$('#resetProject').addEventListener('click',resetProject);
$('#projectForm').addEventListener('submit',async e=>{
  e.preventDefault();const id=$('#projectId').value;
  const payload={title:$('#projectTitle').value.trim(),description:$('#projectDescription').value.trim(),category:$('#projectCategory').value.trim(),cover_url:$('#projectCover').value.trim()||null,project_url:$('#projectUrl').value.trim()||null,is_published:$('#projectPublished').checked};
  const query=id?supabase.from('projects').update(payload).eq('id',id):supabase.from('projects').insert(payload);
  const {error}=await query;
  if(error){setStatus('#projectStatus','Gagal menyimpan. Periksa akses admin dan format URL.',true);return;}
  setStatus('#projectStatus','Project berhasil disimpan.');resetProject();await loadAdminProjects();
});
async function deleteProject(id){if(!confirm('Hapus project ini?'))return;const {error}=await supabase.from('projects').delete().eq('id',id);if(error)alert('Gagal menghapus project.');else await loadAdminProjects();}
async function loadMessages(){
  const list=$('#adminMessages');list.innerHTML='<p class="admin-muted">Loading...</p>';
  const {data,error}=await supabase.from('contact_messages').select('*').order('created_at',{ascending:false}).limit(100);
  if(error){list.innerHTML='<p class="admin-muted">Tidak bisa memuat pesan. Pastikan akun ini terdaftar sebagai admin.</p>';return;}
  if(!data.length){list.innerHTML='<p class="admin-muted">Belum ada pesan masuk.</p>';return;}
  list.innerHTML=data.map(m=>`<article class="admin-item"><div><h3>${safe(m.name)} <span class="admin-muted">· ${safe(m.email)}</span></h3><p class="message-meta">${new Date(m.created_at).toLocaleString('id-ID')}</p><p>${safe(m.message)}</p></div><button class="small-action danger" data-message-delete="${m.id}">Delete</button></article>`).join('');
  list.querySelectorAll('[data-message-delete]').forEach(b=>b.addEventListener('click',async()=>{if(!confirm('Hapus pesan ini?'))return;const {error}=await supabase.from('contact_messages').delete().eq('id',b.dataset.messageDelete);if(error)alert('Gagal menghapus pesan.');else loadMessages();}));
}
$('#refreshMessages').addEventListener('click',loadMessages);
