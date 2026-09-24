/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.join(__dirname, '..', 'public');

const files = [
  path.join(publicDir, 'profile1.png'),
  path.join(publicDir, 'profile2.jpg')
];

async function convertAndRename(filePath) {
  try {
    const ext = path.extname(filePath);
    const newPath = filePath.substring(0, filePath.length - ext.length) + '.webp';
    
    // Read the file
    const buffer = await fs.readFile(filePath);
    
    // Convert to webp
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 100 })
      .toBuffer();
      
    // Write new .webp file
    await fs.writeFile(newPath, webpBuffer);
    console.log(`Converted and saved: ${newPath}`);
    
    // Delete old file
    await fs.unlink(filePath);
    console.log(`Deleted original: ${filePath}`);
  } catch (err) {
    console.error(`Error converting ${filePath}:`, err);
  }
}

async function main() {
  for (const file of files) {
    await convertAndRename(file);
  }
}

main().then(() => console.log('Conversion complete.'));
