import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export function googleApiKeyLines(text) {
  return text.split('\n').flatMap((line, index) => /AIza[0-9A-Za-z_-]{35}/.test(line) ? [index + 1] : [])
}

export function checkTrackedFiles() {
  const paths = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean)
  let findings = 0
  for (const path of paths) {
    let contents
    try { contents = readFileSync(path) } catch (error) {
      if (error.code === 'ENOENT') continue // A tracked file can be removed in a pending change.
      throw error
    }
    if (contents.includes(0)) continue
    for (const line of googleApiKeyLines(contents.toString('utf8'))) {
      // Report locations only; never echo the credential into logs.
      console.error(`Google API key must be removed from tracked source: ${path}:${line}`)
      findings++
    }
  }
  return findings
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const findings = checkTrackedFiles()
  if (findings) process.exitCode = 1
  else console.log('No Google API key literals found in tracked files.')
}
