import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const configured = SUPABASE_URL.startsWith('https://') && SUPABASE_ANON_KEY.length > 20;
const supabase = configured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

const menuToggle = document.querySelector('#menuToggle');
const nav = document.querySelector('#nav');
menuToggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
});
nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuToggle?.setAttribute('aria-expanded', 'false');
}));

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

const cursorGlow = document.querySelector('.cursor-glow');
window.addEventListener('pointermove', event => {
  if (cursorGlow && window.matchMedia('(pointer:fine)').matches) {
    cursorGlow.style.left = `${event.clientX}px`;
    cursorGlow.style.top = `${event.clientY}px`;
  }
});

const projectGrid = document.querySelector('#projectsGrid');
const projectStatus = document.querySelector('#projectStatus');
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

async function loadProjects() {
  if (!supabase) {
    if (projectStatus) projectStatus.textContent = 'Database belum dikonfigurasi. Project contoh ditampilkan.';
    return;
  }
  const { data, error } = await supabase.from('projects')
    .select('id,title,description,category,project_url,cover_url,created_at')
    .eq('is_published', true).order('created_at', { ascending: false });
  if (error) {
    if (projectStatus) projectStatus.textContent = 'Project belum dapat dimuat. Periksa konfigurasi database.';
    console.error('Load projects:', error.message);
    return;
  }
  if (!data?.length) {
    if (projectStatus) projectStatus.textContent = 'Belum ada project yang dipublikasikan.';
    return;
  }
  projectGrid.innerHTML = data.map((project, index) => {
    const title = escapeHTML(project.title);
    const description = escapeHTML(project.description || '');
    const category = escapeHTML(project.category || 'PROJECT');
    const cover = project.cover_url ? `<img src="${escapeHTML(project.cover_url)}" alt="${title}" loading="lazy">` : `<div class="project-fallback"><span>${String(index + 1).padStart(2, '0')}</span><strong>${title}</strong><i>✳</i></div>`;
    const link = project.project_url ? `<a class="project-arrow" href="${escapeHTML(project.project_url)}" target="_blank" rel="noopener noreferrer" aria-label="Buka ${title}">↗</a>` : '<span class="project-arrow">↗</span>';
    return `<article class="project-card reveal"><div class="project-visual database-visual">${cover}</div><div class="project-info"><div><p class="project-category">${category}</p><h3>${title}</h3><p>${description}</p></div>${link}</div></article>`;
  }).join('');
  projectGrid.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  if (projectStatus) projectStatus.textContent = `${data.length} project ditampilkan.`;
}

const contactForm = document.querySelector('#contactForm');
contactForm?.addEventListener('submit', async event => {
  event.preventDefault();
  const status = document.querySelector('#formStatus');
  const button = contactForm.querySelector('button[type="submit"]');
  status.classList.remove('error');
  if (!supabase) {
    status.textContent = 'Form belum aktif. Konfigurasikan Supabase terlebih dahulu.';
    status.classList.add('error');
    return;
  }
  const form = new FormData(contactForm);
  const payload = {
    name: String(form.get('name') || '').trim(),
    email: String(form.get('email') || '').trim(),
    message: String(form.get('message') || '').trim()
  };
  if (!payload.name || !payload.email || !payload.message) return;
  button.disabled = true;
  button.textContent = 'Sending...';
  const { error } = await supabase.from('contact_messages').insert(payload);
  button.disabled = false;
  button.innerHTML = 'Send message <span>↗</span>';
  if (error) {
    status.textContent = 'Pesan gagal dikirim. Coba lagi beberapa saat.';
    status.classList.add('error');
    console.error('Contact submit:', error.message);
  } else {
    status.textContent = 'Pesan berhasil dikirim. Terima kasih!';
    contactForm.reset();
  }
});

if (supabase) loadProjects();
