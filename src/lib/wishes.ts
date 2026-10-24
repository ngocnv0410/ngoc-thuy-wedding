import { getApp, getApps, initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, signInAnonymously } from 'firebase/auth'
import {
  collection, connectFirestoreEmulator, doc, getFirestore, limit, onSnapshot, orderBy,
  query, runTransaction, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { guestbookConfig } from './firebase-config'
import { normalizeWish, validateWish, type WeddingWish, type WishDraft } from './wish-content'

const APP_NAME = 'wedding-guestbook'
const COLLECTION = 'weddingWishes'
export const WISH_FEED_LIMIT = 40

if (!guestbookConfig) throw new Error('Firebase Web configuration is missing')
const app = getApps().some((item) => item.name === APP_NAME) ? getApp(APP_NAME) : initializeApp(guestbookConfig, APP_NAME)
// Optional App Check. Enforcement is enabled separately in the Firebase console.
const appCheckKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY?.trim()
const appCheckReady = appCheckKey
  ? import('firebase/app-check').then(({ initializeAppCheck, ReCaptchaV3Provider }) => {
    initializeAppCheck(app, { provider: new ReCaptchaV3Provider(appCheckKey), isTokenAutoRefreshEnabled: true })
  })
  : Promise.resolve()

// App Check must be initialized before Auth restores a saved guest session.
const clientsReady = appCheckReady.then(() => {
  const db = getFirestore(app)
  const auth = getAuth(app)

  // Only the local development server may connect to the test emulators.
  if (import.meta.env.DEV && import.meta.env.VITE_FIREBASE_EMULATORS === 'true'
    && ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)) {
    connectFirestoreEmulator(db, '127.0.0.1', 8080)
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  }
  return { db, auth }
})

export function watchWishes(onWishes: (wishes: WeddingWish[], fromCache: boolean) => void, onError: (error: unknown) => void) {
  let stop: (() => void) | undefined
  let cancelled = false
  clientsReady.then(({ db }) => {
    if (cancelled) return
    stop = onSnapshot(query(collection(db, COLLECTION), orderBy('createdAt', 'desc'), limit(WISH_FEED_LIMIT)),
      { includeMetadataChanges: true },
      (snapshot) => {
        const wishes: WeddingWish[] = []
        for (const item of snapshot.docs) {
          const data = item.data()
          // A local, unacknowledged write must never be displayed as a sent wish.
          if (item.metadata.hasPendingWrites || !(data.createdAt instanceof Timestamp)
            || typeof data.name !== 'string' || typeof data.message !== 'string') continue
          if (!validateWish({ name: data.name, message: data.message })) {
            wishes.push({ id: item.id, name: data.name, message: data.message, createdAt: data.createdAt.toMillis() })
          }
        }
        onWishes(wishes, snapshot.metadata.fromCache)
      }, onError)
  }).catch(onError)
  return () => { cancelled = true; stop?.() }
}

/** One immutable wish per anonymous identity. Transactions do not queue offline writes. */
export async function sendWish(draft: WishDraft): Promise<{ alreadySent: boolean }> {
  const clean = normalizeWish(draft)
  const invalid = validateWish(clean)
  if (invalid) throw new Error(invalid)
  if (!navigator.onLine) throw Object.assign(new Error('Offline'), { code: 'guestbook/offline' })
  const { db, auth } = await clientsReady
  await auth.authStateReady()
  const user = auth.currentUser ?? (await signInAnonymously(auth)).user
  const ref = doc(db, COLLECTION, user.uid)
  const alreadySent = await runTransaction(db, async (transaction) => {
    if ((await transaction.get(ref)).exists()) return true
    transaction.set(ref, { ...clean, createdAt: serverTimestamp() })
    return false
  }, { maxAttempts: 3 })
  return { alreadySent }
}
