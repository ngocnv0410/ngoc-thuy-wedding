import { describe, expect, it } from 'vitest'
import { googleApiKeyLines } from './check-secrets.mjs'

describe('Google API key source guard', () => {
  it('finds keys in code, comments and env files without returning their values', () => {
    const key = 'AIza' + 'A'.repeat(35)
    expect(googleApiKeyLines(`const key = '${key}'\n// ${key}\nKEY=${key}`)).toEqual([1, 2, 3])
  })
  it('accepts variable names, placeholders and the detector itself', () => {
    expect(googleApiKeyLines('VITE_FIREBASE_API_KEY=\napiKey: process.env.KEY\nWEB_API_KEY\nAIza[0-9A-Za-z_-]{35}')).toEqual([])
  })
  it('detects supported URL-safe key characters and leaves unrelated text alone', () => {
    expect(googleApiKeyLines('a harmless string\n' + 'AIza' + '_-a2'.repeat(8) + 'abc')).toEqual([2])
  })
})
