import type { Room } from '../../shared'

export const voteManager = {
  castVote(room: Room, voterId: string, targetId: string): boolean {
    const voter = room.players.find(p => p.id === voterId)
    if (!voter || !voter.isAlive) return false
    if (voter.isHost) return false

    // Allow __PASS__ as special target in round 1
    if (targetId === '__PASS__') {
      if (room.currentRound !== 1) return false
      if (room.revoteTargets !== null) return false
      room.votes[voterId] = targetId
      return true
    }

    const target = room.players.find(p => p.id === targetId)
    if (!target || !target.isAlive) return false

    room.votes[voterId] = targetId
    return true
  },

  getVoteCounts(room: Room): Record<string, number> {
    const counts: Record<string, number> = {}
    for (const [voterId, targetId] of Object.entries(room.votes)) {
      const voter = room.players.find(p => p.id === voterId)
      const weight = voter?.hasDoubleVote ? 2 : 1
      counts[targetId] = (counts[targetId] || 0) + weight
    }
    return counts
  },

  getTotalVoteWeight(room: Room): number {
    let total = 0
    for (const voterId of Object.keys(room.votes)) {
      const voter = room.players.find(p => p.id === voterId)
      total += voter?.hasDoubleVote ? 2 : 1
    }
    return total
  },

  allVotesCast(room: Room): boolean {
    const alivePlayers = room.players.filter(p => p.isAlive && p.isConnected && !p.isHost)
    return alivePlayers.every(p => room.votes[p.id] !== undefined)
  },

  /** Check if any player received ≥70% of vote weight */
  checkSupermajority(room: Room): string | null {
    const counts = this.getVoteCounts(room)
    const totalWeight = this.getTotalVoteWeight(room)
    if (totalWeight === 0) return null

    const threshold = totalWeight * 0.7

    for (const [playerId, voteCount] of Object.entries(counts)) {
      if (playerId === '__PASS__') continue
      if (voteCount >= threshold) {
        // Check immunity
        const player = room.players.find(p => p.id === playerId)
        if (player && !player.isImmune) {
          return playerId
        }
      }
    }

    return null
  },

  resolveVotes(room: Room): { eliminatedId: string | null; isTie: boolean; tiedPlayerIds: string[] } {
    const counts = this.getVoteCounts(room)

    // Filter out __PASS__ from elimination candidates
    const entries = Object.entries(counts).filter(([id]) => id !== '__PASS__')

    if (entries.length === 0) {
      return { eliminatedId: null, isTie: false, tiedPlayerIds: [] }
    }

    const maxVotes = Math.max(...entries.map(([, count]) => count))
    const topPlayers = entries.filter(([, count]) => count === maxVotes).map(([id]) => id)

    // Filter out immune players
    const nonImmunePlayers = topPlayers.filter(id => {
      const player = room.players.find(p => p.id === id)
      return player && !player.isImmune
    })

    if (nonImmunePlayers.length === 0) {
      return { eliminatedId: null, isTie: false, tiedPlayerIds: [] }
    }

    if (nonImmunePlayers.length === 1) {
      return { eliminatedId: nonImmunePlayers[0], isTie: false, tiedPlayerIds: [] }
    }

    // It's a tie
    return { eliminatedId: null, isTie: true, tiedPlayerIds: nonImmunePlayers }
  },

  resetVotes(room: Room) {
    room.votes = {}
  },
}
