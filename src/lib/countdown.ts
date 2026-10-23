/** Start of the wedding day in Vietnam, independent of the guest's time zone. */
export function weddingDayStart(solar: string): number {
  return Date.parse(`${solar}T00:00:00+07:00`)
}

export function countdownTo(target: number, now = Date.now()) {
  // Round up: the last fraction of a second is still one second to go.
  const remaining = Math.max(0, Math.ceil((target - now) / 1000))
  return {
    days: Math.floor(remaining / 86400),
    hours: Math.floor((remaining % 86400) / 3600),
    minutes: Math.floor((remaining % 3600) / 60),
    seconds: remaining % 60,
    reached: remaining === 0,
  }
}
