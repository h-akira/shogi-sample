import type { PieceType, Board, Piece } from './types'

// -------------------------------------------------------
// Display names
// -------------------------------------------------------

export const PIECE_DISPLAY: Record<PieceType, { normal: string; promoted: string }> = {
  king:   { normal: '玉', promoted: '' },
  rook:   { normal: '飛', promoted: '龍' },
  bishop: { normal: '角', promoted: '馬' },
  gold:   { normal: '金', promoted: '' },
  silver: { normal: '銀', promoted: '成銀' },
  knight: { normal: '桂', promoted: '成桂' },
  lance:  { normal: '香', promoted: '成香' },
  pawn:   { normal: '歩', promoted: 'と' },
}

// Single-char display for board rendering
export const PIECE_KANJI: Record<PieceType, { normal: string; promoted: string }> = {
  king:   { normal: '玉', promoted: '' },
  rook:   { normal: '飛', promoted: '龍' },
  bishop: { normal: '角', promoted: '馬' },
  gold:   { normal: '金', promoted: '' },
  silver: { normal: '銀', promoted: '全' },
  knight: { normal: '桂', promoted: '圭' },
  lance:  { normal: '香', promoted: '杏' },
  pawn:   { normal: '歩', promoted: 'と' },
}

// -------------------------------------------------------
// Promotion mapping: original type -> demoted type (for captured pieces)
// All promoted pieces revert to their base type when captured.
// -------------------------------------------------------

export const PROMOTABLE_TYPES: PieceType[] = ['rook', 'bishop', 'silver', 'knight', 'lance', 'pawn']

// -------------------------------------------------------
// Movement directions
// Defined from sente's perspective: (dCol, dRow)
// dRow negative = forward (toward gote side / lower row index)
// For gote, dRow is negated.
// -------------------------------------------------------

export type Direction = [number, number] // [dCol, dRow]

// Step (1-square) directions
export const KING_DIRS: Direction[] = [
  [-1, -1], [0, -1], [1, -1],
  [-1,  0],          [1,  0],
  [-1,  1], [0,  1], [1,  1],
]

export const GOLD_DIRS: Direction[] = [
  [-1, -1], [0, -1], [1, -1],
  [-1,  0],          [1,  0],
            [0,  1],
]

export const SILVER_DIRS: Direction[] = [
  [-1, -1], [0, -1], [1, -1],
  [-1,  1],          [1,  1],
]

export const PAWN_DIRS: Direction[] = [
  [0, -1],
]

// Knight jumps (forward only, can leap)
export const KNIGHT_DIRS: Direction[] = [
  [-1, -2], [1, -2],
]

// Slide (multi-square) directions
export const ROOK_DIRS: Direction[] = [
            [0, -1],
  [-1,  0],          [1,  0],
            [0,  1],
]

export const BISHOP_DIRS: Direction[] = [
  [-1, -1],          [1, -1],
  [-1,  1],          [1,  1],
]

export const LANCE_DIRS: Direction[] = [
  [0, -1],
]

// -------------------------------------------------------
// Hand piece ordering (for display & SFEN)
// -------------------------------------------------------

export const HAND_PIECE_ORDER: PieceType[] = [
  'rook', 'bishop', 'gold', 'silver', 'knight', 'lance', 'pawn',
]

// -------------------------------------------------------
// Initial board (hirate)
// row 0 = rank 1 (gote back rank), row 8 = rank 9 (sente back rank)
// col 0 = file 9 (left),           col 8 = file 1 (right)
// -------------------------------------------------------

function p(type: PieceType, owner: 'sente' | 'gote', promoted = false): Piece {
  return { type, owner, promoted }
}

const BACK_RANK: PieceType[] = ['lance', 'knight', 'silver', 'gold', 'king', 'gold', 'silver', 'knight', 'lance']

export function createHirateBoard(): Board {
  const board: Board = Array.from({ length: 9 }, () =>
    Array.from<Piece | null>({ length: 9 }).fill(null),
  )

  // Row 0: gote back rank (9一 to 1一) = 香桂銀金玉金銀桂香
  for (let col = 0; col < 9; col++) {
    board[0]![col] = p(BACK_RANK[col]!, 'gote')
  }

  // Row 1: gote rook (8二=col1) and bishop (2二=col7)
  board[1]![1] = p('rook', 'gote')
  board[1]![7] = p('bishop', 'gote')

  // Row 2: gote pawns
  for (let col = 0; col < 9; col++) {
    board[2]![col] = p('pawn', 'gote')
  }

  // Row 6: sente pawns
  for (let col = 0; col < 9; col++) {
    board[6]![col] = p('pawn', 'sente')
  }

  // Row 7: sente bishop (8八=col1) and rook (2八=col7)
  board[7]![1] = p('bishop', 'sente')
  board[7]![7] = p('rook', 'sente')

  // Row 8: sente back rank
  for (let col = 0; col < 9; col++) {
    board[8]![col] = p(BACK_RANK[col]!, 'sente')
  }

  return board
}

export function createEmptyHands() {
  return {
    sente: {} as Record<string, number>,
    gote: {} as Record<string, number>,
  }
}
