import type { FirebaseOptions } from 'firebase/app'

/** Public Firebase Web app configuration; never put a service-account key here. */
export const firebaseWebConfig: FirebaseOptions = {
  apiKey: 'AIzaSyBiAIoBNnCxuJOv55JITDzk_SR-ezVZ5ms',
  authDomain: 'wedding-bfc6a.firebaseapp.com',
  projectId: 'wedding-bfc6a',
  storageBucket: 'wedding-bfc6a.firebasestorage.app',
  messagingSenderId: '883432002161',
  appId: '1:883432002161:web:ce245265ced45cddd881d0',
}

/** Enable on the public site after Firestore Rules and Anonymous Auth are ready. */
export const firebaseGuestbookReady = false
