# 将棋盤コンポーネント 設計書

## 1. 概要

Vue 3 + TypeScript で汎用的な将棋盤コンポーネントを構築する。
盤面表示、クリックによる駒移動、合法手判定、KIF入出力、SFEN出力に対応する。
3つのモード（入力・再生・継盤）を備え、棋譜入力と棋譜再生を切り替えて利用できる。

### 技術スタック

- Vue 3（Composition API / `<script setup lang="ts">`）
- TypeScript
- Vite
- Vue Router 4（ページ分離）
- CSS Grid（盤面レイアウト）

---

## 2. アーキテクチャ

### 2.1 レイヤー構成

```
┌──────────────────────────────────────────────────┐
│  Pages (Route Views)                              │
│  TopPage / PlayPage / ReplayPage                  │
├──────────────────────────────────────────────────┤
│  Vue Components (UI Layer)                        │
│  ShogiBoard / Board / Hand / PlaybackControls ... │
├──────────────────────────────────────────────────┤
│  Composables (State & Logic Layer)                │
│  useMode / usePlayback / useGameState / ...       │
├──────────────────────────────────────────────────┤
│  Core Logic (Pure TypeScript)                     │
│  rules / moves / sfen / kif / game / types        │
│  ※ Vueに依存しない純粋なロジック                  │
└──────────────────────────────────────────────────┘
```

**設計方針**: 将棋ロジック（ルール判定、KIF/SFENパーサー）はVueに依存しない純粋TypeScriptとして実装し、再利用性とテスト容易性を確保する。

### 2.2 ディレクトリ構成

```
src/
├── App.vue                      # シェルレイアウト（NavBar + router-view）
├── main.ts                      # エントリポイント（router登録）
├── style.css                    # グローバルスタイル
│
├── router/
│   └── index.ts                 # ルーター定義（/, /play, /replay）
│
├── pages/                       # ページコンポーネント（ルートごと）
│   ├── TopPage.vue              # トップページ（ランディング）
│   ├── PlayPage.vue             # 入力モードページ
│   └── ReplayPage.vue           # 再生モードページ
│
├── components/                  # UIコンポーネント
│   ├── NavBar.vue               # ナビゲーションバー
│   ├── ShogiBoard.vue           # 将棋盤メインコンポーネント
│   ├── Board.vue                # 9×9盤面
│   ├── Square.vue               # 1マス
│   ├── Piece.vue                # 駒
│   ├── Hand.vue                 # 持ち駒エリア
│   ├── GameInfo.vue             # 対局情報（手番・手数・モード表示）
│   └── PlaybackControls.vue     # 再生ナビゲーション・継盤操作
│
├── composables/                 # Vue Composables
│   ├── useMode.ts               # モード統合管理（入力/再生/継盤）
│   ├── usePlayback.ts           # 棋譜再生状態管理
│   ├── useGameState.ts          # ゲーム状態管理
│   └── useSelection.ts         # 駒選択・移動UI管理
│
├── core/                        # 純粋TypeScriptロジック
│   ├── types.ts                 # 型定義
│   ├── constants.ts             # 定数（初期配置、駒定義）
│   ├── moves.ts                 # 各駒の移動可能位置計算
│   ├── rules.ts                 # 合法手判定（王手・禁じ手含む）
│   ├── game.ts                  # ゲーム進行管理
│   ├── sfen.ts                  # SFEN入出力
│   └── kif.ts                   # KIF入出力
│
└── assets/                      # 静的アセット
```

---

## 3. データ型設計

### 3.1 基本型（`core/types.ts`）

```typescript
// Player
type Player = 'sente' | 'gote'

// Piece types (unPromoted)
type PieceType = 'king' | 'rook' | 'bishop' | 'gold' | 'silver' | 'knight' | 'lance' | 'pawn'

// Piece on board
interface Piece {
  type: PieceType
  owner: Player
  promoted: boolean
}

// Board position (0-indexed)
// row: 0 = 一段（上端/後手側）, 8 = 九段（下端/先手側）
// col: 0 = 9筋（左端）, 8 = 1筋（右端）
interface Position {
  row: number  // 0-8
  col: number  // 0-8
}

// Board: 9x9 grid, null = empty square
type Board = (Piece | null)[][]

// Hands (captured pieces)
// key: PieceType (king以外), value: count
type HandPieces = Partial<Record<PieceType, number>>

interface Hands {
  sente: HandPieces
  gote: HandPieces
}

// Move
interface BoardMove {
  type: 'move'
  from: Position
  to: Position
  promote: boolean
}

interface DropMove {
  type: 'drop'
  pieceType: PieceType
  to: Position
}

type Move = BoardMove | DropMove

// Game state
interface GameState {
  board: Board
  hands: Hands
  turn: Player
  moveCount: number       // current move number
  moveHistory: Move[]     // history of all moves
}
```

### 3.2 座標変換

```
内部表現 (row, col)        将棋表記           SFEN表記
(0, 0)                     9一               9a
(0, 8)                     1一               1a
(8, 0)                     9九               9i
(8, 8)                     1九               1i

変換式:
  筋(file) = 9 - col       (1〜9)
  段(rank) = row + 1       (1〜9)
  SFEN段   = 'a' + row     (a〜i)
```

---

## 4. コンポーネント設計

### 4.1 コンポーネント階層

```
App.vue                               # シェル（NavBar + router-view）
├── NavBar.vue                         # ナビゲーション
└── <router-view>
    ├── TopPage.vue                    # / — ランディング
    ├── PlayPage.vue                   # /play — 入力モード + サイドパネル
    │   └── ShogiBoard.vue
    └── ReplayPage.vue                 # /replay — 再生モード + サイドパネル
        └── ShogiBoard.vue (initial-mode="playback")

ShogiBoard.vue                        # 将棋盤コンポーネント（共通）
├── Hand.vue (gote)                    # 後手の持ち駒（上）
├── Board.vue                          # 9×9盤面
│   └── Square.vue × 81               # 各マス
│       └── Piece.vue                  # 駒（あれば）
├── Hand.vue (sente)                   # 先手の持ち駒（下）
├── PlaybackControls.vue               # 再生ナビ（再生/継盤モード時のみ）
└── GameInfo.vue                       # 対局情報
```

### 4.2 各コンポーネントの責務

#### `ShogiBoard.vue` — メインコンテナ

**Props:**
```typescript
interface ShogiBoardProps {
  initialSfen?: string        // 初期局面SFEN（省略時は平手）
  initialKif?: string         // 初期棋譜KIF
  readonly?: boolean          // 閲覧専用モード
}
```

**Emits:**
```typescript
interface ShogiBoardEmits {
  (e: 'move', move: Move): void          // 手が指された
  (e: 'sfenChange', sfen: string): void  // 局面変更時
  (e: 'gameEnd', result: string): void   // 対局終了
}
```

**Expose:**
```typescript
interface ShogiBoardExpose {
  getSfen(): string                       // 現在局面のSFEN取得
  getKif(): string                        // 棋譜のKIF出力
  loadSfen(sfen: string): void            // SFEN読込
  loadKif(kif: string): void              // KIF読込
  reset(): void                           // 初期化
}
```

#### `Board.vue` — 盤面

**Props:**
```typescript
interface BoardProps {
  board: Board
  selectedPosition: Position | null       // 選択中のマス
  legalMoves: Position[]                  // 合法移動先
}
```

**Emits:**
```typescript
interface BoardEmits {
  (e: 'squareClick', pos: Position): void
}
```

#### `Square.vue` — 1マス

**Props:**
```typescript
interface SquareProps {
  piece: Piece | null
  position: Position
  isSelected: boolean
  isLegalTarget: boolean
  isLastMoveFrom: boolean
  isLastMoveTo: boolean
}
```

**Emits:**
```typescript
interface SquareEmits {
  (e: 'click'): void
}
```

#### `Piece.vue` — 駒

**Props:**
```typescript
interface PieceProps {
  type: PieceType
  owner: Player
  promoted: boolean
}
```

#### `Hand.vue` — 持ち駒エリア

**Props:**
```typescript
interface HandProps {
  pieces: HandPieces
  player: Player
  selectedPiece: PieceType | null         // 選択中の持ち駒
}
```

**Emits:**
```typescript
interface HandEmits {
  (e: 'pieceClick', pieceType: PieceType): void
}
```

#### `GameInfo.vue` — 対局情報

**Props:**
```typescript
interface GameInfoProps {
  turn: Player
  moveCount: number
  sfen: string
}
```

---

## 5. コアロジック設計

### 5.1 駒の移動計算（`core/moves.ts`）

各駒について移動可能なマスを計算する関数群:

```typescript
// Get all squares a piece can move to (ignoring check)
function getPieceMovements(
  board: Board,
  pos: Position,
  piece: Piece
): Position[]

// Step moves (king, gold, silver, pawn, promoted pieces)
function getStepMoves(
  board: Board,
  pos: Position,
  piece: Piece,
  directions: [number, number][]
): Position[]

// Slide moves (rook, bishop, lance)
function getSlideMoves(
  board: Board,
  pos: Position,
  piece: Piece,
  directions: [number, number][]
): Position[]

// Knight jump moves
function getKnightMoves(
  board: Board,
  pos: Position,
  piece: Piece
): Position[]
```

### 5.2 合法手判定（`core/rules.ts`）

```typescript
// Get all legal moves for the current player
function getLegalMoves(state: GameState): Move[]

// Check if a specific move is legal
function isLegalMove(state: GameState, move: Move): boolean

// Check if the current player's king is in check
function isInCheck(board: Board, hands: Hands, player: Player): boolean

// Check if a drop is legal (nifu, no-move-area, uchifuzume)
function isLegalDrop(state: GameState, pieceType: PieceType, to: Position): boolean

// Check for nifu (two pawns in same file)
function isNifu(board: Board, player: Player, col: number): boolean

// Check for uchifuzume (checkmate by pawn drop)
function isUchifuzume(state: GameState, to: Position): boolean

// Determine if promotion is mandatory/optional/impossible
function getPromotionStatus(
  piece: Piece, from: Position, to: Position
): 'mandatory' | 'optional' | 'none'

// Check for checkmate
function isCheckmate(state: GameState): boolean
```

### 5.3 ゲーム進行（`core/game.ts`）

```typescript
// Create initial game state
function createInitialState(sfen?: string): GameState

// Apply a move and return new state
function applyMove(state: GameState, move: Move): GameState

// Undo last move
function undoMove(state: GameState): GameState

// Replay from initial state to move N (for playback navigation)
function replayToMove(initialState: GameState, moves: Move[], n: number): GameState
```

### 5.4 SFEN入出力（`core/sfen.ts`）

```typescript
// Convert game state to SFEN string
function toSfen(state: GameState): string

// Parse SFEN string to game state
function parseSfen(sfen: string): GameState

// Convert move to USI format string
function moveToUsi(move: Move): string

// Parse USI format move string
function parseUsiMove(usi: string): Move
```

### 5.5 KIF入出力（`core/kif.ts`）

```typescript
// Convert full game (with history) to KIF format string
function toKif(state: GameState, metadata?: KifMetadata): string

// Parse KIF format string to game state (replaying all moves)
function parseKif(kif: string): { state: GameState; metadata: KifMetadata }

// KIF metadata
interface KifMetadata {
  startDate?: string
  endDate?: string
  event?: string
  strategy?: string
  handicap?: string
  senteName?: string
  goteName?: string
  result?: string
}
```

---

## 6. ユーザーインタラクション設計

### 6.1 駒移動フロー（クリック方式）

```
[状態: 未選択]
  │
  ├─ 自分の盤上の駒をクリック → [状態: 盤上の駒選択中]
  │   ├─ 合法移動先をクリック
  │   │   ├─ 成り選択が必要 → 成/不成ダイアログ → 移動実行
  │   │   └─ 成り不要 → 移動実行
  │   ├─ 別の自分の駒をクリック → 選択切替
  │   └─ その他をクリック → 選択解除
  │
  └─ 自分の持ち駒をクリック → [状態: 持ち駒選択中]
      ├─ 合法打ち先をクリック → 打ち実行
      ├─ 自分の盤上の駒をクリック → 盤上駒選択に切替
      └─ その他をクリック → 選択解除
```

### 6.2 視覚フィードバック

| 状態 | 表示 |
|------|------|
| 選択中の駒 | 背景色変更（ハイライト） |
| 合法移動先 | マーカー表示（半透明の円） |
| 最終手の移動元 | 薄い色のハイライト |
| 最終手の移動先 | やや濃い色のハイライト |

---

## 7. 盤面デザイン

サンプルの [Board.vue](../samples/01-grid-layout/src/components/Board.vue) をベースとする。

- CSS Gridで9×9レイアウト
- 背景色: `#dcb35c`（将棋盤の木目色）
- 罫線: `#8b4513`
- 駒は漢字テキスト表示
- 後手の駒は180度回転（`transform: rotate(180deg)`）
- 成駒は赤文字
- 星（目印）: 三六・六六・三三・六三の4箇所に点を配置

---

## 8. 外部インターフェース

### 8.1 SFEN出力（解析AI連携用）

`ShogiBoard` コンポーネントの `getSfen()` メソッドで現在局面のSFEN文字列を取得できる。これをUSIプロトコル対応のAIエンジンに送信可能。

```typescript
// 使用例
const boardRef = ref<InstanceType<typeof ShogiBoard>>()
const sfen = boardRef.value?.getSfen()
// → "lnsgkgsnl/1r5b1/ppppppppp/9/9/2P6/PP1PPPPPP/1B5R1/LNSGKGSNL w - 2"
```

### 8.2 KIF入出力

```typescript
// KIF出力
const kif = boardRef.value?.getKif()

// KIF読込
boardRef.value?.loadKif(kifString)
```

---

## 9. モード設計

### 9.1 モード一覧

アプリケーションは3つのモードを持ち、`useMode` composableが統合管理する。

| モード | 説明 | クリック操作 | KIF出力 | SFEN出力 | ナビゲーション |
|--------|------|------------|---------|---------|---------------|
| 入力モード | クリックで駒を動かして棋譜を作成 | 可 | 可 | 可 | - |
| 再生モード | 読み込んだKIF棋譜を前後に送る | 不可 | 可（元の棋譜） | 可 | 前後/最初/最終 |
| 継盤モード | 再生中の局面から一時的に駒を動かす | 可 | 不要 | 可 | - |

### 9.2 ルーティングと状態遷移

```
/            /play              /replay
トップ ──▶ 入力モード     再生モード
                                │  ▲
                    継盤ボタン   │  │ 終了ボタン
                                ▼  │
                            継盤モード
```

- **入力 ↔ 再生**: ナビバーのリンクで `/play` と `/replay` を行き来する。ページ遷移で状態はリセットされる
- **再生 → 継盤**: 「継盤」ボタンで開始。現在の再生局面をSFEN経由で継盤用GameStateに読み込み、再生位置を保存
- **継盤 → 再生**: 「終了」ボタンで復帰。継盤の操作は破棄され、保存した再生位置に戻る

ShogiBoard は `initialMode` prop を受け取り、`useMode(initialMode)` で初期モードを設定する。
`/play` ではデフォルトの `'input'`、`/replay` では `'playback'` を指定する。

### 9.3 Composable構成

```
useMode (統合管理)
├── inputGame: useGameState()      # 入力モード用
├── playback: usePlayback()        # 再生モード用
│   └── replayToMove() を使った局面再現
├── continuationGame: useGameState()  # 継盤モード用
└── selection: useSelection()      # 共有の駒選択UI
    └── activeState に連動
```

- `activeState: computed<GameState>` — モードに応じて適切な `GameState` を返す
- `isInteractive: computed<boolean>` — 入力/継盤では `true`、再生では `false`
- `ShogiBoard.vue` は `useMode()` を通じて全モードの状態にアクセスする

### 9.4 usePlayback の構造

```typescript
// Full game state with all moves applied (source of truth)
fullState: Ref<GameState>
// Current playback position (0 = initial, N = after N moves)
currentMoveIndex: Ref<number>
// State at the current position (computed via replayToMove)
displayState: ComputedRef<GameState>

// Navigation
goForward() / goBack() / goToStart() / goToEnd() / goToMove(n)
// KIF I/O
loadKif(kifStr) / getKif()
```

### 9.5 UI構成

**盤面下部（PlaybackControls.vue）:**

再生モード時:
```
|◁  ◁  ▷  ▷|    N / M手    [継盤]
```

継盤モード時:
```
継盤モード    [一手戻す]    [終了]
```

**サイドパネル（各ページコンポーネント内）:**

```
PlayPage (/play):            ReplayPage (/replay):
├─ 一手戻す / 初期化         ├─ KIF入力テキストエリア
├─ SFEN をコピー             ├─ KIF を読み込むボタン
└─ KIF 出力                  └─ SFEN をコピー
```

---

## 10. ルーティング設計

### 10.1 ルート定義

| パス | ページ | 説明 |
|------|--------|------|
| `/` | TopPage.vue | ランディングページ（将棋盤なし） |
| `/play` | PlayPage.vue | 入力モード（クリックで棋譜入力） |
| `/replay` | ReplayPage.vue | 再生モード（KIF読込・ナビゲーション・継盤） |

### 10.2 ナビゲーション

`NavBar.vue` が `<router-link>` でページ間リンクを提供する。
現在のルートに対応するリンクが `active` クラスでハイライトされる。

### 10.3 ShogiBoard の initialMode prop

```typescript
// ShogiBoard.vue
const props = withDefaults(defineProps<{
  initialMode?: AppMode  // 'input' | 'playback' | 'continuation'
}>(), {
  initialMode: 'input',
})
const modeCtrl = useMode(props.initialMode)
```

PlayPage は prop 省略（デフォルト `'input'`）、ReplayPage は `initial-mode="playback"` を指定する。

---

## 11. 将来の拡張ポイント

現時点では実装しないが、設計上は対応できるようにしておく:

- [ ] ドラッグ&ドロップによる駒移動
- [ ] 分岐棋譜の管理
- [ ] 対局時計
- [ ] 千日手検出
- [ ] CSA形式対応
- [ ] 駒画像（SVG/PNG）への差し替え
