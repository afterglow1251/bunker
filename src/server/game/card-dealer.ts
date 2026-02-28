import {
  type PlayerTraits,
  type ActionCard,
  PROFESSIONS,
  HEALTH_CONDITIONS,
  HOBBIES,
  PHOBIAS,
  BAGGAGE,
  TRAITS,
  CATASTROPHES,
  BUNKERS,
  ACTION_CARDS,
} from '../../shared'
import { randomPick, randomInt, shuffle } from '../utils/random'
import { nanoid } from 'nanoid'

export function dealTraits(): PlayerTraits {
  return {
    profession: randomPick(PROFESSIONS),
    age: randomInt(18, 80),
    sex: randomPick(['Чоловік', 'Жінка']),
    health: randomPick(HEALTH_CONDITIONS),
    hobby: randomPick(HOBBIES),
    phobia: randomPick(PHOBIAS),
    trait: randomPick(TRAITS),
    baggage: randomPick(BAGGAGE),
  }
}

export function dealActionCard(): ActionCard {
  const template = randomPick(ACTION_CARDS)
  return {
    id: nanoid(8),
    type: template.type,
    name: template.name,
    description: template.description,
    used: false,
  }
}

export function dealCatastrophe(): { name: string; description: string } {
  return randomPick(CATASTROPHES)
}

export function dealBunker(): { description: string; capacity: string; supplies: string; flaw: string } {
  return randomPick(BUNKERS)
}

export function generateNewTrait(traitType: keyof PlayerTraits): string | number {
  switch (traitType) {
    case 'profession': return randomPick(PROFESSIONS)
    case 'age': return randomInt(18, 80)
    case 'sex': return randomPick(['Чоловік', 'Жінка'])
    case 'health': return randomPick(HEALTH_CONDITIONS)
    case 'hobby': return randomPick(HOBBIES)
    case 'phobia': return randomPick(PHOBIAS)
    case 'trait': return randomPick(TRAITS)
    case 'baggage': return randomPick(BAGGAGE)
  }
}
