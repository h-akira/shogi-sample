<script setup lang="ts">
import type { AppMode } from '../composables/useMode'

defineProps<{
  currentMoveIndex: number
  totalMoves: number
  mode: AppMode
}>()

defineEmits<{
  goToStart: []
  goBack: []
  goForward: []
  goToEnd: []
  enterContinuation: []
  exitContinuation: []
  undo: []
}>()
</script>

<template>
  <div class="playback-controls">
    <!-- Playback mode -->
    <template v-if="mode === 'playback'">
      <div class="nav-buttons">
        <button :disabled="currentMoveIndex <= 0" @click="$emit('goToStart')" title="最初">|&#9665;</button>
        <button :disabled="currentMoveIndex <= 0" @click="$emit('goBack')" title="一手戻す">&#9665;</button>
        <button :disabled="currentMoveIndex >= totalMoves" @click="$emit('goForward')" title="一手進む">&#9655;</button>
        <button :disabled="currentMoveIndex >= totalMoves" @click="$emit('goToEnd')" title="最終">&#9655;|</button>
      </div>
      <div class="move-info">
        {{ currentMoveIndex }} / {{ totalMoves }}手
      </div>
      <button class="continuation-btn" @click="$emit('enterContinuation')">継盤</button>
    </template>

    <!-- Continuation mode -->
    <template v-if="mode === 'continuation'">
      <div class="continuation-bar">
        <span class="continuation-label">継盤モード</span>
        <button @click="$emit('undo')">一手戻す</button>
        <button class="exit-btn" @click="$emit('exitContinuation')">終了</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.playback-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.nav-buttons {
  display: flex;
  gap: 4px;
}

.nav-buttons button {
  width: 40px;
  height: 32px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 0.85rem;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-buttons button:hover:not(:disabled) {
  background: #f0f0f0;
}

.nav-buttons button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.move-info {
  font-size: 0.85rem;
  color: #666;
}

.continuation-btn {
  padding: 4px 12px;
  border: 1px solid #8b4513;
  border-radius: 4px;
  background: #f5e6c8;
  cursor: pointer;
  font-size: 0.85rem;
  font-family: inherit;
}

.continuation-btn:hover {
  background: #e8d4a8;
}

.continuation-bar {
  display: flex;
  gap: 8px;
  align-items: center;
}

.continuation-label {
  font-size: 0.85rem;
  font-weight: bold;
  color: #8b4513;
}

.continuation-bar button {
  padding: 4px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 0.85rem;
  font-family: inherit;
}

.continuation-bar button:hover {
  background: #f0f0f0;
}

.exit-btn {
  border-color: #c00 !important;
  color: #c00;
}

.exit-btn:hover {
  background: #fee !important;
}
</style>
