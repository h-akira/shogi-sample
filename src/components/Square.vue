<script setup lang="ts">
import type { Piece as PieceData } from '../core/types'
import Piece from './Piece.vue'

defineProps<{
  piece: PieceData | null
  isSelected: boolean
  isLegalTarget: boolean
  isLastMove: boolean
}>()

defineEmits<{
  click: []
}>()
</script>

<template>
  <div
    class="square"
    :class="{
      selected: isSelected,
      'legal-target': isLegalTarget,
      'last-move': isLastMove,
    }"
    @click="$emit('click')"
  >
    <Piece
      v-if="piece"
      :type="piece.type"
      :owner="piece.owner"
      :promoted="piece.promoted"
    />
    <span v-if="isLegalTarget && !piece" class="move-dot" />
  </div>
</template>

<style scoped>
.square {
  aspect-ratio: 1;
  border: 1px solid #8b4513;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  background: transparent;
}

.square.selected {
  background: rgba(80, 160, 255, 0.35);
}

.square.legal-target {
  background: rgba(80, 200, 80, 0.15);
}

.square.legal-target:hover {
  background: rgba(80, 200, 80, 0.35);
}

.square.last-move {
  background: rgba(255, 120, 0, 0.35);
}

.move-dot {
  width: 30%;
  height: 30%;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 50%;
  position: absolute;
}
</style>
