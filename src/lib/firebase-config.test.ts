import { describe, expect, it } from 'vitest'
import { readFirebaseConfig } from './firebase-config'

const configured = { VITE_FIREBASE_API_KEY: 'web-key', VITE_FIREBASE_PROJECT_ID: 'wedding-project', VITE_FIREBASE_APP_ID: '1:123:web:abc' }

describe('Firebase Web configuration', () => {
  it('keeps the guestbook disabled until all required configuration is present', () => {
    expect(readFirebaseConfig({})).toBeUndefined()
    expect(readFirebaseConfig({ VITE_FIREBASE_PROJECT_ID: 'wedding-project' })).toBeUndefined()
    expect(readFirebaseConfig({ ...configured, VITE_FIREBASE_API_KEY: '  ' })).toBeUndefined()
  })
  it('reads Cloudflare build variables and derives the auth domain', () => {
    expect(readFirebaseConfig(configured)).toEqual({ apiKey: 'web-key', projectId: 'wedding-project', appId: '1:123:web:abc', authDomain: 'wedding-project.firebaseapp.com' })
  })
  it('trims variables and supports a custom auth domain', () => {
    expect(readFirebaseConfig({ ...configured, VITE_FIREBASE_PROJECT_ID: '  another-project ', VITE_FIREBASE_AUTH_DOMAIN: ' auth.example.com ' }))
      .toMatchObject({ apiKey: 'web-key', projectId: 'another-project', authDomain: 'auth.example.com' })
  })
  it('never enables an emulator-only demo project in a production build', () => {
    expect(readFirebaseConfig({ ...configured, PROD: true, VITE_FIREBASE_PROJECT_ID: 'demo-test' })).toBeUndefined()
    expect(readFirebaseConfig({ ...configured, DEV: true, VITE_FIREBASE_PROJECT_ID: 'demo-test' })).toBeDefined()
  })
})
