import { useState, useCallback } from 'react'
import type { Phase, TurnPhase, Player, AWSQuestion, Clue, Mystery } from '../types'
import { ROOMS, ADJACENCY } from '../data/rooms'
import { QUESTIONS } from '../data/questions'
import { generateMysteryAndClues, SUSPECTS, DEVICES, MYSTERY_ROOM_IDS } from '../data/mystery'

const PLAYER_COLORS = ['#4080ff', '#ff6040', '#40d060', '#d0a020']

// BFS: returns all room ids reachable from `from` within `steps` steps
function getReachable(from: string, steps: number): string[] {
  const visited = new Set<string>([from])
  let frontier = [from]
  for (let s = 0; s < steps; s++) {
    const next: string[] = []
    for (const node of frontier) {
      for (const neighbour of (ADJACENCY[node] ?? [])) {
        if (!visited.has(neighbour)) {
          visited.add(neighbour)
          next.push(neighbour)
        }
      }
    }
    frontier = next
    if (frontier.length === 0) break
  }
  // Remove non-room nodes ('start') and the current position
  const roomIds = new Set(ROOMS.map(r => r.id))
  return Array.from(visited).filter(id => id !== from && id !== 'start' && roomIds.has(id))
}

interface EscapeRoomState {
  phase: Phase
  players: Player[]
  playerOrder: number[]
  currentTurnIdx: number
  turnPhase: TurnPhase
  diceRoll: number | null
  reachableRooms: string[]
  currentRoomId: string | null
  activeQuestion: AWSQuestion | null
  mystery: Mystery | null
  clues: Clue[]
  collectedClueIds: string[]
  roomsCleared: string[]
  winner: Player | null
  message: string
}

const initialState: EscapeRoomState = {
  phase: 'intro',
  players: [],
  playerOrder: [],
  currentTurnIdx: 0,
  turnPhase: 'roll',
  diceRoll: null,
  reachableRooms: [],
  currentRoomId: null,
  activeQuestion: null,
  mystery: null,
  clues: [],
  collectedClueIds: [],
  roomsCleared: [],
  winner: null,
  message: '',
}

export function useEscapeRoom() {
  const [state, setState] = useState<EscapeRoomState>(initialState)

  const setupPlayers = useCallback((names: string[]) => {
    const players: Player[] = names.map((name, i) => ({
      id:             `player-${i}`,
      name,
      color:          PLAYER_COLORS[i],
      position:       'start',
      cluesCollected: [],
      eliminated:     false,
      initialRoll:    null,
    }))
    setState(prev => ({ ...prev, players, phase: 'initial-roll' }))
  }, [])

  const recordInitialRoll = useCallback((playerId: string, roll: number) => {
    setState(prev => ({
      ...prev,
      players: prev.players.map(p =>
        p.id === playerId ? { ...p, initialRoll: roll } : p
      ),
    }))
  }, [])

  const startGame = useCallback(() => {
    setState(prev => {
      const { mystery, clues } = generateMysteryAndClues()
      // Sort by initial roll descending; ties broken by original index
      const order = prev.players
        .map((p, i) => ({ i, roll: p.initialRoll ?? 0 }))
        .sort((a, b) => b.roll - a.roll || a.i - b.i)
        .map(x => x.i)

      return {
        ...prev,
        phase: 'playing',
        playerOrder: order,
        currentTurnIdx: 0,
        turnPhase: 'roll',
        mystery,
        clues,
        message: `${prev.players[order[0]].name}'s turn — roll the die!`,
      }
    })
  }, [])

  const rollDie = useCallback(() => {
    setState(prev => {
      if (prev.turnPhase !== 'roll') return prev
      const roll = Math.floor(Math.random() * 6) + 1
      const currentPlayerIdx = prev.playerOrder[prev.currentTurnIdx]
      const currentPlayer = prev.players[currentPlayerIdx]
      const reachable = getReachable(currentPlayer.position, roll)
      return {
        ...prev,
        diceRoll: roll,
        reachableRooms: reachable,
        turnPhase: 'choose-room',
        message: reachable.length === 0
          ? 'No rooms reachable — end your turn.'
          : `Rolled a ${roll}! Choose a room to enter.`,
      }
    })
  }, [])

  const enterRoom = useCallback((roomId: string) => {
    setState(prev => {
      if (prev.turnPhase !== 'choose-room') return prev
      const currentPlayerIdx = prev.playerOrder[prev.currentTurnIdx]
      const updatedPlayers = prev.players.map((p, i) =>
        i === currentPlayerIdx ? { ...p, position: roomId } : p
      )
      const room = ROOMS.find(r => r.id === roomId)
      return {
        ...prev,
        players: updatedPlayers,
        currentRoomId: roomId,
        turnPhase: 'in-room',
        reachableRooms: [],
        message: `Entered the ${room?.name ?? roomId}. Answer a question to collect a clue!`,
      }
    })
  }, [])

  const startQuestion = useCallback(() => {
    setState(prev => {
      if (!prev.currentRoomId) return prev
      const roomId = prev.currentRoomId
      // Filter questions for this room that haven't been answered (room cleared)
      const available = QUESTIONS.filter(
        q => q.roomId === roomId && !prev.roomsCleared.includes(roomId)
      )
      if (available.length === 0) {
        return { ...prev, message: 'This room has already been cleared!' }
      }
      const q = available[Math.floor(Math.random() * available.length)]
      return {
        ...prev,
        activeQuestion: q,
        turnPhase: 'answering',
      }
    })
  }, [])

  const answerQuestion = useCallback((idx: number) => {
    setState(prev => {
      if (!prev.activeQuestion || !prev.currentRoomId) return prev
      const correct = idx === prev.activeQuestion.correctIndex
      const roomId = prev.currentRoomId
      const currentPlayerIdx = prev.playerOrder[prev.currentTurnIdx]

      if (correct) {
        // Find the clue for this room
        const clue = prev.clues.find(c => c.roomId === roomId)
        const newCollectedIds = clue && !prev.collectedClueIds.includes(clue.id)
          ? [...prev.collectedClueIds, clue.id]
          : prev.collectedClueIds
        const newRoomsCleared = !prev.roomsCleared.includes(roomId)
          ? [...prev.roomsCleared, roomId]
          : prev.roomsCleared

        // Give clue to current player too
        const updatedPlayers = prev.players.map((p, i) => {
          if (i !== currentPlayerIdx) return p
          if (clue && !p.cluesCollected.includes(clue.id)) {
            return { ...p, cluesCollected: [...p.cluesCollected, clue.id] }
          }
          return p
        })

        const room = ROOMS.find(r => r.id === roomId)
        const clueMsg = clue
          ? `Correct! Clue collected: ${clue.flavorText}`
          : `Correct! (No new clue for this room)`

        return {
          ...prev,
          players: updatedPlayers,
          collectedClueIds: newCollectedIds,
          roomsCleared: newRoomsCleared,
          activeQuestion: null,
          turnPhase: 'in-room',
          message: `${room?.name}: ${clueMsg}`,
        }
      } else {
        return {
          ...prev,
          activeQuestion: null,
          turnPhase: 'in-room',
          message: 'Wrong answer! You lose your turn.',
        }
      }
    })
  }, [])

  const useSecretPassage = useCallback(() => {
    setState(prev => {
      if (!prev.currentRoomId) return prev
      const room = ROOMS.find(r => r.id === prev.currentRoomId)
      if (!room?.secretPassage) return prev
      const dest = room.secretPassage
      const currentPlayerIdx = prev.playerOrder[prev.currentTurnIdx]
      const updatedPlayers = prev.players.map((p, i) =>
        i === currentPlayerIdx ? { ...p, position: dest } : p
      )
      const destRoom = ROOMS.find(r => r.id === dest)
      return {
        ...prev,
        players: updatedPlayers,
        currentRoomId: dest,
        turnPhase: 'in-room',
        message: `Secret passage used! Teleported to the ${destRoom?.name ?? dest}.`,
      }
    })
  }, [])

  const skipRoom = useCallback(() => {
    setState(prev => ({
      ...prev,
      turnPhase: 'turn-end',
      message: 'Skipped room. Turn ending...',
    }))
  }, [])

  const attemptSolve = useCallback((suspect: string, device: string, roomId: string) => {
    setState(prev => {
      if (!prev.mystery) return prev
      const currentPlayerIdx = prev.playerOrder[prev.currentTurnIdx]
      const currentPlayer = prev.players[currentPlayerIdx]

      const correct =
        suspect === prev.mystery.suspect &&
        device  === prev.mystery.device  &&
        roomId  === prev.mystery.room

      if (correct) {
        return {
          ...prev,
          winner: currentPlayer,
          phase: 'game-over',
          message: `${currentPlayer.name} solved the mystery! WINNER!`,
        }
      } else {
        const updatedPlayers = prev.players.map((p, i) =>
          i === currentPlayerIdx ? { ...p, eliminated: true } : p
        )
        // Check if all non-eliminated players are now eliminated
        const activePlayers = updatedPlayers.filter(p => !p.eliminated)
        if (activePlayers.length === 0) {
          return {
            ...prev,
            players: updatedPlayers,
            phase: 'game-over',
            message: 'All players eliminated! Nobody solved the mystery.',
          }
        }
        return {
          ...prev,
          players: updatedPlayers,
          turnPhase: 'turn-end',
          message: `${currentPlayer.name} guessed wrong and has been ELIMINATED!`,
        }
      }
    })
  }, [])

  const endTurn = useCallback(() => {
    setState(prev => {
      const activePlayers = prev.players.filter(p => !p.eliminated)
      if (activePlayers.length === 0) {
        return { ...prev, phase: 'game-over', message: 'No players remaining!' }
      }

      // Find next non-eliminated player in order
      const totalPlayers = prev.playerOrder.length
      let nextIdx = prev.currentTurnIdx
      let looped = 0
      do {
        nextIdx = (nextIdx + 1) % totalPlayers
        looped++
        if (looped > totalPlayers) break
      } while (prev.players[prev.playerOrder[nextIdx]].eliminated)

      const nextPlayer = prev.players[prev.playerOrder[nextIdx]]
      return {
        ...prev,
        currentTurnIdx: nextIdx,
        turnPhase: 'roll',
        diceRoll: null,
        reachableRooms: [],
        currentRoomId: null,
        activeQuestion: null,
        message: `${nextPlayer.name}'s turn — roll the die!`,
      }
    })
  }, [])

  const goToSetup = useCallback(() => {
    setState(prev => ({ ...prev, phase: 'setup' }))
  }, [])

  const goToIntro = useCallback(() => {
    setState({ ...initialState })
  }, [])

  const resetGame = useCallback(() => {
    setState({ ...initialState })
  }, [])

  // Computed helpers
  const getActivePlayers = () => state.players.filter(p => !p.eliminated)

  const getCurrentPlayer = (): Player | null => {
    if (state.playerOrder.length === 0) return null
    return state.players[state.playerOrder[state.currentTurnIdx]] ?? null
  }

  const eliminatedSuspects: string[] = state.clues
    .filter(c => c.type === 'suspect' && state.collectedClueIds.includes(c.id))
    .map(c => c.eliminates)

  const eliminatedDevices: string[] = state.clues
    .filter(c => c.type === 'device' && state.collectedClueIds.includes(c.id))
    .map(c => c.eliminates)

  const eliminatedLocations: string[] = state.clues
    .filter(c => c.type === 'location' && state.collectedClueIds.includes(c.id))
    .map(c => c.eliminates)

  const collectedClues: Clue[] = state.clues.filter(c =>
    state.collectedClueIds.includes(c.id)
  )

  return {
    ...state,
    // Actions
    setupPlayers,
    recordInitialRoll,
    startGame,
    rollDie,
    enterRoom,
    startQuestion,
    answerQuestion,
    useSecretPassage,
    skipRoom,
    attemptSolve,
    endTurn,
    goToSetup,
    goToIntro,
    resetGame,
    // Computed
    getActivePlayers,
    getCurrentPlayer,
    eliminatedSuspects,
    eliminatedDevices,
    eliminatedLocations,
    collectedClues,
    // Re-export constants for components
    SUSPECTS,
    DEVICES,
    MYSTERY_ROOM_IDS,
  }
}
