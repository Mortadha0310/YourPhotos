/**
 * Run: node scripts/download-models.js
 * Downloads face-api.js models to public/models
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
const DEST = path.join(__dirname, '..', 'public', 'models');

const FILES = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_tiny_model-weights_manifest.json',
  'face_landmark_68_tiny_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
];

if (!fs.existsSync(DEST)) fs.mkdirSync(DEST, { recursive: true });

function download(filename) {
  return new Promise((resolve, reject) => {
    const url = `${BASE}/${filename}`;
    const dest = path.join(DEST, filename);
    if (fs.existsSync(dest)) { console.log(`✓ ${filename} (already exists)`); return resolve(); }
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      res.pipe(file);
      file.on('finish', () => { file.close(); console.log(`✓ ${filename}`); resolve(); });
    }).on('error', err => { fs.unlink(dest, () => {}); reject(err); });
  });
}

(async () => {
  console.log('Downloading face-api.js models...\n');
  for (const f of FILES) await download(f);
  console.log('\nAll models downloaded to public/models/');
})();
