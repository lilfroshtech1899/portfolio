// ============================================================
// DASHBOARD — Portfolio CMS
// ============================================================

// ─── STATE ───
const state = {
  projects: [],
  filteredProjects: [],
  currentPage: 1,
  pageSize: 10,
  tags: [],
  thumbnailFile: null,
  thumbnailDeleted: false,
  galleryFiles: [],
  existingGallery: [],
  removedGallery: [],
  editingId: null,
};

// ─── DOM REFS ───
const $ = (id) => document.getElementById(id);
const sections = {
  overview: $('section-overview'),
  projects: $('section-projects'),
};
const toastContainer = $('toastContainer');

// ─── AUTH GUARD ───
(async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return;
  }
  $('userEmail').textContent = session.user.email;
  init();
})();

supabaseClient.auth.onAuthStateChange((event, session) => {
  if (!session) window.location.href = 'login.html';
});

// ─── INIT ───
async function init() {
  setupNavigation();
  setupMobileMenu();
  setupProjectForm();
  setupTagsInput();
  setupImageUploads();
  setupSearchFilterSort();
  setupLogout();
  await loadProjects();
  loadStats();
  showSection('overview');
}

// ─── NAVIGATION ───
function setupNavigation() {
  document.querySelectorAll('.nav-item[data-section]').forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'));
      item.classList.add('active');
      showSection(item.dataset.section);
    });
  });
}

function showSection(name) {
  Object.values(sections).forEach((s) => s.classList.remove('active'));
  if (sections[name]) sections[name].classList.add('active');
  const titles = { overview: 'Dashboard Overview', projects: 'Projects' };
  $('pageTitle').textContent = titles[name] || 'Dashboard';
}

// ─── MOBILE MENU ───
function setupMobileMenu() {
  const toggle = $('menuToggle');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');

  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
  });

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  });
}

// ─── LOGOUT ───
function setupLogout() {
  $('logoutBtn').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = 'login.html';
  });
}

// ─── TOAST ───
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${escapeHtml(message)}</span>
    <button class="toast-close">&times;</button>
  `;
  toastContainer.appendChild(toast);
  toast.querySelector('.toast-close').onclick = () => toast.remove();
  setTimeout(() => toast.remove(), 3500);
}

// ─── CONFIRM DIALOG ───
function showConfirm(message) {
  return new Promise((resolve) => {
    const dialog = $('confirmDialog');
    $('confirmMessage').textContent = message;
    dialog.classList.add('active');

    $('confirmOk').onclick = () => { dialog.classList.remove('active'); resolve(true); };
    $('confirmCancel').onclick = () => { dialog.classList.remove('active'); resolve(false); };
  });
}

// ─── ESCAPE HTML ───
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ─── FORMAT DATE ───
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const d = new Date(dateStr);
  const diff = now - d;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return formatDate(dateStr);
}

// ─── STATS ───
async function loadStats() {
  const { data, error } = await supabaseClient.from('projects').select('id, featured, created_at');
  if (error) { showToast('Failed to load stats', 'error'); return; }

  const total = data.length;
  const featured = data.filter((p) => p.featured).length;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recent = data.filter((p) => new Date(p.created_at) > thirtyDaysAgo).length;

  $('totalProjects').textContent = total;
  $('featuredProjects').textContent = featured;
  $('recentProjects').textContent = recent;
}

// ─── LOAD PROJECTS ───
async function loadProjects() {
  $('projectsTableBody').innerHTML = `
    <tr><td colspan="7" class="table-empty-cell">
      <div class="loading-spinner"><div class="spinner"></div></div>
    </td></tr>`;

  const { data, error } = await supabaseClient
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    showToast('Failed to load projects: ' + error.message, 'error');
    $('projectsTableBody').innerHTML = '<tr><td colspan="7"><div class="empty-state"><p>Error loading projects.</p></div></td></tr>';
    return;
  }

  state.projects = data || [];
  populateCategories();
  applyFilters();
}

// ─── SEARCH / FILTER / SORT ───
function setupSearchFilterSort() {
  $('searchInput').addEventListener('input', applyFilters);
  $('categoryFilter').addEventListener('change', applyFilters);
  $('sortSelect').addEventListener('change', applyFilters);
}

function applyFilters() {
  const search = $('searchInput').value.toLowerCase().trim();
  const category = $('categoryFilter').value;
  const sort = $('sortSelect').value;

  let filtered = [...state.projects];

  if (search) {
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(search) ||
        (p.technologies || []).some((t) => t.toLowerCase().includes(search)) ||
        (p.short_description || '').toLowerCase().includes(search)
    );
  }

  if (category) {
    filtered = filtered.filter((p) => p.category === category);
  }

  filtered.sort((a, b) => {
    const da = new Date(a.created_at || 0).getTime();
    const db = new Date(b.created_at || 0).getTime();
    return sort === 'newest' ? db - da : da - db;
  });

  state.filteredProjects = filtered;
  state.currentPage = 1;
  renderTable();
  renderPagination();
}

function populateCategories() {
  const cats = [...new Set(state.projects.map((p) => p.category).filter(Boolean))];
  const select = $('categoryFilter');
  const current = select.value;
  select.innerHTML = '<option value="">All Categories</option>';
  cats.sort().forEach((c) => {
    select.innerHTML += `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`;
  });
  select.value = current;
}

// ─── RENDER TABLE ───
function renderTable() {
  const tbody = $('projectsTableBody');
  const start = (state.currentPage - 1) * state.pageSize;
  const end = start + state.pageSize;
  const page = state.filteredProjects.slice(start, end);

  if (page.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="7">
        <div class="empty-state">
          <div class="empty-icon">📂</div>
          <p>No projects found.</p>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = page
    .map(
      (p) => `
    <tr>
      <td>
        ${p.thumbnail_url
          ? `<img class="table-thumb" src="${escapeHtml(p.thumbnail_url)}" alt="${escapeHtml(p.title)}" />`
          : `<div class="table-thumb-placeholder">💼</div>`
        }
      </td>
      <td><strong>${escapeHtml(p.title)}</strong></td>
      <td>
        <div class="table-tags">
          ${(p.technologies || []).map((t) => `<span>${escapeHtml(t)}</span>`).join('')}
        </div>
      </td>
      <td>${escapeHtml(p.category || '—')}</td>
      <td class="table-date">
        ${formatDate(p.created_at)}
      </td>
      <td>
        <span class="featured-badge ${p.featured ? 'active' : 'inactive'}">
          ${p.featured ? '★ Featured' : '☆ Not Featured'}
        </span>
      </td>
      <td>
        <div class="action-btns">
          <button class="btn btn-outline btn-sm" onclick="openEditModal('${p.id}')">Edit</button>
          <button class="btn btn-outline btn-sm ${p.featured ? 'btn-primary' : ''}"
            onclick="toggleFeatured('${p.id}', ${p.featured})">
            ${p.featured ? 'Unfeature' : 'Feature'}
          </button>
          <button class="btn btn-danger btn-sm" onclick="confirmDelete('${p.id}')">Delete</button>
        </div>
      </td>
    </tr>`
    )
    .join('');
}

// ─── PAGINATION ───
function renderPagination() {
  const container = $('pagination');
  const total = state.filteredProjects.length;
  const pages = Math.ceil(total / state.pageSize);

  if (pages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';
  html += `<button onclick="goToPage(${state.currentPage - 1})" ${state.currentPage === 1 ? 'disabled' : ''}>‹ Prev</button>`;

  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= state.currentPage - 1 && i <= state.currentPage + 1)) {
      html += `<button class="${i === state.currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    } else if (i === state.currentPage - 2 || i === state.currentPage + 2) {
      html += `<button disabled>…</button>`;
    }
  }

  html += `<button onclick="goToPage(${state.currentPage + 1})" ${state.currentPage === pages ? 'disabled' : ''}>Next ›</button>`;
  container.innerHTML = html;
}

function goToPage(page) {
  const total = state.filteredProjects.length;
  const pages = Math.ceil(total / state.pageSize);
  if (page < 1 || page > pages) return;
  state.currentPage = page;
  renderTable();
  renderPagination();
  document.querySelector('.table-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── FEATURED TOGGLE ───
async function toggleFeatured(id, current) {
  const btn = event.target;
  btn.disabled = true;
  const { error } = await supabaseClient
    .from('projects')
    .update({ featured: !current, updated_at: new Date().toISOString() })
    .eq('id', id);

  btn.disabled = false;
  if (error) {
    showToast('Failed to update featured status', 'error');
    return;
  }
  showToast(current ? 'Unmarked as featured' : 'Marked as featured');
  await loadProjects();
  loadStats();
}

// ─── DELETE ───
async function confirmDelete(id) {
  const project = state.projects.find((p) => p.id === id);
  const confirmed = await showConfirm(`Delete "${project?.title || 'this project'}"? This cannot be undone.`);
  if (!confirmed) return;

  const { error } = await supabaseClient.from('projects').delete().eq('id', id);
  if (error) {
    showToast('Failed to delete project', 'error');
    return;
  }

  showToast('Project deleted');
  await loadProjects();
  loadStats();
}

// ─── TAGS INPUT ───
function setupTagsInput() {
  const wrapper = $('tagsInputWrapper');
  const input = $('tagsInput');

  wrapper.addEventListener('click', () => input.focus());

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
    if (e.key === 'Backspace' && input.value === '' && state.tags.length > 0) {
      state.tags.pop();
      renderTags();
    }
  });

  input.addEventListener('blur', () => {
    if (input.value.trim()) addTag();
  });
}

function addTag() {
  const input = $('tagsInput');
  const val = input.value.replace(/,/g, '').trim();
  if (!val) return;
  if (state.tags.includes(val)) return;
  state.tags.push(val);
  input.value = '';
  renderTags();
}

function removeTag(index) {
  state.tags.splice(index, 1);
  renderTags();
}

function renderTags() {
  const container = $('tagsList');
  container.innerHTML = state.tags
    .map(
      (tag, i) =>
        `<span class="tag-chip">${escapeHtml(tag)} <button class="tag-remove" onclick="removeTag(${i})">&times;</button></span>`
    )
    .join('');
}

function setTags(tags) {
  state.tags = [...(tags || [])];
  renderTags();
}

// ─── IMAGE UPLOADS ───
function setupImageUploads() {
  // Thumbnail
  $('thumbnailInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      e.target.value = '';
      return;
    }
    state.thumbnailFile = file;
    state.thumbnailDeleted = false;
    const reader = new FileReader();
    reader.onload = (ev) => {
      $('thumbnailPreview').innerHTML = `
        <div class="thumbnail-preview">
          <img src="${ev.target.result}" alt="Thumbnail preview" />
          <button class="remove-image" onclick="removeThumbnail()">&times;</button>
        </div>`;
    };
    reader.readAsDataURL(file);
  });

  // Gallery
  $('galleryInput').addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    const valid = files.filter((f) => f.type.startsWith('image/'));
    if (valid.length !== files.length) {
      showToast('Some files were skipped (not images)', 'error');
    }
    state.galleryFiles = [...state.galleryFiles, ...valid];
    renderGalleryPreviews();
    e.target.value = '';
  });
}

function removeThumbnail() {
  state.thumbnailFile = null;
  state.thumbnailDeleted = true;
  $('thumbnailPreview').innerHTML = '';
  $('thumbnailInput').value = '';
}

function removeGalleryPreview(index) {
  if (index < state.galleryFiles.length) {
    state.galleryFiles.splice(index, 1);
  } else {
    const ei = index - state.galleryFiles.length;
    const removed = state.existingGallery.splice(ei, 1);
    if (removed[0]) state.removedGallery.push(removed[0]);
  }
  renderGalleryPreviews();
}

function renderGalleryPreviews() {
  const container = $('galleryPreview');
  let html = '';
  state.galleryFiles.forEach((file, i) => {
    const url = URL.createObjectURL(file);
    html += `<div class="gallery-item">
      <img src="${url}" alt="Gallery preview" />
      <button class="remove-image" onclick="removeGalleryPreview(${i})">&times;</button>
    </div>`;
  });
  state.existingGallery.forEach((url, i) => {
    const idx = state.galleryFiles.length + i;
    html += `<div class="gallery-item">
      <img src="${escapeHtml(url)}" alt="Gallery image" />
      <button class="remove-image" onclick="removeGalleryPreview(${idx})">&times;</button>
    </div>`;
  });
  container.innerHTML = html || '<p class="gallery-empty">No images yet.</p>';
}

async function uploadImage(file, folder = 'thumbnails') {
  const ext = file.name.split('.').pop();
  const name = `${Date.now()}_${Math.random().toString(36).substring(2)}.${ext}`;
  const path = `${folder}/${name}`;

  const { error: uploadError } = await supabaseClient.storage
    .from('portfolio-images')
    .upload(path, file, { upsert: false });

  if (uploadError) throw new Error('Upload failed: ' + uploadError.message);

  const { data: { publicUrl } } = supabaseClient.storage
    .from('portfolio-images')
    .getPublicUrl(path);

  return publicUrl;
}

async function deleteStorageImage(url) {
  if (!url) return;
  const parts = url.split('/portfolio-images/');
  if (parts.length < 2) return;
  const path = parts[1];
  await supabaseClient.storage.from('portfolio-images').remove([path]);
}

// ─── PROJECT FORM ───
function setupProjectForm() {
  $('addProjectBtn').addEventListener('click', openAddModal);
  $('modalClose').addEventListener('click', closeModal);
  $('modalCancel').addEventListener('click', closeModal);
  $('projectModal').addEventListener('click', (e) => {
    if (e.target === $('projectModal')) closeModal();
  });
  $('projectForm').addEventListener('submit', handleFormSubmit);
}

function openAddModal() {
  state.editingId = null;
  state.tags = [];
  state.thumbnailFile = null;
  state.thumbnailDeleted = false;
  state.galleryFiles = [];
  state.existingGallery = [];
  state.removedGallery = [];

  $('modalTitle').textContent = 'Add Project';
  $('modalSubmit').textContent = 'Save Project';
  $('projectForm').reset();
  $('projectId').value = '';
  $('thumbnailPreview').innerHTML = '';
  $('galleryPreview').innerHTML = '<p class="gallery-empty">No images yet.</p>';
  renderTags();
  $('projectModal').classList.add('active');
}

async function openEditModal(id) {
  const project = state.projects.find((p) => p.id === id);
  if (!project) return;

  state.editingId = id;
  state.thumbnailFile = null;
  state.thumbnailDeleted = false;
  state.galleryFiles = [];
  state.existingGallery = [...(project.gallery_images || [])];
  state.removedGallery = [];
  setTags(project.technologies);

  $('modalTitle').textContent = 'Edit Project';
  $('modalSubmit').textContent = 'Update Project';
  $('projectId').value = id;
  $('title').value = project.title || '';
  $('shortDescription').value = project.short_description || '';
  $('fullDescription').value = project.full_description || '';
  $('category').value = project.category || '';
  $('featured').checked = project.featured || false;
  $('liveUrl').value = project.live_url || '';
  $('githubUrl').value = project.github_url || '';

  // Thumbnail preview
  if (project.thumbnail_url) {
    $('thumbnailPreview').innerHTML = `
      <div class="thumbnail-preview">
        <img src="${escapeHtml(project.thumbnail_url)}" alt="Current thumbnail" />
        <button class="remove-image" onclick="removeThumbnail()">&times;</button>
      </div>`;
  } else {
    $('thumbnailPreview').innerHTML = '';
  }

  // Gallery preview
  renderGalleryPreviews();

  $('projectModal').classList.add('active');
}

function closeModal() {
  $('projectModal').classList.remove('active');
  state.editingId = null;
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const title = $('title').value.trim();
  const shortDescription = $('shortDescription').value.trim();
  const fullDescription = $('fullDescription').value.trim();
  const category = $('category').value.trim();
  const featured = $('featured').checked;
  const liveUrl = $('liveUrl').value.trim();
  const githubUrl = $('githubUrl').value.trim();

  // Validation
  if (!title) { showToast('Title is required.', 'error'); return; }
  if (!shortDescription) { showToast('Short description is required.', 'error'); return; }
  if (state.tags.length === 0) { showToast('At least one technology is required.', 'error'); return; }
  if (!category) { showToast('Category is required.', 'error'); return; }
  if (!state.thumbnailFile && !state.editingId) { showToast('Thumbnail image is required.', 'error'); return; }
  if (state.thumbnailDeleted && !state.thumbnailFile) { showToast('Thumbnail image is required.', 'error'); return; }

  const submitBtn = $('modalSubmit');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving...';

  try {
    let thumbnailUrl = state.editingId
      ? state.projects.find((p) => p.id === state.editingId)?.thumbnail_url || null
      : null;

    // Upload new thumbnail
    if (state.thumbnailFile) {
      if (thumbnailUrl) await deleteStorageImage(thumbnailUrl);
      thumbnailUrl = await uploadImage(state.thumbnailFile, 'thumbnails');
    } else if (state.thumbnailDeleted) {
      if (thumbnailUrl) await deleteStorageImage(thumbnailUrl);
      thumbnailUrl = null;
    }

    // Delete removed gallery images from storage
    for (const url of state.removedGallery) {
      await deleteStorageImage(url);
    }

    // Upload new gallery images
    const newGalleryUrls = [];
    for (const file of state.galleryFiles) {
      const url = await uploadImage(file, 'gallery');
      newGalleryUrls.push(url);
    }

    const galleryImages = [...state.existingGallery, ...newGalleryUrls];

    const payload = {
      title,
      short_description: shortDescription,
      full_description: fullDescription,
      technologies: state.tags,
      category,
      thumbnail_url: thumbnailUrl,
      gallery_images: galleryImages,
      live_url: liveUrl || null,
      github_url: githubUrl || null,
      featured,
      updated_at: new Date().toISOString(),
    };

    if (state.editingId) {
      const { error } = await supabaseClient.from('projects').update(payload).eq('id', state.editingId);
      if (error) throw error;
      showToast('Project updated successfully!');
    } else {
      payload.created_at = new Date().toISOString();
      const { error } = await supabaseClient.from('projects').insert(payload);
      if (error) throw error;
      showToast('Project added successfully!');
    }

    closeModal();
    await loadProjects();
    loadStats();
  } catch (err) {
    showToast(err.message || 'An error occurred', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = state.editingId ? 'Update Project' : 'Save Project';
  }
}

// ─── EXPOSE GLOBALLY (for inline onclick) ───
window.openEditModal = openEditModal;
window.toggleFeatured = toggleFeatured;
window.confirmDelete = confirmDelete;
window.removeTag = removeTag;
window.removeThumbnail = removeThumbnail;
window.removeGalleryPreview = removeGalleryPreview;
window.goToPage = goToPage;