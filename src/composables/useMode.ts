import { ref, computed } from 'vue'
import type { GameState, Move } from '../core/types'
import { toSfen } from '../core/sfen'
import { isCheckmate } from '../core/rules'
import { useGameState } from './useGameState'
import { usePlayback } from './usePlayback'
import { useSelection } from './useSelection'

export type AppMode = 'input' | 'playback' | 'continuation'

export function useMode(initialMode: AppMode = 'input') {
  const mode = ref<AppMode>(initialMode)

  // Input mode state
  const inputGame = useGameState()

  // Playback mode state
  const playback = usePlayback()

  // Continuation mode state
  const continuationGame = useGameState()
  const savedPlaybackIndex = ref(0)

  // Active GameState based on current mode
  const activeState = computed<GameState>(() => {
    switch (mode.value) {
      case 'input':
        return inputGame.state.value
      case 'playback':
        return playback.displayState.value
      case 'continuation':
        return continuationGame.state.value
    }
  })

  // Whether the board accepts click input
  const isInteractive = computed(() => mode.value !== 'playback')

  // SFEN is always available
  const sfen = computed(() => toSfen(activeState.value))

  // Checkmate based on active state
  const checkmated = computed(() => isCheckmate(activeState.value))

  // Move handler dispatches to the correct game state
  function handleMove(move: Move) {
    if (mode.value === 'input') {
      inputGame.doMove(move)
    } else if (mode.value === 'continuation') {
      continuationGame.doMove(move)
    }
  }

  // Selection (shared, wired to activeState + handleMove)
  const {
    selection,
    legalTargets,
    promotionPending,
    handleSquareClick,
    handleHandClick,
    resolvePromotion,
    clearSelection,
  } = useSelection(() => activeState.value, handleMove)

  // --- Mode transitions ---

  function switchToInput() {
    mode.value = 'input'
    clearSelection()
  }

  function switchToPlayback() {
    mode.value = 'playback'
    clearSelection()
  }

  function enterContinuation() {
    if (mode.value !== 'playback') return
    savedPlaybackIndex.value = playback.currentMoveIndex.value
    // Initialize continuation from the current playback position
    continuationGame.loadSfen(toSfen(playback.displayState.value))
    mode.value = 'continuation'
  }

  function exitContinuation() {
    if (mode.value !== 'continuation') return
    playback.goToMove(savedPlaybackIndex.value)
    mode.value = 'playback'
    clearSelection()
  }

  // --- Undo (mode-aware) ---

  function doUndo() {
    if (mode.value === 'input') {
      inputGame.doUndo()
    } else if (mode.value === 'continuation') {
      continuationGame.doUndo()
    }
  }

  // --- Reset (input mode only) ---

  function reset() {
    if (mode.value === 'input') {
      inputGame.reset()
      clearSelection()
    }
  }

  // --- KIF ---

  function getKif(): string {
    if (mode.value === 'input') {
      return inputGame.getKif()
    }
    // Playback and continuation return the original loaded KIF
    return playback.getKif()
  }

  function loadKif(kifStr: string) {
    playback.loadKif(kifStr)
    mode.value = 'playback'
    clearSelection()
  }

  return {
    mode,
    activeState,
    isInteractive,
    sfen,
    checkmated,

    // Selection
    selection,
    legalTargets,
    promotionPending,
    handleSquareClick,
    handleHandClick,
    resolvePromotion,
    clearSelection,

    // Mode transitions
    switchToInput,
    switchToPlayback,
    enterContinuation,
    exitContinuation,

    // Actions
    doUndo,
    reset,
    getKif,
    loadKif,

    // Playback navigation (exposed for external UI)
    playback,

    // Input game (for loadSfen in input mode)
    inputGame,
  }
}
