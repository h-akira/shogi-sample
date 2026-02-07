import { ref, computed } from 'vue'
import type { GameState, Move } from '../core/types'
import { createInitialState, applyMove, undoMove } from '../core/game'
import { toSfen, parseSfen } from '../core/sfen'
import { toKif, parseKif, type KifMetadata } from '../core/kif'
import { isCheckmate } from '../core/rules'

export function useGameState() {
  const state = ref<GameState>(createInitialState())

  const sfen = computed(() => toSfen(state.value))
  const checkmated = computed(() => isCheckmate(state.value))

  function doMove(move: Move) {
    state.value = applyMove(state.value, move)
  }

  function doUndo() {
    const prev = undoMove(state.value)
    if (prev) state.value = prev
  }

  function reset() {
    state.value = createInitialState()
  }

  function loadSfen(sfenStr: string) {
    state.value = parseSfen(sfenStr)
  }

  function loadKif(kifStr: string) {
    const { state: s } = parseKif(kifStr)
    state.value = s
  }

  function getKif(metadata?: KifMetadata): string {
    return toKif(state.value, metadata)
  }

  return {
    state,
    sfen,
    checkmated,
    doMove,
    doUndo,
    reset,
    loadSfen,
    loadKif,
    getKif,
  }
}
