<script setup lang="ts">
import { ref } from 'vue'
import ShogiBoard from '../components/ShogiBoard.vue'

const boardRef = ref<InstanceType<typeof ShogiBoard>>()
const sfenText = ref('')
const kifText = ref('')

function copySfen() {
  const sfen = boardRef.value?.getSfen()
  if (sfen) {
    navigator.clipboard.writeText(sfen)
    sfenText.value = sfen
  }
}

function importKif() {
  if (kifText.value.trim()) {
    boardRef.value?.loadKif(kifText.value)
  }
}
</script>

<template>
  <div class="main-layout">
    <div class="board-area">
      <ShogiBoard ref="boardRef" initial-mode="playback" />
    </div>

    <div class="side-panel">
      <div class="kif-section">
        <h3>KIF 読込</h3>
        <div class="kif-panel">
          <textarea v-model="kifText" rows="10" placeholder="KIF形式のテキストを貼り付け..." />
          <button @click="importKif">KIF を読み込む</button>
        </div>
      </div>

      <div class="sfen-section">
        <h3>SFEN</h3>
        <button @click="copySfen">SFEN をコピー</button>
        <div v-if="sfenText" class="sfen-display">{{ sfenText }}</div>
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

.kif-panel {
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
