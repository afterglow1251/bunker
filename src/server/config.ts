export const config = {
  port: Number(process.env.PORT) || 3001,
  timers: {
    discussion: 120,
    voting: 60,
    catastropheReveal: 10,
    eliminationReveal: 8,
  },
  gracePeriod: 120_000, // 2 minutes for reconnection
}
