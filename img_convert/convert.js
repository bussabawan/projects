const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

const uploadsDir = path.join(__dirname, '..', 'uploads', 'images');
const publicDir = path.join(__dirname, '..', 'public');

const logos = [
  path.join(publicDir, 'lprulogo.png'),
  path.join(publicDir, 'nltc_logo.png')
];

async function convertFileToWebP(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    if (!['.png', '.jpg', '.jpeg'].includes(ext)) {
      return;
    }
    
    console.log(`Converting ${filePath}...`);
    // Read the file into a buffer first
    const buffer = await fs.readFile(filePath);
    
    // Convert to webp
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 80 })
      .toBuffer();
      
    // Overwrite the original file with the webp buffer
    await fs.writeFile(filePath, webpBuffer);
    console.log(`Successfully converted and overwritten ${filePath}`);
  } catch (err) {
    console.error(`Error converting ${filePath}:`, err);
  }
}

async function main() {
  // Convert logos
  for (const logo of logos) {
    await convertFileToWebP(logo);
  }

  // Convert files in uploads/images
  try {
    const files = await fs.readdir(uploadsDir);
    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      const stat = await fs.stat(filePath);
      if (stat.isFile()) {
        await convertFileToWebP(filePath);
      }
    }
  } catch (err) {
    console.error(`Error reading ${uploadsDir}:`, err);
  }
}

main().then(() => console.log('Done'));
