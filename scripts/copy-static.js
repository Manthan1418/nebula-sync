import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    throw new Error(`Source directory not found: ${src}`);
  }

  // Remove dest if exists
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }

  // Create dest
  fs.mkdirSync(dest, { recursive: true });

  // Copy files
  const files = fs.readdirSync(src);
  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);

    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

try {
  const srcDir = path.join(__dirname, '..', 'FE', 'dist');
  const destDir = path.join(__dirname, '..', 'public');

  console.log(`Copying ${srcDir} to ${destDir}...`);
  copyDir(srcDir, destDir);
  console.log('✓ Static files copied successfully!');
} catch (error) {
  console.error('✗ Error copying static files:', error.message);
  process.exit(1);
}
