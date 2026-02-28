import type { ActionCardType } from '../types/cards'

export interface ActionCardTemplate {
  type: ActionCardType
  name: string
  description: string
}

export const ACTION_CARDS: ActionCardTemplate[] = [
  {
    type: 'swap_trait',
    name: 'Обміняти характеристику',
    description: 'Замініть одну свою характеристику на випадкову нову',
  },
  {
    type: 'peek',
    name: 'Підглянути',
    description: 'Побачте одну нерозкриту характеристику іншого гравця',
  },
  {
    type: 'exchange_with_player',
    name: 'Обмін з гравцем',
    description: 'Обміняйте одну характеристику з іншим гравцем',
  },
  {
    type: 'reveal_other',
    name: 'Розкрити чужу',
    description: 'Примусово розкрийте випадкову характеристику іншого гравця',
  },
  {
    type: 'double_vote',
    name: 'Подвійний голос',
    description: 'Ваш голос рахується як 2 в цьому раунді',
  },
  {
    type: 'immunity',
    name: 'Імунітет',
    description: 'Захист від вигнання на 1 раунд',
  },
]
