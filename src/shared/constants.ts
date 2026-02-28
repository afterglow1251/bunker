export const MIN_PLAYERS = 4
export const MAX_PLAYERS = 16
export const ROOM_CODE_LENGTH = 5

export const DEFAULT_TIMERS = {
  discussion: 120,
  voting: 60,
  catastropheReveal: 10,
  eliminationReveal: 8,
}

export const TRAITS_PER_ROUND: Record<number, number[]> = {
  4: [3, 3, 2], 5: [3, 3, 2], 6: [3, 3, 2],
  7: [3, 2, 2, 1], 8: [3, 2, 2, 1],
  9: [3, 2, 1, 1], 10: [3, 2, 1, 1],
  11: [2, 2, 1, 1], 12: [2, 2, 1, 1],
  13: [2, 1, 1, 1], 14: [2, 1, 1, 1], 15: [2, 1, 1, 1], 16: [2, 1, 1, 1],
}

export function getTraitsToReveal(playerCount: number, round: number): number {
  const s = TRAITS_PER_ROUND[Math.max(4, Math.min(16, playerCount))]
  return s[Math.min(round - 1, s.length - 1)]
}

export const DEFAULT_SPEECH_TIMERS = {
  accusation: 30,
  justification: 30,
  farewell: 15,
}

export const TRAIT_TYPES = [
  'profession',
  'age',
  'sex',
  'health',
  'hobby',
  'phobia',
  'trait',
  'baggage',
] as const

export const TRAIT_LABELS: Record<string, string> = {
  profession: 'Професія',
  age: 'Вік',
  sex: 'Стать',
  health: "Здоров'я",
  hobby: 'Хобі',
  phobia: 'Фобія',
  trait: 'Додаткова інформація',
  baggage: 'Багаж',
}
