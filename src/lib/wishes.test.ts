import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Timestamp } from 'firebase/firestore'
import { sendWish, watchGuestWish } from './wishes'

const mocks = vi.hoisted(() => ({
  auth: { currentUser: null as null | { uid: string }, authStateReady: vi.fn().mockResolvedValue(undefined) },
  onAuthStateChanged: vi.fn(), onSnapshot: vi.fn(), signInAnonymously: vi.fn(),
  runTransaction: vi.fn(), stopAuth: vi.fn(), stopWish: vi.fn(),
}))
vi.mock('./firebase-config', () => ({ guestbookConfig: { projectId: 'demo-wishes', apiKey: 'demo-key', appId: 'demo-app' } }))
vi.mock('firebase/app', () => ({ getApps: () => [], initializeApp: () => ({}), getApp: () => ({}) }))
vi.mock('firebase/auth', () => ({
  getAuth: () => mocks.auth, connectAuthEmulator: vi.fn(),
  onAuthStateChanged: mocks.onAuthStateChanged, signInAnonymously: mocks.signInAnonymously,
}))
vi.mock('firebase/firestore', async (original) => ({
  ...await original<typeof import('firebase/firestore')>(),
  getFirestore: () => ({}), doc: (_db: unknown, _collection: string, id: string) => ({ id }),
  onSnapshot: mocks.onSnapshot, runTransaction: mocks.runTransaction,
}))

const saved = { name: 'Khách mời', message: 'Chúc hai bạn hạnh phúc!', createdAt: Timestamp.fromMillis(123456) }
const savedWish = { id: 'returning-guest', ...saved, createdAt: 123456 }
const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0))
function snapshot(data: typeof saved | undefined, fromCache = false, pending = false) {
  return { id: 'returning-guest', data: () => data, metadata: { fromCache, hasPendingWrites: pending } }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('navigator', { onLine: true })
  mocks.auth.currentUser = null
  mocks.onAuthStateChanged.mockReturnValue(mocks.stopAuth)
  mocks.onSnapshot.mockReturnValue(mocks.stopWish)
})

describe('guestbook returning guests and acknowledged submissions', () => {
  it('checks the restored identity without signing up a new guest', async () => {
    const onWish = vi.fn()
    const stop = watchGuestWish(onWish, vi.fn())
    await tick()
    mocks.onAuthStateChanged.mock.calls[0][1](null)
    expect(onWish).toHaveBeenCalledWith(null)
    expect(mocks.signInAnonymously).not.toHaveBeenCalled()
    expect(mocks.onSnapshot).not.toHaveBeenCalled()
    stop()
    expect(mocks.stopAuth).toHaveBeenCalledOnce()
  })

  it('waits for a server check before treating a restored guest as eligible to write', async () => {
    const onWish = vi.fn()
    const stop = watchGuestWish(onWish, vi.fn())
    await tick()
    mocks.onAuthStateChanged.mock.calls[0][1]({ uid: 'returning-guest' })
    const onSnapshot = mocks.onSnapshot.mock.calls[0][2]
    onSnapshot(snapshot(undefined, true))
    expect(onWish).not.toHaveBeenCalled()
    onSnapshot(snapshot(saved, false, true))
    expect(onWish).not.toHaveBeenCalled()
    onSnapshot(snapshot(saved))
    expect(onWish).toHaveBeenCalledWith(savedWish)
    stop()
    expect(mocks.stopWish).toHaveBeenCalledOnce()
  })

  it('allows a restored guest with no saved wish after a confirmed empty response', async () => {
    const onWish = vi.fn()
    const stop = watchGuestWish(onWish, vi.fn())
    await tick()
    mocks.onAuthStateChanged.mock.calls[0][1]({ uid: 'returning-guest' })
    mocks.onSnapshot.mock.calls[0][2](snapshot(undefined))
    expect(onWish).toHaveBeenCalledWith(null)
    stop()
  })

  it('ignores late reads after replay disconnects the old section', async () => {
    const onWish = vi.fn()
    const stop = watchGuestWish(onWish, vi.fn())
    await tick()
    mocks.onAuthStateChanged.mock.calls[0][1]({ uid: 'returning-guest' })
    const callback = mocks.onSnapshot.mock.calls[0][2]
    stop()
    callback(snapshot(saved))
    expect(onWish).not.toHaveBeenCalled()
  })

  it('returns the original wish on a duplicate instead of displaying the rejected draft', async () => {
    mocks.auth.currentUser = { uid: 'returning-guest' }
    const set = vi.fn()
    mocks.runTransaction.mockImplementation(async (_db, action) => action({
      get: async () => ({ ...snapshot(saved), exists: () => true }), set,
    }))
    await expect(sendWish({ name: 'Tên khác', message: 'Nội dung gửi lại' }))
      .resolves.toEqual({ alreadySent: true, wish: savedWish })
    expect(set).not.toHaveBeenCalled()
  })

  it('returns a displayable wish only after the transaction commit is acknowledged', async () => {
    mocks.auth.currentUser = { uid: 'new-guest' }
    let acknowledge!: () => void
    const committed = new Promise<void>((resolve) => { acknowledge = resolve })
    mocks.runTransaction.mockImplementation(async (_db, action) => {
      const result = await action({ get: async () => ({ exists: () => false }), set: vi.fn() })
      await committed
      return result
    })
    let resolved = false
    const sending = sendWish({ name: '  Khách mới  ', message: saved.message }).then((value) => { resolved = true; return value })
    await tick()
    expect(resolved).toBe(false)
    acknowledge()
    expect(await sending).toEqual({ alreadySent: false, wish: {
      id: 'new-guest', name: 'Khách mới', message: saved.message, createdAt: expect.any(Number),
    } })
  })
})
