// ============================================================
// ONAFBU - MODERN PAPER EDITION (Mobile First)
// ============================================================

let watchedVideos = {}; // { courseId: Set(videoIds) }
let currentCourseId = null;
let currentPlayingId = null;
let hlsInstance = null;
let studyChartInstance = null;
let currentViewMode = 'list';

document.addEventListener('DOMContentLoaded', () => {
  if (typeof globalPlatformData === 'undefined') {
    alert("Data file missing!");
    return;
  }
  
  updateGreeting();
  renderDashboard();
});

function updateGreeting() {
  const hour = new Date().getHours();
  let greeting = "Good Evening.";
  if (hour < 12) greeting = "Good Morning.";
  else if (hour < 17) greeting = "Good Afternoon.";
  
  const el = document.getElementById('greetingTitle');
  if (el) el.textContent = greeting;
}

// ===== STATE & PROGRESS =====
function loadAllProgress() {
  if (!masterCourses) return;
  Object.keys(masterCourses).forEach(courseId => {
    const saved = localStorage.getItem('onafbu_watched_' + courseId);
    if (saved) watchedVideos[courseId] = new Set(JSON.parse(saved));
    else watchedVideos[courseId] = new Set();
  });
}

function saveProgress(courseId) {
  if (watchedVideos[courseId]) {
    localStorage.setItem(`onafbu_watched_${courseId}`, JSON.stringify([...watchedVideos[courseId]]));
    
  }
}

// ===== DASHBOARD =====
// ===== COURSE VIEW (TIMELINE) =====
window.openCourse = async function(courseId) {
  currentCourseId = courseId;
  
  document.getElementById('dashboardView').classList.add('hidden');
  document.getElementById('courseView').classList.remove('hidden');
  document.getElementById('timelineList').innerHTML = '<div style="color:white; padding: 20px;">Loading course data...</div>';
  
  try {
      const response = await fetch('courses_data/' + courseId + '.json');
      currentCourseData = await response.json();
  } catch(e) {
      document.getElementById('timelineList').innerHTML = '<div style="color:white; padding: 20px;">Error loading course.</div>';
      return;
  }

  const course = currentCourseData;
  document.getElementById('courseTitle').textContent = course.title;
  
  renderTimeline();
  updateProgressStats();
  
  // Setup Search
  const searchInput = document.getElementById('searchInput');
  searchInput.value = '';
  searchInput.oninput = (e) => renderTimeline(e.target.value);
}

window.goHome = function() {
  document.getElementById('courseView').classList.add('hidden');
  document.getElementById('dashboardView').classList.remove('hidden');
  currentCourseId = null;
  window.scrollTo(0, 0);
}

function updateProgressStats() {
  if (!currentCourseId) return;
  const set = watchedVideos[currentCourseId];
  document.getElementById('completedCount').textContent = set ? set.size : 0;
}

function renderTimeline(filterText = '') {
  if (!currentCourseId) return;
  const course = currentCourseData;
  const list = document.getElementById('timelineList');
  let html = '';
  
  const lowerFilter = filterText.toLowerCase();
  
  course.videos.forEach((v, index) => {
    const cleanTitleStr = cleanTitle(v.title);
    if (filterText && !cleanTitleStr.toLowerCase().includes(lowerFilter)) return;
    
    const isWatched = watchedVideos[currentCourseId].has(index);
    const watchedClass = isWatched ? 'watched' : '';
    const checkmark = isWatched ? `<i class="ri-check-line class-checkmark"></i>` : '';
    
    html += `
      <div class="class-item paper-panel ${watchedClass}" onclick="openPlayer(${index})">
        <div class="class-thumb">
          <i class="ri-play-circle-fill"></i>
        </div>
        <div class="class-details">
          <span>${cleanTitleStr}</span>
        </div>
        ${checkmark}
      </div>
    `;
  });
  
  list.innerHTML = html;
}

// ===== TIMELINE VIEW TOGGLE =====
window.setViewMode = function(mode) {
  currentViewMode = mode;
  document.getElementById('listViewBtn').classList.toggle('active-view', mode === 'list');
  document.getElementById('gridViewBtn').classList.toggle('active-view', mode === 'grid');
  
  const list = document.getElementById('timelineList');
  if (mode === 'grid') {
    list.classList.add('grid-view');
  } else {
    list.classList.remove('grid-view');
  }
}

// ===== PLAYER MODAL =====
window.openPlayer = function(videoId) {
  currentPlayingId = videoId;
  const course = currentCourseData;
  const video = course.videos[videoId];
  
  const type = (video.url.includes('youtube.com') || video.url.includes('youtu.be')) ? 'youtube' : 'hls';
  
  // Auto-mark as watched
  const set = watchedVideos[currentCourseId];
  if (!set.has(videoId)) {
    set.add(videoId);
    saveProgress(currentCourseId);
  }
  
  document.getElementById('playerView').classList.remove('hidden');
  document.getElementById('nowPlayingTitle').textContent = cleanTitle(video.title);
  
  const macTitle = document.getElementById('macTitle');
  if (macTitle) macTitle.textContent = cleanTitle(video.title);
  
  updateMarkWatchedBtn();
  loadVideoSource(video.url, type);
}

window.closePlayer = function() {
  if (hlsInstance) {
    hlsInstance.destroy();
    hlsInstance = null;
  }
  const videoEl = document.getElementById('videoElement');
  videoEl.pause();
  videoEl.removeAttribute('src');
  videoEl.load();
  
  const ytContainer = document.getElementById('youtubeContainer');
  ytContainer.innerHTML = '';
  ytContainer.classList.add('hidden');
  
  document.getElementById('playerView').classList.add('hidden');
  renderTimeline(document.getElementById('searchInput').value); // refresh list
  updateProgressStats();
}

function loadVideoSource(url, type) {
  const videoEl = document.getElementById('videoElement');
  const ytContainer = document.getElementById('youtubeContainer');
  const qualityDiv = document.getElementById('qualitySelector');
  
  if (hlsInstance) {
    hlsInstance.destroy();
    hlsInstance = null;
  }
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
      videoEl.addEventListener('loadedmetadata', function() {
        videoEl.play();
      });
      qualityDiv.classList.add('hidden');
    }
  }
}

window.setQuality = function(level) {
  if (hlsInstance) {
    hlsInstance.currentLevel = level;
  }
}

window.setSpeed = function(rate) {
  const videoEl = document.getElementById('videoElement');
  if (videoEl) videoEl.playbackRate = rate;
}

// Nav actions
document.getElementById('prevBtn').onclick = () => {
  if (currentPlayingId > 0) openPlayer(currentPlayingId - 1);
};
document.getElementById('nextBtn').onclick = () => {
  if (!currentCourseId) return;
  const max = currentCourseData.videos.length - 1;
  if (currentPlayingId < max) openPlayer(currentPlayingId + 1);
};

document.getElementById('markWatchedBtn').onclick = () => {
  const set = watchedVideos[currentCourseId];
  if (set.has(currentPlayingId)) {
    set.delete(currentPlayingId);
  } else {
    set.add(currentPlayingId);
  }
  saveProgress(currentCourseId);
  updateMarkWatchedBtn();
};

function updateMarkWatchedBtn() {
  const btn = document.getElementById('markWatchedBtn');
  const isWatched = watchedVideos[currentCourseId].has(currentPlayingId);
  if (isWatched) {
    btn.classList.add('watched');
    btn.innerHTML = `<i class="ri-check-double-line"></i> Completed`;
  } else {
    btn.classList.remove('watched');
    btn.innerHTML = `<i class="ri-check-line"></i> Mark Done`;
  }
}

// ===== UTILS =====
function cleanTitle(title) {
  if (!title) return 'Untitled';
  let cleaned = title.replace(/[\uFFFD]+/g, '');
  cleaned = cleaned.replace(/\s+[a-zA-Z0-9_\-]{30,}.*$/, '');
  cleaned = cleaned.replace(/https?:\/\/\S+/g, '');
  cleaned = cleaned.replace(/\s+[0-9a-f]{20,}$/i, '');
  cleaned = cleaned.replace(/\s*bcov_auth=.*/i, '');
  cleaned = cleaned.replace(/\s*eyJ[A-Za-z0-9_\-]+.*/g, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/[\|\-\s]+$/, '').trim();
  return cleaned || 'Untitled';
}

// ===== COURSE PDFs =====
window.showCoursePdfs = function() {
  if (!currentCourseId) return;
  document.getElementById('pdfModal').classList.remove('hidden');
  renderCurrentCoursePdfs();
}
window.closePdfs = function() {
  document.getElementById('pdfModal').classList.add('hidden');
}

function renderCurrentCoursePdfs() {
  const container = document.getElementById('pdfContainer');
  let html = '';
  
  const course = currentCourseData;
  if (course && course.pdfs && course.pdfs.length > 0) {
    html += `
      <div class="pdf-category">
        <div class="pdf-list">
    `;
    
    course.pdfs.forEach(pdf => {
      html += `
        <a href="${pdf.url}" target="_blank" class="pdf-card">
          <i class="ri-file-pdf-line"></i>
          <span class="pdf-title">${cleanTitle(pdf.title)}</span>
        </a>
      `;
    });
    
    html += `</div></div>`;
  } else {
    html = `<p style="text-align:center; margin-top: 40px; color: var(--text-muted);">No study materials available for this course.</p>`;
  }
  
  container.innerHTML = html;
}

