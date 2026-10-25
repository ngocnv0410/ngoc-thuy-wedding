import { describe, expect, it } from 'vitest'
import { readFirebaseConfig } from './firebase-config'

const saved = { projectId: 'wedding-project', appId: '1:123:web:abc' }
const env = { VITE_FIREBASE_API_KEY: 'web-key' }

describe('Firebase Web configuration', () => {
  it('keeps the guestbook disabled until all required configuration is present', () => {
    expect(readFirebaseConfig({}, {})).toBeUndefined()
    expect(readFirebaseConfig({}, { projectId: 'wedding-project' })).toBeUndefined()
    expect(readFirebaseConfig({}, saved)).toBeUndefined()
  })
  it('uses the build key with public project identifiers and derives the auth domain', () => {
    expect(readFirebaseConfig(env, saved)).toEqual({ ...saved, apiKey: 'web-key', authDomain: 'wedding-project.firebaseapp.com' })
  })
  it('supports environment overrides without empty CI variables clearing public identifiers', () => {
    expect(readFirebaseConfig({ ...env, VITE_FIREBASE_PROJECT_ID: '  another-project ', VITE_FIREBASE_APP_ID: '' }, saved))
      .toMatchObject({ apiKey: 'web-key', projectId: 'another-project', authDomain: 'another-project.firebaseapp.com' })
  })
  it('never reuses a hardcoded key if the environment key is missing or blank', () => {
    const legacy = { ...saved, apiKey: 'old-key' }
    expect(readFirebaseConfig({}, legacy)).toBeUndefined()
    expect(readFirebaseConfig({ VITE_FIREBASE_API_KEY: '  ' }, legacy)).toBeUndefined()
    expect(readFirebaseConfig({ VITE_FIREBASE_API_KEY: ' new-key ' }, legacy)?.apiKey).toBe('new-key')
  })
  it('never enables an emulator-only demo project in a production build', () => {
    expect(readFirebaseConfig({ ...env, PROD: true }, { ...saved, projectId: 'demo-test' })).toBeUndefined()
    expect(readFirebaseConfig({ ...env, DEV: true }, { ...saved, projectId: 'demo-test' })).toBeDefined()
  })
})
