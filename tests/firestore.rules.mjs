import { after, before, beforeEach, describe, it } from 'node:test'
import { readFile } from 'node:fs/promises'
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, Timestamp, updateDoc } from 'firebase/firestore'

let env
const collectionName = 'weddingWishes'
const valid = () => ({ name: 'Khách mời', message: 'Chúc Ngọc & Thủy luôn hạnh phúc! 💛', createdAt: serverTimestamp() })
const ref = (context, id = 'guest-a') => doc(context.firestore(), collectionName, id)

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-ngoc-thuy-wedding',
    firestore: { rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8') },
  })
})
beforeEach(async () => { await env.clearFirestore() })
after(async () => { await env?.cleanup() })

describe('public wedding guestbook rules', () => {
  it('accepts an authenticated guest creating their own wish with a server timestamp', async () => {
    await assertSucceeds(setDoc(ref(env.authenticatedContext('guest-a')), valid()))
    await assertSucceeds(getDoc(ref(env.unauthenticatedContext())))
  })
  it('rejects unauthenticated writes and impersonating another guest', async () => {
    await assertFails(setDoc(ref(env.unauthenticatedContext()), valid()))
    await assertFails(setDoc(ref(env.authenticatedContext('guest-b')), valid()))
  })
  it('rejects missing, extra and wrongly typed fields', async () => {
    const context = env.authenticatedContext('guest-a')
    await assertFails(setDoc(ref(context), { name: 'A', createdAt: serverTimestamp() }))
    await assertFails(setDoc(ref(context), { ...valid(), admin: true }))
    await assertFails(setDoc(ref(context), { ...valid(), name: 123 }))
    await assertFails(setDoc(ref(context), { ...valid(), message: ['test'] }))
  })
  it('rejects blank and overlong names and messages', async () => {
    const context = env.authenticatedContext('guest-a')
    for (const name of ['', '   ', '\t\n', '\u00a0', '\u2003', '\u200b', 'a'.repeat(61)]) {
      await assertFails(setDoc(ref(context), { ...valid(), name }))
    }
    for (const message of ['', '    ', '\t\n\r', '\u00a0\u2003\u200d', 'a'.repeat(601)]) {
      await assertFails(setDoc(ref(context), { ...valid(), message }))
    }
  })
  it('accepts a multiline Vietnamese message and boundary lengths', async () => {
    await assertSucceeds(setDoc(ref(env.authenticatedContext('guest-a')), {
      ...valid(), name: 'a'.repeat(60), message: 'a'.repeat(600),
    }))
    await assertSucceeds(setDoc(ref(env.authenticatedContext('guest-b'), 'guest-b'), {
      ...valid(), message: 'Chúc mừng hai bạn!\nTrăm năm hạnh phúc 💛',
    }))
  })
  it('accepts Vietnamese and emoji within client length limits', async () => {
    await assertSucceeds(setDoc(ref(env.authenticatedContext('guest-a')), {
      ...valid(), name: 'đ'.repeat(60), message: 'ế'.repeat(600),
    }))
    await assertSucceeds(setDoc(ref(env.authenticatedContext('guest-b'), 'guest-b'), {
      ...valid(), message: '💛'.repeat(300),
    }))
  })
  it('rejects forged creation times', async () => {
    await assertFails(setDoc(ref(env.authenticatedContext('guest-a')), { ...valid(), createdAt: Timestamp.fromMillis(0) }))
  })
  it('allows only one immutable wish per identity, including its author', async () => {
    const context = env.authenticatedContext('guest-a')
    await assertSucceeds(setDoc(ref(context), valid()))
    await assertFails(setDoc(ref(context), valid()))
    await assertFails(updateDoc(ref(context), { message: 'Changed' }))
    await assertFails(deleteDoc(ref(context)))
    await assertFails(deleteDoc(ref(env.authenticatedContext('guest-b'))))
  })
  it('allows bounded public reads but rejects an unbounded or oversized query', async () => {
    const db = env.unauthenticatedContext().firestore()
    await assertSucceeds(getDocs(query(collection(db, collectionName), orderBy('createdAt', 'desc'), limit(40))))
    await assertFails(getDocs(collection(db, collectionName)))
    await assertFails(getDocs(query(collection(db, collectionName), limit(51))))
  })
  it('does not grant access to unrelated collections', async () => {
    const db = env.authenticatedContext('guest-a').firestore()
    await assertFails(setDoc(doc(db, 'private', 'anything'), { value: true }))
    await assertFails(getDoc(doc(db, 'private', 'anything')))
  })
})
