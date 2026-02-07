import type { Board, GameState, Hands, Player, PieceType, Move } from './types'
import { HAND_PIECE_ORDER } from './constants'

// -------------------------------------------------------
// Piece <-> SFEN char mapping
// -------------------------------------------------------

const PIECE_TO_SFEN: Record<PieceType, string> = {
  king: 'K', rook: 'R', bishop: 'B', gold: 'G',
  silver: 'S', knight: 'N', lance: 'L', pawn: 'P',
}

const SFEN_TO_PIECE: Record<string, PieceType> = {
  K: 'king', R: 'rook', B: 'bishop', G: 'gold',
  S: 'silver', N: 'knight', L: 'lance', P: 'pawn',
}

// -------------------------------------------------------
// Board -> SFEN
// -------------------------------------------------------

function boardToSfen(board: Board): string {
  const ranks: string[] = []
  for (let r = 0; r < 9; r++) {
    let rank = ''
    let empty = 0
    for (let c = 0; c < 9; c++) {
      const pc = board[r]![c]
      if (!pc) {
        empty++
        continue
      }
      if (empty > 0) {
        rank += empty
        empty = 0
      }
      let ch = PIECE_TO_SFEN[pc.type]
      if (pc.owner === 'gote') ch = ch.toLowerCase()
      if (pc.promoted) ch = '+' + ch
      rank += ch
    }
    if (empty > 0) rank += empty
    ranks.push(rank)
  }
  return ranks.join('/')
}

// -------------------------------------------------------
// Hands -> SFEN
// -------------------------------------------------------

function handsToSfen(hands: Hands): string {
  let s = ''
  for (const player of ['sente', 'gote'] as Player[]) {
    for (const pt of HAND_PIECE_ORDER) {
      const count = hands[player][pt] || 0
      if (count <= 0) continue
      let ch = PIECE_TO_SFEN[pt]
      if (player === 'gote') ch = ch.toLowerCase()
      s += (count > 1 ? String(count) : '') + ch
    }
  }
  return s || '-'
}

// -------------------------------------------------------
// GameState -> SFEN string
// -------------------------------------------------------

export function toSfen(state: GameState): string {
  const boardStr = boardToSfen(state.board)
  const turnStr = state.turn === 'sente' ? 'b' : 'w'
  const handsStr = handsToSfen(state.hands)
  const moveNum = state.moveCount + 1
  return `${boardStr} ${turnStr} ${handsStr} ${moveNum}`
}

// -------------------------------------------------------
// SFEN string -> GameState
// -------------------------------------------------------

export function parseSfen(sfen: string): GameState {
  const parts = sfen.trim().split(/\s+/)
  if (parts.length < 3) throw new Error('Invalid SFEN: expected at least 3 fields')

  const board = parseSfenBoard(parts[0]!)
  const turn: Player = parts[1] === 'b' ? 'sente' : 'gote'
  const hands = parseSfenHands(parts[2]!)
  const moveCount = parts[3] ? Math.max(0, parseInt(parts[3], 10) - 1) : 0

  return { board, hands, turn, moveCount, history: [] }
}

function parseSfenBoard(s: string): Board {
  const board: Board = Array.from({ length: 9 }, () => Array(9).fill(null))
  const ranks = s.split('/')
  if (ranks.length !== 9) throw new Error('Invalid SFEN board: expected 9 ranks')

  for (let r = 0; r < 9; r++) {
    let c = 0
    let promoted = false
    for (const ch of ranks[r]!) {
      if (ch === '+') {
        promoted = true
        continue
      }
      const digit = parseInt(ch, 10)
      if (!isNaN(digit)) {
        c += digit
        continue
      }
      const upper = ch.toUpperCase()
      const pieceType = SFEN_TO_PIECE[upper]
      if (!pieceType) throw new Error(`Invalid SFEN piece: ${ch}`)
      const owner: Player = ch === upper ? 'sente' : 'gote'
      board[r]![c] = { type: pieceType, owner, promoted }
      promoted = false
      c++
    }
  }

  return board
}

function parseSfenHands(s: string): Hands {
  const hands: Hands = { sente: {}, gote: {} }
  if (s === '-') return hands

  let count = 0
  for (const ch of s) {
    const digit = parseInt(ch, 10)
    if (!isNaN(digit)) {
      count = count * 10 + digit
      continue
    }
    const upper = ch.toUpperCase()
    const pieceType = SFEN_TO_PIECE[upper]
    if (!pieceType) throw new Error(`Invalid SFEN hand piece: ${ch}`)
    const owner: Player = ch === upper ? 'sente' : 'gote'
    hands[owner][pieceType] = (hands[owner][pieceType] || 0) + (count || 1)
    count = 0
  }

  return hands
}

// -------------------------------------------------------
// USI move notation
// -------------------------------------------------------

function colToFile(col: number): string {
  return String(9 - col)
}

function rowToRank(row: number): string {
  return String.fromCharCode('a'.charCodeAt(0) + row)
}

function fileToCol(file: string): number {
  return 9 - parseInt(file, 10)
}

function rankToRow(rank: string): number {
  return rank.charCodeAt(0) - 'a'.charCodeAt(0)
}

export function moveToUsi(move: Move): string {
  if (move.type === 'drop') {
    const ch = PIECE_TO_SFEN[move.pieceType]
    return `${ch}*${colToFile(move.to.col)}${rowToRank(move.to.row)}`
  }
  const from = `${colToFile(move.from.col)}${rowToRank(move.from.row)}`
  const to = `${colToFile(move.to.col)}${rowToRank(move.to.row)}`
  return `${from}${to}${move.promote ? '+' : ''}`
}

export function parseUsiMove(usi: string): Move {
  // Drop: e.g. "P*2d"
  if (usi.charAt(1) === '*') {
    const pieceType = SFEN_TO_PIECE[usi.charAt(0).toUpperCase()]
    if (!pieceType) throw new Error(`Invalid USI drop: ${usi}`)
    const col = fileToCol(usi.charAt(2))
    const row = rankToRow(usi.charAt(3))
    return { type: 'drop', pieceType, to: { row, col } }
  }

  // Board move: e.g. "7g7f" or "8h2b+"
  const fromCol = fileToCol(usi.charAt(0))
  const fromRow = rankToRow(usi.charAt(1))
  const toCol = fileToCol(usi.charAt(2))
  const toRow = rankToRow(usi.charAt(3))
  const promote = usi.length > 4 && usi.charAt(4) === '+'

  return {
    type: 'move',
    from: { row: fromRow, col: fromCol },
    to: { row: toRow, col: toCol },
    promote,
  }
}
