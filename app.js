// ============================================================
// ONAFBU - Dynamic Lazy-Loading Architecture (Redesign Edition)
// ============================================================

let watchedVideos = {};
let currentCourseId = null;
let currentPlayingId = null;
let hlsInstance = null;
let studyChartInstance = null;
let currentViewMode = 'list';
let loadedCourses = {}; // Cache: { courseId: { videos, pdfs } }

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  loadAllProgress();
  renderDashboard();
  initTextRotator();

  // ===== TEXT ROTATOR =====
  function initTextRotator() {
    const slides = document.querySelectorAll('.hero-slide');
    if (slides.length === 0) return;
    let currentIndex = 0;
    setInterval(() => {
      slides[currentIndex].classList.remove('active');
      currentIndex = (currentIndex + 1) % slides.length;
      slides[currentIndex].classList.add('active');
    }, 4000);
  }

  // Scroll spy for navbar
  window.addEventListener('scroll', handleScroll);
});

// ===== THEME TOGGLE (DISABLED) =====
// Functions permanently removed to enforce Dark Mode

function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
}

function handleScroll() {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
      navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
    } else {
      navbar.style.boxShadow = 'none';
    }
  
    if (typeof previousView !== 'undefined' && previousView === 'allCourses') {
      const navLinks = document.querySelectorAll('.nav-link, .mobile-menu a');
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('onclick') && link.getAttribute('onclick').includes('showAllCoursesView')) {
          link.classList.add('active');
        }
      });
      return;
    }

  // Scrollspy logic
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.nav-link, .mobile-menu a');
  let current = '';

  sections.forEach(section => {
    // Ignore hidden sections or sections without an ID
    if (section.offsetParent !== null && section.getAttribute('id')) {
      const sectionTop = section.offsetTop;
      if (window.scrollY >= sectionTop - 150) {
        current = section.getAttribute('id');
      }
    }
  });

  if (current) {
    navLinks.forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href') || '';
      const onclick = link.getAttribute('onclick') || '';
      
      if (href.includes(current)) {
        link.classList.add('active');
      } else if (current === 'courses-section' && onclick.includes('showAllCoursesView')) {
        link.classList.add('active');
      }
    });

    // Dynamic Background Orbs Logic
    const orb1 = document.querySelector('.orb-1');
    const orb2 = document.querySelector('.orb-2');
    const orb3 = document.querySelector('.orb-3');
    
    if (orb1 && orb2 && orb3) {
      if (current === 'hero') {
        orb1.style.background = 'rgba(249, 205, 5, 0.4)'; // Yellow
        orb2.style.background = 'rgba(236, 72, 153, 0.3)'; // Pink
        orb3.style.background = 'rgba(139, 92, 246, 0.3)'; // Purple
      } else if (current === 'courses-section') {
        orb1.style.background = 'rgba(236, 72, 153, 0.4)'; // Pink
        orb2.style.background = 'rgba(139, 92, 246, 0.3)'; // Purple
        orb3.style.background = 'rgba(249, 205, 5, 0.3)'; // Yellow
      } else if (current === 'features') {
        orb1.style.background = 'rgba(139, 92, 246, 0.4)'; // Purple
        orb2.style.background = 'rgba(249, 205, 5, 0.3)'; // Yellow
        orb3.style.background = 'rgba(236, 72, 153, 0.3)'; // Pink
      } else if (current === 'about' || current === 'faq') {
        orb1.style.background = 'rgba(15, 23, 42, 0.6)'; // Deep Navy
        orb2.style.background = 'rgba(249, 205, 5, 0.2)'; // Faint Yellow
        orb3.style.background = 'rgba(139, 92, 246, 0.2)'; // Faint Purple
      }
    }
  }
}

// ===== PROGRESS =====
function loadAllProgress() {
  try {
    Object.keys(courseIndex).forEach(courseId => {
      const saved = localStorage.getItem(`onafbu_watched_${courseId}`);
      if (saved) watchedVideos[courseId] = new Set(JSON.parse(saved));
      else watchedVideos[courseId] = new Set();
    });
  } catch(e) {
    console.warn("localStorage is unavailable.", e);
  }
  renderIntensityGrid();
}

function saveProgress(courseId) {
  if (watchedVideos[courseId]) {
    try {
      localStorage.setItem(`onafbu_watched_${courseId}`, JSON.stringify([...watchedVideos[courseId]]));
    } catch(e) {
      console.warn("localStorage is unavailable.", e);
    }
    renderIntensityGrid();
  }
}

// ===== DYNAMIC SCRIPT LOADER =====
function loadCourseData(courseId) {
  return new Promise((resolve, reject) => {
    if (loadedCourses[courseId]) {
      resolve(loadedCourses[courseId]);
      return;
    }

    const meta = courseIndex[courseId];
    if (!meta || !meta.file) {
      reject(new Error('Course not found: ' + courseId));
      return;
    }

    const script = document.createElement('script');
    script.src = meta.file;
    script.onload = () => {
      const dataKey = 'courseData_' + courseId;
      if (window[dataKey]) {
        loadedCourses[courseId] = window[dataKey];
        resolve(window[dataKey]);
      } else {
        reject(new Error('Course data variable not found: ' + dataKey));
      }
    };
    script.onerror = () => reject(new Error('Failed to load: ' + meta.file));
    document.head.appendChild(script);
  });
}

// ===== ROUTING & VIEWS =====
let previousView = 'landing';

window.showLandingView = function() {
  previousView = 'landing';
  document.getElementById('courseView').classList.add('hidden');
  document.getElementById('allCoursesView').classList.add('hidden');
  document.getElementById('landingView').classList.remove('hidden');
  window.scrollTo(0, 0);
};

window.showAllCoursesView = function() {
  previousView = 'allCourses';
  document.getElementById('courseView').classList.add('hidden');
  document.getElementById('landingView').classList.add('hidden');
  document.getElementById('allCoursesView').classList.remove('hidden');
  window.scrollTo(0, 0);
  renderAllCourses();
};

// ===== DASHBOARD (COURSES SECTION) =====
function renderDashboard() {
  const grid = document.getElementById('featuredCourseGrid');
  if (!grid) return;
  let html = '';
  const keys = Object.keys(courseIndex).slice(0, 4); // Only top 4

  keys.forEach(courseId => {
    const course = courseIndex[courseId];
    html += generateCourseCardHtml(courseId, course);
  });
  grid.innerHTML = html;
}

let activeCategoryFilter = 'All';

window.setCategoryFilter = function(category, btnElement) {
  activeCategoryFilter = category;
  document.querySelectorAll('.filter-chip').forEach(btn => btn.classList.remove('active'));
  btnElement.classList.add('active');
  renderAllCourses();
}

window.filterAllCourses = function() {
  renderAllCourses(document.getElementById('allCourseSearchInput').value);
}

function renderAllCourses(filterText = '') {
  const grid = document.getElementById('allCourseGrid');
  if (!grid) return;
  let html = '';
  const lowerFilter = filterText.toLowerCase();

  Object.keys(courseIndex).forEach(courseId => {
    const course = courseIndex[courseId];
    
    // Search Filter
    if (filterText && !course.title.toLowerCase().includes(lowerFilter) && !course.teacher.toLowerCase().includes(lowerFilter)) {
      return;
    }
    
    // Category Filter (Mock implementation since we don't have categories in DB yet)
    // If we had categories, we'd do: if (activeCategoryFilter !== 'All' && course.category !== activeCategoryFilter) return;

    html += generateCourseCardHtml(courseId, course);
  });
  
  if (!html) html = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-muted);">No courses found.</div>';
  grid.innerHTML = html;
}

function generateCourseCardHtml(courseId, course) {
  const totalClasses = course.videosCount || 0;
  const totalWatched = watchedVideos[courseId] ? watchedVideos[courseId].size : 0;
  
  return `
    <div class="course-card paper-panel glow-card" onclick="openCourse('${courseId}')">
      <div class="course-icon-wrapper" style="color: ${course.color};">
        <i class="${course.icon}"></i>
      </div>
      <div class="course-info" style="flex:1;">
        <h3>${course.title}</h3>
        <p>${course.teacher}</p>
        <div class="capsule-container">
          <span class="capsule pace">${totalWatched}/${totalClasses} classes completed</span>
        </div>
      </div>
    </div>
  `;
}

// ===== COURSE DETAILED VIEW =====
window.openCourse = async function(courseId) {
  // Note: previousView is set by showLandingView or showAllCoursesView
  currentCourseId = courseId;

  if (!watchedVideos[courseId]) watchedVideos[courseId] = new Set();

  // Hide landing view, show course view
  document.getElementById('landingView').classList.add('hidden');
  document.getElementById('allCoursesView').classList.add('hidden');
  document.getElementById('courseView').classList.remove('hidden');
  window.scrollTo(0, 0);

  document.getElementById('timelineList').innerHTML = '<div style="color: var(--text-muted); padding: 40px; text-align:center;"><i class="ri-loader-4-line" style="animation: spin 1s linear infinite; display:inline-block; font-size: 2rem;"></i><br>Loading course data...</div>';

  try {
    await loadCourseData(courseId);
  } catch (e) {
    console.error(e);
    document.getElementById('timelineList').innerHTML = '<div style="color: #ef4444; padding: 20px; text-align:center;">Error loading course data.</div>';
    return;
  }

  const meta = courseIndex[courseId];
  document.getElementById('courseTitle').textContent = meta.title;

  renderTimeline();
  updateProgressStats();

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.value = '';
    searchInput.oninput = (e) => renderTimeline(e.target.value);
  }
};

window.goHomeFromLogo = function() {
  currentCourseId = null;
  showLandingView();
  window.scrollTo(0,0);
};

window.goHome = function() {
  currentCourseId = null;
  if (previousView === 'allCourses') {
    showAllCoursesView();
  } else {
    showLandingView();
  }
};

function updateProgressStats() {
  if (!currentCourseId) return;
  const set = watchedVideos[currentCourseId];
  document.getElementById('completedCount').textContent = set ? set.size : 0;
}

// ===== TIMELINE =====
function renderTimeline(filterText = '') {
  if (!currentCourseId || !loadedCourses[currentCourseId]) return;
  const course = loadedCourses[currentCourseId];
  const list = document.getElementById('timelineList');
  let html = '';
  const lowerFilter = (filterText || '').toLowerCase();

  course.videos.forEach((v, index) => {
    const titleStr = cleanTitle(v.title);
    if (lowerFilter && !titleStr.toLowerCase().includes(lowerFilter)) return;

    const isWatched = watchedVideos[currentCourseId] && watchedVideos[currentCourseId].has(index);
    const watchedClass = isWatched ? 'watched completed-shine' : '';

    html += `
      <div class="class-item paper-panel ${watchedClass}" onclick="openPlayer(${index})" ondblclick="unmarkWatched(${index}, event)">
        <div class="class-thumb">
          <i class="ri-play-circle-fill"></i>
        </div>
        <div class="class-details">
          <span class="class-title-text">${titleStr}</span>
        </div>
      </div>
    `;
  });

  if (!html) html = '<div style="color: var(--text-muted); padding: 20px; text-align:center;">No videos found.</div>';
  list.innerHTML = html;
}

// ===== VIEW TOGGLE =====
window.setViewMode = function(mode) {
  currentViewMode = mode;
  const listBtn = document.getElementById('listViewBtn');
  const gridBtn = document.getElementById('gridViewBtn');
  if (listBtn) listBtn.classList.toggle('active-view', mode === 'list');
  if (gridBtn) gridBtn.classList.toggle('active-view', mode === 'grid');
  
  const list = document.getElementById('timelineList');
  if (mode === 'grid') list.classList.add('grid-view');
  else list.classList.remove('grid-view');
};

// ===== PLAYER =====
window.openPlayer = function(videoId) {
  if (!loadedCourses[currentCourseId]) return;
  currentPlayingId = videoId;
  const course = loadedCourses[currentCourseId];
  const video = course.videos[videoId];
  if (!video) return;

  const type = (video.url.includes('youtube.com') || video.url.includes('youtu.be')) ? 'youtube' : 'hls';

  if (!watchedVideos[currentCourseId]) watchedVideos[currentCourseId] = new Set();
  const set = watchedVideos[currentCourseId];
  if (!set.has(videoId)) {
    set.add(videoId);
    logStudyActivity(currentCourseId, cleanTitle(video.title));
    saveProgress(currentCourseId);
    renderTimeline();
    updateProgressStats();
  }

  document.getElementById('playerView').classList.remove('hidden');
  document.getElementById('nowPlayingTitle').textContent = cleanTitle(video.title);
  const macTitle = document.getElementById('macTitle');
  if (macTitle) macTitle.textContent = cleanTitle(video.title);

  updateMarkWatchedBtn();
  loadVideoSource(video.url, type);
};

window.closePlayer = function() {
  if (hlsInstance) { hlsInstance.destroy(); hlsInstance = null; }
  const videoEl = document.getElementById('videoElement');
  if(videoEl) {
    videoEl.pause();
    videoEl.removeAttribute('src');
    videoEl.load();
  }

  const ytContainer = document.getElementById('youtubeContainer');
  if(ytContainer) {
    ytContainer.innerHTML = '';
    ytContainer.classList.add('hidden');
  }

  document.getElementById('playerView').classList.add('hidden');
  const searchInput = document.getElementById('searchInput');
  renderTimeline(searchInput ? searchInput.value : '');
  updateProgressStats();
};

function loadVideoSource(url, type) {
  const videoEl = document.getElementById('videoElement');
  const ytContainer = document.getElementById('youtubeContainer');
  const qualityDiv = document.getElementById('qualitySelector');

  if (hlsInstance) { hlsInstance.destroy(); hlsInstance = null; }
  videoEl.pause();
  videoEl.removeAttribute('src');
  ytContainer.innerHTML = '';

  if (type === 'youtube') {
    videoEl.classList.add('hidden');
    qualityDiv.classList.add('hidden');
    ytContainer.classList.remove('hidden');
    const embedUrl = url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/");
    ytContainer.innerHTML = `<iframe width="100%" height="100%" src="${embedUrl}?autoplay=1&rel=0" frameborder="0" allowfullscreen></iframe>`;
  } else {
    ytContainer.classList.add('hidden');
    videoEl.classList.remove('hidden');
    qualityDiv.classList.remove('hidden');

    if (Hls.isSupported()) {
      hlsInstance = new Hls();
      hlsInstance.loadSource(url);
      hlsInstance.attachMedia(videoEl);
      hlsInstance.on(Hls.Events.MANIFEST_PARSED, function(event, data) {
        videoEl.play();
        const selector = document.getElementById('nativeQualitySelector');
        selector.innerHTML = '<option value="-1">Auto</option>';
        data.levels.forEach((level, i) => {
          selector.innerHTML += `<option value="${i}">${level.height}p</option>`;
        });
      });
    } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      videoEl.src = url;
      videoEl.addEventListener('loadedmetadata', function() { videoEl.play(); });
      qualityDiv.classList.add('hidden');
    }
  }
}

window.setQuality = function(level) {
  if (hlsInstance) hlsInstance.currentLevel = level;
};

window.setSpeed = function(rate) {
  const videoEl = document.getElementById('videoElement');
  if (videoEl) videoEl.playbackRate = rate;
};

document.getElementById('prevBtn').onclick = () => {
  if (currentPlayingId > 0) openPlayer(currentPlayingId - 1);
};
document.getElementById('nextBtn').onclick = () => {
  if (!currentCourseId || !loadedCourses[currentCourseId]) return;
  const max = loadedCourses[currentCourseId].videos.length - 1;
  if (currentPlayingId < max) openPlayer(currentPlayingId + 1);
};
window.unmarkWatched = function(videoId, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  if (!watchedVideos[currentCourseId]) return;
  watchedVideos[currentCourseId].delete(videoId);
  saveProgress(currentCourseId);
  renderTimeline();
  updateProgressStats();
};

document.getElementById('markWatchedBtn').onclick = () => {
    if (!watchedVideos[currentCourseId]) watchedVideos[currentCourseId] = new Set();
    const set = watchedVideos[currentCourseId];
    if (set.has(currentPlayingId)) {
      set.delete(currentPlayingId);
    } else {
      set.add(currentPlayingId);
      const videoTitle = loadedCourses[currentCourseId].videos[currentPlayingId].title;
      logStudyActivity(currentCourseId, cleanTitle(videoTitle));
    }
    saveProgress(currentCourseId);
    updateMarkWatchedBtn();
    renderTimeline();
    updateProgressStats();
  };

function updateMarkWatchedBtn() {
  const btn = document.getElementById('markWatchedBtn');
  const isWatched = watchedVideos[currentCourseId] && watchedVideos[currentCourseId].has(currentPlayingId);
  if (isWatched) {
    btn.classList.add('watched');
    btn.innerHTML = `<i class="ri-check-double-line"></i> Completed`;
  } else {
    btn.classList.remove('watched');
    btn.innerHTML = `<i class="ri-check-line"></i> Mark Done`;
  }
}

function cleanTitle(title) {
  if (!title) return 'Untitled';
  let cleaned = title.replace(/[\uFFFD]+/g, '');
  cleaned = cleaned.replace(/\s+[a-zA-Z0-9_\-]{30,}.*$/, '');
  cleaned = cleaned.replace(/https?:\/\/\S+/g, '');
  cleaned = cleaned.replace(/\s+[0-9a-f]{20,}$/i, '');
  cleaned = cleaned.replace(/\s*bcov_auth=.*/i, '');
  cleaned = cleaned.replace(/\s*eyJ[A-Za-z0-9_\-]+.*/g, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/[|\-\s]+$/, '').trim();
  return cleaned || 'Untitled';
}

// ===== PDFs =====
window.showCoursePdfs = function() {
  if (!currentCourseId) return;
  document.getElementById('pdfModal').classList.remove('hidden');
  renderCurrentCoursePdfs();
};
window.closePdfs = function() {
  document.getElementById('pdfModal').classList.add('hidden');
};

// ===== SUPABASE AUTH =====
var SUPABASE_URL = 'https://uvjsmwluxvjpkfwwckwk.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2anNtd2x1eHZqcGtmd3dja3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNDc2MDEsImV4cCI6MjA5NTYyMzYwMX0.pw1lDFAscayEIi7m9Uf59KhgcobQU0yGALx3UI33xrE';

var supabase = null;
function getSupabase() {
  if (supabase) return supabase;
  try {
    if (window.supabase && window.supabase.createClient) {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
  } catch (e) {
    console.error('Supabase init failed:', e);
  }
  return supabase;
}

// Initial eager attempt
getSupabase();

function updateAuthUI(user) {
  var authPanelUI = document.getElementById('authPanelUI');
  var userProfileUI = document.getElementById('userProfileUI');
  var emailDisplay = document.getElementById('userEmailDisplay');
  if (!authPanelUI || !userProfileUI) return;
  if (user) {
    authPanelUI.style.display = 'none';
    userProfileUI.style.display = 'flex';
    if (emailDisplay) emailDisplay.innerText = user.email || 'Welcome!';
  } else {
    authPanelUI.style.display = 'flex';
    userProfileUI.style.display = 'none';
  }
}

if (supabase) {
  supabase.auth.getSession().then(function(res) {
    var session = res.data.session;
    updateAuthUI(session ? session.user : null);
  });
  supabase.auth.onAuthStateChange(function(_event, session) {
    updateAuthUI(session ? session.user : null);
  });
}

window.handleEmailSignUp = async function() {
  var client = getSupabase();
  if (!client) { alert('Auth not ready. Please check your internet connection.'); return; }
  var email = document.getElementById('authEmail').value;
  var password = document.getElementById('authPassword').value;
  var err = document.getElementById('authErrorMsg');
  var suc = document.getElementById('authSuccessMsg');
  err.style.display = 'none'; suc.style.display = 'none';
  if (!email || !password) { err.innerText = 'Please enter email and password.'; err.style.display = 'block'; return; }
  document.getElementById('authSignUpBtn').innerText = 'Signing up...';
  var result = await client.auth.signUp({ email: email, password: password });
  document.getElementById('authSignUpBtn').innerText = 'Sign Up';
  if (result.error) { err.innerText = result.error.message; err.style.display = 'block'; }
  else { suc.innerText = 'Account created! Check your email or sign in.'; suc.style.display = 'block'; }
};

window.handleEmailSignIn = async function() {
  var client = getSupabase();
  if (!client) { alert('Auth not ready. Please check your internet connection.'); return; }
  var email = document.getElementById('authEmail').value;
  var password = document.getElementById('authPassword').value;
  var err = document.getElementById('authErrorMsg');
  err.style.display = 'none'; document.getElementById('authSuccessMsg').style.display = 'none';
  if (!email || !password) { err.innerText = 'Please enter email and password.'; err.style.display = 'block'; return; }
  document.getElementById('authSignInBtn').innerText = 'Connecting...';
  var result = await client.auth.signInWithPassword({ email: email, password: password });
  document.getElementById('authSignInBtn').innerText = 'Sign In';
  if (result.error) { err.innerText = result.error.message; err.style.display = 'block'; }
};

window.handleGoogleLogin = async function() {
  var client = getSupabase();
  if (!client) { alert('Auth not ready. Please check your internet connection and disable adblockers.'); return; }
  var err = document.getElementById('authErrorMsg');
  err.style.display = 'none';
  var origin = window.location.origin;
  var redirectTo = (origin && origin !== 'null' && !origin.startsWith('file')) ? origin : window.location.href.split('/').slice(0,3).join('/');
  var result = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectTo } });
  if (result.error) { err.innerText = result.error.message; err.style.display = 'block'; }
};

window.handleSignOut = async function() {
  var client = getSupabase();
  if (!client) return;
  await client.auth.signOut();
};

function renderCurrentCoursePdfs() {
  const container = document.getElementById('pdfContainer');
  const course = loadedCourses[currentCourseId];
  let html = '';

  if (course && course.pdfs && course.pdfs.length > 0) {
    html += '<div class="pdf-category"><div class="pdf-list">';
    course.pdfs.forEach(pdf => {
      html += `
        <a href="${pdf.url}" target="_blank" class="pdf-card">
          <i class="ri-file-pdf-line"></i>
          <span class="pdf-title">${cleanTitle(pdf.title)}</span>
        </a>
      `;
    });
    html += '</div></div>';
  } else {
    html = '<p style="text-align:center; margin-top: 40px; color: var(--text-muted);">No study materials available for this course.</p>';
  }
  container.innerHTML = html;
}

// ===== STUDY HUB LOGIC (Intensity Grid & Logs) =====
window.getStudyLogs = function() {
  try {
    const logs = localStorage.getItem('onafbu_study_logs');
    return logs ? JSON.parse(logs) : {};
  } catch(e) {
    return {};
  }
};

window.saveStudyLogs = function(logs) {
  try {
    localStorage.setItem('onafbu_study_logs', JSON.stringify(logs));
  } catch(e) {}
  renderIntensityGrid();
};

window.logStudyActivity = function(courseId, videoTitle) {
  const logs = getStudyLogs();
  const dateStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
  if (!logs[dateStr]) logs[dateStr] = [];
  
  const courseTitle = courseIndex[courseId] ? courseIndex[courseId].title : 'Course';
  logs[dateStr].push(`${courseTitle}: ${videoTitle}`);
  saveStudyLogs(logs);
};

window.renderIntensityGrid = function() {
  const grid = document.getElementById('intensityGrid');
  if (!grid) return;
  
  const logs = getStudyLogs();
  const today = new Date();
  const daysToRender = 150; // Dense graph data
  let html = '';
  
  for (let i = daysToRender - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toLocaleDateString('en-CA');
    
    const count = logs[dateStr] ? logs[dateStr].length : 0;
    let level = 0;
    if (count > 0 && count <= 2) level = 1;
    else if (count > 2 && count <= 4) level = 2;
    else if (count > 4 && count <= 6) level = 3;
    else if (count > 6) level = 4;
    
    // Study log removed per user request
    html += `<div class="grid-square level-${level}" title="${dateStr}: ${count} classes"></div>`;
  }
  grid.innerHTML = html;
};

window.showStudyLog = function(dateStr) {
  // Deprecated/removed per user request
};

// ===== POMODORO TIMER =====
window.pomodoroTimer = null;
window.pomodoroTimeLeft = 25 * 60; // 25 mins
window.pomodoroMode = 'work'; // 'work' or 'break'
window.isPomodoroRunning = false;

window.togglePomodoro = function() {
  const btn = document.getElementById('pomodoroStartBtn');
  if (isPomodoroRunning) {
    clearInterval(pomodoroTimer);
    isPomodoroRunning = false;
    btn.innerHTML = '<i class="ri-play-fill"></i>';
  } else {
    isPomodoroRunning = true;
    btn.innerHTML = '<i class="ri-pause-fill"></i>';
    pomodoroTimer = setInterval(() => {
      if (pomodoroTimeLeft > 0) {
        pomodoroTimeLeft--;
        updatePomodoroDisplay();
      } else {
        clearInterval(pomodoroTimer);
        isPomodoroRunning = false;
        btn.innerHTML = '<i class="ri-play-fill"></i>';
        alert(pomodoroMode === 'work' ? 'Work session complete! Take a break.' : 'Break over! Back to work.');
        switchPomodoroMode();
      }
    }, 1000);
  }
};

window.resetPomodoro = function() {
  clearInterval(pomodoroTimer);
  isPomodoroRunning = false;
  document.getElementById('pomodoroStartBtn').innerHTML = '<i class="ri-play-fill"></i>';
  pomodoroTimeLeft = pomodoroMode === 'work' ? 25 * 60 : 5 * 60;
  updatePomodoroDisplay();
};

window.switchPomodoroMode = function() {
  pomodoroMode = pomodoroMode === 'work' ? 'break' : 'work';
  const status = document.getElementById('pomodoroStatus');
  if (pomodoroMode === 'work') {
    status.textContent = 'Work Session';
    status.style.color = 'var(--accent-pink)';
    pomodoroTimeLeft = 25 * 60;
  } else {
    status.textContent = 'Short Break';
    status.style.color = 'var(--accent-green)';
    pomodoroTimeLeft = 5 * 60;
  }
  resetPomodoro();
};

window.updatePomodoroDisplay = function() {
  const mins = Math.floor(pomodoroTimeLeft / 60).toString().padStart(2, '0');
  const secs = (pomodoroTimeLeft % 60).toString().padStart(2, '0');
  const display = document.getElementById('pomodoroDisplay');
  if(display) display.textContent = `${mins}:${secs}`;
};

// Initialize Grid on load
document.addEventListener('DOMContentLoaded', () => {
  renderIntensityGrid();
});

// ===== FAQ & TRACKER =====
window.toggleFaq = function(el) {
  el.classList.toggle('open');
};

// ===== PARTICLES BACKGROUND =====
if (window.particlesJS) {
  particlesJS("particles-js", {
    "particles": {
      "number": {
        "value": 50,
        "density": { "enable": true, "value_area": 800 }
      },
      "color": { "value": "#F9CD05" }, /* Yellow dots to match theme */
      "shape": { "type": "circle" },
      "opacity": {
        "value": 0.4,
        "random": true
      },
      "size": {
        "value": 3,
        "random": true
      },
      "line_linked": {
        "enable": true,
        "distance": 150,
        "color": "#F9CD05", /* Yellow lines */
        "opacity": 0.2,
        "width": 1
      },
      "move": {
        "enable": true,
        "speed": 1.5,
        "direction": "none",
        "random": true,
        "straight": false,
        "out_mode": "out",
        "bounce": false
      }
    },
    "interactivity": {
      "detect_on": "canvas",
      "events": {
        "onhover": { "enable": true, "mode": "grab" },
        "onclick": { "enable": true, "mode": "push" },
        "resize": true
      },
      "modes": {
        "grab": { "distance": 140, "line_linked": { "opacity": 0.5 } },
        "push": { "particles_nb": 3 }
      }
    },
    "retina_detect": true
  });
}

// ===== LOCAL CARD GLOW EFFECT (Optimized) =====
document.addEventListener('mousemove', function(e) {
  const card = e.target.closest('.glow-card');
  if (!card) return; // Only calculate if hovering over a card
  
  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  card.style.setProperty('--mouse-x', x + 'px');
  card.style.setProperty('--mouse-y', y + 'px');
});