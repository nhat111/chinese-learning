import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { execSync } from 'node:child_process'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'

/** Recursively lists files under `dir`. */
function listFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listFiles(join(dir, e.name)) : [join(dir, e.name)],
  )
}

/**
 * Generates dist/sw.js from sw/sw.js after the build: injects the list of
 * files to precache and a version hash of their contents, so every deploy
 * with changed files installs a fresh service worker. Also writes
 * dist/version.json, read by the running app to notice a newer deploy.
 */
function pwaPlugin(audio: string, build: string): Plugin {
  let root = process.cwd()
  let outDir = 'dist'
  return {
    name: 'zv-service-worker',
    apply: 'build',
    configResolved(config) {
      root = config.root
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const files = listFiles(outDir)
        .map((f) => relative(outDir, f).split(sep).join('/'))
        .filter((f) => f !== 'sw.js' && f !== 'version.json' && !f.endsWith('.map') && !f.startsWith('audio/'))
        .sort()
      const hash = createHash('sha256')
      for (const f of files) hash.update(f).update(readFileSync(join(outDir, f)))
      const version = hash.digest('hex').slice(0, 12)
      const sw = readFileSync(resolve(root, 'sw/sw.js'), 'utf8')
        .replace('__VERSION__', version)
        .replace('__PRECACHE__', JSON.stringify(files.map((f) => `/${f}`)))
        .replace('__AUDIO_BASE__', audio)
      writeFileSync(join(outDir, 'sw.js'), sw)
      writeFileSync(join(outDir, 'version.json'), JSON.stringify({ version: build }))
      console.log(`sw.js: ${files.length} files precached, version ${version}`)
    },
  }
}

/**
 * Stroke-order data for Hanzi Writer, at /strokes/<char>.json, copied from
 * hanzi-writer-data for every character in public/data/hanzi.json. Built into
 * dist (and so precached for offline use); served from node_modules in dev.
 */
function strokePlugin(): Plugin {
  const dataDir = dirname(createRequire(import.meta.url).resolve('hanzi-writer-data/package.json'))
  const chars = (): string[] => {
    const { items } = JSON.parse(readFileSync('public/data/hanzi.json', 'utf8')) as { items: { char: string }[] }
    return [...new Set(items.map((i) => i.char))]
  }
  const read = (ch: string) => readFileSync(join(dataDir, `${ch}.json`))
  return {
    name: 'zv-strokes',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const m = /^\/strokes\/(.+)\.json$/.exec((req.url ?? '').split('?')[0])
        if (!m) return next()
        try {
          const body = read(decodeURIComponent(m[1]))
          res.setHeader('Content-Type', 'application/json')
          res.end(body)
        } catch {
          res.statusCode = 404
          res.end()
        }
      })
    },
    generateBundle() {
      for (const ch of chars()) this.emitFile({ type: 'asset', fileName: `strokes/${ch}.json`, source: read(ch) })
    },
  }
}

function gitCommit(): string {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return 'dev'
  }
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  // '' = this origin (public/audio). Set to another host to move the MP3s out of the deployment.
  const audio = (env.VITE_AUDIO_BASE_URL ?? '').trim().replace(/\/+$/, '')
  const build = command === 'build' ? `${gitCommit()} · ${new Date().toISOString().slice(0, 16).replace('T', ' ')}` : 'dev'
  return {
    plugins: [react(), strokePlugin(), pwaPlugin(audio, build)],
    define: {
      __APP_VERSION__: JSON.stringify(build),
      __AUDIO_BASE__: JSON.stringify(audio),
    },
  }
})
