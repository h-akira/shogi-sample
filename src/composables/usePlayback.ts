import { ref, computed } from 'vue'
import type { GameState } from '../core/types'
import { createInitialState, replayToMove } from '../core/game'
import { toSfen } from '../core/sfen'
import { toKif, parseKif, type KifMetadata } from '../core/kif'
import { isCheckmate } from '../core/rules'

export function usePlayback() {
  // Full game state with all moves applied (source of truth for history)
  const fullState = ref<GameState>(createInitialState())
  // Initial state for replaying from
  const initialState = ref<GameState>(createInitialState())
  // Current playback position (0 = initial, N = after N moves)
  const currentMoveIndex = ref(0)
  // KIF metadata
  const metadata = ref<KifMetadata>({})

  const totalMoves = computed(() => fullState.value.history.length)

  // State at the current playback position
  const displayState = computed<GameState>(() => {
    const idx = currentMoveIndex.value
    if (idx >= totalMoves.value) {
      return fullState.value
    }
    const moves = fullState.value.history.map(r => r.move)
    return replayToMove(initialState.value, moves, idx)
  })

  const sfen = computed(() => toSfen(displayState.value))
  const checkmated = computed(() => isCheckmate(displayState.value))

  function loadKif(kifStr: string) {
    const result = parseKif(kifStr)
    fullState.value = result.state
    metadata.value = result.metadata
    initialState.value = createInitialState()
    currentMoveIndex.value = 0
  }

  function goToMove(n: number) {
    currentMoveIndex.value = Math.max(0, Math.min(n, totalMoves.value))
  }

  function goForward() {
    goToMove(currentMoveIndex.value + 1)
  }

  function goBack() {
    goToMove(currentMoveIndex.value - 1)
  }

  function goToStart() {
    goToMove(0)
  }

  function goToEnd() {
    goToMove(totalMoves.value)
  }

  function getKif(): string {
    return toKif(fullState.value, metadata.value)
  }

  return {
    displayState,
    currentMoveIndex,
    totalMoves,
    sfen,
    checkmated,
    metadata,
    loadKif,
    goToMove,
    goForward,
    goBack,
    goToStart,
    goToEnd,
    getKif,
  }
}
