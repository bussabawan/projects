const https = require('https');
const fs = require('fs');

const phrases = [
  'คำแนะนำการเล่น',
  'จับคู่ภาพกับภาพ',
  'ดูรูปภาพตัวอย่างในกรอบใหญ่',
  'แล้วคลิกเลือกภาพในกรอบด้านข้าง',
  'ที่มีลักษณะเหมือนกับภาพโจทย์',
  'ทุกประการ'
];

async function downloadTTS(text) {
  return new Promise((resolve, reject) => {
    // using direct Google API to ensure it's not messed up by intermediate Next.js decoding/encoding issues
    // Use client=dict-chrome-ex which provides a much more natural voice than tw-ob
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=th&client=dict-chrome-ex`;
    
    https.get(url, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function run() {
  console.log('Downloading chunks...');
  let combined = Buffer.alloc(0);
  for (const phrase of phrases) {
    const audioBuf = await downloadTTS(phrase);
    combined = Buffer.concat([combined, audioBuf]);
  }
  fs.writeFileSync('storage/uploads/matching_instruction.mp3', combined);
  console.log('Done! Size:', combined.length);
}
run();
