type TimerCallback = () => void
type TickCallback = (secondsRemaining: number) => void

interface RoomTimer {
  interval: ReturnType<typeof setInterval> | null
  timeout: ReturnType<typeof setTimeout> | null
  remaining: number
}

const timers = new Map<string, RoomTimer>()

export const timerManager = {
  start(
    roomCode: string,
    durationSeconds: number,
    onTick: TickCallback,
    onComplete: TimerCallback,
  ) {
    this.clear(roomCode)

    let remaining = durationSeconds

    const interval = setInterval(() => {
      remaining--
      onTick(remaining)
      if (remaining <= 0) {
        this.clear(roomCode)
        onComplete()
      }
    }, 1000)

    timers.set(roomCode, { interval, timeout: null, remaining })
  },

  clear(roomCode: string) {
    const timer = timers.get(roomCode)
    if (timer) {
      if (timer.interval) clearInterval(timer.interval)
      if (timer.timeout) clearTimeout(timer.timeout)
      timers.delete(roomCode)
    }
  },

  getRemaining(roomCode: string): number {
    return timers.get(roomCode)?.remaining ?? 0
  },
}
