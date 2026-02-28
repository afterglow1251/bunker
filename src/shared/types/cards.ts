import type { TRAIT_TYPES } from '../constants'

export type TraitType = (typeof TRAIT_TYPES)[number]

export interface PlayerTraits {
  profession: string
  age: number
  sex: string
  health: string
  hobby: string
  phobia: string
  trait: string
  baggage: string
}

export interface ActionCard {
  id: string
  type: ActionCardType
  name: string
  description: string
  used: boolean
}

export type ActionCardType =
  | 'swap_trait'
  | 'peek'
  | 'exchange_with_player'
  | 'reveal_other'
  | 'double_vote'
  | 'immunity'
