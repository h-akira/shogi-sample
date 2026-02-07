<template>
  <div class="top-page">
    <p class="description">
      Vue 3 + TypeScript で将棋盤を実装するサンプルアプリケーションです。
    </p>

    <div class="feature-cards">
      <router-link to="/play" class="card">
        <h3>入力モード</h3>
        <p>クリックで駒を動かして棋譜を入力します。KIF形式・SFEN形式で出力できます。</p>
      </router-link>

      <router-link to="/replay" class="card">
        <h3>再生モード</h3>
        <p>KIF形式の棋譜を読み込んで再生します。継盤モードで自由に指し進めることもできます。</p>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.top-page {
  max-width: 600px;
}

.description {
  font-size: 1rem;
  color: #555;
  line-height: 1.6;
}

.feature-cards {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.card {
  flex: 1;
  padding: 1.2rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  background: #fff;
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.2s;
}

.card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.card h3 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  color: #8b4513;
}

.card p {
  margin: 0;
  font-size: 0.85rem;
  color: #666;
  line-height: 1.5;
}

@media (max-width: 500px) {
  .feature-cards {
    flex-direction: column;
  }
}
</style>
