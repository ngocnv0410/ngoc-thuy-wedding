import { spawnSync } from 'node:child_process'
import { loadEnv } from 'vite'

// Build variables/secrets are available during the build, not at static request time.
const firebaseEnv = loadEnv('production', process.cwd(), 'VITE_FIREBASE_')
const required = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_APP_ID']
const missing = required.filter((key) => !firebaseEnv[key]?.trim())
if (missing.length) {
  console.error(`Missing Cloudflare build variables: ${missing.join(', ')}. Add them in Settings > Build > Build variables and secrets, then rebuild.`)
  process.exit(1)
}
if (firebaseEnv.VITE_FIREBASE_PROJECT_ID.trim().startsWith('demo-') || firebaseEnv.VITE_FIREBASE_EMULATORS === 'true') {
  console.error('Cloudflare must use the real Firebase project, with emulators disabled.')
  process.exit(1)
}

const siteEnv = loadEnv('production', process.cwd(), ['SITE_URL', 'CF_PAGES_URL'])
const siteUrl = siteEnv.SITE_URL?.trim() || siteEnv.CF_PAGES_URL?.trim()
  || 'https://ngoc-thuy-wedding.ngoc-nv0410.workers.dev'

// Static Assets serves the app at the domain root, including images, music and QR.
const result = spawnSync('npm', ['run', 'build'], {
  stdio: 'inherit', env: { ...process.env, ...firebaseEnv, SITE_URL: siteUrl, BASE_PATH: '/' },
})
if (result.error) console.error('Could not start the production build.')
process.exit(result.status ?? 1)
