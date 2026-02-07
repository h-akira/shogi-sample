<script setup lang="ts">
import type { Player } from '../core/types'
import type { AppMode } from '../composables/useMode'

const MODE_LABELS: Record<AppMode, string> = {
  input: '入力モード',
  playback: '再生モード',
  continuation: '継盤モード',
}

defineProps<{
  turn: Player
  moveCount: number
  checkmated: boolean
  mode: AppMode
}>()
</script>

<template>
  <div class="game-info">
    <div class="mode-badge" :class="mode">
      {{ MODE_LABELS[mode] }}
    </div>
    <div class="info-row">
      <span class="label">手番:</span>
      <span class="value" :class="turn">
        {{ turn === 'sente' ? '☗先手' : '☖後手' }}
      </span>
    </div>
    <div class="info-row">
      <span class="label">手数:</span>
      <span class="value">{{ moveCount }}</span>
    </div>
    <div v-if="checkmated" class="status checkmate">
      詰み — {{ turn === 'sente' ? '後手' : '先手' }}の勝ち
    </div>
  </div>
</template>

<style scoped>
.game-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 0;
}

.mode-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
  width: fit-content;
}

.mode-badge.input {
  background: #d4edda;
  color: #155724;
}

.mode-badge.playback {
  background: #cce5ff;
  color: #004085;
}

.mode-badge.continuation {
  background: #fff3cd;
  color: #856404;
}

.info-row {
  display: flex;
  gap: 8px;
  font-size: 0.9rem;
}

.label {
  color: #666;
}

.value {
  font-weight: bold;
}

.value.sente { color: #333; }
.value.gote { color: #333; }

.status {
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9rem;
}

.status.checkmate {
  background: #f8d7da;
  color: #721c24;
}
</style>
