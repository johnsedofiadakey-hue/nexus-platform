const fs = require('fs');
const path = require('path');

/**
 * 🛠️ NEXUS INTEGRITY CONFIG
 */
const CONFIG = {
  searchDir: './src/app/dashboard/hr', // Where to look for broken imports
  oldPath: '@/src/app/dashboard/hr/member/',
  newPath: '@/components/dashboard/hr/',
  mapOldPath: '@/src/app/dashboard/hr/member/LiveMap',
  mapNewPath: '@/components/maps/LiveMap'
};

function repairFiles(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      repairFiles(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;

      // 🔄 Swap HR Component Paths
      content = content.split(CONFIG.oldPath).join(CONFIG.newPath);
      
      // 🔄 Swap Map Path
      content = content.split(CONFIG.mapOldPath).join(CONFIG.mapNewPath);

      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ REPAIRED: ${filePath}`);
      } else {
        console.log(`🔎 VERIFIED: ${filePath}`);
      }
    }
  });
}

console.log("🚀 Initializing Nexus File Integrity Check...");
try {
  repairFiles(CONFIG.searchDir);
  console.log("\n✨ Integrity Check Complete. All paths aligned to root /components.");
} catch (err) {
  console.error("❌ Critical Error during integrity check:", err.message);
}