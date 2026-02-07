// Player
export type Player = 'sente' | 'gote'

// Piece types (unpromoted)
export type PieceType =
  | 'king'
  | 'rook'
  | 'bishop'
  | 'gold'
  | 'silver'
  | 'knight'
  | 'lance'
  | 'pawn'

// Piece on board
export interface Piece {
  type: PieceType
  owner: Player
  promoted: boolean
}

// Board position (0-indexed)
// row: 0 = rank 1 (top / gote side), 8 = rank 9 (bottom / sente side)
// col: 0 = file 9 (left),            8 = file 1 (right)
export interface Position {
  row: number
  col: number
}

// 9x9 board, null = empty
export type Board = (Piece | null)[][]

// Captured pieces per player. key = PieceType (never 'king'), value = count
export type HandPieces = Partial<Record<PieceType, number>>

export interface Hands {
  sente: HandPieces
  gote: HandPieces
}

// Move from a board square
export interface BoardMove {
  type: 'move'
  from: Position
  to: Position
  promote: boolean
}

// Drop a captured piece
export interface DropMove {
  type: 'drop'
  pieceType: PieceType
  to: Position
}

export type Move = BoardMove | DropMove

// Snapshot stored in history for undo
export interface MoveRecord {
  move: Move
  captured: Piece | null // piece that was on the destination before the move
}

// Full game state
export interface GameState {
  board: Board
  hands: Hands
  turn: Player
  moveCount: number
  history: MoveRecord[]
}
