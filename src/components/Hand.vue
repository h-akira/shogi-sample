<script setup lang="ts">
import type { Player, PieceType, HandPieces } from '../core/types'
import { HAND_PIECE_ORDER, PIECE_KANJI } from '../core/constants'
import { computed } from 'vue'

const props = defineProps<{
  pieces: HandPieces
  player: Player
  selectedPiece: PieceType | null
  isActive: boolean
}>()

defineEmits<{
  pieceClick: [pieceType: PieceType]
}>()

// Filter to only pieces with count > 0, in standard order
const handEntries = computed(() => {
  return HAND_PIECE_ORDER
    .filter(pt => (props.pieces[pt] || 0) > 0)
    .map(pt => ({
      type: pt,
      count: props.pieces[pt]!,
      display: PIECE_KANJI[pt].normal,
    }))
})

const label = computed(() => props.player === 'sente' ? '☗先手' : '☖後手')
</script>

<template>
  <div class="hand" :class="[player, { active: isActive }]">
    <span class="hand-label" :class="{ active: isActive }">{{ label }}</span>
    <div class="hand-pieces">
      <span v-if="handEntries.length === 0" class="empty">なし</span>
      <button
        v-for="entry in handEntries"
        :key="entry.type"
        class="hand-piece"
        :class="{
          selected: selectedPiece === entry.type,
          gote: player === 'gote',
        }"
        @click="$emit('pieceClick', entry.type)"
      >
        <span class="kanji">{{ entry.display }}</span>
        <span v-if="entry.count > 1" class="count">{{ entry.count }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.hand {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  min-height: 44px;
}

.hand-label {
  font-size: 0.85rem;
  font-weight: bold;
  color: #999;
  white-space: nowrap;
  padding: 2px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.hand-label.active {
  color: #fff;
  background: #8b4513;
}

.hand-pieces {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.empty {
  color: #999;
  font-size: 0.8rem;
}

.hand-piece {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  padding: 4px 6px;
  border: 1px solid #8b4513;
  border-radius: 4px;
  background: #f5e6c8;
  cursor: pointer;
  font-family: inherit;
}

.hand-piece:hover {
  background: #e8d4a8;
}

.hand-piece.selected {
  background: rgba(80, 160, 255, 0.35);
  border-color: #4090ff;
}

.hand-piece .kanji {
  font-size: 1.2em;
  font-weight: bold;
}

.hand-piece.gote .kanji {
  display: inline-block;
  transform: rotate(180deg);
}

.hand-piece .count {
  font-size: 0.75em;
  color: #666;
  margin-left: 1px;
}
</style>
