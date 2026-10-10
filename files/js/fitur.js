document.addEventListener('DOMContentLoaded', () => {
  // 1. Theme Switcher Logic
  const savedTheme = localStorage.getItem('arocommand_theme') || 'classic-horror';
  document.documentElement.setAttribute('data-theme', savedTheme);

  const themes = ['classic-horror', 'abyssal-void', 'toxic-hazard', 'blood-moon', 'phantom-shadow', 'asylum'];
  
  window.toggleThemeModal = () => {
    let modal = document.getElementById('themeModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'themeModal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-container">
          <div class="modal__header">
            <h3 class="modal__title"><span class="material-icons">palette</span> Ubah Tema</h3>
            <button class="modal__close" onclick="closeModal('themeModal')"><span class="material-icons">close</span></button>
          </div>
          <div class="modal__body" style="display:flex; flex-direction:column; gap:0.8rem;">
            ${themes.map(t => `<button class="btn" style="justify-content:center; text-transform:uppercase;" onclick="setTheme('${t}')">${t.replace('-', ' ')}</button>`).join('')}
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    modal.classList.add('modal-overlay--active');
  };

  window.setTheme = (themeName) => {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('arocommand_theme', themeName);
    closeModal('themeModal');
  };

  window.closeModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('modal-overlay--active');
  };

  // 2. Dynamic Copyright Year
  const yearEls = document.querySelectorAll('#currentYear');
  yearEls.forEach(el => el.textContent = new Date().getFullYear());
  
  // profile link
  document.querySelectorAll('.profile__link').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    
    const destination = this.getAttribute('data-url');
    
    if (destination && destination !== '') {
      window.location.href = destination;
    }
   });
  });
  
  // post link
  document.querySelectorAll('.post__link').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    
    const destination = this.getAttribute('data-url');
    
    if (destination && destination !== '') {
      window.open(destination, '_blank');
    }
   });
  });

  // 3. 404 Auto Redirect Countdown
  const countdownEl = document.getElementById('countdownNum');
  if (countdownEl) {
    let countdown = 10;
    const redirectInterval = setInterval(() => {
      countdown--;
      countdownEl.textContent = countdown;
      if (countdown <= 0) {
        clearInterval(redirectInterval);
        window.location.href = '/';
      }
    }, 1000);
  }

  // 4. Index Page: Random Rotating Post
  const randomPostContainer = document.getElementById('randomPostContainer');
  const randomPostTimer = document.getElementById('randomPostTimer');
  if (randomPostContainer) {
    let secondsLeft = 60;

    const loadRandomPost = () => {
      fetch('categories.json')
        .then(res => res.json())
        .then(data => {
          if (!data || data.length === 0) return;
          const randomIndex = Math.floor(Math.random() * data.length);
          const p = data[randomIndex];
          
          const thumbHtml = p.thumbnail 
            ? `<img src="${escapeHtml(p.thumbnail)}" alt="Thumb" class="archive-thumb">`
            : `<div class="archive-thumb-placeholder"><span class="material-icons" style="font-size: 2rem; color: var(--accent);">auto_stories</span></div>`;

          randomPostContainer.innerHTML = `
            <div style="display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap;">
              ${thumbHtml}
              <div style="display: flex; flex-direction: column; gap: 0.5rem; flex: 1; min-width: 220px;">
                <h4 style="font-family: var(--font-mono); color: var(--accent); font-size: 1.1rem;">${escapeHtml(p.title)}</h4>
                <div style="display: flex; gap: 1rem; color: var(--text-muted); font-size: 0.8rem; flex-wrap: wrap;">
                  <span><span class="material-icons" style="font-size: 0.85rem; vertical-align: middle;">schedule</span> ${escapeHtml(p.date)}</span>
                  <span><span class="material-icons" style="font-size: 0.85rem; vertical-align: middle;">label</span> ${escapeHtml(p.labels.join(', '))}</span>
                </div>
                <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.5;">${escapeHtml((p.description || (p.blocks && p.blocks.find(b => b.type === 'text')?.content) || '').substring(0, 110))}...</p>
                <a href="categories.html?post=${encodeURIComponent(p.slug)}" class="btn" style="align-self: flex-start; padding: 0.4rem 0.9rem; font-size: 0.85rem;">Baca Selengkapnya <span class="material-icons" style="font-size: 1rem;">visibility</span></a>
              </div>
            </div>
          `;
        })
        .catch(() => {
          randomPostContainer.innerHTML = `<p style="color: var(--accent); font-size: 0.9rem;">Gagal memuat post acak.</p>`;
        });
    };

    loadRandomPost();

    setInterval(() => {
      secondsLeft--;
      if (randomPostTimer) {
        randomPostTimer.textContent = `Otomatis refresh dalam ${secondsLeft}s`;
      }
      if (secondsLeft <= 0) {
        loadRandomPost();
        secondsLeft = 60;
      }
    }, 1000);
  }

  // 5. Auth & Post Management (post.html)
  const loginForm = document.getElementById('loginForm');
  const postSection = document.getElementById('postSection');
  const logoutBtn = document.getElementById('logoutBtn');

  const scriptURL = 'https://script.google.com/macros/s/AKfycbxyPX8fr0pLK9ayHNOMn7-rJDGLjI93LhrrFiUIo5Ddy6UBrp7Qv2VKfEDFNVbfaBAelg/exec';

  if (loginForm && postSection) {
    const isLogged = localStorage.getItem('arocommand_auth') === 'true';
    if (isLogged) {
      loginForm.style.display = 'none';
      postSection.style.display = 'flex';
      if (logoutBtn) logoutBtn.style.display = 'inline-flex';
      initPostPanel();
    }
    
    window.handleLogin = async (e) => {
      e.preventDefault();
      const user = document.getElementById('authUser').value.trim();
      const pass = document.getElementById('authPass').value.trim();
      
      try {
        const response = await fetch(scriptURL, {
          method: 'POST',
          body: JSON.stringify({ action: 'login', user: user, pass: pass }),
          headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
          localStorage.setItem('arocommand_auth', 'true');
          loginForm.style.display = 'none';
          postSection.style.display = 'flex';
          if (logoutBtn) logoutBtn.style.display = 'inline-flex';
          initPostPanel();
        } else {
          showCustomAlert('Identitas Kredensial Tidak Dikenali!');
        }
      } catch (error) {
        console.error('Error login:', error);
        showCustomAlert('Gagal terhubung ke server autentikasi.');
      }
    };
    
    window.handleLogout = () => {
      localStorage.removeItem('arocommand_auth');
      loginForm.style.display = 'block';
      postSection.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'none';
      document.getElementById('authUser').value = '';
      document.getElementById('authPass').value = '';
    };
  }

  // 6. Categories & Rendering Logic with Pagination & URL Search Routing
  const postContainer = document.getElementById('postContainer');
  if (postContainer) {
    fetch('categories.json')
      .then(res => res.json())
      .then(data => {
        const urlParams = new URLSearchParams(window.location.search);
        const postSlug = urlParams.get('post');
        const searchQuery = urlParams.get('search');
        const pagesQuery = urlParams.get('pages');
        
        const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwMgSHtS1YWlIG2m2xYuAgM6S6pG_OHEkozlNSpbY9wVOn3ABM5Ft-RveBsbROkQt5PjA/exec';

        // Single Full Post View
        if (postSlug) {
          const singlePost = data.find(p => p.slug === postSlug);
          if (singlePost) {
            const pageTitleEl = document.getElementById('pageTitle');
            if (pageTitleEl) pageTitleEl.textContent = `${singlePost.title} ー aRoCommand`;
            
            const searchWrapper = document.getElementById('searchWrapper');
            if (searchWrapper) searchWrapper.style.display = 'none';
            
            let contentHtml = '';
            if (singlePost.blocks && Array.isArray(singlePost.blocks)) {
              contentHtml = singlePost.blocks.map((b, idx) => {
                if (b.type === 'script') {
                  return `
                    <div class="form-group" style="margin: 1.2rem 0;">
                      <div style="position: relative; background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; overflow: hidden;">
                        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2); padding: 0.4rem 0.8rem; border-bottom: 1px solid var(--border);">
                          <span style="font-family: var(--font-mono); color: var(--accent); font-size: 0.8rem;">SCRIPT (${(b.lang || 'javascript').toUpperCase()})</span>
                          <button class="btn" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; display: flex; align-items: center; gap: 0.2rem;" onclick="copyCodeBlock('codeBlock_${idx}')">
                            <span class="material-icons" style="font-size: 0.9rem;">content_copy</span> Salin
                          </button>
                        </div>
                        <pre style="margin: 0; padding: 1rem; overflow-x: auto; background: transparent; border: none;"><code id="codeBlock_${idx}" style="font-family: monospace; color: var(--text-main); font-size: 0.9rem; line-height: 1.5;">${escapeHtml(b.code)}</code></pre>
                      </div>
                    </div>
                  `;
                } else if (b.type === 'html') {
                  return `<div style="margin: 1rem 0; color: var(--text-main);">${b.content}</div>`;
                } else if (b.type === 'text') {
                  return `<p style="line-height: 1.7; margin: 1rem 0; color: var(--text-main);">${escapeHtml(b.content)}</p>`;
                } else if (b.type === 'image') {
                  return `
                    <div style="margin: 1.5rem 0; text-align: center;">
                      <img src="${escapeHtml(b.url)}" alt="Post Image" class="post-body-image">
                    </div>
                  `;
                }
                return '';
              }).join('');
            } else {
              contentHtml = `<p style="line-height: 1.6;">${escapeHtml(singlePost.description || '')}</p>`;
            }
            
            // Render Konten Post beserta Section Komentar
            postContainer.innerHTML = `
              <article class="interactive-card" style="padding: 2.5rem; width: 100%;">
                <h1 style="font-family: var(--font-mono); color: var(--accent); font-size: 2rem; line-height: 1.3;">${escapeHtml(singlePost.title)}</h1>
                <div style="display: flex; flex-wrap: wrap; gap: 1rem; color: var(--text-muted); font-size: 0.9rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem;">
                  <span><span class="material-icons" style="font-size: 1rem; vertical-align: middle;">person</span> ${escapeHtml(singlePost.author)}</span>
                  <span><span class="material-icons" style="font-size: 1rem; vertical-align: middle;">schedule</span> ${escapeHtml(singlePost.date)}</span>
                  <span><span class="material-icons" style="font-size: 1rem; vertical-align: middle;">label</span> ${escapeHtml(singlePost.labels.join(', '))}</span>
                </div>
                <div class="post-body-content">${contentHtml}</div>
                ${singlePost.quote ? `<blockquote style="border-left: 4px solid var(--accent); padding-left: 1rem; font-style: italic; color: var(--text-muted); margin-top: 1rem;">${escapeHtml(singlePost.quote)}</blockquote>` : ''}
                
                <!-- BAGIAN KOMENTAR -->
              <section style="margin-top: 3rem; border-top: 1px solid var(--border); padding-top: 2rem;">
                <h3 style="font-family: var(--font-mono); color: var(--accent); margin-bottom: 1.5rem;">Komentar
                </h3>
                
                <div id="commentsList" style="margin-bottom: 2rem; display: flex; flex-direction: column; gap: 1rem;">
                <p style="color: var(--text-muted); font-size: 0.9rem;">Memuat komentar...
                </p>
                </div>
                
               <form id="commentForm" style="display: flex; flex-direction: column; gap: 1rem; background: var(--bg-card); padding: 1.5rem; border-radius: 8px; border: 1px solid var(--border);">
                <h4 style="font-family: var(--font-mono); color: var(--text-main); font-size: 1rem;">Tinggalkan Komentar
                </h4>
                <div class="form-group">
                <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.3rem;">Nama
                </label>
                <input type="text" id="commentName" required class="form-control">
                </div>
                
                <div class="form-group">
                <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.3rem;">Email (tidak akan dipublikasikan)
                </label>
                <input type="email" id="commentEmail" required class="form-control">
                </div>
                
                <div class="form-group">
                <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.3rem;">Komentar
                </label>
                <textarea id="commentText" rows="4" required class="form-control"></textarea>
                </div>
                
                <button type="submit" id="submitCommentBtn" class="btn" style="align-self: flex-start;">Kirim Komentar <span class="material-icons">send</span>
                </button>
               </form>
              </section>

                <div style="margin-top: 2rem;">
                  <a href="categories.html" class="btn"><span class="material-icons">arrow_back</span> Kembali ke Arsip</a>
                </div>
              </article>
            `;
            
            // Fetch dan Tampilkan Komentar yang sudah ada
            const loadComments = () => {
              fetch(`${SCRIPT_URL}?postSlug=${encodeURIComponent(postSlug)}`)
                .then(res => res.json())
                .then(comments => {
                  const listEl = document.getElementById('commentsList');
                  if (!listEl) return;
                  if (comments.length === 0) {
                    listEl.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem; font-style: italic;">Belum ada komentar. Jadilah yang pertama berkomentar!</p>`;
                    return;
                  }
                  listEl.innerHTML = comments.map(c => `
                    <div style="background: var(--bg-card); padding: 1rem; border-radius: 6px; border: 1px solid var(--border);">
                      <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.85rem; color: var(--text-muted);">
                        <strong style="color: var(--accent);">${escapeHtml(c.name)}</strong>
                        <span>${new Date(c.timestamp).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span>
                      </div>
                      <p style="color: var(--text-main); font-size: 0.95rem; line-height: 1.5; margin: 0;">${escapeHtml(c.comment)}</p>
                    </div>
                  `).join('');
                })
                .catch(() => {
                  const listEl = document.getElementById('commentsList');
                  if (listEl) listEl.innerHTML = `<p style="color: var(--accent); font-size: 0.9rem;">Gagal memuat komentar.</p>`;
                });
            };
            
            loadComments();
            
            // Handle Submit Form Komentar
            const commentForm = document.getElementById('commentForm');
            if (commentForm) {
              commentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const submitBtn = document.getElementById('submitCommentBtn');
                submitBtn.disabled = true;
                submitBtn.textContent = 'Mengirim...';
                
                const payload = {
                  postSlug: postSlug,
                  name: document.getElementById('commentName').value.trim(),
                  email: document.getElementById('commentEmail').value.trim(),
                  comment: document.getElementById('commentText').value.trim()
                };
                
                fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                  })
                  .then(res => res.json())
                  .then(res => {
                    if (res.status === 'success') {
                      showCustomAlert('Komentar berhasil dikirim!');
                      document.getElementById('commentText').value = '';
                      loadComments();
                    } else {
                      showCustomAlert('Gagal mengirim komentar.');
                    }
                  })
                  .catch(() => {
                    showCustomAlert('Terjadi kesalahan jaringan.');
                  })
                  .finally(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `Kirim Komentar <span class="material-icons">send</span>`;
                  });
              });
            }
            
            const paginationEl = document.getElementById('paginationContainer');
            if (paginationEl) paginationEl.style.display = 'none';
            return;
          } else {
            window.location.href = '404.html';
            return;
          }
        }

        let currentPage = 1;
        if (pagesQuery && pagesQuery.startsWith('preview-all-')) {
          const parsedPage = parseInt(pagesQuery.replace('preview-all-', ''), 10);
          if (!isNaN(parsedPage) && parsedPage > 0) {
            currentPage = parsedPage;
          }
        }

        let currentFilteredData = data;

        // Handle Search Query Parameter on load
        if (searchQuery) {
          const searchInput = document.getElementById('searchPost');
          if (searchInput) searchInput.value = searchQuery;
          const query = searchQuery.toLowerCase();
          currentFilteredData = data.filter(p => 
            p.title.toLowerCase().includes(query) || 
            p.labels.some(l => l.toLowerCase().includes(query))
          );
          if (currentFilteredData.length === 0) {
            window.location.href = '404.html';
            return;
          }
        }

        const itemsPerPage = 10;

        const renderListWithPagination = (items, page) => {
          const paginationEl = document.getElementById('paginationContainer');
          if (items.length === 0) {
            postContainer.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 2rem;">Tidak ada post ditemukan.</p>`;
            if (paginationEl) paginationEl.innerHTML = '';
            return;
          }

          const totalPages = Math.ceil(items.length / itemsPerPage);
          if (page > totalPages) page = totalPages;
          if (page < 1) page = 1;

          const start = (page - 1) * itemsPerPage;
          const end = start + itemsPerPage;
          const paginatedItems = items.slice(start, end);

          postContainer.innerHTML = paginatedItems.map(p => {
            const thumbEl = p.thumbnail 
              ? `<img src="${escapeHtml(p.thumbnail)}" alt="Thumbnail" class="archive-thumb">`
              : `<div class="archive-thumb-placeholder"><span class="material-icons" style="font-size: 2rem; color: var(--accent);">article</span></div>`;

            return `
              <div class="interactive-card" style="flex-direction: row; align-items: center; gap: 1.5rem; flex-wrap: wrap;">
                ${thumbEl}
                <div style="display: flex; flex-direction: column; gap: 0.5rem; flex: 1; min-width: 240px;">
                  <h3 style="font-family: var(--font-mono); color: var(--accent); font-size: 1.15rem;">${escapeHtml(p.title)}</h3>
                  <div style="display: flex; flex-wrap: wrap; gap: 1rem; color: var(--text-muted); font-size: 0.85rem;">
                    <span><span class="material-icons" style="font-size: 0.9rem; vertical-align: middle;">schedule</span> ${escapeHtml(p.date)}</span>
                    <span><span class="material-icons" style="font-size: 0.9rem; vertical-align: middle;">label</span> ${escapeHtml(p.labels.join(', '))}</span>
                  </div>
                  <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.5;">${escapeHtml((p.description || (p.blocks && p.blocks.find(b => b.type === 'text')?.content) || '').substring(0, 130))}...</p>
                  <a href="categories.html?post=${encodeURIComponent(p.slug)}" class="btn" style="align-self: flex-start; margin-top: 0.3rem;">Baca Selengkapnya <span class="material-icons">visibility</span></a>
                </div>
              </div>
            `;
          }).join('');

          if (paginationEl) {
            if (totalPages <= 1) {
              paginationEl.innerHTML = '';
            } else {
              let pagesHtml = '';
              
              pagesHtml += `<button class="pagination-btn" ${page === 1 ? 'disabled' : ''} onclick="window.changePage(${page - 1})" title="Sebelumnya"><span class="material-icons">chevron_left</span></button>`;

              const maxVisiblePages = 5;
              let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
              let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
              
              if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
              }

              if (startPage > 1) {
                pagesHtml += `<button class="pagination-btn" onclick="window.changePage(1)">1</button>`;
                if (startPage > 2) {
                  pagesHtml += `<span style="color: var(--text-muted); padding: 0.5rem;">...</span>`;
                }
              }

              for (let i = startPage; i <= endPage; i++) {
                pagesHtml += `<button class="pagination-btn ${i === page ? 'pagination-btn--active' : ''}" onclick="window.changePage(${i})">${i}</button>`;
              }

              if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                  pagesHtml += `<span style="color: var(--text-muted); padding: 0.5rem;">...</span>`;
                }
                pagesHtml += `<button class="pagination-btn" onclick="window.changePage(${totalPages})">${totalPages}</button>`;
              }

              pagesHtml += `<button class="pagination-btn" ${page === totalPages ? 'disabled' : ''} onclick="window.changePage(${page + 1})" title="Berikutnya"><span class="material-icons">chevron_right</span></button>`;

              paginationEl.innerHTML = pagesHtml;
            }
          }
        };

        window.changePage = (page) => {
          currentPage = page;
          const currentSearch = document.getElementById('searchPost')?.value.trim();
          let newUrl = `categories.html?pages=preview-all-${page}`;
          if (currentSearch) {
            newUrl += `&search=${encodeURIComponent(currentSearch)}`;
          }
          window.history.pushState({}, '', newUrl);
          const pageTitleEl = document.getElementById('pageTitle');
          if (pageTitleEl) pageTitleEl.textContent = `Arsip Post (Halaman ${page}) ー aRoCommand`;

          renderListWithPagination(currentFilteredData, currentPage);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        renderListWithPagination(currentFilteredData, currentPage);

        const searchInput = document.getElementById('searchPost');
        if (searchInput) {
          searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            currentFilteredData = data.filter(p => p.title.toLowerCase().includes(query) || p.labels.some(l => l.toLowerCase().includes(query)));
            
            if (query.length > 0) {
              window.history.pushState({}, '', `categories.html?search=${encodeURIComponent(query)}`);
            } else {
              window.history.pushState({}, '', `categories.html?pages=preview-all-1`);
            }

            if (currentFilteredData.length === 0 && query.length > 0) {
              window.location.href = '404.html';
              return;
            }

            currentPage = 1;
            renderListWithPagination(currentFilteredData, currentPage);
          });
        }
      })
      .catch(() => {
        postContainer.innerHTML = `<p style="text-align: center; color: var(--accent);">Gagal memuat basis data categories.json</p>`;
      });
  }
});

// --- PANEL KHUSUS POST.HTML ---

let currentBlocks = [];
let availableCategories = ['Frontend', 'Backend', 'JavaScript', 'Python', 'Security', 'Database', 'Horror-Lore', 'DevOps', 'HTML', 'CSS', 'JSON', 'Advanced'];
let selectedCategoriesSet = new Set();
const scriptLanguages = [
  { id: 'javascript', name: 'JavaScript' },
  { id: 'html', name: 'HTML' },
  { id: 'css', name: 'CSS' },
  { id: 'python', name: 'Python' },
  { id: 'json', name: 'JSON' },
  { id: 'php', name: 'PHP' },
  { id: 'bash', name: 'Bash' }
];

function initPostPanel() {
  if (currentBlocks.length === 0) {
    addScriptBlock();
  }
  setCurrentDateTimeInput();
  updateJsonPreviewData();
}

window.setCurrentDateTimeInput = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  const formatted = `${year}-${month}-${day}T${hours}:${minutes}`;
  const dateInput = document.getElementById('postCustomDate');
  if (dateInput) {
    dateInput.value = formatted;
    updateJsonPreviewData();
  }
};

window.openDatePickerModal = () => {
  let modal = document.getElementById('datePickerModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'datePickerModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-container" style="max-width:400px;">
        <div class="modal__header">
          <h3 class="modal__title"><span class="material-icons">event</span> Tanggal Manual</h3>
          <button class="modal__close" onclick="closeModal('datePickerModal')"><span class="material-icons">close</span></button>
        </div>
        <div class="modal__body" style="display:flex; flex-direction:column; gap:1rem;">
          <p style="font-size:0.85rem; color:var(--text-muted);">Pilih tanggal dan waktu spesifik Post:</p>
          <button type="button" class="btn" style="justify-content:center; background:var(--bg-card); border:1px solid var(--border); color:var(--text-main);" onclick="openWheelPickerModal()">
            <span class="material-icons">schedule</span> Setel Tanggal & Waktu
          </button>
          <div style="display:flex; gap:1rem; margin-top:0.5rem;">
            <button type="button" class="btn" style="flex:1; justify-content:center; background:var(--bg-card); border:1px solid var(--border);" onclick="setCurrentDateTimeInput(); closeModal('datePickerModal');">Otomatis</button>
            <button type="button" class="btn" style="flex:1; justify-content:center;" onclick="closeModal('datePickerModal')">Terapkan</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  modal.classList.add('modal-overlay--active');
};

window.openWheelPickerModal = () => {
  closeModal('datePickerModal');
  let modal = document.getElementById('wheelPickerModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'wheelPickerModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-container" style="max-width:420px;">
        <div class="modal__header">
          <h3 class="modal__title"><span class="material-icons">access_time</span> Set Manual</h3>
          <button class="modal__close" onclick="closeModal('wheelPickerModal')"><span class="material-icons">close</span></button>
        </div>
        <div class="modal__body" style="display:flex; flex-direction:column; gap:1rem; align-items:center;">
          <div class="wheel-picker-grid">
            <div class="wheel-col">
              <span class="wheel-lbl">Tgl</span>
              <button type="button" class="wheel-btn-ctrl" onclick="adjustWheel('day', 1)"><span class="material-icons">arrow_drop_up</span></button>
              <div id="wheelDayVal" class="wheel-val">01</div>
              <button type="button" class="wheel-btn-ctrl" onclick="adjustWheel('day', -1)"><span class="material-icons">arrow_drop_down</span></button>
            </div>
            <div class="wheel-col">
              <span class="wheel-lbl">Bln</span>
              <button type="button" class="wheel-btn-ctrl" onclick="adjustWheel('month', 1)"><span class="material-icons">arrow_drop_up</span></button>
              <div id="wheelMonthVal" class="wheel-val">10</div>
              <button type="button" class="wheel-btn-ctrl" onclick="adjustWheel('month', -1)"><span class="material-icons">arrow_drop_down</span></button>
            </div>
            <div class="wheel-col">
              <span class="wheel-lbl">Thn</span>
              <button type="button" class="wheel-btn-ctrl" onclick="adjustWheel('year', 1)"><span class="material-icons">arrow_drop_up</span></button>
              <div id="wheelYearVal" class="wheel-val">2026</div>
              <button type="button" class="wheel-btn-ctrl" onclick="adjustWheel('year', -1)"><span class="material-icons">arrow_drop_down</span></button>
            </div>
            <div class="wheel-sep">:</div>
            <div class="wheel-col">
              <span class="wheel-lbl">Jam</span>
              <button type="button" class="wheel-btn-ctrl" onclick="adjustWheel('hour', 1)"><span class="material-icons">arrow_drop_up</span></button>
              <div id="wheelHourVal" class="wheel-val">21</div>
              <button type="button" class="wheel-btn-ctrl" onclick="adjustWheel('hour', -1)"><span class="material-icons">arrow_drop_down</span></button>
            </div>
            <div class="wheel-col">
              <span class="wheel-lbl">Mnt</span>
              <button type="button" class="wheel-btn-ctrl" onclick="adjustWheel('minute', 1)"><span class="material-icons">arrow_drop_up</span></button>
              <div id="wheelMinuteVal" class="wheel-val">19</div>
              <button type="button" class="wheel-btn-ctrl" onclick="adjustWheel('minute', -1)"><span class="material-icons">arrow_drop_down</span></button>
            </div>
          </div>
          <div style="display:flex; gap:0.8rem; width:100%; margin-top:1rem;">
            <button type="button" class="btn" style="flex:1; justify-content:center; background:var(--bg-card); border:1px solid var(--border);" onclick="resetWheelTime()">Hapus</button>
            <button type="button" class="btn" style="flex:1; justify-content:center; background:var(--bg-card); border:1px solid var(--border);" onclick="closeModal('wheelPickerModal'); openDatePickerModal();">Batal</button>
            <button type="button" class="btn" style="flex:1; justify-content:center;" onclick="applyWheelPickerData()">Setel</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  initWheelValues();
  modal.classList.add('modal-overlay--active');
};

let wheelDateState = new Date();

function initWheelValues() {
  const dateInput = document.getElementById('postCustomDate');
  if (dateInput && dateInput.value) {
    wheelDateState = new Date(dateInput.value);
    if (isNaN(wheelDateState)) wheelDateState = new Date();
  } else {
    wheelDateState = new Date();
  }
  renderWheelDisplay();
}

function renderWheelDisplay() {
  document.getElementById('wheelDayVal').textContent = String(wheelDateState.getDate()).padStart(2, '0');
  document.getElementById('wheelMonthVal').textContent = String(wheelDateState.getMonth() + 1).padStart(2, '0');
  document.getElementById('wheelYearVal').textContent = wheelDateState.getFullYear();
  document.getElementById('wheelHourVal').textContent = String(wheelDateState.getHours()).padStart(2, '0');
  document.getElementById('wheelMinuteVal').textContent = String(wheelDateState.getMinutes()).padStart(2, '0');
}

window.adjustWheel = (type, amount) => {
  if (type === 'day') wheelDateState.setDate(wheelDateState.getDate() + amount);
  if (type === 'month') wheelDateState.setMonth(wheelDateState.getMonth() + amount);
  if (type === 'year') wheelDateState.setFullYear(wheelDateState.getFullYear() + amount);
  if (type === 'hour') wheelDateState.setHours(wheelDateState.getHours() + amount);
  if (type === 'minute') wheelDateState.setMinutes(wheelDateState.getMinutes() + amount);
  renderWheelDisplay();
};

window.resetWheelTime = () => {
  wheelDateState = new Date();
  renderWheelDisplay();
};

window.applyWheelPickerData = () => {
  const y = wheelDateState.getFullYear();
  const m = String(wheelDateState.getMonth() + 1).padStart(2, '0');
  const d = String(wheelDateState.getDate()).padStart(2, '0');
  const h = String(wheelDateState.getHours()).padStart(2, '0');
  const min = String(wheelDateState.getMinutes()).padStart(2, '0');
  
  const formatted = `${y}-${m}-${d}T${h}:${min}`;
  const dateInput = document.getElementById('postCustomDate');
  if (dateInput) {
    dateInput.value = formatted;
    updateJsonPreviewData();
  }
  closeModal('wheelPickerModal');
};

window.openLabelModal = () => {
  let modal = document.getElementById('labelModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'labelModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-container" style="max-width:450px;">
        <div class="modal__header">
          <h3 class="modal__title"><span class="material-icons">label</span> Pilih Label</h3>
          <button class="modal__close" onclick="closeModal('labelModal')"><span class="material-icons">close</span></button>
        </div>
        <div class="modal__body" style="display:flex; flex-direction:column; gap:0.8rem;">
          <p style="font-size:0.85rem; color:var(--text-muted);">Pilih satu atau beberapa Label:</p>
          <div id="labelCheckboxesContainer" style="display:flex; flex-direction:column; gap:0.5rem; max-height:200px; overflow-y:auto; padding:0.5rem; border:1px solid var(--border); border-radius:4px;">
            ${availableCategories.map(cat => `
              <label style="display:flex; align-items:center; gap:0.6rem; cursor:pointer; font-size:0.95rem;">
                <input type="checkbox" value="${cat}" ${selectedCategoriesSet.has(cat) ? 'checked' : ''} onchange="toggleCategorySelection('${cat}', this.checked)">
                ${cat}
              </label>
            `).join('')}
          </div>
          <button type="button" class="btn" style="justify-content:center; margin-top:0.5rem;" onclick="closeModal('labelModal')">Terapkan</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  modal.classList.add('modal-overlay--active');
};

window.toggleCategorySelection = (cat, isChecked) => {
  if (isChecked) {
    selectedCategoriesSet.add(cat);
  } else {
    selectedCategoriesSet.delete(cat);
  }
  updateLabelDisplayUI();
};

function updateLabelDisplayUI() {
  const displayEl = document.getElementById('labelPlaceholderText');
  const hiddenInput = document.getElementById('postLabels');
  const arr = Array.from(selectedCategoriesSet);
  
  if (arr.length > 0) {
    displayEl.innerHTML = arr.map(cat => `<span style="background:var(--bg-card); border:1px solid var(--border); padding:0.2rem 0.5rem; border-radius:4px; font-size:0.85rem; color:var(--accent); white-space:nowrap;">${cat}</span>`).join('');
    displayEl.style.overflowX = 'auto';
    displayEl.style.display = 'flex';
    displayEl.style.gap = '0.4rem';
    displayEl.style.alignItems = 'center';
    hiddenInput.value = arr.join(', ');
  } else {
    displayEl.innerHTML = '<span style="color:var(--text-muted);">Label</span>';
    displayEl.style.display = 'block';
    hiddenInput.value = '';
  }
  updateJsonPreviewData();
}

window.openScriptLangModal = (index) => {
  let modal = document.getElementById('scriptLangModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'scriptLangModal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }
  
  modal.innerHTML = `
    <div class="modal-container" style="max-width:380px;">
      <div class="modal__header">
        <h3 class="modal__title"><span class="material-icons">code</span> Pilih Input Script</h3>
        <button class="modal__close" onclick="closeModal('scriptLangModal')"><span class="material-icons">close</span></button>
      </div>
      <div class="modal__body" style="display:flex; flex-direction:column; gap:0.5rem;">
        ${scriptLanguages.map(lang => `
          <button type="button" class="btn" style="justify-content:space-between; background:var(--bg-card); border:1px solid var(--border); color:var(--text-main);" onclick="setScriptLang(${index}, '${lang.id}')">
            <span>${lang.name}</span>
            <span class="material-icons" style="font-size:1.1rem; color:var(--accent);">${currentBlocks[index].lang === lang.id ? 'radio_button_checked' : 'radio_button_unchecked'}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
  modal.classList.add('modal-overlay--active');
};

window.setScriptLang = (index, langId) => {
  currentBlocks[index].lang = langId;
  closeModal('scriptLangModal');
  renderDynamicBlocks();
  updateJsonPreviewData();
};

window.addScriptBlock = () => {
  currentBlocks.push({ type: 'script', lang: 'javascript', code: '' });
  renderDynamicBlocks();
};

window.addHtmlBlock = () => {
  currentBlocks.push({ type: 'html', content: '' });
  renderDynamicBlocks();
};

window.addTextBlock = () => {
  currentBlocks.push({ type: 'text', content: '' });
  renderDynamicBlocks();
};

window.addImageBlock = () => {
  currentBlocks.push({ type: 'image', url: '' });
  renderDynamicBlocks();
};

window.removeDynamicBlock = (index) => {
  currentBlocks.splice(index, 1);
  renderDynamicBlocks();
};

window.updateBlockData = (index, field, val) => {
  currentBlocks[index][field] = val;
  updateJsonPreviewData();
};

function renderDynamicBlocks() {
  const container = document.getElementById('dynamicContentContainer');
  if (!container) return;

  container.innerHTML = currentBlocks.map((b, idx) => {
    if (b.type === 'script') {
      const currentLangObj = scriptLanguages.find(l => l.id === b.lang) || scriptLanguages[0];
      return `
        <div class="interactive-card" style="padding:1rem;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-family:var(--font-mono); color:var(--accent); font-size:0.85rem;"><span class="material-icons" style="font-size:0.9rem; vertical-align:middle;">code</span> Blok Script #${idx + 1}</span>
            <div style="display:flex; gap:0.5rem; align-items:center;">
              <button type="button" class="btn" style="padding:0.3rem 0.8rem; font-size:0.8rem; background:var(--bg-secondary); border:1px solid var(--border); display:flex; align-items:center; gap:0.4rem;" onclick="openScriptLangModal(${idx})">
                <span>${currentLangObj.name}</span>
                <span class="material-icons" style="font-size:1rem;">arrow_drop_down</span>
              </button>
              <button type="button" class="btn" style="background:var(--accent); color:#fff; padding:0.2rem 0.4rem; font-size:0.8rem;" onclick="removeDynamicBlock(${idx})"><span class="material-icons" style="font-size:1rem;">delete</span></button>
            </div>
          </div>
          <textarea class="form-control" rows="5" placeholder="Tulis teks script..." oninput="updateBlockData(${idx}, 'code', this.value)">${escapeHtml(b.code)}</textarea>
        </div>
      `;
    } else if (b.type === 'html') {
      return `
        <div class="interactive-card" style="padding:1rem;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-family:var(--font-mono); color:var(--accent); font-size:0.85rem;"><span class="material-icons" style="font-size:0.9rem; vertical-align:middle;">html</span> Blok HTML #${idx + 1}</span>
            <button type="button" class="btn" style="background:var(--accent); color:#fff; padding:0.2rem 0.4rem; font-size:0.8rem;" onclick="removeDynamicBlock(${idx})"><span class="material-icons" style="font-size:1rem;">delete</span></button>
          </div>
          <textarea class="form-control" rows="3" placeholder="Tulis Script HTML (contoh: <a href=...>...</a>)..." oninput="updateBlockData(${idx}, 'content', this.value)">${escapeHtml(b.content)}</textarea>
        </div>
      `;
    } else if (b.type === 'image') {
      return `
        <div class="interactive-card" style="padding:1rem;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-family:var(--font-mono); color:var(--accent); font-size:0.85rem;"><span class="material-icons" style="font-size:0.9rem; vertical-align:middle;">image</span> Blok Gambar #${idx + 1}</span>
            <button type="button" class="btn" style="background:var(--accent); color:#fff; padding:0.2rem 0.4rem; font-size:0.8rem;" onclick="removeDynamicBlock(${idx})"><span class="material-icons" style="font-size:1rem;">delete</span></button>
          </div>
          <input type="text" class="form-control" placeholder="(URL atau Base64)" value="${escapeHtml(b.url || '')}" oninput="updateBlockData(${idx}, 'url', this.value)">
        </div>
      `;
    } else {
      return `
        <div class="interactive-card" style="padding:1rem;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-family:var(--font-mono); color:var(--accent); font-size:0.85rem;"><span class="material-icons" style="font-size:0.9rem; vertical-align:middle;">text_fields</span> Blok Teks #${idx + 1}</span>
            <button type="button" class="btn" style="background:var(--accent); color:#fff; padding:0.2rem 0.4rem; font-size:0.8rem;" onclick="removeDynamicBlock(${idx})"><span class="material-icons" style="font-size:1rem;">delete</span></button>
          </div>
          <textarea class="form-control" rows="3" placeholder="Tulis teks biasa..." oninput="updateBlockData(${idx}, 'content', this.value)">${escapeHtml(b.content)}</textarea>
        </div>
      `;
    }
  }).join('');
  updateJsonPreviewData();
}

function updateJsonPreviewData() {
  const title = document.getElementById('postTitle')?.value || 'Judul Post';
  const author = document.getElementById('postAuthor')?.value || 'aRo';
  const thumbnail = document.getElementById('postThumbnail')?.value || '';
  const labels = Array.from(selectedCategoriesSet);
  const quote = document.getElementById('postQuote')?.value || '';
  
  const dateInputVal = document.getElementById('postCustomDate')?.value;
  let d = dateInputVal ? new Date(dateInputVal) : new Date();
  if (isNaN(d)) d = new Date();

  const options = { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
  const dateStr = d.toLocaleDateString('id-ID', options) + ' WIB';

  const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const dayStr = String(d.getDate()).padStart(2, '0');
  const monthStr = String(d.getMonth() + 1).padStart(2, '0');
  const yearStr = String(d.getFullYear()).slice(-2);
  const hourStr = String(d.getHours()).padStart(2, '0');
  const minStr = String(d.getMinutes()).padStart(2, '0');
  const slug = `${baseSlug}--${dayStr}-${monthStr}-${yearStr}--${hourStr}-${minStr}wib`;

  const newPostObj = {
    slug,
    title,
    thumbnail,
    author,
    date: dateStr,
    labels: labels.length > 0 ? labels : ['Umum'],
    blocks: currentBlocks,
    quote
  };

  fetch('categories.json')
    .then(res => res.json())
    .then(existingData => {
      const combined = [newPostObj, ...existingData];
      const previewEl = document.getElementById('jsonPreview');
      if (previewEl) {
        previewEl.value = JSON.stringify(combined, null, 2);
      }
    })
    .catch(() => {
      const previewEl = document.getElementById('jsonPreview');
      if (previewEl) {
        previewEl.value = JSON.stringify([newPostObj], null, 2);
      }
    });
}

window.handleSavePost = (e) => {
  e.preventDefault();
  const title = document.getElementById('postTitle').value;
  if (!title) {
    showCustomAlert('Judul post wajib diisi!');
    return;
  }
  if (selectedCategoriesSet.size === 0) {
    showCustomAlert('Pilih minimal satu kategori melalui menu pilihan label!');
    return;
  }

  const jsonText = document.getElementById('jsonPreview').value;
  
  const blob = new Blob([jsonText], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'categories.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showCustomAlert('Arsip berhasil dibuat! File pembaruan `categories.json` telah diunduh otomatis. Unggah file tersebut ke direktori utama website Anda.');
};

window.copyJsonPreview = () => {
  const preview = document.getElementById('jsonPreview');
  preview.select();
  navigator.clipboard.writeText(preview.value);
  showCustomAlert('Kode JSON berhasil disalin ke clipboard!');
};

window.downloadJsonFile = () => {
  const jsonText = document.getElementById('jsonPreview').value;
  const blob = new Blob([jsonText], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'categories.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

window.copyCodeBlock = (elementId) => {
  const codeEl = document.getElementById(elementId);
  if (codeEl) {
    navigator.clipboard.writeText(codeEl.textContent);
    showCustomAlert('Kode berhasil disalin ke clipboard!');
  }
};

window.showCustomAlert = (message) => {
  let alertModal = document.getElementById('customAlertModal');
  if (!alertModal) {
    alertModal = document.createElement('div');
    alertModal.id = 'customAlertModal';
    alertModal.className = 'modal-overlay';
    alertModal.innerHTML = `
      <div class="modal-container" style="max-width:380px; text-align:center;">
        <div class="modal__header" style="justify-content:center;">
          <h3 class="modal__title"><span class="material-icons" style="color:var(--accent);">info</span> Informasi Sistem</h3>
        </div>
        <div class="modal__body" style="display:flex; flex-direction:column; gap:1rem; align-items:center;">
          <p id="customAlertMessage" style="line-height:1.5; color:var(--text-main);"></p>
          <button class="btn" style="justify-content:center; width:100%;" onclick="closeModal('customAlertModal')">Mengerti</button>
        </div>
      </div>
    `;
    document.body.appendChild(alertModal);
  }
  document.getElementById('customAlertMessage').textContent = message;
  alertModal.classList.add('modal-overlay--active');
};

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// live preview post
function updateLivePreview() {
  const title = document.getElementById('postTitle')?.value || 'Judul Postingan';
  const author = document.getElementById('postAuthor')?.value || 'aRo';
  const dateVal = document.getElementById('postCustomDate')?.value;
  const thumbnail = document.getElementById('postThumbnail')?.value || '';
  const quote = document.getElementById('postQuote')?.value || '';
  
  document.getElementById('prevTitle').textContent = title;
  document.getElementById('prevAuthor').textContent = author;
  
  if (dateVal) {
    try {
      const d = new Date(dateVal);
      document.getElementById('prevDate').textContent = isNaN(d) ? dateVal : d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) + ' WIB';
    } catch (e) {
      document.getElementById('prevDate').textContent = dateVal;
    }
  } else {
    document.getElementById('prevDate').textContent = '-';
  }
  
  // Thumbnail Handler
  const thumbWrapper = document.getElementById('prevThumbnailWrapper');
  const thumbImg = document.getElementById('prevThumbnailImg');
  if (thumbnail && thumbnail.trim() !== '') {
    thumbImg.src = thumbnail;
    thumbWrapper.style.display = 'block';
  } else {
    thumbWrapper.style.display = 'none';
  }
  
  // Label Handler
  const prevLabels = document.getElementById('prevLabels');
  if (typeof selectedCategoriesSet !== 'undefined' && selectedCategoriesSet.size > 0) {
    prevLabels.innerHTML = Array.from(selectedCategoriesSet).map(cat =>
      `<span style="background:var(--bg-secondary); border:1px solid var(--border); padding:0.1rem 0.4rem; border-radius:4px; font-size:0.75rem; color:var(--accent);">${cat}</span>`
    ).join('');
  } else {
    prevLabels.innerHTML = '<span style="font-size:0.75rem; color:var(--text-muted);">Umum</span>';
  }
  
  // Blok Konten Handler
  const prevBlocks = document.getElementById('prevBlocks');
  if (typeof currentBlocks !== 'undefined' && currentBlocks.length > 0) {
    prevBlocks.innerHTML = currentBlocks.map((b) => {
      if (b.type === 'script') {
        return `<div style="background:var(--bg-secondary); border:1px solid var(--border); padding:0.6rem; border-radius:4px; font-family:var(--font-mono); font-size:0.85rem; white-space:pre-wrap; overflow-x:auto;"><span style="color:var(--accent); font-size:0.75rem; display:block; margin-bottom:0.2rem;">[Script: ${b.lang || 'javascript'}]</span>${b.code ? escapeHtmlCustom(b.code) : '<span style="color:var(--text-muted); font-style:italic;">(Kosong)</span>'}</div>`;
      } else if (b.type === 'html') {
        // Blok HTML merender tag HTML secara aktif
        return `<div style="word-break:break-word;">${b.content ? b.content : '<span style="color:var(--text-muted); font-style:italic;">(Blok HTML kosong)</span>'}</div>`;
      } else if (b.type === 'image') {
        return b.url ? `<div style="border-radius:4px; overflow:hidden; max-height:160px;"><img src="${b.url}" style="width:100%; object-fit:cover;" onerror="this.style.display='none'"></div>` : `<div style="color:var(--text-muted); font-size:0.85rem; font-style:italic;">[Blok Gambar kosong]</div>`;
      } else {
        // Blok Teks murni menampilkan teks biasa dengan aman
        return `<div style="word-break:break-word; white-space:pre-wrap;">${b.content ? escapeHtmlCustom(b.content) : '<span style="color:var(--text-muted); font-style:italic;">(Blok Teks kosong)</span>'}</div>`;
      }
    }).join('');
  } else {
    prevBlocks.innerHTML = '<span style="color:var(--text-muted); font-style:italic;">Belum ada konten blok...</span>';
  }
  
  // Disclaimer / Quote Handler
  const quoteWrapper = document.getElementById('prevQuoteWrapper');
  const quoteText = document.getElementById('prevQuoteText');
  if (quote && quote.trim() !== '') {
    quoteText.textContent = quote;
    quoteWrapper.style.display = 'block';
  } else {
    quoteWrapper.style.display = 'none';
  }
}

function escapeHtmlCustom(text) {
  if (!text) return '';
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Menggabungkan sinkronisasi dengan fungsi update di fitur.js secara mulus
window.addEventListener('DOMContentLoaded', () => {
  const originalUpdate = window.updateJsonPreviewData;
  if (typeof originalUpdate === 'function') {
    window.updateJsonPreviewData = function() {
      originalUpdate.apply(this, arguments);
      updateLivePreview();
    };
  }
  document.addEventListener('input', updateLivePreview);
  document.addEventListener('change', updateLivePreview);
  setTimeout(updateLivePreview, 400);
});
