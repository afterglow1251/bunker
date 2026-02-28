import type { Room, Player, TraitType, ActionCardResult } from '../../shared'
import { MIN_PLAYERS, TRAIT_TYPES, getTraitsToReveal, DEFAULT_SPEECH_TIMERS } from '../../shared'
import { dealTraits, dealActionCard, dealCatastrophe, dealBunker, generateNewTrait } from './card-dealer'
import { voteManager } from './vote-manager'
import { timerManager } from './timer-manager'
import { speechManager } from './speech-manager'
import { randomPick } from '../utils/random'
import type { ServerMessage } from '../../shared'

type BroadcastFn = (roomCode: string, message: ServerMessage, excludeId?: string) => void
type SendFn = (playerId: string, message: ServerMessage) => void

let broadcast: BroadcastFn = () => {}
let sendTo: SendFn = () => {}

export const gameEngine = {
  setBroadcast(fn: BroadcastFn) {
    broadcast = fn
    speechManager.setBroadcast(fn)
  },
  setSend(fn: SendFn) { sendTo = fn },

  // ── Helpers ──

  getAlivePlayersOrdered(room: Room): Player[] {
    const alive = room.players.filter(p => p.isAlive)
    if (room.turnOrderReversed) {
      return [...alive].reverse()
    }
    return alive
  },

  // ── Start Game ──

  startGame(room: Room): boolean {
    if (room.phase !== 'lobby') return false
    if (room.players.length < MIN_PLAYERS) return false

    for (const player of room.players) {
      player.traits = dealTraits()
      player.actionCard = dealActionCard()
      player.isAlive = true
      player.revealedTraits = []
      player.traitsRevealedThisRound = 0
      player.isImmune = false
      player.hasDoubleVote = false
    }

    const catastrophe = dealCatastrophe()
    const bunker = dealBunker()
    room.catastrophe = `${catastrophe.name}: ${catastrophe.description}`
    room.bunkerDescription = `${bunker.description} | Місткість: ${bunker.capacity} | Запаси: ${bunker.supplies} | Недолік: ${bunker.flaw}`
    room.survivorCount = Math.floor(room.players.length / 2)
    room.currentRound = 0
    room.eliminatedIds = []
    room.initialPlayerCount = room.players.length
    room.pendingDoubleElimination = false
    room.votePassUsed = false

    const playerOrder = room.players.map(p => p.id)
    const allPlayersData = room.players.map(p => ({
      id: p.id, nickname: p.nickname, traits: p.traits, actionCard: p.actionCard,
    }))
    for (const player of room.players) {
      sendTo(player.id, {
        type: 'GAME_STARTED',
        payload: {
          catastrophe: room.catastrophe,
          bunkerDescription: room.bunkerDescription,
          yourTraits: player.traits,
          yourActionCard: player.actionCard,
          playerOrder,
          ...(player.id === room.hostId ? { allPlayersData } : {}),
        },
      })
    }

    room.phase = 'catastrophe_reveal'

    setTimeout(() => {
      this.startRound(room)
    }, 10_000)

    return true
  },

  // ── Round Management ──

  startRound(room: Room) {
    room.currentRound++
    room.phase = 'trait_reveal'
    voteManager.resetVotes(room)
    room.revoteTargets = null
    room.justifiedThisRound = []
    room.revoteCount = 0
    room.previousRevoteCandidates = []
    room.eliminationsThisRound = 0

    // Determine how many eliminations this round
    if (room.pendingDoubleElimination) {
      room.eliminationsRequiredThisRound = 2
      room.pendingDoubleElimination = false
    } else {
      room.eliminationsRequiredThisRound = 1
    }

    // Alternating turn order: odd rounds = normal, even rounds = reversed
    room.turnOrderReversed = room.currentRound % 2 === 0

    // Calculate traits to reveal
    room.traitsToRevealThisRound = getTraitsToReveal(room.initialPlayerCount, room.currentRound)

    // Reset per-round state
    for (const player of room.players) {
      player.traitsRevealedThisRound = 0
      player.isImmune = false
      player.hasDoubleVote = false
    }

    const alivePlayers = this.getAlivePlayersOrdered(room)
    room.currentTurnPlayerId = alivePlayers[0]?.id ?? null

    broadcast(room.code, {
      type: 'ROUND_STARTED',
      payload: {
        roundNumber: room.currentRound,
        currentPlayerId: room.currentTurnPlayerId!,
        traitsToReveal: room.traitsToRevealThisRound,
      },
    })
  },

  // ── Trait Reveal ──

  revealTrait(room: Room, playerId: string, traitType: TraitType): boolean {
    if (room.phase !== 'trait_reveal') return false
    if (room.currentTurnPlayerId !== playerId) return false

    const player = room.players.find(p => p.id === playerId)
    if (!player || !player.isAlive) return false
    if (player.traitsRevealedThisRound >= room.traitsToRevealThisRound) return false
    if (player.revealedTraits.includes(traitType)) return false

    // Round 1, first trait must be profession
    if (room.currentRound === 1 && player.traitsRevealedThisRound === 0 && traitType !== 'profession') {
      return false
    }

    player.revealedTraits.push(traitType)
    player.traitsRevealedThisRound++

    const value = traitType === 'age' ? player.traits.age : player.traits[traitType]

    broadcast(room.code, {
      type: 'TRAIT_REVEALED',
      payload: { playerId, traitType, value },
    })

    // Check if this player has revealed enough traits
    if (player.traitsRevealedThisRound >= room.traitsToRevealThisRound) {
      this.advanceTurn(room)
    }

    return true
  },

  advanceTurn(room: Room) {
    const alivePlayers = this.getAlivePlayersOrdered(room)
    const currentIndex = alivePlayers.findIndex(p => p.id === room.currentTurnPlayerId)
    const nextIndex = currentIndex + 1

    if (nextIndex >= alivePlayers.length) {
      // All players revealed, move to discussion
      this.startDiscussion(room)
    } else {
      room.currentTurnPlayerId = alivePlayers[nextIndex].id

      // Skip disconnected players
      if (!alivePlayers[nextIndex].isConnected) {
        alivePlayers[nextIndex].traitsRevealedThisRound = room.traitsToRevealThisRound
        this.advanceTurn(room)
        return
      }

      // If next player has already revealed enough (reconnect case), skip
      if (alivePlayers[nextIndex].traitsRevealedThisRound >= room.traitsToRevealThisRound) {
        this.advanceTurn(room)
        return
      }

      broadcast(room.code, {
        type: 'TURN_CHANGED',
        payload: { currentPlayerId: room.currentTurnPlayerId },
      })
    }
  },

  // ── Discussion ──

  startDiscussion(room: Room) {
    room.phase = 'discussion'
    room.currentTurnPlayerId = null

    broadcast(room.code, {
      type: 'DISCUSSION_PHASE',
      payload: { timeLimit: room.settings.discussionTime },
    })

    timerManager.start(
      room.code,
      room.settings.discussionTime,
      (remaining) => {
        broadcast(room.code, { type: 'TIMER_TICK', payload: { secondsRemaining: remaining } })
      },
      () => {
        this.startAccusationSpeeches(room)
      },
    )
  },

  // ── Accusation Speeches ──

  startAccusationSpeeches(room: Room) {
    room.phase = 'accusation_speech'
    const speakers = this.getAlivePlayersOrdered(room).map(p => p.id)

    speechManager.startSpeechRound(
      room,
      speakers,
      'accusation',
      DEFAULT_SPEECH_TIMERS.accusation,
      () => {
        this.startVoting(room)
      },
    )
  },

  // ── Voting ──

  startVoting(room: Room, isRevote = false) {
    room.phase = 'voting'
    voteManager.resetVotes(room)

    // Revotes are OPEN — no candidate restriction
    if (!isRevote) {
      room.revoteTargets = null
    }

    broadcast(room.code, {
      type: 'VOTING_PHASE',
      payload: {
        timeLimit: room.settings.votingTime,
        candidates: undefined, // always open
      },
    })

    timerManager.start(
      room.code,
      room.settings.votingTime,
      (remaining) => {
        broadcast(room.code, { type: 'TIMER_TICK', payload: { secondsRemaining: remaining } })
      },
      () => {
        // Auto-vote against self for players who didn't vote
        this.autoVoteAbstainers(room)
        this.resolveVoting(room)
      },
    )
  },

  autoVoteAbstainers(room: Room) {
    const alivePlayers = room.players.filter(p => p.isAlive)
    for (const player of alivePlayers) {
      if (room.votes[player.id] === undefined) {
        room.votes[player.id] = player.id // vote against self
      }
    }
  },

  castVote(room: Room, voterId: string, targetId: string): boolean {
    if (room.phase !== 'voting') return false

    const success = voteManager.castVote(room, voterId, targetId)
    if (!success) return false

    const counts = voteManager.getVoteCounts(room)
    broadcast(room.code, { type: 'VOTE_UPDATE', payload: { votes: counts } })

    if (voteManager.allVotesCast(room)) {
      timerManager.clear(room.code)
      this.resolveVoting(room)
    }

    return true
  },

  castVotePass(room: Room, voterId: string): boolean {
    if (room.phase !== 'voting') return false
    if (room.currentRound !== 1) return false
    if (room.revoteCount > 0) return false // can't pass during revote

    const success = voteManager.castVote(room, voterId, '__PASS__')
    if (!success) return false

    const counts = voteManager.getVoteCounts(room)
    broadcast(room.code, { type: 'VOTE_UPDATE', payload: { votes: counts } })

    if (voteManager.allVotesCast(room)) {
      timerManager.clear(room.code)
      this.resolveVoting(room)
    }

    return true
  },

  // ── Vote Resolution ──

  resolveVoting(room: Room) {
    room.phase = 'vote_resolution'

    // Check for pass majority (round 1 only, first vote)
    if (room.currentRound === 1 && room.revoteCount === 0) {
      const counts = voteManager.getVoteCounts(room)
      const passVotes = counts['__PASS__'] || 0
      const totalVotes = Object.values(counts).reduce((a, b) => a + b, 0)

      if (passVotes > totalVotes / 2) {
        room.pendingDoubleElimination = true
        room.votePassUsed = true
        broadcast(room.code, { type: 'VOTE_PASS_RESULT', payload: { passed: true } })
        setTimeout(() => this.startRound(room), 3000)
        return
      }
    }

    // Check 70% supermajority
    const supermajorityResult = voteManager.checkSupermajority(room)
    if (supermajorityResult) {
      this.eliminatePlayer(room, supermajorityResult, 'supermajority')
      return
    }

    const result = voteManager.resolveVotes(room)

    // Is this a revote?
    if (room.revoteCount > 0) {
      this.resolveRevoteResult(room, result)
      return
    }

    // First vote
    if (result.isTie) {
      this.handleTie(room, result.tiedPlayerIds)
      return
    }

    if (result.eliminatedId) {
      if (room.justifiedThisRound.includes(result.eliminatedId)) {
        this.eliminatePlayer(room, result.eliminatedId, 'vote')
      } else {
        this.startJustificationSpeech(room, result.eliminatedId)
      }
    } else {
      this.checkNextEliminationOrRound(room)
    }
  },

  // ── Revote result (official rules) ──

  resolveRevoteResult(room: Room, result: { eliminatedId: string | null; isTie: boolean; tiedPlayerIds: string[] }) {
    const prev = room.previousRevoteCandidates

    if (result.isTie) {
      const tiedIds = result.tiedPlayerIds
      // Check if new player appeared in the tie
      const newPlayers = tiedIds.filter(id => !prev.includes(id))

      if (newPlayers.length > 0) {
        // New candidate(s) get justification, then another revote
        const needJustification = newPlayers.filter(id => !room.justifiedThisRound.includes(id))
        if (needJustification.length > 0) {
          room.phase = 'justification_speech'
          speechManager.startSpeechRound(
            room,
            needJustification,
            'justification',
            DEFAULT_SPEECH_TIMERS.justification,
            () => {
              room.justifiedThisRound.push(...needJustification)
              room.previousRevoteCandidates = tiedIds
              room.revoteCount++
              this.startVoting(room, true)
            },
          )
        } else {
          room.previousRevoteCandidates = tiedIds
          room.revoteCount++
          this.startVoting(room, true)
        }
        return
      }

      // Same candidates tied again
      if (room.currentRound === 1 && !room.votePassUsed) {
        // Round 1: skip + double next
        room.pendingDoubleElimination = true
        broadcast(room.code, { type: 'VOTE_PASS_RESULT', payload: { passed: true } })
        setTimeout(() => this.startRound(room), 3000)
      } else {
        // Other rounds: eliminate all tied
        this.eliminateMultiple(room, tiedIds)
      }
      return
    }

    if (result.eliminatedId) {
      const eid = result.eliminatedId
      // Was this player in the previous candidates?
      if (prev.includes(eid)) {
        // Votes changed among existing candidates — eliminate leader
        this.eliminatePlayer(room, eid, 'vote')
      } else {
        // New player leads
        if (room.justifiedThisRound.includes(eid)) {
          this.eliminatePlayer(room, eid, 'vote')
        } else {
          this.startJustificationSpeech(room, eid)
        }
      }
    } else {
      this.checkNextEliminationOrRound(room)
    }
  },

  // ── Tie Handling (first vote) ──

  handleTie(room: Room, tiedPlayerIds: string[]) {
    // Give justification to each tied player who hasn't had one
    const needJustification = tiedPlayerIds.filter(id => !room.justifiedThisRound.includes(id))

    const startRevote = () => {
      room.revoteCount++
      room.previousRevoteCandidates = tiedPlayerIds
      this.startVoting(room, true)
    }

    if (needJustification.length > 0) {
      room.phase = 'justification_speech'
      speechManager.startSpeechRound(
        room,
        needJustification,
        'justification',
        DEFAULT_SPEECH_TIMERS.justification,
        () => {
          room.justifiedThisRound.push(...needJustification)
          startRevote()
        },
      )
    } else {
      startRevote()
    }
  },

  // ── Justification Speech (single player, <70%) ──

  startJustificationSpeech(room: Room, playerId: string) {
    room.phase = 'justification_speech'
    room.justifiedThisRound.push(playerId)

    speechManager.startSpeechRound(
      room,
      [playerId],
      'justification',
      DEFAULT_SPEECH_TIMERS.justification,
      () => {
        // After justification — open revote
        room.revoteCount++
        room.previousRevoteCandidates = [playerId]
        this.startVoting(room, true)
      },
    )
  },

  // ── Elimination ──

  eliminatePlayer(room: Room, playerId: string, reason: 'supermajority' | 'vote' | 'tie' = 'vote') {
    room.phase = 'elimination'
    const player = room.players.find(p => p.id === playerId)
    if (!player) return

    player.isAlive = false
    room.eliminatedIds.push(playerId)
    room.eliminationsThisRound++

    broadcast(room.code, {
      type: 'PLAYER_ELIMINATED',
      payload: {
        playerId,
        allTraits: player.traits,
        actionCard: player.actionCard,
        reason,
      },
    })

    // Start farewell speech
    this.startFarewellSpeech(room, playerId)
  },

  eliminateMultiple(room: Room, playerIds: string[]) {
    room.phase = 'elimination'

    for (const pid of playerIds) {
      const player = room.players.find(p => p.id === pid)
      if (!player) continue
      player.isAlive = false
      room.eliminatedIds.push(pid)
      room.eliminationsThisRound++

      broadcast(room.code, {
        type: 'PLAYER_ELIMINATED',
        payload: {
          playerId: pid,
          allTraits: player.traits,
          actionCard: player.actionCard,
          reason: 'tie',
        },
      })
    }

    // Farewell speeches for all eliminated
    this.startFarewellSpeeches(room, playerIds)
  },

  // ── Farewell Speech ──

  startFarewellSpeech(room: Room, playerId: string) {
    room.phase = 'farewell_speech'

    speechManager.startSpeechRound(
      room,
      [playerId],
      'farewell',
      DEFAULT_SPEECH_TIMERS.farewell,
      () => {
        this.checkNextEliminationOrRound(room)
      },
    )
  },

  startFarewellSpeeches(room: Room, playerIds: string[]) {
    room.phase = 'farewell_speech'

    speechManager.startSpeechRound(
      room,
      playerIds,
      'farewell',
      DEFAULT_SPEECH_TIMERS.farewell,
      () => {
        this.checkNextEliminationOrRound(room)
      },
    )
  },

  // ── Post-elimination check ──

  checkNextEliminationOrRound(room: Room) {
    const alivePlayers = room.players.filter(p => p.isAlive)

    // Check win condition
    if (alivePlayers.length <= room.survivorCount) {
      this.endGame(room)
      return
    }

    // Check if more eliminations needed this round
    if (room.eliminationsThisRound < room.eliminationsRequiredThisRound) {
      // Need another elimination cycle
      room.revoteTargets = null
      room.revoteCount = 0
      room.previousRevoteCandidates = []
      room.justifiedThisRound = []
      this.startAccusationSpeeches(room)
      return
    }

    // Next round
    this.startRound(room)
  },

  // ── Game Over ──

  endGame(room: Room) {
    room.phase = 'game_over'
    timerManager.clear(room.code)
    speechManager.clear(room.code)

    const survivors = room.players.filter(p => p.isAlive)
    const eliminated = room.players.filter(p => !p.isAlive)

    broadcast(room.code, {
      type: 'GAME_OVER',
      payload: {
        survivors,
        eliminated,
        catastrophe: room.catastrophe!,
        bunkerDescription: room.bunkerDescription!,
      },
    })
  },

  // ── Skip Speech (host action) ──

  skipSpeech(room: Room, playerId: string): boolean {
    if (room.hostId !== playerId) return false
    if (!speechManager.isActive(room.code)) return false
    speechManager.skipCurrent(room)
    return true
  },

  // ── Action Cards ──

  useActionCard(room: Room, playerId: string, cardId: string, targetPlayerId?: string, traitType?: TraitType): boolean {
    // Allow action cards during trait_reveal, discussion, and farewell_speech (except double_vote/immunity)
    const allowedPhases = ['discussion', 'trait_reveal', 'farewell_speech']
    if (!allowedPhases.includes(room.phase)) return false

    const player = room.players.find(p => p.id === playerId)
    if (!player || !player.isAlive) return false
    if (player.actionCard.id !== cardId || player.actionCard.used) return false

    // During farewell, only allow certain cards
    if (room.phase === 'farewell_speech') {
      if (player.actionCard.type === 'double_vote' || player.actionCard.type === 'immunity') {
        return false
      }
    }

    let result: ActionCardResult | undefined

    switch (player.actionCard.type) {
      case 'swap_trait': {
        if (!traitType) return false
        const newValue = generateNewTrait(traitType)
        player.traits[traitType] = newValue as never
        player.revealedTraits = player.revealedTraits.filter(t => t !== traitType)
        result = {
          type: 'swap_trait',
          message: `${player.nickname} обміняв характеристику "${traitType}"`,
          newTrait: { traitType, value: newValue },
        }
        sendTo(playerId, {
          type: 'ACTION_CARD_USED',
          payload: { playerId, card: player.actionCard, result },
        })
        player.actionCard.used = true
        broadcast(room.code, {
          type: 'ACTION_CARD_USED',
          payload: {
            playerId,
            card: player.actionCard,
            result: { type: 'swap_trait', message: `${player.nickname} обміняв характеристику` },
          },
        }, playerId)
        return true
      }

      case 'peek': {
        if (!targetPlayerId) return false
        const target = room.players.find(p => p.id === targetPlayerId)
        if (!target || !target.isAlive) return false
        const unrevealed = TRAIT_TYPES.filter(t => !target.revealedTraits.includes(t))
        if (unrevealed.length === 0) return false
        const peekedTrait = randomPick([...unrevealed])
        const value = peekedTrait === 'age' ? target.traits.age : target.traits[peekedTrait]
        result = {
          type: 'peek',
          message: `Ви підглянули характеристику гравця ${target.nickname}`,
          revealedTrait: { playerId: targetPlayerId, traitType: peekedTrait, value },
        }
        sendTo(playerId, {
          type: 'ACTION_CARD_USED',
          payload: { playerId, card: player.actionCard, result },
        })
        player.actionCard.used = true
        broadcast(room.code, {
          type: 'ACTION_CARD_USED',
          payload: {
            playerId,
            card: player.actionCard,
            result: { type: 'peek', message: `${player.nickname} підглянув характеристику гравця ${target.nickname}` },
          },
        }, playerId)
        return true
      }

      case 'exchange_with_player': {
        if (!targetPlayerId || !traitType) return false
        const target = room.players.find(p => p.id === targetPlayerId)
        if (!target || !target.isAlive) return false
        const temp = player.traits[traitType]
        player.traits[traitType] = target.traits[traitType] as never
        target.traits[traitType] = temp as never
        player.revealedTraits = player.revealedTraits.filter(t => t !== traitType)
        target.revealedTraits = target.revealedTraits.filter(t => t !== traitType)
        player.actionCard.used = true
        broadcast(room.code, {
          type: 'ACTION_CARD_USED',
          payload: {
            playerId,
            card: player.actionCard,
            result: { type: 'exchange_with_player', message: `${player.nickname} обміняв характеристику з ${target.nickname}` },
          },
        })
        return true
      }

      case 'reveal_other': {
        if (!targetPlayerId) return false
        const target = room.players.find(p => p.id === targetPlayerId)
        if (!target || !target.isAlive) return false
        const unrevealed = TRAIT_TYPES.filter(t => !target.revealedTraits.includes(t))
        if (unrevealed.length === 0) return false
        const revealedTrait = randomPick([...unrevealed])
        target.revealedTraits.push(revealedTrait)
        const value = revealedTrait === 'age' ? target.traits.age : target.traits[revealedTrait]
        player.actionCard.used = true
        broadcast(room.code, {
          type: 'ACTION_CARD_USED',
          payload: {
            playerId,
            card: player.actionCard,
            result: {
              type: 'reveal_other',
              message: `${player.nickname} розкрив характеристику гравця ${target.nickname}`,
              revealedTrait: { playerId: targetPlayerId, traitType: revealedTrait, value },
            },
          },
        })
        broadcast(room.code, {
          type: 'TRAIT_REVEALED',
          payload: { playerId: targetPlayerId, traitType: revealedTrait, value },
        })
        return true
      }

      case 'double_vote': {
        player.hasDoubleVote = true
        player.actionCard.used = true
        broadcast(room.code, {
          type: 'ACTION_CARD_USED',
          payload: {
            playerId,
            card: player.actionCard,
            result: { type: 'double_vote', message: `${player.nickname} активував подвійний голос` },
          },
        })
        return true
      }

      case 'immunity': {
        player.isImmune = true
        player.actionCard.used = true
        broadcast(room.code, {
          type: 'ACTION_CARD_USED',
          payload: {
            playerId,
            card: player.actionCard,
            result: { type: 'immunity', message: `${player.nickname} активував імунітет` },
          },
        })
        return true
      }
    }

    return false
  },

  // ── Disconnect Handling ──

  handleDisconnect(room: Room, playerId: string) {
    const player = room.players.find(p => p.id === playerId)
    if (!player) return

    player.isConnected = false
    broadcast(room.code, { type: 'PLAYER_DISCONNECTED', payload: { playerId } })

    // If it was their turn during trait reveal, skip them
    if (room.phase === 'trait_reveal' && room.currentTurnPlayerId === playerId) {
      player.traitsRevealedThisRound = room.traitsToRevealThisRound
      this.advanceTurn(room)
    }

    // If they haven't voted, check if all remaining connected players have voted
    if (room.phase === 'voting' && !room.votes[playerId]) {
      const connectedAlive = room.players.filter(p => p.isAlive && p.isConnected)
      const allVoted = connectedAlive.every(p => room.votes[p.id] !== undefined)
      if (allVoted) {
        timerManager.clear(room.code)
        this.resolveVoting(room)
      }
    }
  },
}
