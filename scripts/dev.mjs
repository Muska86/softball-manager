/**
 * Dev launcher — starts the local API server and Vite in parallel.
 * Cross-platform, zero extra dependencies (uses only node:child_process).
 *
 * Usage: node scripts/dev.mjs   (via "npm run dev")
 */

import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const isWin = process.platform === 'win32'

// Load .env.local into process.env so child processes inherit it
const envLocalPath = path.join(root, '.env.local')
if (fs.existsSync(envLocalPath)) {
  const lines = fs.readFileSync(envLocalPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (key && !(key in process.env)) process.env[key] = val
  }
  console.log('  \x1b[2m[dev] Loaded .env.local\x1b[0m')
}

function spawnLabeled(cmd, args, label, colorCode) {
  const prefix = `  \x1b[${colorCode}m[${label}]\x1b[0m `
  const child = spawn(cmd, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
    env: process.env,
    cwd: root,
  })

  const tag = (data) =>
    data
      .toString()
      .split('\n')
      .map((l) => (l.trim() ? prefix + l : l))
      .join('\n')

  child.stdout.on('data', (d) => process.stdout.write(tag(d)))
  child.stderr.on('data', (d) => process.stderr.write(tag(d)))
  return child
}

// Run vite via node directly — works cross-platform without shell
const viteEntry = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
const api  = spawnLabeled('node', ['scripts/local-api.mjs'], 'api ', '36') // cyan
const vite = spawnLabeled('node', [viteEntry],               'vite', '35') // magenta

function killAll(code = 0) {
  api.kill()
  vite.kill()
  process.exit(code)
}

api.on('exit',  (c) => { process.stdout.write('\n'); killAll(c ?? 0) })
vite.on('exit', (c) => { process.stdout.write('\n'); killAll(c ?? 0) })
process.on('SIGINT',  () => killAll(0))
process.on('SIGTERM', () => killAll(0))
