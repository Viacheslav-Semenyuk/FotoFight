const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Create icon.png (1024x1024)
const iconSvg = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#FF6B6B"/>
  <text x="512" y="512" font-family="Arial" font-size="200" fill="white" text-anchor="middle" dominant-baseline="middle" font-weight="bold">FF</text>
</svg>
`;

// Create adaptive-icon.png (1024x1024)
const adaptiveIconSvg = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#FF6B6B"/>
  <text x="512" y="512" font-family="Arial" font-size="200" fill="white" text-anchor="middle" dominant-baseline="middle" font-weight="bold">FF</text>
</svg>
`;

// Create splash.png (2048x2048)
const splashSvg = `
<svg width="2048" height="2048" xmlns="http://www.w3.org/2000/svg">
  <rect width="2048" height="2048" fill="#ffffff"/>
  <text x="1024" y="1024" font-family="Arial" font-size="300" fill="#FF6B6B" text-anchor="middle" dominant-baseline="middle" font-weight="bold">Foto Fight</text>
</svg>
`;

// Create favicon.png (48x48)
const faviconSvg = `
<svg width="48" height="48" xmlns="http://www.w3.org/2000/svg">
  <rect width="48" height="48" fill="#FF6B6B"/>
  <text x="24" y="24" font-family="Arial" font-size="20" fill="white" text-anchor="middle" dominant-baseline="middle" font-weight="bold">FF</text>
</svg>
`;

async function generateAssets() {
  try {
    // Generate icon.png
    await sharp(Buffer.from(iconSvg))
      .png()
      .toFile(path.join(assetsDir, 'icon.png'));

    // Generate adaptive-icon.png
    await sharp(Buffer.from(adaptiveIconSvg))
      .png()
      .toFile(path.join(assetsDir, 'adaptive-icon.png'));

    // Generate splash.png
    await sharp(Buffer.from(splashSvg))
      .png()
      .toFile(path.join(assetsDir, 'splash.png'));

    // Generate favicon.png
    await sharp(Buffer.from(faviconSvg))
      .png()
      .toFile(path.join(assetsDir, 'favicon.png'));

    console.log('✅ Assets generated successfully!');
  } catch (error) {
    console.error('❌ Error generating assets:', error);
    process.exit(1);
  }
}

generateAssets();
