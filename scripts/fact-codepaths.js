/**
 * Counts hand-written source lines so the "15K+ lines of hand-crafted code"
 * claim published on about.html can be verified instead of guessed.
 */
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const IGNORE_DIRS = new Set(['node_modules', 'dist', 'dist-electron', 'dist-web', 'Models', 'Models And SFX', '.git', '.agents', '.opencode', 'public', 'assets', 'libs'])
const EXT = new Set(['.html', '.js', '.css', '.json', '.ts', '.tsx'])

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue
      walk(full, out)
    } else if (EXT.has(path.extname(entry.name).toLowerCase())) {
      out.push(full)
    }
  }
  return out
}

const files = walk(root, [])
let total = 0
const byArea = {}
for (const f of files) {
  const rel = path.relative(root, f).replace(/\\/g, '/')
  // Bulk data files (career records, generated payloads) are data, not hand-crafted code.
  if (fs.statSync(f).size > 400 * 1024) continue
  const area = rel.startsWith('Traffic/') ? 'Traffic/' : rel.startsWith('Terra3D/') ? 'Terra3D/' : 'root'
  const lines = fs.readFileSync(f, 'utf8').split('\n').length
  total += lines
  byArea[area] = (byArea[area] || 0) + lines
}

console.log('files scanned :', files.length)
console.log('total lines   :', total.toLocaleString())
for (const [area, n] of Object.entries(byArea).sort((a, b) => b[1] - a[1])) {
  console.log('  ' + area.padEnd(12) + n.toLocaleString())
}
