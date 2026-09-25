const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const distRoot = path.join(projectRoot, 'dist')
const errors = []
const warnings = []

function addError(message) {
  errors.push(message)
}

function addWarning(message) {
  warnings.push(message)
}

function existsAsRoute(filePath) {
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {return true}
  if (fs.existsSync(filePath + '.html')) {return true}
  if (fs.existsSync(path.join(filePath, 'index.html'))) {return true}
  return false
}

function isExternalOrNonFileUrl(url) {
  return (
    !url ||
    url.startsWith('#') ||
    url.startsWith('data:') ||
    url.startsWith('blob:') ||
    url.startsWith('mailto:') ||
    url.startsWith('tel:') ||
    url.startsWith('javascript:') ||
    url.startsWith('//') ||
    /^[a-z][a-z\d+.-]*:/i.test(url)
  )
}

function checkLocalReference(htmlFile, rawUrl) {
  const url = rawUrl.split('#')[0].split('?')[0]
  if (!url || url === '/' || url === '/home' || url.includes('${') || url.includes('{{')) {return true}
  const target = url.startsWith('/')
    ? path.join(distRoot, url.replace(/^\/+/, ''))
    : path.resolve(path.dirname(htmlFile), url)
  if (existsAsRoute(target)) {return true}
  addWarning(`${path.relative(distRoot, htmlFile)} references missing ${rawUrl}`)
  return false
}

function walk(directory, visitor) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {walk(entryPath, visitor)}
    else {visitor(entryPath)}
  }
}

if (!fs.existsSync(distRoot)) {
  addError('dist/ does not exist. Run npm run build first.')
} else {
  const vercelConfigPath = path.join(projectRoot, 'vercel.json')
  try {
    const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'))
    if (vercelConfig.outputDirectory !== 'dist') {addError('vercel.json must set outputDirectory to dist.')}
    if (vercelConfig.buildCommand !== 'npm run build') {addError('vercel.json must set buildCommand to npm run build.')}
  } catch (error) {
    addError(`Could not parse vercel.json: ${error.message}`)
  }

  const requiredFiles = [
    'home.html',
    'about.html',
    'favicon.ico',
    'manifest.json',
    'sw.js',
    'config.json',
    'Traffic/Driving.html',
    'Traffic/Academy.html',
    'Traffic/TrafficDashboard.html',
    'Traffic/simulator-bundle.js'
  ]
  for (const relativePath of requiredFiles) {
    if (!fs.existsSync(path.join(distRoot, relativePath))) {addError(`Missing required output: ${relativePath}`)}
  }

  const forbiddenDirectoryNames = new Set(['node_modules', '.opencode', '.freebuff', '.vercel', 'Cyberpunk', 'scripts', 'scratch'])
  const forbiddenFilePattern = /^(?:\.env(?:\..*)?|.*\.(?:db|sqlite|sqlite3))$/i
  const forbiddenOutputPattern = /^(?:vite\.config\.(?:ts|mts|cts|js|mjs|cjs)|.*\.(?:exe|msi|dmg|appimage|pkg))$/i
  const htmlFiles = []
  let fileCount = 0
  let totalBytes = 0

  walk(distRoot, (filePath) => {
    fileCount += 1
    totalBytes += fs.statSync(filePath).size
    const relativePath = path.relative(distRoot, filePath)
    const segments = relativePath.split(path.sep)
    if (segments.some((segment) => forbiddenDirectoryNames.has(segment))) {addError(`Forbidden directory in output: ${relativePath}`)}
    if (forbiddenFilePattern.test(path.basename(filePath))) {addError(`Forbidden file in output: ${relativePath}`)}
    if (forbiddenOutputPattern.test(path.basename(filePath))) {addError(`Source or binary artifact in output: ${relativePath}`)}
    if (filePath.endsWith('.html')) {htmlFiles.push(filePath)}
  })

  for (const htmlFile of htmlFiles) {
    const html = fs.readFileSync(htmlFile, 'utf8')
    const referencePattern = /(?:^|[\s])(?:src|href)\s*=\s*["']([^"']+)["']/gi
    let match
    while ((match = referencePattern.exec(html))) {
      if (!isExternalOrNonFileUrl(match[1])) {checkLocalReference(htmlFile, match[1])}
    }
  }

  const sizeMb = totalBytes / (1024 * 1024)
  if (sizeMb > 500) {addWarning(`dist/ is ${sizeMb.toFixed(0)} MB; review unused 3D/source assets before deployment.`)}

  console.log(`Production check: ${fileCount} files, ${htmlFiles.length} HTML pages, ${sizeMb.toFixed(0)} MB.`)
}

if (warnings.length > 0) {
  console.warn(`Production check warnings (${warnings.length}):`)
  for (const warning of warnings.slice(0, 50)) {console.warn(`  - ${warning}`)}
  if (warnings.length > 50) {console.warn(`  ... ${warnings.length - 50} more warnings`)}
}

if (errors.length > 0) {
  console.error(`Production check failed (${errors.length} error(s)):`)
  for (const error of errors) {console.error(`  - ${error}`)}
  process.exit(1)
}

console.log('Production check passed.')
