import type { FirebaseOptions } from 'firebase/app'
import { firebaseGuestbookReady, firebaseWebConfig } from '../content/firebase'

type Environment = Record<string, string | boolean | undefined>

export function readFirebaseConfig(env: Environment, fallback: FirebaseOptions): FirebaseOptions | undefined {
  const value = (key: string, saved?: string) => {
    const raw = env[key]
    return typeof raw === 'string' && raw.trim() ? raw.trim() : saved?.trim()
  }
  const projectId = value('VITE_FIREBASE_PROJECT_ID', fallback.projectId)
  // Never fall back to a key stored in source, including a previously leaked key.
  const apiKey = value('VITE_FIREBASE_API_KEY')
  const appId = value('VITE_FIREBASE_APP_ID', fallback.appId)
  if (!projectId || !apiKey || !appId || (env.PROD && projectId.startsWith('demo-'))) return undefined
  return {
    projectId, apiKey, appId,
    authDomain: value('VITE_FIREBASE_AUTH_DOMAIN', fallback.authDomain) || `${projectId}.firebaseapp.com`,
  }
}

export const guestbookConfig = readFirebaseConfig(import.meta.env, firebaseWebConfig)
export const guestbookEnabled = Boolean(guestbookConfig) && (import.meta.env.DEV || firebaseGuestbookReady)
