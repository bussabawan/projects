const fs = require('fs/promises');
const path = require('path');

const uploadsDir = path.join(__dirname, '..', 'uploads', 'images');
const publicDir = path.join(__dirname, '..', 'public');

const logos = [
  path.join(publicDir, 'lprulogo.png'),
  path.join(publicDir, 'nltc_logo.png')
];

async function renameToWebP(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    if (!['.png', '.jpg', '.jpeg'].includes(ext)) {
      return;
    }
    
    // We only rename, content is already WebP
    const newPath = filePath.substring(0, filePath.length - ext.length) + '.webp';
    
    await fs.rename(filePath, newPath);
    console.log(`Renamed ${filePath} to ${newPath}`);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`Error renaming ${filePath}:`, err);
    }
  }
}

async function main() {
  // Rename logos
  for (const logo of logos) {
    await renameToWebP(logo);
  }

  // Rename files in uploads/images
  try {
    const files = await fs.readdir(uploadsDir);
    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      const stat = await fs.stat(filePath);
      if (stat.isFile()) {
        await renameToWebP(filePath);
      }
    }
  } catch (err) {
    console.error(`Error reading ${uploadsDir}:`, err);
  }
}

main().then(() => console.log('Done renaming'));
