// ============================================================
// PORTFOLIO SITE — Main Scripts
// ============================================================
// Handles:
//   1. Scroll reveal animations
//   2. Loading projects from Supabase
//   3. Contact form submission
// ============================================================

// ─── 1. SCROLL REVEAL ───
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

// ─── 2. LOAD PROJECTS FROM SUPABASE ───
(async () => {
  const container = document.getElementById('projectsContainer');

  const { data: projects, error } = await supabaseClient
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    container.innerHTML = `
      <div class="project-card message-card">
        <p>Unable to load projects.</p>
      </div>`;
    return;
  }

  if (!projects || projects.length === 0) {
    container.innerHTML = `
      <div class="project-card message-card">
        <p>No projects yet. Check back soon!</p>
      </div>`;
    return;
  }

  container.innerHTML = projects
    .map((project, index) => {
      // When the project has a URL, show the live site in an iframe
      // instead of the static thumbnail, so visitors see the project itself.
      const hasLiveUrl = Boolean(project.live_url);

      const thumbBg = project.thumbnail_url
        ? `background-image:url('${project.thumbnail_url.replace(/'/g, "\\'")}');background-size:cover;background-position:center;position:relative;`
        : `background:linear-gradient(135deg, var(--accent-light), var(--bg));`;

      const thumbContent = hasLiveUrl
        ? `<iframe src="${escapeHtml(project.live_url)}" class="thumb-frame" loading="lazy" title="Live preview of ${escapeHtml(project.title)}"></iframe>`
        : project.thumbnail_url
          ? ''
          : '<span>💼</span>';

      const featuredClass = index === 0 ? ' style="grid-column:1/-1"' : '';

      return `
        <div class="project-card reveal"${featuredClass}>
          <div class="thumb" style="${thumbBg}">
            ${thumbContent}
            <div class="bg-shape"></div>
          </div>
          <div class="info">
            <h3>${escapeHtml(project.title)}</h3>
            <p>${escapeHtml(project.short_description || '')}</p>
            <div class="tags">
              ${(project.technologies || []).map((t) => `<span>${escapeHtml(t)}</span>`).join('')}
            </div>
            ${hasLiveUrl
              ? '<p class="frame-note">Live preview above — if it looks blank, the site blocks embedding, so use Live Demo.</p>'
              : ''}
            <div class="project-links">
              ${hasLiveUrl
                ? `<a href="${escapeHtml(project.live_url)}" class="btn btn-primary btn-sm" target="_blank" rel="noopener">Live Demo →</a>`
                : ''}
              ${project.github_url
                ? `<a href="${escapeHtml(project.github_url)}" class="btn btn-outline btn-sm" target="_blank" rel="noopener">GitHub →</a>`
                : ''}
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  // Observe any new .reveal elements added by the loader
  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
})();

// ─── HELPER: ESCAPE HTML ───
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ─── 3. CONTACT FORM ───
const contactForm = document.getElementById('contactForm');
const thankYouSection = document.getElementById('thankYouSection');
const backButton = document.getElementById('backButton');

function showFormAgain() {
  thankYouSection.style.display = 'none';
  contactForm.style.display = 'flex';
}

contactForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  const formData = new FormData(this);

  try {
    const res = await fetch(this.action, {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' },
    });

    if (res.ok) {
      this.style.display = 'none';
      thankYouSection.style.display = 'block';
      this.reset();
    } else {
      alert('Something went wrong. Please try again.');
    }
  } catch {
    alert('Something went wrong. Please try again.');
  }
});

backButton.addEventListener('click', showFormAgain);

// Show the thank-you card when returning from formsubmit.co
if (window.location.search.includes('submitted=true')) {
  thankYouSection.style.display = 'block';
  contactForm.style.display = 'none';
  history.replaceState(null, '', window.location.pathname);
}
