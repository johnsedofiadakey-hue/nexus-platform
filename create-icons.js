const fs = require('fs');

// Create a simple 1x1 pixel transparent PNG (smallest valid PNG)
const transparentPNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

fs.writeFileSync('public/icons/icon-192x192.png', transparentPNG);
fs.writeFileSync('public/icons/icon-512x512.png', transparentPNG);

console.log('✅ Created placeholder icons successfully');
