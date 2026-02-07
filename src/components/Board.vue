<script setup lang="ts">
import type { Board as BoardData, Position } from '../core/types'
import Square from './Square.vue'

const props = defineProps<{
  board: BoardData
  selectedPos: Position | null
  legalTargets: Position[]
  lastMove: { from: Position; to: Position } | null
}>()

defineEmits<{
  squareClick: [pos: Position]
}>()

function isSelected(row: number, col: number): boolean {
  return !!props.selectedPos && props.selectedPos.row === row && props.selectedPos.col === col
}

function isLegalTarget(row: number, col: number): boolean {
  return props.legalTargets.some(t => t.row === row && t.col === col)
}

function isLastMove(row: number, col: number): boolean {
  if (!props.lastMove) return false
  const { from, to } = props.lastMove
  return (from.row === row && from.col === col) || (to.row === row && to.col === col)
}

const rows = Array(9).fill(null)
const cols = Array(9).fill(null)

// File labels: 9 8 7 6 5 4 3 2 1 (left to right)
const fileLabels = [9, 8, 7, 6, 5, 4, 3, 2, 1]
// Rank labels: 一 二 三 ... 九 (top to bottom)
const rankLabels = ['一', '二', '三', '四', '五', '六', '七', '八', '九']
</script>

<template>
  <div class="board-wrapper">
    <!-- File labels (top) -->
    <div class="file-labels">
      <span v-for="f in fileLabels" :key="f" class="label">{{ f }}</span>
    </div>

    <div class="board-with-ranks">
      <!-- Board grid -->
      <div class="board">
        <template v-for="(_, rowIdx) in rows" :key="rowIdx">
          <Square
            v-for="(_, colIdx) in cols"
            :key="`${rowIdx}-${colIdx}`"
            :piece="board[rowIdx]?.[colIdx] ?? null"
            :is-selected="isSelected(rowIdx, colIdx)"
            :is-legal-target="isLegalTarget(rowIdx, colIdx)"
            :is-last-move="isLastMove(rowIdx, colIdx)"
            :class="{
              'top-edge': rowIdx === 0,
              'bottom-edge': rowIdx === 8,
              'left-edge': colIdx === 0,
              'right-edge': colIdx === 8,
            }"
            @click="$emit('squareClick', { row: rowIdx, col: colIdx })"
          />
        </template>
      </div>

      <!-- Rank labels (right side) -->
      <div class="rank-labels">
        <span v-for="(r, i) in rankLabels" :key="i" class="label">{{ r }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.board-wrapper {
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
}

.file-labels {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  padding: 0 0 2px 0;
  /* Align with board width */
}

.file-labels .label {
  text-align: center;
  font-size: 0.75rem;
  color: #654321;
}

.board-with-ranks {
  display: flex;
  gap: 2px;
}

.board {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  width: 100%;
  max-width: 450px;
  min-width: 315px;
  background: #dcb35c;
  border: 3px solid #8b4513;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  position: relative;
}

.rank-labels {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  padding: 0 2px;
}

.rank-labels .label {
  font-size: 0.75rem;
  color: #654321;
  line-height: 1;
}

/* Edge borders */
.top-edge { border-top-width: 2px; }
.bottom-edge { border-bottom-width: 2px; }
.left-edge { border-left-width: 2px; }
.right-edge { border-right-width: 2px; }

</style>
