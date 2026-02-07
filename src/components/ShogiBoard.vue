<script setup lang="ts">
import { computed } from 'vue'
import type { Position, PieceType } from '../core/types'
import type { AppMode } from '../composables/useMode'
import { useMode } from '../composables/useMode'
import Board from './Board.vue'
import Hand from './Hand.vue'
import GameInfo from './GameInfo.vue'
import PlaybackControls from './PlaybackControls.vue'

const props = withDefaults(defineProps<{
  initialMode?: AppMode
}>(), {
  initialMode: 'input',
})

const modeCtrl = useMode(props.initialMode)

const {
  mode,
  activeState,
  isInteractive,
  sfen,
  checkmated,
  selection,
  legalTargets,
  promotionPending,
  handleSquareClick,
  handleHandClick,
  resolvePromotion,
  switchToInput,
  switchToPlayback,
  enterContinuation,
  exitContinuation,
  doUndo,
  reset,
  getKif,
  loadKif,
  playback,
  inputGame,
} = modeCtrl

// Selected position for board highlight
const selectedPos = computed<Position | null>(() => {
  if (!isInteractive.value) return null
  const sel = selection.value
  return sel.mode === 'board' ? sel.pos : null
})

// Selected hand piece type
const selectedHandPiece = computed<PieceType | null>(() => {
  if (!isInteractive.value) return null
  const sel = selection.value
  return sel.mode === 'hand' ? sel.pieceType : null
})

// Last move highlight
const lastMove = computed(() => {
  const history = activeState.value.history
  if (history.length === 0) return null
  const lastRecord = history[history.length - 1]
  if (!lastRecord) return null
  const last = lastRecord.move
  if (last.type === 'move') {
    return { from: last.from, to: last.to }
  }
  return { from: last.to, to: last.to }
})

// Expose for parent
defineExpose({
  getSfen: () => sfen.value,
  getKif,
  loadSfen: (s: string) => inputGame.loadSfen(s),
  loadKif,
  reset,
  doUndo,
  mode: computed(() => mode.value),
  switchToInput,
  switchToPlayback,
  enterContinuation,
  exitContinuation,
  playback,
})
</script>

<template>
  <div class="shogi-board-container">
    <!-- Gote hand (top) -->
    <Hand
      :pieces="activeState.hands.gote"
      player="gote"
      :selected-piece="activeState.turn === 'gote' ? selectedHandPiece : null"
      :is-active="activeState.turn === 'gote'"
      @piece-click="(pt: PieceType) => isInteractive && handleHandClick(pt)"
    />

    <!-- Board -->
    <Board
      :board="activeState.board"
      :selected-pos="selectedPos"
      :legal-targets="isInteractive ? legalTargets : []"
      :last-move="lastMove"
      @square-click="(pos: Position) => isInteractive && handleSquareClick(pos)"
    />

    <!-- Sente hand (bottom) -->
    <Hand
      :pieces="activeState.hands.sente"
      player="sente"
      :selected-piece="activeState.turn === 'sente' ? selectedHandPiece : null"
      :is-active="activeState.turn === 'sente'"
      @piece-click="(pt: PieceType) => isInteractive && handleHandClick(pt)"
    />

    <!-- Playback / Continuation controls -->
    <PlaybackControls
      v-if="mode === 'playback' || mode === 'continuation'"
      :current-move-index="playback.currentMoveIndex.value"
      :total-moves="playback.totalMoves.value"
      :mode="mode"
      @go-to-start="playback.goToStart()"
      @go-back="playback.goBack()"
      @go-forward="playback.goForward()"
      @go-to-end="playback.goToEnd()"
      @go-to-move="(n: number) => playback.goToMove(n)"
      @enter-continuation="enterContinuation()"
      @exit-continuation="exitContinuation()"
      @undo="doUndo()"
    />

    <!-- Game info -->
    <GameInfo
      :turn="activeState.turn"
      :move-count="activeState.moveCount"
      :checkmated="checkmated"
      :mode="mode"
    />

    <!-- Promotion dialog -->
    <div v-if="promotionPending" class="promotion-overlay" @click.self="resolvePromotion(false)">
      <div class="promotion-dialog">
        <p>成りますか？</p>
        <div class="promotion-buttons">
          <button class="promote-btn yes" @click="resolvePromotion(true)">成る</button>
          <button class="promote-btn no" @click="resolvePromotion(false)">不成</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shogi-board-container {
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
}

.promotion-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.promotion-dialog {
  background: #fff;
  border-radius: 8px;
  padding: 20px 28px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  text-align: center;
}

.promotion-dialog p {
  margin: 0 0 16px;
  font-size: 1.1rem;
  font-weight: bold;
}

.promotion-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.promote-btn {
  padding: 8px 24px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
}

.promote-btn.yes {
  background: #c00;
  color: #fff;
}

.promote-btn.yes:hover {
  background: #a00;
}

.promote-btn.no {
  background: #eee;
  color: #333;
}

.promote-btn.no:hover {
  background: #ddd;
}
</style>
