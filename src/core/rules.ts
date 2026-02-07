import type { Board, Piece, Position, Player, GameState, Move, BoardMove, DropMove, Hands } from './types'
import { PROMOTABLE_TYPES, HAND_PIECE_ORDER } from './constants'
import { getPieceMovements, findKing, isSquareAttackedBy } from './moves'

// -------------------------------------------------------
// Board helpers
// -------------------------------------------------------

function cloneBoard(board: Board): Board {
  return board.map(row => row.map(cell => (cell ? { ...cell } : null)))
}

function opponent(player: Player): Player {
  return player === 'sente' ? 'gote' : 'sente'
}

// -------------------------------------------------------
// Check detection
// -------------------------------------------------------

export function isInCheck(board: Board, player: Player): boolean {
  const kingPos = findKing(board, player)
  if (!kingPos) return false
  return isSquareAttackedBy(board, kingPos, opponent(player))
}

// Apply a move on a cloned board (minimal — no hand update needed for check testing)
function applyMoveOnBoard(board: Board, move: Move, player?: Player): Board {
  const b = cloneBoard(board)
  if (move.type === 'move') {
    const piece = b[move.from.row]![move.from.col]!
    b[move.from.row]![move.from.col] = null
    b[move.to.row]![move.to.col] = move.promote
      ? { ...piece, promoted: true }
      : piece
  } else {
    // drop
    b[move.to.row]![move.to.col] = { type: move.pieceType, owner: player ?? 'sente', promoted: false }
  }
  return b
}

// -------------------------------------------------------
// Promotion status
// -------------------------------------------------------

export type PromotionStatus = 'mandatory' | 'optional' | 'none'

export function getPromotionStatus(piece: Piece, from: Position, to: Position): PromotionStatus {
  if (piece.promoted) return 'none'
  if (!PROMOTABLE_TYPES.includes(piece.type)) return 'none'
  if (piece.type === 'king' || piece.type === 'gold') return 'none'

  const isInEnemyZone = (row: number, owner: Player) =>
    owner === 'sente' ? row <= 2 : row >= 6

  const enters = isInEnemyZone(to.row, piece.owner)
  const leaves = isInEnemyZone(from.row, piece.owner)

  if (!enters && !leaves) return 'none'

  // Mandatory promotion: piece would have no moves if not promoted
  if (piece.owner === 'sente') {
    if ((piece.type === 'pawn' || piece.type === 'lance') && to.row === 0) return 'mandatory'
    if (piece.type === 'knight' && to.row <= 1) return 'mandatory'
  } else {
    if ((piece.type === 'pawn' || piece.type === 'lance') && to.row === 8) return 'mandatory'
    if (piece.type === 'knight' && to.row >= 7) return 'mandatory'
  }

  return 'optional'
}

// -------------------------------------------------------
// Drop legality
// -------------------------------------------------------

// Two-pawn (nifu) check
export function isNifu(board: Board, player: Player, col: number): boolean {
  for (let r = 0; r < 9; r++) {
    const pc = board[r]![col]
    if (pc && pc.type === 'pawn' && !pc.promoted && pc.owner === player) {
      return true
    }
  }
  return false
}

// Check if dropping a piece at the given position would leave it with no moves
function isDeadEnd(pieceType: string, toRow: number, owner: Player): boolean {
  if (owner === 'sente') {
    if ((pieceType === 'pawn' || pieceType === 'lance') && toRow === 0) return true
    if (pieceType === 'knight' && toRow <= 1) return true
  } else {
    if ((pieceType === 'pawn' || pieceType === 'lance') && toRow === 8) return true
    if (pieceType === 'knight' && toRow >= 7) return true
  }
  return false
}

// Check for uchifuzume (checkmate by pawn drop)
function isUchifuzume(board: Board, hands: Hands, player: Player, to: Position): boolean {
  // Simulate the pawn drop
  const b = cloneBoard(board)
  b[to.row]![to.col] = { type: 'pawn', owner: player, promoted: false }

  const opp = opponent(player)

  // Must be checking the opponent's king
  if (!isInCheck(b, opp)) return false

  // Check if opponent has any legal response
  return !hasAnyLegalMove(b, hands, opp)
}

// -------------------------------------------------------
// Legal move enumeration
// -------------------------------------------------------

function hasAnyLegalMove(board: Board, hands: Hands, player: Player): boolean {
  // Board moves
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const pc = board[r]![c]
      if (!pc || pc.owner !== player) continue
      const from = { row: r, col: c }
      const targets = getPieceMovements(board, from, pc)
      for (const to of targets) {
        const promStatus = getPromotionStatus(pc, from, to)
        const tryPromote = promStatus === 'mandatory' || promStatus === 'optional'
        const tryNoPromote = promStatus !== 'mandatory'

        if (tryNoPromote) {
          const move: BoardMove = { type: 'move', from, to, promote: false }
          const nb = applyMoveOnBoard(board, move)
          if (!isInCheck(nb, player)) return true
        }
        if (tryPromote) {
          const move: BoardMove = { type: 'move', from, to, promote: true }
          const nb = applyMoveOnBoard(board, move)
          if (!isInCheck(nb, player)) return true
        }
      }
    }
  }

  // Drop moves
  const hand = hands[player]
  for (const pt of HAND_PIECE_ORDER) {
    if (!hand[pt] || hand[pt]! <= 0) continue
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r]![c]) continue
        if (isDeadEnd(pt, r, player)) continue
        if (pt === 'pawn' && isNifu(board, player, c)) continue
        const move: DropMove = { type: 'drop', pieceType: pt, to: { row: r, col: c } }
        const nb = applyMoveOnBoard(board, move)
        // Fix owner in clone for check detection
        nb[r]![c] = { type: pt, owner: player, promoted: false }
        if (!isInCheck(nb, player)) return true
      }
    }
  }

  return false
}

/**
 * Get all legal board moves for a piece at a given position.
 */
export function getLegalBoardMoves(state: GameState, from: Position): BoardMove[] {
  const piece = state.board[from.row]![from.col]
  if (!piece || piece.owner !== state.turn) return []

  const targets = getPieceMovements(state.board, from, piece)
  const moves: BoardMove[] = []

  for (const to of targets) {
    const promStatus = getPromotionStatus(piece, from, to)
    const tryPromote = promStatus === 'mandatory' || promStatus === 'optional'
    const tryNoPromote = promStatus !== 'mandatory'

    if (tryNoPromote) {
      const move: BoardMove = { type: 'move', from, to, promote: false }
      const nb = applyMoveOnBoard(state.board, move)
      if (!isInCheck(nb, state.turn)) {
        moves.push(move)
      }
    }
    if (tryPromote) {
      const move: BoardMove = { type: 'move', from, to, promote: true }
      const nb = applyMoveOnBoard(state.board, move)
      if (!isInCheck(nb, state.turn)) {
        moves.push(move)
      }
    }
  }

  return moves
}

/**
 * Get all legal drop positions for a given piece type.
 */
export function getLegalDropPositions(state: GameState, pieceType: string): Position[] {
  const player = state.turn
  const positions: Position[] = []

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (state.board[r]![c]) continue
      if (isDeadEnd(pieceType, r, player)) continue
      if (pieceType === 'pawn' && isNifu(state.board, player, c)) continue

      // Simulate drop
      const b = cloneBoard(state.board)
      b[r]![c] = { type: pieceType as any, owner: player, promoted: false }

      // Self-check
      if (isInCheck(b, player)) continue

      // Uchifuzume check for pawn drops
      if (pieceType === 'pawn' && isUchifuzume(state.board, state.hands, player, { row: r, col: c })) {
        continue
      }

      positions.push({ row: r, col: c })
    }
  }

  return positions
}

/**
 * Check if the current player is in checkmate.
 */
export function isCheckmate(state: GameState): boolean {
  if (!isInCheck(state.board, state.turn)) return false
  return !hasAnyLegalMove(state.board, state.hands, state.turn)
}
