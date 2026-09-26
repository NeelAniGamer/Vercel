const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const distDir = path.join(__dirname, 'dist');

// Keep the deployable tree deliberately small and free of local-only data.
// This is a deny-list rather than an allow-list so new runtime pages/assets are
// still copied automatically, while known development and credential paths
// can never leak into dist/.
const excludedDirectories = new Set([
  'node_modules', '.git', '.github', '.claude', '.agents', '.agent', '.codex',
  '.freebuff', '.impeccable', '.kilo', '.opencode', '.playwright-mcp',
  '.superpowers', '.vercel', 'android', '.gradle', 'react-src', 'tests',
  'build', 'dist', 'dist-electron', 'dist-web', 'docs', 'electron',
  'recordings', 'screenshots', 'scripts', 'scratch', 'supabase', 'Cyberpunk'
]);

const excludedFiles = new Set([
  'AGENTS.md', 'README.md', 'PLAN.md', 'PROJECTS.md', 'findings.md',
  'progress.md', 'task_plan.md', 'app.json', 'SECURITY.md', '.gitignore', '.prettierignore',
  '.prettierrc', '.vercelignore', 'build.js', 'build_scenes.js', 'generate_video_reel.py',
  'render_production_videos.py', 'perceptus_agent.py', 'local_server.js',
  'serve.js', 'server.js', 'package.json', 'package-lock.json', 'tsconfig.json',
  'opencode.json', 'skills-lock.json', 'eslint.config.js', 'AdvancedTypingInstructor.exe', 'AdvancedTypingInstructor_Setup.exe',
  'AdvancedTypingInstructor_1.4.0_all.deb', 'AdvancedTypingInstructor-Linux.tar.gz', 'bmcbrand.zip'
]);

const excludedFilePatterns = [
  /^\.env(?:\..*)?$/i,
  /\.(?:db|sqlite|sqlite3)$/i,
  /\.(?:exe|msi|dmg|appimage|pkg)$/i,
  /^vite\.config\.(?:ts|mts|cts|js|mjs|cjs)$/i
];

// These model folders are unreferenced by the browser runtime and contain
// source/editor formats rather than loadable game assets. Keeping them out of
// the deployable tree saves hundreds of megabytes without changing gameplay.
const excludedPaths = new Set([
  'Traffic/Models/sofa',
  'Traffic/Models/kenney_platformer-pack-remastered',
  'Traffic/Models/uploads_files_3963923_Metal+and+Concrete+Barrier+Textures',
  'Traffic/Models/uploads_files_6809232_bollard',
  'Traffic/Models/low_poly_city.glb',
  'Traffic/Models/low_poly_city_game-ready.glb',
  'Traffic/Models/New folder',
  'Traffic/New folder',
  'Traffic/Models/parking_garage.glb',
  // Traffic pages load these shared modules from the parent directory
  // (../col-ui.js), so the Traffic-local copies are never requested and would
  // only ship a second, divergent version of the same file.
  'Traffic/col-auth.js',
  'Traffic/col-ui.css',
  'Traffic/col-ui.js',
  'Traffic/col-router.js',
  'Traffic/config.json'
]);

// 3D assets the browser never requests.
//
// Traffic/Models is ~530 MB and only ~265 MB of it is ever loaded. This list
// is the remainder, produced by Traffic/tools/find-dead-models.js from two
// independent signals: a full 57-level sweep of observed browser requests, and
// a scan of every filename mentioned in first-party source. A file must fail
// both to appear here.
//
// The files stay in the repository. They are simply not copied into dist/, so
// they cost nothing at deploy time and remain available if a level is ever
// wired to one. Review the list with:
//   node Traffic/tools/find-dead-models.js <requests.json>
const deadModelFiles = new Set(
  (() => {
    const manifest = path.join(__dirname, 'Traffic', 'tools', 'dead-model-files.json');
    if (!fs.existsSync(manifest)) {return [];}
    return JSON.parse(fs.readFileSync(manifest, 'utf8')).files || [];
  })()
);

function shouldExclude(name, isDirectory, relativePath = '') {
  const normalizedPath = relativePath.replace(/\\/g, '/');
  if (excludedPaths.has(normalizedPath)) {return true;}
  if (isDirectory) {return excludedDirectories.has(name) || name.startsWith('dist-');}
  if (deadModelFiles.has(normalizedPath)) {return true;}
  return excludedFiles.has(name) || excludedFilePatterns.some((pattern) => pattern.test(name));
}

function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    if (shouldExclude(entry.name, entry.isDirectory(), path.relative(__dirname, srcPath))) {continue;}

    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function copyTrafficPublicAssets() {
  const sourceDir = path.join(__dirname, 'Traffic', 'public')
  const targetDir = path.join(distDir, 'Traffic')
  if (!fs.existsSync(sourceDir)) {return}

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (!entry.isFile() || shouldExclude(entry.name, false)) {continue}
    fs.copyFileSync(path.join(sourceDir, entry.name), path.join(targetDir, entry.name))
  }
}

function assertSafeOutput(dir) {
  const forbidden = [];
  const forbiddenDirectories = new Set(['node_modules', '.opencode', '.freebuff', '.vercel']);
  const forbiddenFilePattern = /^(?:\.env(?:\..*)?|.*\.(?:db|sqlite|sqlite3))$/i;

  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      const relativePath = path.relative(dir, entryPath);
      if (entry.isDirectory()) {
        if (forbiddenDirectories.has(entry.name)) {
          forbidden.push(relativePath);
        } else {
          walk(entryPath);
        }
      } else if (forbiddenFilePattern.test(entry.name)) {
        forbidden.push(relativePath);
      }
    }
  }

  walk(dir);
  if (forbidden.length > 0) {
    throw new Error(`Unsafe files copied to dist/: ${forbidden.join(', ')}`);
  }

  // The dead-model manifest is only safe while it is a strict subset of what
  // was actually observed. If someone hand-edits the list and drops a live
  // asset, that file silently disappears from the deploy and the level breaks
  // at runtime with no build error. The browser is the only authority on what
  // is used, so the capture is checked in alongside the manifest and any
  // disagreement here stops the build.
  const capture = path.join(__dirname, 'Traffic', 'tools', 'model-requests.json');
  if (fs.existsSync(capture) && deadModelFiles.size) {
    const observed = JSON.parse(fs.readFileSync(capture, 'utf8'))
      .map((p) => decodeURIComponent(p).replace(/\\/g, '/'));
    const wronglyExcluded = observed.filter((p) => deadModelFiles.has(p));
    if (wronglyExcluded.length > 0) {
      throw new Error(
        `dead-model-files.json excludes ${wronglyExcluded.length} asset(s) the browser actually loads, ` +
        `starting with: ${wronglyExcluded.slice(0, 5).join(', ')}. ` +
        'Regenerate the manifest with Traffic/tools/find-dead-models.js.'
      );
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
  copyTrafficPublicAssets();
  assertSafeOutput(distDir);
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
