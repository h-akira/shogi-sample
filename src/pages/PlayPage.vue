<script setup lang="ts">
import { ref } from 'vue'
import ShogiBoard from '../components/ShogiBoard.vue'

const boardRef = ref<InstanceType<typeof ShogiBoard>>()
const sfenText = ref('')
const kifText = ref('')
const showKifPanel = ref(false)

function copySfen() {
  const sfen = boardRef.value?.getSfen()
  if (sfen) {
    navigator.clipboard.writeText(sfen)
    sfenText.value = sfen
  }
}

function exportKif() {
  const kif = boardRef.value?.getKif()
  if (kif) {
    kifText.value = kif
    showKifPanel.value = true
  }
}

function handleUndo() {
  boardRef.value?.doUndo()
}

function handleReset() {
  boardRef.value?.reset()
  sfenText.value = ''
  kifText.value = ''
  showKifPanel.value = false
}
</script>

<template>
  <div class="main-layout">
    <div class="board-area">
      <ShogiBoard ref="boardRef" />
    </div>

    <div class="side-panel">
      <div class="controls">
        <button @click="handleUndo">↩ 一手戻す</button>
        <button @click="handleReset">⟲ 初期化</button>
      </div>

      <div class="sfen-section">
        <h3>SFEN</h3>
        <button @click="copySfen">SFEN をコピー</button>
        <div v-if="sfenText" class="sfen-display">{{ sfenText }}</div>
      </div>

      <div class="kif-section">
        <h3>KIF</h3>
        <div class="kif-buttons">
          <button @click="exportKif">KIF 出力</button>
        </div>
        <div v-if="showKifPanel" class="kif-panel">
          <textarea v-model="kifText" rows="12" readonly />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-layout {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.board-area {
  flex-shrink: 0;
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  min-width: 260px;
}

.controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

h3 {
  font-size: 0.95rem;
  margin-bottom: 6px;
  color: #555;
}

button {
  padding: 6px 14px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 0.85rem;
  font-family: inherit;
}

button:hover {
  background: #f0f0f0;
}

.sfen-display {
  margin-top: 6px;
  padding: 8px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.75rem;
  word-break: break-all;
}

.kif-buttons {
  display: flex;
  gap: 8px;
}

.kif-panel {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.kif-panel textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.8rem;
  resize: vertical;
}

@media (max-width: 700px) {
  .main-layout {
    flex-direction: column;
  }
}
</style>
