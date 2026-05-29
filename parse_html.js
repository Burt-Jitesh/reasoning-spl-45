const fs = require('fs');
const html = fs.readFileSync('Biology_Spl._(Theory+Pract.).html', 'utf8');
const links = [];
// More robust parsing using regex
const regex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1[^>]*>(.*?)<\/a>/gis;

let match;
while ((match = regex.exec(html)) !== null) {
  links.push({ url: match[2], text: match[3].replace(/<[^>]+>/g, '').trim() });
}

console.log('Total links found:', links.length);
console.log('Sample links:', links.slice(0, 10));

const pdfs = links.filter(l => l.url.includes('.pdf') || l.url.toLowerCase().includes('drive.google') || l.text.toLowerCase().includes('pdf') || l.text.toLowerCase().includes('note'));
// Assuming video links are the ones not matching PDFs, or specific domains
const videos = links.filter(l => !pdfs.includes(l));

console.log('Potential PDFs:', pdfs.length);
console.log('Potential Videos:', videos.length);
console.log('Sample Video:', videos[0]);
console.log('Sample PDF:', pdfs[0]);

// Dump to JSON for inspection
fs.writeFileSync('biology_parsed.json', JSON.stringify({ videos, pdfs }, null, 2));
