import { describe, expect, it } from 'vitest'
import { readFirebaseConfig } from './firebase-config'

const saved = { apiKey: 'web-key', projectId: 'wedding-project', appId: '1:123:web:abc' }

describe('Firebase Web configuration', () => {
  it('keeps the guestbook disabled until all required configuration is present', () => {
    expect(readFirebaseConfig({}, {})).toBeUndefined()
    expect(readFirebaseConfig({}, { projectId: 'wedding-project' })).toBeUndefined()
  })
  it('uses tracked public configuration and derives the auth domain', () => {
    expect(readFirebaseConfig({}, saved)).toEqual({ ...saved, authDomain: 'wedding-project.firebaseapp.com' })
  })
  it('supports environment overrides without empty CI variables clearing saved values', () => {
    expect(readFirebaseConfig({ VITE_FIREBASE_PROJECT_ID: '  another-project ', VITE_FIREBASE_API_KEY: '' }, saved))
      .toMatchObject({ apiKey: 'web-key', projectId: 'another-project', authDomain: 'another-project.firebaseapp.com' })
  })
  it('never enables an emulator-only demo project in a production build', () => {
    expect(readFirebaseConfig({ PROD: true }, { ...saved, projectId: 'demo-test' })).toBeUndefined()
    expect(readFirebaseConfig({ DEV: true }, { ...saved, projectId: 'demo-test' })).toBeDefined()
  })
})
