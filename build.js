const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const distDir = path.join(__dirname, 'dist');

const excludes = [
  'node_modules', '.git', '.claude', '.agents', 'dist', 'android', '.gradle',
  'react-src', '.playwright-mcp', 'tests', 'build.js', 'package.json', 'package-lock.json',
  'tsconfig.json', '.github',
  // Deploy hygiene (Phase 0): never ship build outputs, secrets, local DBs, or desktop binaries
  'dist-web', 'dist-electron', '.env', 'traffic.db',
  'AdvancedTypingInstructor.exe', 'AdvancedTypingInstructor_Setup.exe'
];

function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    if (excludes.includes(entry.name)) continue;

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function build() {
  console.log("Validating Traffic Academy levels (maintained set)...");
  try {
    require('child_process').execSync(
      'node Traffic/tools/validate-levels.js --scope=level1,level5,level_custom',
      { stdio: 'inherit' }
    );
  } catch (err) {
    console.error("Level validation failed — fix Traffic/levels errors above.");
    process.exit(1);
  }
  console.log("Copying static files to dist/...");
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  
  copyDirSync(__dirname, distDir);
  console.log("Static files copied successfully.");

  console.log("Bundling React components...");
  try {
    await esbuild.build({
      entryPoints: ['react-src/GamePage.tsx'],
      bundle: true,
      outfile: 'dist/Traffic/simulator-bundle.js',
      format: 'esm',
      minify: true,
      loader: {
        '.tsx': 'tsx',
        '.ts': 'ts',
      }
    });
    console.log("Build complete.");
  } catch (err) {
    console.error("Build failed:", err);
    process.exit(1);
  }
}

build();
