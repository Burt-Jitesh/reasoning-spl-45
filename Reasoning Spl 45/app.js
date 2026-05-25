// ============================================================
// REASONING SPL-45 — Refactored App
// ============================================================

// ===== TOPIC DEFINITIONS (For tagging, not sorting) =====
const TOPIC_KEYWORDS = [
  { id: 'introduction', name: 'Introduction', keywords: ['introduction', 'intro'] },
  { id: 'dice', name: 'Dice (पासा)', keywords: ['dice', 'पासा'] },
  { id: 'cube-cuboid', name: 'Cube & Cuboid', keywords: ['cube', 'cuboid'] },
  { id: 'venn-diagram', name: 'Venn Diagram', keywords: ['venn diagram', 'venn'] },
  { id: 'directions', name: 'Directions & Distance', keywords: ['direction', 'distance'] },
  { id: 'counting-figures', name: 'Counting Figures', keywords: ['counting figure', 'counting fig'] },
  { id: 'blood-relations', name: 'Blood Relations', keywords: ['blood relation', 'blood'] },
  { id: 'alphabetical-series', name: 'Alphabetical Series', keywords: ['alphabetical series', 'alphabet'] },
  { id: 'non-verbal', name: 'Non Verbal Reasoning', keywords: ['non verbal', 'non-verbal', 'nonverbal', 'mirror', 'water image', 'paper folding', 'figure completion'] },
  { id: 'coding-decoding', name: 'Coding & Decoding', keywords: ['coding', 'decoding'] },
  { id: 'letter-series', name: 'Letter Series', keywords: ['letter series'] },
  { id: 'pair-formation', name: 'Pair Formation', keywords: ['pair formation', 'pair', 'dictionary', 'word formation', 'jumbling'] },
  { id: 'calendar', name: 'Calendar', keywords: ['calendar'] },
  { id: 'statement-assumptions', name: 'Statement & Assumptions', keywords: ['statement', 'assumption', 'conclusion', 'inference', 'argument', 'assertion', 'reason', 'decision making'] },
  { id: 'cause-effect', name: 'Cause & Effect', keywords: ['cause', 'effect'] },
  { id: 'analogy', name: 'Analogy', keywords: ['analogy'] },
  { id: 'syllogism', name: 'Syllogism', keywords: ['syllogism', 'syllogims'] },
  { id: 'puzzle', name: 'Puzzle', keywords: ['puzzle'] },
  { id: 'data-sufficiency', name: 'Data Sufficiency', keywords: ['data sufficiency'] },
  { id: 'course-of-action', name: 'Course of Action', keywords: ['course of action'] }
];

// ===== STATE =====
let processedVideos = [];
let processedPdfs = [];
let watchedVideos = new Set();
let studyHistory = {}; // Format: { "YYYY-MM-DD": [videoId1, videoId2] }
let currentVideoIndex = -1;
let hlsInstance = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  loadProgress();
  processData();
  renderTimeline();
  renderPdfs();
  renderAnalytics();
  initSearch();
  initControls();
  resumeLastVideo();
});

function resumeLastVideo() {
  const lastVideoId = localStorage.getItem('spl45_last_video');
  if (lastVideoId !== null && processedVideos[lastVideoId]) {
    playVideo(parseInt(lastVideoId));
  }
}

// ===== THEME =====
function loadTheme() {
  const savedTheme = localStorage.getItem('spl45_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeBtn(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('spl45_theme', next);
  updateThemeBtn(next);
}

function updateThemeBtn(theme) {
  const btn = document.getElementById('themeToggleBtn');
  if (theme === 'dark') {
    btn.innerHTML = '<i class="ri-sun-line"></i> Light Mode';
  } else {
    btn.innerHTML = '<i class="ri-moon-line"></i> Dark Mode';
  }
}

// ===== DATA PROCESSING =====
function processData() {
  if (typeof globalCourseData === 'undefined') {
    alert("Data not found. Make sure data.js is loaded.");
    return;
  }

  // Process videos sequentially
  let currentTopicId = null;

  processedVideos = globalCourseData.videos.map((v, index) => {
    const cleanedTitle = cleanTitle(v.title);
    const topic = detectTopic(cleanedTitle);
    
    // Determine video type
    let videoType = 'hls';
    if (v.url && (v.url.includes('youtube.com') || v.url.includes('youtu.be'))) {
      videoType = 'youtube';
    }

    return {
      id: index,
      index: index,
      title: cleanedTitle,
      url: v.url,
      type: videoType,
      topic: topic
    };
  });

  // Process PDFs
  processedPdfs = globalCourseData.pdfs.map((p, index) => {
    const cleanedTitle = cleanTitle(p.title);
    return {
      id: index,
      title: cleanedTitle,
      url: p.url,
      category: detectPdfCategory(cleanedTitle)
    };
  });

  // Update Top Stats
  document.getElementById('totalVids').textContent = processedVideos.length;
  document.getElementById('totalPdfs').textContent = processedPdfs.length;
  updateProgressPct();
}

function cleanTitle(title) {
  if (!title) return 'Untitled';
  let cleaned = title.replace(/[\uFFFD]+/g, '');
  cleaned = cleaned.replace(/\s+[a-zA-Z0-9]{30,}.*$/, '');
  cleaned = cleaned.replace(/https?:\/\/\S+/g, '');
  cleaned = cleaned.replace(/\s+[0-9a-f]{20,}$/i, '');
  cleaned = cleaned.replace(/\s*bcov_auth=.*/i, '');
  cleaned = cleaned.replace(/\s*eyJ[A-Za-z0-9_\-]+.*/g, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/[\|\-\s]+$/, '').trim();
  return cleaned || 'Untitled';
}

function detectTopic(title) {
  const lower = title.toLowerCase();
  for (const t of TOPIC_KEYWORDS) {
    for (const kw of t.keywords) {
      if (lower.includes(kw)) {
        if (t.id === 'alphabetical-series' && lower.includes('letter series')) continue;
        return t;
      }
    }
  }
  return { id: 'other', name: 'Other / Mixed' };
}

function detectPdfCategory(title) {
  const lower = title.toLowerCase();
  if (/practice\s*set|pyq|test|question/i.test(lower)) return 'Practice Sets';
  if (/short\s*notes|notes/i.test(lower)) return 'Short Notes';
  if (/class\s*png|\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(lower)) return 'Class Boards';
  return 'Study Material';
}

// ===== RENDERING =====
function renderTimeline(query = '') {
  const container = document.getElementById('timelineList');
  let html = '';
  let lastTopicId = null;

  const filtered = query 
    ? processedVideos.filter(v => v.title.toLowerCase().includes(query.toLowerCase()))
    : processedVideos;

  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-light);">No classes found</div>`;
    return;
  }

  filtered.forEach((video) => {
    // Insert Topic Header if it changes (and we're not searching, or just let it show during search too)
    if (video.topic.id !== lastTopicId) {
      html += `<div class="topic-header">${video.topic.name}</div>`;
      lastTopicId = video.topic.id;
    }

    const isWatched = watchedVideos.has(video.id);
    const isActive = currentVideoIndex === video.id;
    
    html += `
      <div class="class-item ${isWatched ? 'watched' : ''} ${isActive ? 'active' : ''}" 
           onclick="playVideo(${video.id})"
           id="class-item-${video.id}">
        <div class="class-status">
          ${isWatched ? '<i class="ri-checkbox-circle-fill"></i>' : '<i class="ri-checkbox-blank-circle-line"></i>'}
        </div>
        <div class="class-info">
          <div class="class-number">Class ${video.index + 1}</div>
          <div class="class-title">${escapeHtml(video.title)}</div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function renderPdfs(filter = 'all') {
  const categories = ['all', ...new Set(processedPdfs.map(p => p.category))];
  const filterContainer = document.getElementById('pdfFilters');
  
  filterContainer.innerHTML = categories.map(cat => {
    const count = cat === 'all' ? processedPdfs.length : processedPdfs.filter(p => p.category === cat).length;
    return `<button class="pdf-filter-btn ${filter === cat ? 'active' : ''}" onclick="filterPdfs('${cat}')">${cat} (${count})</button>`;
  }).join('');

  const grid = document.getElementById('pdfGrid');
  const filtered = filter === 'all' ? processedPdfs : processedPdfs.filter(p => p.category === filter);
  
  grid.innerHTML = filtered.map(pdf => `
    <a href="${pdf.url}" target="_blank" class="pdf-card">
      <div class="pdf-icon"><i class="ri-file-pdf-line"></i></div>
      <div class="pdf-info">
        <div class="pdf-title">${escapeHtml(pdf.title)}</div>
        <div class="pdf-category">${pdf.category}</div>
      </div>
      <div class="pdf-download"><i class="ri-download-2-line"></i></div>
    </a>
  `).join('');
}

window.filterPdfs = function(cat) {
  renderPdfs(cat);
};

// ===== VIDEO PLAYER & HLS =====
window.playVideo = function(id) {
  const video = processedVideos[id];
  if (!video) return;

  currentVideoIndex = id;
  localStorage.setItem('spl45_last_video', id); // Save last watched
  
  // Update UI state
  document.getElementById('emptyPlayer').classList.add('hidden');
  document.getElementById('videoHost').classList.remove('hidden');
  document.getElementById('videoMeta').classList.remove('hidden');
  
  document.getElementById('nowPlayingTitle').textContent = `Class ${video.index + 1}: ${video.title}`;
  document.getElementById('currentTopicBadge').textContent = video.topic.name;
  
  // Highlight active in timeline
  renderTimeline(document.getElementById('searchInput').value);
  
  // Auto-scroll timeline to active item
  const el = document.getElementById(`class-item-${id}`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Navigation buttons
  document.getElementById('prevBtn').disabled = currentVideoIndex <= 0;
  document.getElementById('nextBtn').disabled = currentVideoIndex >= processedVideos.length - 1;

  // Auto Watch Feature
  markAsWatched(id);

  // Setup Player
  setupPlayer(video);
};

function setupPlayer(video) {
  document.getElementById('emptyPlayer').classList.add('hidden');
  document.getElementById('videoHost').classList.remove('hidden');
  document.getElementById('videoMeta').classList.remove('hidden');

  const videoEl = document.getElementById('videoElement');
  const qualitySelector = document.getElementById('qualitySelector');
  const ytContainer = document.getElementById('youtubeContainer');
  
  if (hlsInstance) {
    hlsInstance.destroy();
    hlsInstance = null;
  }

  if (video.type === 'youtube') {
    videoEl.classList.add('hidden');
    qualitySelector.classList.add('hidden');
    ytContainer.classList.remove('hidden');
    
    // Pause existing HLS video
    videoEl.pause();
    videoEl.removeAttribute('src');
    videoEl.load();
    
    const ytMatch = video.url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&\s?"']+)/);
    const ytId = ytMatch ? ytMatch[1] : '';
    ytContainer.innerHTML = `
      <div style="width:100%; height:100%; position:relative;">
        <iframe 
            src="https://www.youtube.com/embed/${ytId}?autoplay=1" 
            title="YouTube video player" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            referrerpolicy="strict-origin-when-cross-origin" 
            allowfullscreen 
            style="width:100%; height:100%; border:none;">
        </iframe>
        <a href="https://www.youtube.com/watch?v=${ytId}" target="_blank" class="action-btn" style="position:absolute; top:10px; right:10px; background: rgba(0,0,0,0.8); color: white; border: 1px solid #ff0000; text-decoration:none; z-index: 10;">
          <i class="ri-youtube-fill" style="color:#ff0000;"></i> Open in YouTube App
        </a>
      </div>
    `;
  } else {
    ytContainer.classList.add('hidden');
    ytContainer.innerHTML = ''; // Destroy youtube iframe
    videoEl.classList.remove('hidden');
    qualitySelector.classList.remove('hidden');
    
    if (Hls.isSupported()) {
      hlsInstance = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });
      
      hlsInstance.loadSource(video.url);
      hlsInstance.attachMedia(videoEl);
      
      hlsInstance.on(Hls.Events.MANIFEST_PARSED, function(event, data) {
        videoEl.play().catch(e => console.log('Autoplay prevented'));
        setupQualitySelector(hlsInstance.levels);
      });
      
      hlsInstance.on(Hls.Events.LEVEL_SWITCHED, function(event, data) {
        updateQualityLabel(data.level);
      });
    } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      videoEl.src = video.url;
      videoEl.play();
      qualitySelector.classList.add('hidden'); // Safari native HLS handles quality automatically
    }
  }
}

// ===== QUALITY SELECTOR =====
function setupQualitySelector(levels) {
  const dropdown = document.getElementById('qualityDropdown');
  let html = `<button class="q-option selected" onclick="setQuality(-1)">Auto</button>`;
  
  // Sort levels by height (resolution)
  const uniqueLevels = [];
  const heights = new Set();
  levels.forEach((level, index) => {
    if (!heights.has(level.height)) {
      heights.add(level.height);
      uniqueLevels.push({ index, height: level.height });
    }
  });
  
  uniqueLevels.sort((a,b) => b.height - a.height).forEach(level => {
    html += `<button class="q-option" onclick="setQuality(${level.index})">${level.height}p</button>`;
  });
  
  dropdown.innerHTML = html;
  document.getElementById('qualityToggle').textContent = 'Auto';
}

window.setQuality = function(levelIndex) {
  if (!hlsInstance) return;
  hlsInstance.currentLevel = levelIndex;
  
  // Update UI instantly
  const options = document.querySelectorAll('.q-option');
  options.forEach(opt => opt.classList.remove('selected'));
  
  if (levelIndex === -1) {
    options[0].classList.add('selected');
    document.getElementById('qualityToggle').textContent = 'Auto';
  } else {
    const selectedOpt = Array.from(options).find(opt => opt.textContent.includes(hlsInstance.levels[levelIndex].height + 'p'));
    if (selectedOpt) selectedOpt.classList.add('selected');
    document.getElementById('qualityToggle').textContent = hlsInstance.levels[levelIndex].height + 'p';
  }
  
  document.getElementById('qualityDropdown').style.display = 'none';
  setTimeout(() => document.getElementById('qualityDropdown').style.display = '', 200); // Reset hover
};

function updateQualityLabel(levelIndex) {
  if (hlsInstance.autoLevelEnabled) {
    document.getElementById('qualityToggle').textContent = `Auto (${hlsInstance.levels[levelIndex].height}p)`;
  }
}

// ===== PROGRESS AND CONTROLS =====
function markAsWatched(id) {
  if (!watchedVideos.has(id)) {
    watchedVideos.add(id);
    
    // Add to study history
    const today = new Date().toISOString().split('T')[0];
    if (!studyHistory[today]) studyHistory[today] = [];
    if (!studyHistory[today].includes(id)) {
      studyHistory[today].push(id);
    }
  }

  saveProgress();
  updateProgressPct();
  renderAnalytics();
  
  const markBtn = document.getElementById('markWatchedBtn');
  markBtn.classList.add('is-watched');
  markBtn.innerHTML = '<i class="ri-checkbox-circle-fill"></i> Watched';
  
  // Render timeline efficiently without full rebuild to avoid scrolling jumps if possible
  const item = document.getElementById(`class-item-${id}`);
  if (item) {
    item.classList.add('watched');
    item.querySelector('.class-status').innerHTML = '<i class="ri-checkbox-circle-fill"></i>';
  }
}

function toggleWatchedManually() {
  if (currentVideoIndex < 0) return;
  if (watchedVideos.has(currentVideoIndex)) {
    watchedVideos.delete(currentVideoIndex);
    document.getElementById('markWatchedBtn').classList.remove('is-watched');
    document.getElementById('markWatchedBtn').innerHTML = '<i class="ri-check-line"></i> Mark Watched';
  } else {
    markAsWatched(currentVideoIndex);
  }
  saveProgress();
  updateProgressPct();
  renderTimeline(document.getElementById('searchInput').value);
}

function loadProgress() {
  const saved = localStorage.getItem('spl45_watched_v2');
  if (saved) watchedVideos = new Set(JSON.parse(saved));
  
  const history = localStorage.getItem('spl45_history');
  if (history) studyHistory = JSON.parse(history);
}

function saveProgress() {
  localStorage.setItem('spl45_watched_v2', JSON.stringify([...watchedVideos]));
  localStorage.setItem('spl45_history', JSON.stringify(studyHistory));
}

function updateProgressPct() {
  const pct = processedVideos.length > 0 ? Math.round((watchedVideos.size / processedVideos.length) * 100) : 0;
  document.getElementById('progressPct').textContent = `${pct}%`;
}

// ===== STUDY ANALYTICS =====
function renderAnalytics() {
  const totalWatched = watchedVideos.size;
  const daysStudied = Object.keys(studyHistory).length;
  
  document.getElementById('statTotalWatched').textContent = totalWatched;
  document.getElementById('statTotalDays').textContent = daysStudied;
  
  const timeline = document.getElementById('historyTimeline');
  
  if (daysStudied === 0) {
    timeline.innerHTML = '<p style="color: var(--text-muted);">No study history yet. Start watching classes!</p>';
    return;
  }
  
  // Sort dates descending (newest first)
  const sortedDates = Object.keys(studyHistory).sort((a,b) => new Date(b) - new Date(a));
  
  let html = '';
  sortedDates.forEach(dateStr => {
    // Format date nicely
    const dateObj = new Date(dateStr);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const niceDate = dateObj.toLocaleDateString(undefined, options);
    
    html += `<div class="history-day">
      <div class="history-date"><i class="ri-calendar-check-line"></i> ${niceDate}</div>`;
      
    // Render classes watched on this day
    const videoIds = studyHistory[dateStr];
    videoIds.forEach(vidId => {
      const video = processedVideos.find(v => v.id === vidId);
      if (video) {
        html += `
          <div class="history-item">
            <i class="ri-play-circle-fill history-item-icon"></i>
            <div class="history-item-title">Class ${video.index + 1}: ${escapeHtml(video.title)}</div>
            <div class="history-item-topic">${video.topic.name}</div>
          </div>
        `;
      }
    });
    
    html += `</div>`;
  });
  
  timeline.innerHTML = html;
}

// ===== UTILS & EVENTS =====
function initControls() {
  document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);

  document.getElementById('prevBtn').addEventListener('click', () => {
    if (currentVideoIndex > 0) playVideo(currentVideoIndex - 1);
  });
  
  document.getElementById('nextBtn').addEventListener('click', () => {
    if (currentVideoIndex < processedVideos.length - 1) playVideo(currentVideoIndex + 1);
  });
  
  document.getElementById('markWatchedBtn').addEventListener('click', toggleWatchedManually);
  
  // Sections Toggle Logic
  const playerContainer = document.getElementById('playerContainer');
  const pdfSection = document.getElementById('studyMaterialsSection');
  const analyticsSection = document.getElementById('analyticsSection');

  document.getElementById('togglePdfsBtn').addEventListener('click', () => {
    playerContainer.classList.add('hidden');
    analyticsSection.classList.add('hidden');
    pdfSection.classList.remove('hidden');
  });
  
  document.getElementById('toggleAnalyticsBtn').addEventListener('click', () => {
    playerContainer.classList.add('hidden');
    pdfSection.classList.add('hidden');
    analyticsSection.classList.remove('hidden');
  });
  
  // Hook up video clicking to switch back to player view
  const originalPlayVideo = window.playVideo;
  window.playVideo = function(id) {
    playerContainer.classList.remove('hidden');
    pdfSection.classList.add('hidden');
    analyticsSection.classList.add('hidden');
    originalPlayVideo(id);
  };
}

window.goHome = function() {
  const playerContainer = document.getElementById('playerContainer');
  const pdfSection = document.getElementById('studyMaterialsSection');
  const analyticsSection = document.getElementById('analyticsSection');
  
  // Reset all sections
  playerContainer.classList.remove('hidden');
  pdfSection.classList.add('hidden');
  analyticsSection.classList.add('hidden');
  
  // Hide video and show empty state
  document.getElementById('emptyPlayer').classList.remove('hidden');
  document.getElementById('videoHost').classList.add('hidden');
  document.getElementById('videoMeta').classList.add('hidden');
  
  // Stop playback if playing
  if (hlsInstance) {
    hlsInstance.destroy();
    hlsInstance = null;
  }
  const ytContainer = document.getElementById('youtubeContainer');
  ytContainer.innerHTML = '';
  ytContainer.classList.add('hidden');
  
  const videoEl = document.getElementById('videoElement');
  videoEl.pause();
  videoEl.removeAttribute('src');
  videoEl.load();
  videoEl.classList.remove('hidden');
  document.getElementById('qualitySelector').classList.remove('hidden');
  
  // Reset badges
  document.getElementById('currentTopicBadge').textContent = 'Select a class to begin';
  currentVideoIndex = -1;
  localStorage.removeItem('spl45_last_video'); // Clear last watched
  
  // Remove active highlight from timeline
  const activeItems = document.querySelectorAll('.class-item.active');
  activeItems.forEach(item => item.classList.remove('active'));
};

function initSearch() {
  const input = document.getElementById('searchInput');
  const clear = document.getElementById('clearSearch');
  
  input.addEventListener('input', (e) => {
    const val = e.target.value;
    clear.style.display = val ? 'block' : 'none';
    renderTimeline(val);
  });
  
  clear.addEventListener('click', () => {
    input.value = '';
    clear.style.display = 'none';
    renderTimeline('');
    
    // Scroll back to active if exists
    if (currentVideoIndex >= 0) {
      const el = document.getElementById(`class-item-${currentVideoIndex}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
}

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
