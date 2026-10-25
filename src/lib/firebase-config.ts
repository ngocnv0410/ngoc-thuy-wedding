import type { FirebaseOptions } from 'firebase/app'
import { firebaseGuestbookReady } from '../content/firebase'

type Environment = Record<string, string | boolean | undefined>

export function readFirebaseConfig(env: Environment): FirebaseOptions | undefined {
  const value = (key: string) => {
    const raw = env[key]
    return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined
  }
  const projectId = value('VITE_FIREBASE_PROJECT_ID')
  const apiKey = value('VITE_FIREBASE_API_KEY')
  const appId = value('VITE_FIREBASE_APP_ID')
  if (!projectId || !apiKey || !appId || (env.PROD && projectId.startsWith('demo-'))) return undefined
  return {
    projectId, apiKey, appId,
    authDomain: value('VITE_FIREBASE_AUTH_DOMAIN') || `${projectId}.firebaseapp.com`,
  }
}

export const guestbookConfig = readFirebaseConfig(import.meta.env)
export const guestbookEnabled = Boolean(guestbookConfig) && (import.meta.env.DEV || firebaseGuestbookReady)
