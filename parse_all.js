const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, 'Raw_Courses');
const outputDir = path.join(__dirname, 'courses_data');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

function cleanTitle(title) {
    if (!title) return title;
    let t = title.replace(/[^\x00-\x7F]/g, '');
    t = t.replace(/^[^A-Za-z0-9\[]+/, '');
    t = t.replace(/\(\s*_\s*,\s*_\s*\)/g, '(पासा)');
    
    let parts = t.split(/\s+/);
    let newParts = [];
    for (let p of parts) {
        if (p.length > 25 && /^[A-Za-z0-9_-]{25,}$/.test(p)) {
            break;
        }
        newParts.push(p);
    }
    t = newParts.join(' ');
    return t.trim();
}

function generateId(filename) {
    return filename.replace(/\.html$/i, '')
                   .toLowerCase()
                   .replace(/[^a-z0-9]+/g, '-')
                   .replace(/^-|-$/g, '')
                   // Make sure it is reasonably short and unique
                   .substring(0, 50);
}

function getIconForTitle(title) {
    title = title.toLowerCase();
    if (title.includes('math') || title.includes('quant')) return 'ri-functions';
    if (title.includes('english')) return 'ri-english-input';
    if (title.includes('reasoning')) return 'ri-brain-line';
    if (title.includes('bio') || title.includes('science')) return 'ri-microscope-line';
    if (title.includes('history')) return 'ri-book-3-line';
    if (title.includes('geography')) return 'ri-earth-line';
    if (title.includes('polity')) return 'ri-government-line';
    if (title.includes('current affairs')) return 'ri-newspaper-line';
    if (title.includes('computer')) return 'ri-computer-line';
    if (title.includes('hindi')) return 'ri-translate';
    return 'ri-book-open-line';
}

function getColorForTitle(title) {
    title = title.toLowerCase();
    if (title.includes('math') || title.includes('quant')) return '#ec4899'; 
    if (title.includes('english')) return '#3b82f6'; 
    if (title.includes('reasoning')) return '#a855f7'; 
    if (title.includes('bio') || title.includes('science')) return '#10b981'; 
    if (title.includes('history')) return '#f59e0b'; 
    if (title.includes('geography')) return '#14b8a6'; 
    if (title.includes('polity')) return '#ef4444'; 
    return '#6366f1'; 
}

const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.html'));
const masterIndex = {};
let processed = 0;

// Need to handle duplicate IDs in case filename truncations overlap
const idCounts = {};

for (const file of files) {
    const filePath = path.join(inputDir, file);
    const html = fs.readFileSync(filePath, 'utf8');
    
    let courseTitle = file.replace(/\.html$/i, '').replace(/_/g, ' ');
    
    const videos = [];
    const pdfs = [];
    
    const regex = /(?:<a\s+[^>]*?href=(["'])(.*?)\1[^>]*>(.*?)<\/a>)|(?:<div class='video' onclick="playVideo\((["'])(.*?)\4,\s*(["'])(.*?)\6\)"[^>]*>(.*?)<\/div>)/gi;
    
    let match;
    while ((match = regex.exec(html)) !== null) {
        if (match[1]) {
            let url = match[2];
            let text = cleanTitle(match[3].replace(/<[^>]+>/g, '').trim());
            
            if (url.includes('.pdf') || text.includes('[Notes]')) {
                pdfs.push({ title: text, url: url });
            } else if (url.includes('youtu.be') || url.includes('youtube.com')) {
                videos.push({ title: text, url: url, type: 'youtube' });
            }
        } else if (match[4]) {
            let url = match[5];
            let text = cleanTitle(match[8].replace(/&#x27;/g, "'").trim());
            videos.push({ title: text, url: url, type: 'hls' });
        }
    }
    
    let rawId = generateId(file);
    if (!idCounts[rawId]) idCounts[rawId] = 0;
    idCounts[rawId]++;
    let id = idCounts[rawId] > 1 ? rawId + '-' + idCounts[rawId] : rawId;
    
    const icon = getIconForTitle(courseTitle);
    const color = getColorForTitle(courseTitle);
    
    const courseObj = {
        id: id,
        title: courseTitle,
        teacher: "Instructor", 
        icon: icon,
        color: color,
        videos: videos,
        pdfs: pdfs
    };
    
    fs.writeFileSync(path.join(outputDir, id + '.json'), JSON.stringify(courseObj, null, 2));
    
    masterIndex[id] = {
        id: id,
        title: courseTitle,
        teacher: "Instructor",
        icon: icon,
        color: color,
        videosCount: videos.length,
        pdfsCount: pdfs.length
    };
    
    processed++;
}

fs.writeFileSync(path.join(__dirname, 'master_courses.json'), JSON.stringify(masterIndex, null, 2));
console.log('Processed ' + processed + ' files successfully.');